import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ConnectWallet from '../components/ConnectWallet'

const STEPS = [
  { n: '1', color: '#00c8e0', title: 'Connect your wallet', desc: 'Sign a message to verify ownership — no private keys ever leave your device.' },
  { n: '2', color: '#7000e0', title: 'We monitor your positions', desc: 'MarginFi and Kamino positions scanned every 60 seconds, 24/7.' },
  { n: '3', color: '#e0007a', title: 'Get alerted before liquidation', desc: 'Instant Telegram alerts when your health factor drops into danger.' },
]

const FEATURES = [
  { icon: '🤖', color: '#7000e0', title: 'AI Risk Analysis',      desc: 'DeepSeek analyses your positions and explains your risk in plain English.' },
  { icon: '⚡', color: '#00c8e0', title: 'Real-Time Monitoring',   desc: 'Health factors tracked every 60 seconds across all your lending positions.' },
  { icon: '📡', color: '#e0007a', title: 'Telegram Alerts',        desc: 'Instant notifications sent directly to your Telegram when risk level changes.' },
  { icon: '🔗', color: '#e06000', title: 'Multi-Protocol',         desc: 'MarginFi and Kamino supported today. More protocols coming soon.' },
]

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: '#00c8e0',
    features: ['1 wallet monitored', 'Telegram alerts', 'MarginFi + Kamino', '60s polling interval', '4 AI analyses per day'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Plus',
    price: null,
    period: null,
    color: '#7000e0',
    features: ['3 wallets monitored', 'All Free features', '30s polling interval', '10 AI analyses per day', 'More protocols'],
    cta: 'Coming Soon',
    highlight: true,
  },
  {
    name: 'Pro',
    price: null,
    period: null,
    color: '#e0007a',
    features: ['Unlimited wallets', 'All Plus features', '15s polling interval', 'Unlimited AI analyses', 'Priority alerts'],
    cta: 'Coming Soon',
    highlight: false,
  },
]

export default function Landing() {
  const { connected } = useWallet()
  const navigate = useNavigate()

  function handleAuth(authData) {
    localStorage.setItem('vrynn_auth', JSON.stringify(authData))
    navigate('/dashboard')
  }

  useEffect(() => {
    if (connected && localStorage.getItem('vrynn_auth')) {
      navigate('/dashboard')
    }
  }, [connected])

  return (
    <div className="min-h-screen bg-white text-zinc-900">

      {/* Nav */}
      <nav className="border-b border-black/8 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-black gradient-text">Vrynn</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#00c8e0]/15 text-[#00c8e0] border border-[#00c8e0]/30">Beta</span>
        </div>
        <ConnectWallet onAuth={handleAuth} compact />
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 flex flex-col items-center text-center gap-6">
        <div className="text-xs font-bold tracking-widest text-[#00c8e0] uppercase bg-[#00c8e0]/10 px-4 py-1.5 rounded-full">
          Solana DeFi Protection
        </div>
        <h1 className="text-5xl sm:text-6xl font-black leading-tight">
          Master Your Solana<br />
          <span className="gradient-text">Leverage Risk.</span>
        </h1>
        <p className="text-zinc-500 text-lg max-w-xl">
          Vrynn delivers real-time health factor alerts across MarginFi and Kamino — liquidation-proof your positions before volatility strikes.
        </p>
        <ConnectWallet onAuth={handleAuth} />
      </section>

      {/* How it works */}
      <section className="bg-zinc-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-12">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map(s => (
              <div key={s.n} className="card p-6 flex flex-col gap-3" style={{ borderTop: `4px solid ${s.color}` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black" style={{ background: s.color }}>
                  {s.n}
                </div>
                <h3 className="font-bold text-zinc-900">{s.title}</h3>
                <p className="text-zinc-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-black text-center mb-12">Everything you need</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="card p-6 flex gap-4" style={{ borderLeft: `4px solid ${f.color}` }}>
              <span className="text-3xl">{f.icon}</span>
              <div>
                <h3 className="font-bold text-zinc-900 mb-1">{f.title}</h3>
                <p className="text-zinc-500 text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-zinc-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-12">Pricing</h2>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map(p => (
              <div key={p.name} className={`card p-6 flex flex-col gap-4 relative ${p.highlight ? 'ring-2' : ''}`}
                style={{ borderTop: `4px solid ${p.color}`, ...(p.highlight ? { ringColor: p.color } : {}) }}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: p.color }}>Most Popular</span>
                  </div>
                )}
                <div>
                  <div className="text-zinc-400 text-sm mb-1 font-medium">{p.name}</div>
                  {p.price ? (
                    <div className="text-4xl font-black text-zinc-900">
                      {p.price} <span className="text-zinc-400 text-sm font-normal">/ {p.period}</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-black" style={{ color: p.color }}>Coming Soon</div>
                  )}
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="text-zinc-600 text-sm flex items-center gap-2">
                      <span className="font-bold" style={{ color: p.color }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={p.cta === 'Coming Soon'}
                  className="mt-auto py-2.5 rounded-xl font-bold text-sm transition-all"
                  style={p.cta !== 'Coming Soon'
                    ? { background: p.color, color: 'white', boxShadow: `0 4px 16px ${p.color}40` }
                    : { background: '#f0f0f0', color: '#aaa', cursor: 'not-allowed' }
                  }
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-5xl mx-auto px-6 py-24 flex flex-col items-center text-center gap-6">
        <h2 className="text-4xl font-black">Start monitoring <span className="gradient-text">for free</span></h2>
        <p className="text-zinc-500 text-lg">Connect your wallet and get your first alert in under a minute.</p>
        <ConnectWallet onAuth={handleAuth} />
      </section>

      {/* Footer */}
      <footer className="border-t border-black/8 px-6 py-6 flex flex-col items-center gap-2">
        <p className="text-zinc-400 text-sm">© 2026 Vrynn Protocol · vrynn.xyz</p>
        <p className="text-zinc-800 text-xs max-w-xl text-center">
          Vrynn is in early beta. Alerts are informational only and do not constitute financial advice.
          Always monitor your own positions. We are not responsible for any liquidations or losses.
        </p>
      </footer>

    </div>
  )
}
