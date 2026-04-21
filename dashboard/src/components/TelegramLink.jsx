import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

const API = 'https://vrynn.xyz/api'

export default function TelegramLink() {
  const { publicKey } = useWallet()
  const [code,    setCode]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [copied,  setCopied]  = useState(false)

  async function handleGenerate() {
    if (!publicKey) return
    setLoading(true)
    setError(null)
    setCode(null)
    try {
      const auth      = JSON.parse(localStorage.getItem('vrynn_auth') || '{}')
      const signature = auth.signature
      if (!signature) throw new Error('Session expired — please reconnect your wallet')
      const res  = await fetch(`${API}/telegram/link`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ address: publicKey.toBase58(), signature }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCode(data.code)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(`/link ${code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-zinc-700 font-bold">Link Telegram</h2>
        <p className="text-zinc-400 text-sm">Connect your Telegram to receive alerts directly in your chat.</p>
      </div>

      {!code ? (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(90deg, #00c8e0, #7000e0)', boxShadow: '0 4px 16px rgba(0,200,224,0.3)' }}
        >
          {loading ? 'Generating...' : 'Generate Link Code'}
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-zinc-500 text-sm">
            Send this command to <span className="text-zinc-900 font-mono font-bold">@VrynnBot</span> on Telegram:
          </p>
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
            <span className="text-zinc-900 font-mono text-lg tracking-widest flex-1">/link {code}</span>
            <button
              onClick={handleCopy}
              className="text-[#00c8e0] hover:text-[#00a8c0] text-xs font-semibold transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-zinc-400 text-xs">Code expires in 10 minutes.</p>
          <button
            onClick={handleGenerate}
            className="text-[#00c8e0] hover:text-[#00a8c0] text-sm font-medium transition-colors"
          >
            Generate new code
          </button>
        </div>
      )}

      {error && <p className="text-[#e0007a] text-sm">{error}</p>}
    </div>
  )
}
