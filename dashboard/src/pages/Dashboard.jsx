import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useVrynn } from '../hooks/useVrynn'
import PositionCard from '../components/PositionCard'
import RiskScore from '../components/RiskScore'
import AlertHistory from '../components/AlertHistory'
import Settings from '../components/Settings'
import TelegramLink from '../components/TelegramLink'

const TABS = ['Positions', 'Alerts', 'Settings']

export default function Dashboard() {
  const { publicKey } = useWallet()
  const { portfolio, alerts, loading, error, lastUpdated, refresh } = useVrynn()
  const [tab, setTab] = useState('Positions')

  const address = publicKey?.toBase58() ?? ''
  const short = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : ''

  return (
    <div className="min-h-screen text-zinc-900 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-black/8 px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-2xl font-black gradient-text tracking-tight">Vrynn</h1>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-sm font-mono">{short}</span>
          <WalletMultiButton />
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-black/8 px-6 flex gap-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
              tab === t
                ? 'border-[#00c8e0] text-[#00c8e0]'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="max-w-4xl w-full mx-auto px-6 py-8 flex flex-col gap-6 flex-1">

        {/* Status bar */}
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>{loading ? 'Updating...' : lastUpdated ? `Updated ${lastUpdated}` : ''}</span>
          <button
            onClick={refresh}
            disabled={loading}
            className="text-[#00c8e0] hover:text-[#00a8c0] disabled:opacity-40 transition-colors font-medium"
          >
            ↻ Refresh
          </button>
        </div>

        {error && <p className="text-[#e0007a] text-center font-medium">{error}</p>}

        {/* Positions tab */}
        {tab === 'Positions' && portfolio && (
          <>
            <RiskScore score={portfolio.riskScore} />

            <div className="grid grid-cols-2 gap-4">
              <div className="card p-4 glow-cyan border-l-4 border-l-[#00c8e0]">
                <p className="text-zinc-400 text-xs mb-1 uppercase tracking-wider">Total Collateral</p>
                <p className="text-zinc-900 text-2xl font-bold">${portfolio.totalCollateralUsd?.toFixed(2) ?? '0.00'}</p>
              </div>
              <div className="card p-4 glow-pink border-l-4 border-l-[#e0007a]">
                <p className="text-zinc-400 text-xs mb-1 uppercase tracking-wider">Total Borrowed</p>
                <p className="text-zinc-900 text-2xl font-bold">${portfolio.totalBorrowUsd?.toFixed(2) ?? '0.00'}</p>
              </div>
            </div>

            {portfolio.latestAiAnalysis?.length > 0 && (
              <div className="card p-5 flex flex-col gap-3 border-l-4 border-l-[#7000e0]">
                <h2 className="font-bold text-[#7000e0] uppercase tracking-wider text-xs">AI Risk Analysis</h2>
                {portfolio.latestAiAnalysis.map((a, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 text-xs capitalize">{a.protocol}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        a.risk_level === 'LOW'    ? 'bg-[#2ecc00]/15 text-[#2ecc00]' :
                        a.risk_level === 'MEDIUM' ? 'bg-[#00c8e0]/15 text-[#00c8e0]' :
                        a.risk_level === 'HIGH'   ? 'bg-[#e06000]/15 text-[#e06000]' :
                        'bg-[#e0007a]/15 text-[#e0007a]'
                      }`}>{a.risk_level}</span>
                    </div>
                    <p className="text-zinc-600 text-sm leading-relaxed">{a.analysis}</p>
                  </div>
                ))}
              </div>
            )}

            {portfolio.positions.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <p className="text-zinc-400">No active lending positions found.</p>
                <p className="text-zinc-300 text-sm">Make sure your wallet has open positions on MarginFi or Kamino.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <h2 className="text-zinc-400 font-semibold uppercase tracking-wider text-xs">Active Positions</h2>
                {portfolio.positions.map((p, i) => (
                  <PositionCard key={i} position={p} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Alerts tab */}
        {tab === 'Alerts' && <AlertHistory alerts={alerts} />}

        {/* Settings tab */}
        {tab === 'Settings' && portfolio && (
          <div className="flex flex-col gap-6">
            <Settings settings={portfolio.settings} onSaved={(s) => console.log('settings saved', s)} />
            <TelegramLink />
          </div>
        )}

      </main>
    </div>
  )
}
