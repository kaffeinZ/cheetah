import RiskScore from '../../components/RiskScore'
import AiAnalysis from '../../components/AiAnalysis'
import PositionCard from '../../components/PositionCard'
import PerpPositionCard from '../../components/PerpPositionCard'
import LiquidationCalc from '../../components/LiquidationCalc'

export default function PortfolioView({ portfolio, loading, error, onRefresh }) {
  if (error) return <p className="text-destructive font-medium">{error}</p>

  if (!portfolio) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      {loading ? 'Loading portfolio…' : 'Connect your wallet to get started.'}
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <RiskScore
        score={portfolio.riskScore}
        totalCollateralUsd={portfolio.totalCollateralUsd}
        totalBorrowUsd={portfolio.totalBorrowUsd}
        perpExposureUsd={portfolio.perpExposureUsd}
        totalUnrealizedPnl={portfolio.totalUnrealizedPnl}
        worstHealthFactor={portfolio.worstHealthFactor}
        worstPositionType={portfolio.worstPositionType}
        settings={portfolio.settings}
        positions={portfolio.positions}
      />

      <AiAnalysis analyses={portfolio.latestAiAnalysis ?? []} onResult={onRefresh} />

      {portfolio.positions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">No active positions found.</p>
          <p className="text-muted-foreground text-sm">Make sure your wallet has open positions on MarginFi, Kamino, or Jupiter.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="text-muted-foreground font-semibold uppercase tracking-wider text-xs">Active Positions</h2>
          {[...portfolio.positions]
            .sort((a) => (a.positionType === 'perp' ? -1 : 1))
            .map((p, i) =>
              p.positionType === 'perp'
                ? <PerpPositionCard key={i} position={p} settings={portfolio.settings} />
                : <PositionCard key={i} position={p} settings={portfolio.settings} />
            )
          }
        </div>
      )}

      <LiquidationCalc positions={portfolio.positions} />
    </div>
  )
}