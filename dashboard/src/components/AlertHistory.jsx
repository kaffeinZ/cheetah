const RISK_COLORS = {
  CRITICAL: 'bg-[#e0007a]/15 text-[#e0007a]',
  HIGH:     'bg-[#e06000]/15 text-[#e06000]',
  WARNING:  'bg-[#00c8e0]/15 text-[#00c8e0]',
  LOW:      'bg-[#2ecc00]/15 text-[#2ecc00]',
  SAFE:     'bg-[#2ecc00]/15 text-[#2ecc00]',
}

const STALE_HOURS = 24

export default function AlertHistory({ alerts }) {
  const recent = alerts?.slice(0, 5) ?? []
  const now    = Date.now() / 1000

  return (
    <div className="card p-5">
      <h2 className="text-zinc-700 font-bold mb-4">Recent Alerts</h2>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <span className="text-2xl">✓</span>
          <p className="text-zinc-400 text-sm font-medium">All caught up</p>
          <p className="text-zinc-300 text-xs">No alerts fired yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {recent.map((a, i) => {
            const isStale = (now - a.sent_at) > STALE_HOURS * 3600
            return (
              <div key={i} className={`border-b border-zinc-100 pb-3 last:border-0 last:pb-0 ${isStale ? 'opacity-40' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-900 text-sm font-semibold capitalize">{a.protocol}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RISK_COLORS[a.risk_level] ?? 'bg-zinc-100 text-zinc-500'}`}>
                      {a.risk_level}
                    </span>
                  </div>
                  <span className="text-zinc-400 text-xs">
                    {new Date(a.sent_at * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed">{a.message}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
