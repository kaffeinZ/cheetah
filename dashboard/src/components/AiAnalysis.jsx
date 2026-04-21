import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

const API = 'https://vrynn.xyz/api'

export default function AiAnalysis({ analyses = [], onResult }) {
  const { publicKey } = useWallet()
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [usage,     setUsage]     = useState(null)

  async function handleAnalyze() {
    if (!publicKey) return
    setLoading(true)
    setError(null)
    try {
      const auth      = JSON.parse(localStorage.getItem('vrynn_auth') || '{}')
      const signature = auth.signature
      if (!signature) throw new Error('Session expired — please reconnect your wallet')
      const res  = await fetch(`${API}/analyze`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ address: publicKey.toBase58(), signature }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.usage) setUsage(data.usage)
        throw new Error(data.error)
      }
      setUsage(data.usage)
      onResult?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const remaining = usage?.remaining ?? null
  const atLimit   = remaining !== null && remaining <= 0

  return (
    <div className="card p-5 flex flex-col gap-3 border-l-4 border-l-[#7000e0]">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[#7000e0] uppercase tracking-wider text-xs">AI Risk Analysis</h2>
        <div className="flex items-center gap-3">
          {remaining !== null && (
            <span className={`text-xs font-medium ${atLimit ? 'text-[#e0007a]' : 'text-zinc-400'}`}>
              {remaining}/{usage.limit} today
            </span>
          )}
          <button
            onClick={handleAnalyze}
            disabled={loading || atLimit}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(90deg, #7000e0, #e0007a)', boxShadow: '0 2px 8px rgba(112,0,224,0.3)' }}
          >
            {loading ? 'Analysing...' : atLimit ? 'Limit reached' : '✦ Analyse Risk'}
          </button>
        </div>
      </div>

      {analyses.length > 0 ? (
        analyses.map((a, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-xs capitalize">{a.protocol}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                a.risk_level === 'LOW'    ? 'bg-[#2ecc00]/15 text-[#2ecc00]' :
                a.risk_level === 'MEDIUM' ? 'bg-[#00c8e0]/15 text-[#00c8e0]' :
                a.risk_level === 'HIGH'   ? 'bg-[#e06000]/15 text-[#e06000]' :
                'bg-[#e0007a]/15 text-[#e0007a]'
              }`}>{a.risk_level}</span>
              <span className="text-zinc-300 text-xs ml-auto">
                {new Date(a.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-zinc-600 text-sm leading-relaxed">{a.analysis}</p>
          </div>
        ))
      ) : (
        <p className="text-zinc-400 text-sm">No analysis yet — click Analyse Risk to get started.</p>
      )}

      {error && <p className="text-[#e0007a] text-xs">{error}</p>}
    </div>
  )
}