const RISK_STYLE = {
  SAFE:     { accent: '#2ecc00', glow: 'glow-green',  badge: 'bg-[#2ecc00]/15 text-[#2ecc00]' },
  WARNING:  { accent: '#00c8e0', glow: 'glow-cyan',   badge: 'bg-[#00c8e0]/15 text-[#00c8e0]' },
  HIGH:     { accent: '#e06000', glow: 'glow-orange', badge: 'bg-[#e06000]/15 text-[#e06000]' },
  CRITICAL: { accent: '#e0007a', glow: 'glow-pink',   badge: 'bg-[#e0007a]/15 text-[#e0007a]' },
}

export default function PerpPositionCard({ position }) {
  const { protocol, token, side, leverage, entryPrice, currentPrice, liqPrice, distancePct, unrealizedPnl, sizeUsd, collateralUsd, riskLevel } = position
  const style = RISK_STYLE[riskLevel] ?? RISK_STYLE.SAFE
  const pnlPositive = unrealizedPnl >= 0
  const barWidth = Math.max(0, Math.min(100, 100 - distancePct * 2))
  const barColor = distancePct > 20 ? '#2ecc00' : distancePct > 10 ? '#e06000' : '#e0007a'

  return (
    <div className={`card p-5 flex flex-col gap-4 ${style.glow} border-l-4`} style={{ borderLeftColor: style.accent }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-zinc-900 dark:text-zinc-100 font-bold capitalize text-lg">{protocol}</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{token}-PERP</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${side === 'Long' ? 'bg-[#2ecc00]/15 text-[#2ecc00]' : 'bg-[#e0007a]/15 text-[#e0007a]'}`}>
            {side} {leverage}x
          </span>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${style.badge}`}>{riskLevel}</span>
      </div>

      {/* Price row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
          <p className="text-zinc-400 text-xs mb-1 uppercase tracking-wider">Entry</p>
          <p className="text-zinc-900 dark:text-zinc-100 font-bold">${entryPrice?.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
          <p className="text-zinc-400 text-xs mb-1 uppercase tracking-wider">Current</p>
          <p className="text-zinc-900 font-bold">${currentPrice?.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
          <p className="text-zinc-400 text-xs mb-1 uppercase tracking-wider">Size</p>
          <p className="text-zinc-900 font-bold">${sizeUsd?.toFixed(0)}</p>
        </div>
      </div>

      {/* PnL */}
      <div className="bg-zinc-50 rounded-lg p-3 flex items-center justify-between">
        <span className="text-zinc-400 text-xs uppercase tracking-wider">Unrealised PnL</span>
        <span className={`font-bold text-sm ${pnlPositive ? 'text-[#2ecc00]' : 'text-[#e0007a]'}`}>
          {pnlPositive ? '+' : ''}${unrealizedPnl?.toFixed(2)}
        </span>
      </div>

      {/* Liquidation distance bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-zinc-400">
          <span>Liq: <span className="text-zinc-700 font-semibold">${liqPrice?.toFixed(2)}</span></span>
          <span className="font-semibold" style={{ color: barColor }}>{distancePct?.toFixed(1)}% away</span>
        </div>
        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${barWidth}%`, backgroundColor: barColor }}
          />
        </div>
        <p className="text-zinc-400 text-xs">Collateral: <span className="text-zinc-600 dark:text-zinc-300 font-medium">${collateralUsd?.toFixed(2)}</span></p>
      </div>

    </div>
  )
}
