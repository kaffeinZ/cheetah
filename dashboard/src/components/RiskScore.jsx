import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'


export default function RiskScore({ score, totalCollateralUsd, totalBorrowUsd, perpExposureUsd, totalUnrealizedPnl, worstHealthFactor, positions }) {
  const color =
    score <= 20 ? '#2ecc00' :
    score <= 50 ? '#00c8e0' :
    score <= 75 ? '#e06000' :
    '#e0007a'

  const label =
    score <= 20 ? 'Low Risk' :
    score <= 50 ? 'Moderate' :
    score <= 75 ? 'High Risk' :
    'Critical'

  const netValue     = (totalCollateralUsd ?? 0) - (totalBorrowUsd ?? 0) + (totalUnrealizedPnl ?? 0)
  const pnlSign      = (totalUnrealizedPnl ?? 0) >= 0 ? '+' : ''
  const activeCount  = positions?.filter(p => p.healthFactor !== null).length ?? 0
  const protocolsSet = [...new Set(positions?.map(p => p.protocol) ?? [])]

  const radius       = 40
  const circumference = Math.PI * radius
  const progress     = circumference - (score / 100) * circumference

  return (
    <Card className="border-t-4 overflow-hidden" style={{ borderTopColor: color, boxShadow: `0 4px 32px ${color}20` }}>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1px_1fr] gap-0">

          {/* Left — Risk gauge */}
          <div className="flex flex-col items-center justify-center gap-2 px-8 py-6">
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">Risk Score</p>
            <div className="relative w-28 h-16 overflow-hidden">
              <svg viewBox="0 0 100 54" className="w-full h-full">
                <path d="M 6 50 A 40 40 0 0 1 94 50" fill="none" stroke="currentColor"
                  className="text-muted" strokeWidth="8" strokeLinecap="round" />
                <path d="M 6 50 A 40 40 0 0 1 94 50" fill="none" stroke={color}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={progress}
                  style={{ transition: 'stroke-dashoffset 0.6s ease', filter: `drop-shadow(0 0 6px ${color})` }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-0.5">
                <span className="text-2xl font-black leading-none">{score}</span>
              </div>
            </div>
            <Badge style={{ background: color + '25', color, border: 'none' }} className="font-bold text-xs uppercase tracking-wider">
              {label}
            </Badge>
            <p className="text-muted-foreground text-xs text-center">0 = safe · 100 = liquidation</p>
          </div>

          {/* Divider */}
          <Separator orientation="vertical" className="hidden md:block h-auto my-4" />

          {/* Right — Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-border">

            <div className="flex flex-col justify-center gap-1 p-5">
              <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Net Value</p>
              <p className="text-2xl font-black">${netValue.toFixed(2)}</p>
              <p className="text-xs" style={{ color: (totalUnrealizedPnl ?? 0) >= 0 ? '#2ecc00' : '#e0007a' }}>
                {pnlSign}{(totalUnrealizedPnl ?? 0).toFixed(2)} PnL
              </p>
            </div>

            <div className="flex flex-col justify-center gap-1 p-5">
              <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Collateral</p>
              <p className="text-2xl font-black" style={{ color: '#00c8e0' }}>${(totalCollateralUsd ?? 0).toFixed(2)}</p>
              <p className="text-muted-foreground text-xs">total deposited</p>
            </div>

            <div className="flex flex-col justify-center gap-1 p-5">
              <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Perp Exposure</p>
              <p className="text-2xl font-black" style={{ color: '#e0007a' }}>${(perpExposureUsd ?? 0).toFixed(2)}</p>
              <p className="text-muted-foreground text-xs">total notional</p>
            </div>

            <div className="flex flex-col justify-center gap-1 p-5">
              <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Worst HF</p>
              <p className="text-2xl font-black" style={{ color: worstHealthFactor && worstHealthFactor < 1.5 ? '#e06000' : '#2ecc00' }}>
                {worstHealthFactor ? worstHealthFactor.toFixed(3) : '—'}
              </p>
              <p className="text-muted-foreground text-xs">{protocolsSet.join(' · ') || 'no protocols'}</p>
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  )
}