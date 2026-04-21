const RISK_COLOR = {
  SAFE:     '#2ecc00',
  WARNING:  '#00c8e0',
  HIGH:     '#e06000',
  CRITICAL: '#e0007a',
}

const SAFE_LABEL = {
  lst_loop:            'Depeg risk only',
  stablecoin_loop:     'Interest risk only',
  volatile_collateral: 'Safe ≥ 2.0',
  volatile_borrow:     'Safe ≥ 2.0',
  mixed:               'Safe ≥ 2.0',
}

export default function HealthGauge({ healthFactor, riskLevel, positionType }) {
  if (healthFactor === null) return (
    <span className="text-[#2ecc00] text-sm font-medium">No debt — fully safe</span>
  )

  const hf = parseFloat(healthFactor)
  const width = Math.min(100, Math.max(0, (hf / 3.0) * 100)).toFixed(1)
  const dangerPos = ((1.2 / 3.0) * 100).toFixed(1)
  const color = RISK_COLOR[riskLevel] ?? '#00c8e0'

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex justify-between items-baseline">
        <span className="text-zinc-400 text-xs uppercase tracking-wider">Health Factor</span>
        <span className="text-xl font-bold" style={{ color }}>{hf.toFixed(3)}</span>
      </div>
      <div className="relative w-full bg-zinc-100 rounded-full h-3">
        <div
          className="h-3 rounded-full transition-all duration-500"
          style={{ width: `${width}%`, background: `linear-gradient(90deg, ${color}80, ${color})`, boxShadow: `0 0 8px ${color}40` }}
        />
        <div
          className="absolute top-0 h-3 w-0.5 bg-zinc-300"
          style={{ left: `${dangerPos}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-zinc-300">
        <span>Liquidation</span>
        <span>{SAFE_LABEL[positionType] ?? 'Safe ≥ 2.0'}</span>
      </div>
    </div>
  )
}
