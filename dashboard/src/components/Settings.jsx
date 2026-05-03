import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

const API = 'https://vrynn.xyz/api'

export default function Settings({ settings, onSaved }) {
  const { publicKey } = useWallet()
  const [hfWarning,    setHfWarning]    = useState(settings?.hf_warning    ?? 1.5)
  const [perpAlertPct, setPerpAlertPct] = useState(settings?.perp_alert_pct ?? 10)
  const [alerts,       setAlerts]       = useState(settings?.alerts_enabled  ?? 1)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)
  const [saved,      setSaved]      = useState(false)

  async function handleSave() {
    if (!publicKey) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const auth      = JSON.parse(localStorage.getItem('vrynn_auth') || '{}')
      const signature = auth.signature
      if (!signature) throw new Error('Session expired — please reconnect your wallet')
      const res  = await fetch(`${API}/settings`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          address:       publicKey.toBase58(),
          signature,
          hfWarning:     parseFloat(hfWarning),
          hfCritical:    Math.max(1.0, parseFloat(hfWarning) - 0.3),
          alertsEnabled: alerts === 1,
          perpAlertPct:  parseFloat(perpAlertPct),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSaved(true)
      onSaved?.(data.settings)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card p-5 flex flex-col gap-5">
      <h2 className="text-zinc-700 dark:text-zinc-300 font-bold">Alert Settings</h2>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-sm">
          <label className="text-zinc-500 dark:text-zinc-400">Lending alert threshold (HF)</label>
          <span className="font-mono font-bold" style={{ color: '#e06000' }}>{parseFloat(hfWarning).toFixed(2)}</span>
        </div>
        <input type="range" min="1.05" max="2.5" step="0.05"
          value={hfWarning}
          onChange={e => setHfWarning(e.target.value)}
          className="w-full accent-[#e06000]"
        />
        <p className="text-zinc-400 text-xs">Alert fires when lending HF drops below this</p>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-sm">
          <label className="text-zinc-500 dark:text-zinc-400">Perp alert threshold</label>
          <span className="font-mono font-bold" style={{ color: '#e0007a' }}>{parseFloat(perpAlertPct).toFixed(0)}% from liq</span>
        </div>
        <input type="range" min="2" max="20" step="1"
          value={perpAlertPct}
          onChange={e => setPerpAlertPct(e.target.value)}
          className="w-full accent-[#e0007a]"
        />
        <p className="text-zinc-400 text-xs">Alert fires when perp is within this % of liquidation</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-zinc-500 dark:text-zinc-400 text-sm">Telegram alerts</span>
        <button
          onClick={() => setAlerts(alerts === 1 ? 0 : 1)}
          className="w-12 h-6 rounded-full transition-colors"
          style={{ background: alerts === 1 ? '#2ecc00' : '#e0e0e0' }}
        >
          <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform shadow-sm ${alerts === 1 ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

      {error && <p className="text-[#e0007a] text-sm">{error}</p>}

      <div className="flex items-center justify-between">
        {saved  && <p className="text-[#2ecc00] text-xs font-medium">Saved ✓</p>}
        {!saved && <span />}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(90deg, #00c8e0, #7000e0)', boxShadow: '0 2px 10px rgba(0,200,224,0.25)' }}
        >
          {saving ? 'Signing...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
