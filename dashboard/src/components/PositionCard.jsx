import HealthGauge from './HealthGauge'

const RISK_STYLE = {
  SAFE:     { accent: '#2ecc00', glow: 'glow-green',  badge: 'bg-[#2ecc00]/15 text-[#2ecc00]' },
  WARNING:  { accent: '#00c8e0', glow: 'glow-cyan',   badge: 'bg-[#00c8e0]/15 text-[#00c8e0]' },
  HIGH:     { accent: '#e06000', glow: 'glow-orange', badge: 'bg-[#e06000]/15 text-[#e06000]' },
  CRITICAL: { accent: '#e0007a', glow: 'glow-pink',   badge: 'bg-[#e0007a]/15 text-[#e0007a]' },
}

const POSITION_TYPE_LABEL = {
  lst_loop:            'LST Loop',
  stablecoin_loop:     'Stablecoin Loop',
  volatile_collateral: 'Volatile Collateral',
  volatile_borrow:     'Volatile Borrow',
  mixed:               'Mixed',
}

function liquidationInfo(healthFactor, collateralUsd, borrowUsd) {
  if (!healthFactor || !collateralUsd || !borrowUsd) return null
  const dropPct = ((1 - (borrowUsd / collateralUsd)) * 100).toFixed(1)
  const collateralNeeded = ((borrowUsd * 2.0) - collateralUsd).toFixed(2)
  return { dropPct, collateralNeeded: Math.max(0, collateralNeeded) }
}

export default function PositionCard({ position }) {
  const { protocol, collateralUsd, borrowUsd, healthFactor, riskLevel, balances, positionType } = position
  const style = RISK_STYLE[riskLevel] ?? { accent: '#00c8e0', glow: '', badge: 'bg-zinc-100 text-zinc-600' }
  const info = liquidationInfo(healthFactor, collateralUsd, borrowUsd)

  const deposits = balances?.filter(b => b.assetUsd > 0.01) ?? []
  const borrows  = balances?.filter(b => b.liabilityUsd > 0.01) ?? []

  return (
    <div className={`card p-5 flex flex-col gap-4 ${style.glow} border-l-4`} style={{ borderLeftColor: style.accent }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-zinc-900 font-bold capitalize text-lg">{protocol}</span>
          {positionType && POSITION_TYPE_LABEL[positionType] && (
            <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
              {POSITION_TYPE_LABEL[positionType]}
            </span>
          )}
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${style.badge}`}>
          {riskLevel}
        </span>
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-50 rounded-lg p-3">
          <p className="text-zinc-400 text-xs mb-1 uppercase tracking-wider">Collateral</p>
          <p className="text-zinc-900 font-bold text-lg">${collateralUsd?.toFixed(2) ?? '0.00'}</p>
          {deposits.map(b => (
            <p key={b.token} className="text-zinc-400 text-xs mt-0.5">{b.token}: ${b.assetUsd.toFixed(2)}</p>
          ))}
        </div>
        <div className="bg-zinc-50 rounded-lg p-3">
          <p className="text-zinc-400 text-xs mb-1 uppercase tracking-wider">Borrowed</p>
          <p className="text-zinc-900 font-bold text-lg">${borrowUsd?.toFixed(2) ?? '0.00'}</p>
          {borrows.map(b => (
            <p key={b.token} className="text-zinc-400 text-xs mt-0.5">{b.token}: ${b.liabilityUsd.toFixed(2)}</p>
          ))}
        </div>
      </div>

      {/* Health gauge */}
      <HealthGauge healthFactor={healthFactor} riskLevel={riskLevel} />

      {/* Liquidation info */}
      {info && riskLevel !== 'SAFE' && (
        <div className="bg-zinc-50 rounded-lg p-3 flex flex-col gap-1 border border-zinc-100">
          {Number(info.dropPct) > 0 && (
            <p className="text-zinc-500 text-xs">
              Collateral can drop <span className="text-zinc-900 font-semibold">{info.dropPct}%</span> before liquidation
            </p>
          )}
          {info.collateralNeeded > 0 && (
            <p className="text-zinc-500 text-xs">
              Add <span className="text-zinc-900 font-semibold">${info.collateralNeeded}</span> collateral to reach safe zone
            </p>
          )}
        </div>
      )}

    </div>
  )
}
