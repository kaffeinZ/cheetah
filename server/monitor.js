/**
 * Monitor loop — polls all tracked wallets every 60s, evaluates health
 * factors, persists snapshots, fires Telegram alerts, and triggers AI
 * analysis when health factor changes significantly.
 */

import cron from 'node-cron';
import { config } from './config.js';
import {
  getAllTrackedWallets,
  savePosition,
  getLastAlert,
  getWalletSettings,
} from './db.js';
import { getMarginFiPositions } from './protocols/marginfi.js';
import { getKaminoPositions } from './protocols/kamino.js';
import { getJupiterPositions } from './protocols/jupiter.js';
import { sendAlert } from './alerts.js';
import { analyzeRisk } from './ai.js';
import { buildPriceTrendContext } from './priceMonitor.js';

// ── Helpers ───────────────────────────────────────────────────────────────

function riskTier(hf) {
  if (hf === null) return 0;   // no debt
  if (hf >= 2.0)   return 1;   // SAFE
  if (hf >= 1.5)   return 2;   // WARNING
  if (hf >= 1.2)   return 3;   // HIGH
  return 4;                     // CRITICAL
}

/**
 * Returns true when the health factor has moved enough to warrant a fresh
 * AI analysis: tier boundary crossed OR absolute shift > 0.1.
 */
function significantChange(currentHf, lastHf) {
  if (lastHf === null) return true; // first time — always analyse
  if (currentHf === null) return false;
  if (riskTier(currentHf) !== riskTier(lastHf)) return true;
  return Math.abs(currentHf - lastHf) > 0.1;
}

function shouldAlert(walletAddress, protocol, currentRiskLevel, currentHf, position, settings) {
  const hfThreshold   = settings?.hf_warning  ?? 1.5;
  const perpThreshold = settings?.perp_alert_pct ?? 10;

  if (position?.positionType === 'perp') {
    // Perps: alert when distance % is below user threshold, only if PnL negative or CRITICAL
    const distancePct = position.distancePct ?? 100;
    if (distancePct > perpThreshold) return false;
    if (distancePct > 5 && (position.unrealizedPnl ?? 0) >= 0) return false;
  } else {
    // Lending: alert when HF drops below user-configured threshold
    if (currentHf === null || currentHf >= hfThreshold) return false;
  }

  const last = getLastAlert(walletAddress, protocol);

  // No previous alert — fire
  if (!last) return true;

  // Risk level changed in either direction — fire
  if (last.risk_level !== currentRiskLevel) return true;

  // Same risk level but HF shifted more than 0.05 — fire
  if (last.health_factor !== null && Math.abs(currentHf - last.health_factor) > 0.05) return true;

  // No meaningful change — stay quiet
  return false;
}

function buildAlertMessage(position, aiAnalysis) {
  // Prefer the AI's natural-language analysis when available
  if (aiAnalysis?.analysis) return aiAnalysis.analysis;

  if (position.positionType === 'perp') {
    const dist     = position.distancePct?.toFixed(1) ?? '?';
    const liq      = position.liqPrice?.toFixed(2) ?? '?';
    const current  = position.currentPrice?.toFixed(2) ?? '?';
    const side     = position.side ?? '';
    const token    = position.token ?? '';
    const leverage = position.leverage ?? '?';
    const pnl      = position.unrealizedPnl != null
      ? `${position.unrealizedPnl >= 0 ? '+' : ''}$${position.unrealizedPnl.toFixed(2)}`
      : 'N/A';

    if (position.riskLevel === 'CRITICAL') {
      return (
        `CRITICAL: Your Jupiter ${side} ${token}-PERP ${leverage}x is ${dist}% from liquidation. ` +
        `Current: $${current} → Liq: $${liq}. PnL: ${pnl}. Close or add collateral immediately.`
      );
    }
    return (
      `WARNING: Your Jupiter ${side} ${token}-PERP ${leverage}x is ${dist}% from liquidation. ` +
      `Current: $${current} → Liq: $${liq}. PnL: ${pnl}. Monitor closely.`
    );
  }

  // Lending position (MarginFi / Kamino)
  const hf         = position.healthFactor?.toFixed(3) ?? 'N/A';
  const collateral = position.collateralUsd?.toFixed(2) ?? '0';
  const borrow     = position.borrowUsd?.toFixed(2) ?? '0';

  if (position.riskLevel === 'CRITICAL') {
    return (
      `Your ${position.protocol} position is at CRITICAL risk of liquidation. ` +
      `Health Factor: ${hf}. Collateral: $${collateral} / Borrow: $${borrow}. ` +
      `${position.riskContext} Take action immediately.`
    );
  }
  return (
    `Your ${position.protocol} position health is LOW. ` +
    `Health Factor: ${hf}. Collateral: $${collateral} / Borrow: $${borrow}. ` +
    `${position.riskContext} Consider adding collateral or reducing your borrow.`
  );
}

