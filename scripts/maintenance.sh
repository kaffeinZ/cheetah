#!/bin/bash
# Vrynn maintenance script — runs all 4 checks
# Called by cron for individual jobs

TASK="${1:-all}"
DB="/root/vrynn-protocol/vrynn.db"
LOG_FILE="/root/.pm2/logs/vrynn-protocol-error.log"
BOT_TOKEN="8634625220:AAFfU7kzj8Ydw0kYHG2zzfzOVS2awtM44l8"
CHAT_ID="1509182292"
PROJECT_DIR="/root/vrynn-protocol"

send_telegram() {
  local msg="$1"
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d chat_id="${CHAT_ID}" \
    -d text="${msg}" \
    -d parse_mode="Markdown" > /dev/null
}

# ── 1. DB pruning ─────────────────────────────────────────────────────────────
prune_db() {
  BEFORE=$(sqlite3 "$DB" "SELECT COUNT(*) FROM positions;")
  sqlite3 "$DB" "DELETE FROM positions WHERE recorded_at < unixepoch() - 2592000;"
  AFTER=$(sqlite3 "$DB" "SELECT COUNT(*) FROM positions;")
  DELETED=$((BEFORE - AFTER))
  echo "[maintenance] DB pruned: removed $DELETED rows older than 30 days ($AFTER remaining)"
  if [ "$DELETED" -gt 0 ]; then
    send_telegram "🗄 *Vrynn DB pruned*: removed ${DELETED} old position rows. ${AFTER} remaining."
  fi
}

# ── 2. Error log monitoring ───────────────────────────────────────────────────
check_errors() {
  # Count non-Kamino-524 errors in the last hour
  SINCE=$(date -d '1 hour ago' '+%s' 2>/dev/null || date -v-1H '+%s')
  ERROR_COUNT=$(tail -n 500 "$LOG_FILE" 2>/dev/null | grep -v "Kamino API 524" | grep -v "using cached data" | grep -c "\[.*\] failed\|Error\|error" || true)
  if [ "$ERROR_COUNT" -gt 10 ]; then
    SAMPLE=$(tail -n 500 "$LOG_FILE" | grep -v "Kamino API 524" | grep -v "using cached data" | grep "\[.*\] failed\|Error\|error" | tail -3)
    send_telegram "⚠️ *Vrynn error spike*: ${ERROR_COUNT} errors in recent logs.\n\`\`\`${SAMPLE}\`\`\`"
    echo "[maintenance] Alert sent: $ERROR_COUNT errors detected"
  else
    echo "[maintenance] Error check OK: $ERROR_COUNT non-Kamino errors"
  fi
}

# ── 3. Dependency audit ───────────────────────────────────────────────────────
audit_deps() {
  cd "$PROJECT_DIR" || exit 1
  AUDIT=$(npm audit --audit-level=high --json 2>/dev/null | node -e "
    const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    const high = (d.metadata?.vulnerabilities?.high ?? 0);
    const crit = (d.metadata?.vulnerabilities?.critical ?? 0);
    console.log(high + ',' + crit);
  " 2>/dev/null || echo "0,0")
  HIGH=$(echo "$AUDIT" | cut -d',' -f1)
  CRIT=$(echo "$AUDIT" | cut -d',' -f2)
  echo "[maintenance] Dependency audit: $HIGH high, $CRIT critical vulnerabilities"
  if [ "$CRIT" -gt 0 ] || [ "$HIGH" -gt 2 ]; then
    send_telegram "🔐 *Vrynn dependency alert*: ${CRIT} critical, ${HIGH} high vulnerabilities found. Run \`npm audit\` in /root/vrynn-protocol."
  fi
}

# ── 4. Protocol health check ──────────────────────────────────────────────────
check_protocols() {
  # Check Jupiter price API
  JUP=$(curl -s -o /dev/null -w "%{http_code}" "https://api.jup.ag/price/v3?ids=So11111111111111111111111111111111111111112")
  # Check Kamino API
  KAM=$(curl -s -o /dev/null -w "%{http_code}" "https://api.kamino.finance/v2/metrics" --max-time 10)
  # Check PM2 process is running
  PM2_STATUS=$(pm2 jlist 2>/dev/null | node -e "
    const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    const p = d.find(x => x.name === 'vrynn-protocol');
    console.log(p ? p.pm2_env.status : 'missing');
  " 2>/dev/null || echo "unknown")

  ISSUES=""
  [ "$JUP" != "200" ] && ISSUES="${ISSUES}Jupiter price API returned ${JUP}. "
  [ "$PM2_STATUS" != "online" ] && ISSUES="${ISSUES}PM2 process is ${PM2_STATUS}. "

  if [ -n "$ISSUES" ]; then
    send_telegram "🚨 *Vrynn protocol health*: ${ISSUES}"
    echo "[maintenance] Health alert sent: $ISSUES"
  else
    echo "[maintenance] Protocol health OK (Jupiter: $JUP, PM2: $PM2_STATUS)"
  fi
}

# ── Run ───────────────────────────────────────────────────────────────────────
case "$TASK" in
  prune)    prune_db ;;
  errors)   check_errors ;;
  audit)    audit_deps ;;
  health)   check_protocols ;;
  *)        prune_db; check_errors; audit_deps; check_protocols ;;
esac
