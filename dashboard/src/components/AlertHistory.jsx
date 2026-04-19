const RISK_COLORS = {
  CRITICAL: 'bg-[#e0007a]/15 text-[#e0007a]',
  HIGH:     'bg-[#e06000]/15 text-[#e06000]',
  WARNING:  'bg-[#00c8e0]/15 text-[#00c8e0]',
  LOW:      'bg-[#2ecc00]/15 text-[#2ecc00]',
}

export default function AlertHistory({ alerts }) {
  if (!alerts?.length) return (
    <div className="card p-5">
      <h2 className="text-zinc-700 font-bold mb-3">Recent Alerts</h2>
      <p className="text-zinc-400 text-sm">No alerts fired yet.</p>
    </div>
  )

  return (
    <div className="card p-5">
      <h2 className="text-zinc-700 font-bold mb-4">Recent Alerts</h2>
      <div className="flex flex-col gap-3">
        {alerts.map((a, i) => (
          <div key={i} className="border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-zinc-900 text-sm font-semibold capitalize">{a.protocol}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RISK_COLORS[a.risk_level] ?? 'bg-zinc-100 text-zinc-500'}`}>
                  {a.risk_level}
                </span>
              </div>
              <span className="text-zinc-400 text-xs">
                {new Date(a.sent_at * 1000).toLocaleString()}
              </span>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed">{a.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