// ── Per-wallet scan ───────────────────────────────────────────────────────

async function scanWallet(address) {
  const [marginfiPositions, kaminoPositions, jupiterPositions] = await Promise.allSettled([
    getMarginFiPositions(address),
    getKaminoPositions(address),
    getJupiterPositions(address),
  ]);

  const positions = [
    ...(marginfiPositions.status === 'fulfilled' ? marginfiPositions.value : []),
    ...(kaminoPositions.status  === 'fulfilled' ? kaminoPositions.value  : []),
    ...(jupiterPositions.status === 'fulfilled' ? jupiterPositions.value : []),
  ];

  if (marginfiPositions.status === 'rejected') {
    console.error(`[monitor] marginfi failed for ${address.slice(0, 8)}…: ${marginfiPositions.reason?.message}`);
  }
  if (kaminoPositions.status === 'rejected') {
    console.error(`[monitor] kamino failed for ${address.slice(0, 8)}…: ${kaminoPositions.reason?.message}`);
  }
  if (jupiterPositions.status === 'rejected') {
    console.error(`[monitor] jupiter failed for ${address.slice(0, 8)}…: ${jupiterPositions.reason?.message}`);
  }

  if (!positions.length) return;

  // Collect positions that have debt (health factor is not null)
  const activePositions = positions.filter((p) => p.healthFactor !== null);

  for (const pos of positions) {
    savePosition({
      walletAddress: address,
      protocol:      pos.protocol,
      collateralUsd: pos.collateralUsd,
      borrowUsd:     pos.borrowUsd,
      healthFactor:  (pos.borrowUsd > 0.01) ? pos.healthFactor : null,
      rawData:       pos,
    });
  }

  if (!activePositions.length) return;

  // AI analysis — only auto-fires on CRITICAL (HF < 1.2) as safety net
  // Normal analysis is user-triggered via /api/analyze (4/day free)
  let aiResult = null;
  const isCritical = activePositions.some(p => p.riskLevel === 'CRITICAL');
  if (isCritical) {
    const priceTrendContext = await buildPriceTrendContext(activePositions).catch(() => null);
    aiResult = await analyzeRisk(address, activePositions, priceTrendContext);
  }

  const settings = getWalletSettings(address);
  if (settings?.alerts_enabled === 0) return;

  // Telegram alerts for HIGH / CRITICAL positions
  for (const pos of activePositions) {
    if (shouldAlert(address, pos.protocol, pos.riskLevel, pos.healthFactor, pos, settings)) {
      const message = buildAlertMessage(pos, aiResult);
      await sendAlert({
        walletAddress: address,
        protocol:      pos.protocol,
        riskLevel:     pos.riskLevel,
        healthFactor:  pos.healthFactor,
        message,
      });
      console.log(`[monitor] alert for ${address.slice(0, 8)}… HF=${pos.healthFactor?.toFixed(3)} (${pos.riskLevel})`);
    }
  }
}

// ── Main loop ─────────────────────────────────────────────────────────────

let _running = false;

export function startMonitor() {
  const intervalSecs = config.monitorIntervalSeconds;
  console.log(`[monitor] starting — polling every ${intervalSecs}s`);

  cron.schedule(`*/${intervalSecs} * * * * *`, async () => {
    if (_running) {
      console.log('[monitor] previous tick still running, skipping');
      return;
    }
    _running = true;

    const wallets = getAllTrackedWallets();
    if (!wallets.length) {
      _running = false;
      return;
    }

    console.log(`[${new Date().toISOString()}] [monitor] scanning ${wallets.length} wallet(s)`);
    for (const { address } of wallets) {
      await scanWallet(address);
    }

    _running = false;
  });
}
