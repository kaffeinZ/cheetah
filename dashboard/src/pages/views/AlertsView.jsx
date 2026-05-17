const RISK_COLOR = {
  CRITICAL: '#e0007a',
  HIGH:     '#e06000',
  WARNING:  '#e0b800',
  SAFE:     '#2ecc00',
}

function timeAgo(unixSecs) {
  const diff = Math.floor(Date.now() / 1000) - unixSecs
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function AlertsView({ alerts }) {
  if (!alerts?.length) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-black">AI Analysis History</h2>
          <p className="text-muted-foreground text-sm">Past AI risk analyses for your wallet.</p>
        </div>
        <div className="text-muted-foreground text-sm mt-8 text-center">No AI analyses yet. Run an analysis from the Portfolio tab.</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-black">AI Analysis History</h2>
        <p className="text-muted-foreground text-sm">Past AI risk analyses for your wallet.</p>
      </div>

      <div className="flex flex-col gap-3">
        {alerts.map((entry) => {
          const color = RISK_COLOR[entry.risk_level] ?? '#888'
          return (
            <div
              key={entry.id}
              className="bg-card border rounded-xl p-4 flex flex-col gap-2"
              style={{ borderColor: color + '40' }}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: color + '20', color }}
                  >
                    {entry.risk_level}
                  </span>
                  <span className="text-sm font-semibold capitalize">{entry.protocol}</span>
                  {entry.health_factor !== null && entry.health_factor !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      HF {entry.health_factor.toFixed(2)}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo(entry.created_at)}</span>
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{entry.analysis}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
