import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ConnectWallet from '../components/ConnectWallet'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../hooks/useTheme'
import { useMarkets } from '../hooks/useMarkets'
import { usePerps }   from '../hooks/usePerps'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import { ExternalLink } from 'lucide-react'

const PROTOCOL_COLOR = { marginfi: '#00c8e0', kamino: '#a855f7' }

function apyColor(apy) {
  if (apy >= 20) return '#ffd700'
  if (apy >= 10) return '#2ecc00'
  if (apy >= 5)  return '#00c8e0'
  if (apy >= 2)  return '#e06000'
  return '#888'
}

function LandingRateRow({ m, valueKey, colorFn }) {
  const color = PROTOCOL_COLOR[m.protocol] ?? '#888'
  const val   = m[valueKey]
  return (
    <a href={m.url} target="_blank" rel="noopener noreferrer"
      className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/40 transition-colors group">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm">{m.token ?? '—'}</span>
        <Badge className="text-[10px] px-1.5 py-0 font-bold uppercase"
          style={{ background: color + '22', color, border: 'none' }}>
          {m.protocol === 'marginfi' ? 'mrgn' : m.market ?? m.protocol}
        </Badge>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-black tabular-nums text-sm" style={{ color: colorFn(val) }}>
          {val > 0.01 ? `${val.toFixed(2)}%` : '—'}
        </span>
        <ExternalLink size={11} className="opacity-0 group-hover:opacity-50 text-muted-foreground" />
      </div>
    </a>
  )
}

const TOKEN_ICONS  = { SOL: '◎', BTC: '₿', ETH: 'Ξ' }
const TOKEN_COLORS = { SOL: '#9945ff', BTC: '#f7931a', ETH: '#627eea' }
const PERPS_URLS   = { SOL: 'https://jup.ag/perps/long/SOL-SOL', BTC: 'https://jup.ag/perps/long/WBTC-WBTC', ETH: 'https://jup.ag/perps/long/ETH-ETH' }

function formatPrice(p) {
  if (p >= 1000) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (p >= 1)    return `$${p.toFixed(2)}`
  return `$${p.toFixed(4)}`
}

function UtilBar({ pct, color }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mt-1">
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  )
}

function PerpsCard({ p }) {
  const tokenColor = TOKEN_COLORS[p.token] ?? '#888'
  const total    = p.longUtilization + p.shortUtilization
  const longPct  = total > 0 ? (p.longUtilization / total) * 100 : 50
  const shortPct = 100 - longPct
  const biasLabel = longPct > 60 ? 'Long-heavy' : longPct < 40 ? 'Short-heavy' : 'Balanced'
  const biasColor = longPct > 60 ? '#2ecc00' : longPct < 40 ? '#e0007a' : '#888'

  return (
    <a href={PERPS_URLS[p.token] ?? 'https://jup.ag/perps'} target="_blank" rel="noopener noreferrer"
      className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 hover:bg-muted/40 transition-colors group relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 blur-2xl pointer-events-none"
        style={{ background: `radial-gradient(circle at 20% 20%, ${tokenColor}, transparent 60%)` }} />

      {/* Header: token + price + 24h change */}
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black" style={{ color: tokenColor }}>{TOKEN_ICONS[p.token] ?? p.token[0]}</span>
          <span className="font-black text-base">{p.token}</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold tabular-nums text-muted-foreground">{p.price > 0 ? formatPrice(p.price) : '—'}</span>
            <ExternalLink size={12} className="text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity" />
          </div>
          {p.price24hChange != null && (
            <span className="text-xs font-bold tabular-nums" style={{ color: p.price24hChange >= 0 ? '#2ecc00' : '#e0007a' }}>
              {p.price24hChange >= 0 ? '+' : ''}{p.price24hChange.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {/* Market bias bar */}
      <div className="flex flex-col gap-1.5 relative">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
          <span style={{ color: '#2ecc00' }}>Long {p.longUtilization.toFixed(1)}%</span>
          <span style={{ color: '#e0007a' }}>Short {p.shortUtilization.toFixed(1)}%</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden flex bg-muted">
          <div className="h-full transition-all" style={{ width: `${longPct}%`, background: '#2ecc00' }} />
          <div className="h-full transition-all" style={{ width: `${shortPct}%`, background: '#e0007a' }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold" style={{ color: biasColor }}>{biasLabel}</span>
          <span className="text-[10px] text-muted-foreground">{longPct.toFixed(0)}% / {shortPct.toFixed(0)}%</span>
        </div>
      </div>

      {/* Borrow rates */}
      <div className="grid grid-cols-2 gap-4 relative">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Long borrow</p>
          <p className="text-xs font-semibold tabular-nums mt-0.5">{p.longBorrowRateHr.toFixed(4)}%<span className="text-muted-foreground font-normal">/h</span></p>
          <p className="text-[10px] text-muted-foreground">{p.longBorrowRateApr.toFixed(2)}% APR</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Short borrow</p>
          <p className="text-xs font-semibold tabular-nums mt-0.5">{p.shortBorrowRateHr.toFixed(4)}%<span className="text-muted-foreground font-normal">/h</span></p>
          <p className="text-[10px] text-muted-foreground">{p.shortBorrowRateApr.toFixed(2)}% APR</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 relative">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Open fee</span>
        <span className="text-xs font-semibold tabular-nums">{p.openFeePercent.toFixed(2)}%</span>
      </div>
    </a>
  )
}

const STEPS = [
  { n: '1', color: '#00c8e0', title: 'Connect your wallet', desc: 'Sign a message to verify ownership — no private keys ever leave your device.' },
  { n: '2', color: '#7000e0', title: 'We monitor your positions', desc: 'MarginFi, Kamino and Jupiter Perps monitored 24/7 — lending health factors and perp liquidation distances in one place.' },
  { n: '3', color: '#e0007a', title: 'Get alerted before liquidation', desc: 'Instant Telegram alerts when your health factor drops into danger.' },
]

const FEATURES = [
  { icon: '🤖', color: '#7000e0', title: 'AI Risk Analysis',      desc: 'DeepSeek analyses your positions and explains your risk in plain English.' },
  { icon: '⚡', color: '#00c8e0', title: 'Real-Time Monitoring',   desc: 'Health factors and perp liquidation distances tracked every 60 seconds across all your positions.' },
  { icon: '📡', color: '#e0007a', title: 'Telegram Alerts',        desc: 'Instant notifications sent directly to your Telegram when risk level changes.' },
  { icon: '📈', color: '#7000e0', title: 'Perps Monitoring',       desc: 'Track your Jupiter leverage positions with real-time liquidation distance alerts and PnL.' },
  { icon: '🔗', color: '#e06000', title: 'Multi-Protocol',         desc: 'MarginFi, Kamino and Jupiter Perps supported today. More protocols coming soon.' },
]

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: '#00c8e0',
    features: ['1 wallet monitored', 'Telegram alerts', 'MarginFi + Kamino + Jupiter Perps', '60s polling interval', '4 AI analyses per day'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Plus',
    price: null,
    color: '#7000e0',
    features: ['3 wallets monitored', 'All Free features', '30s polling interval', '10 AI analyses per day', 'More protocols'],
    cta: 'Coming Soon',
    highlight: true,
  },
  {
    name: 'Pro',
    price: null,
    color: '#e0007a',
    features: ['Unlimited wallets', 'All Plus features', '15s polling interval', 'Unlimited AI analyses', 'Priority alerts'],
    cta: 'Coming Soon',
    highlight: false,
  },
]

export default function Landing() {
  const { connected } = useWallet()
  const navigate = useNavigate()
  const { dark, toggle } = useTheme()
  const { markets } = useMarkets()
  const { perps }   = usePerps()

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
    <div className="min-h-screen bg-background text-foreground">

      {/* Beta disclaimer */}
      <div className="sticky top-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-700">
        Vrynn is in beta. Do not rely solely on this service for liquidation alerts — always monitor your positions independently.
      </div>

      {/* Nav */}
      <nav className="border-b border-border bg-card px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-black gradient-text">Vrynn</span>
          <Badge variant="outline" style={{ color: '#00c8e0', borderColor: '#00c8e0' }}>Beta</Badge>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle dark={dark} toggle={toggle} />
          <ConnectWallet onAuth={handleAuth} compact />
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 flex flex-col items-center text-center gap-6">
        <Badge variant="outline" style={{ color: '#00c8e0', borderColor: '#00c8e040' }} className="uppercase tracking-widest text-xs px-4 py-1.5">
          Solana DeFi Protection
        </Badge>
        <h1 className="text-5xl sm:text-6xl font-black leading-tight">
          Your Solana DeFi <span className="gradient-text">Intelligence Hub.</span>
        </h1>
        <TextGenerateEffect
          words="Live lending rates, position health, and AI risk analysis across MarginFi, Kamino and Jupiter — everything you need to stay informed before the market moves."
          className="text-muted-foreground max-w-xl font-normal text-lg"
          filter={false}
          duration={0.3}
        />
        <div className="relative">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00c8e0] to-[#e0007a] blur-md opacity-40 animate-pulse" />
          <ConnectWallet onAuth={handleAuth} />
        </div>
      </section>

      <Separator />

      {/* Live Rates */}
      {markets.length > 0 && (
        <section className="w-full py-20 bg-muted/40 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 relative z-10">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#00c8e0' }}>Live on-chain</span>
              <h2 className="text-3xl sm:text-4xl font-black mt-2">DeFi Rates Right Now</h2>
              <p className="text-muted-foreground mt-2 text-sm">Supply &amp; borrow rates across MarginFi and Kamino · updates every 5 min</p>
            </div>

            {/* Ticker */}
            <div className="overflow-hidden mb-10 border border-border rounded-lg py-2 bg-background/60">
              <div className="flex gap-8 whitespace-nowrap"
                style={{ animation: 'marquee 30s linear infinite', width: 'max-content' }}>
                {[...markets, ...markets].map((m, i) => (
                  <span key={i} className="flex items-center gap-2 text-sm font-semibold">
                    <span className="text-foreground">{m.token}</span>
                    <span style={{ color: apyColor(m.supplyApy) }}>{m.supplyApy.toFixed(2)}%</span>
                    <span className="text-muted-foreground">·</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Featured top lend + top borrow */}
            <div className="grid sm:grid-cols-2 gap-6 mb-10">
              {(() => {
                const topLend   = [...markets].sort((a,b) => b.supplyApy - a.supplyApy)[0]
                const topBorrow = [...markets].filter(m => m.borrowApy > 0.01).sort((a,b) => a.borrowApy - b.borrowApy)[0]
                return [
                  { m: topLend,   label: 'Highest Supply APY',  valueKey: 'supplyApy',  color: '#2ecc00' },
                  { m: topBorrow, label: 'Cheapest Borrow APY', valueKey: 'borrowApy',  color: '#00c8e0' },
                ].map(({ m, label, valueKey, color }) => m && (
                  <a key={label} href={m.url} target="_blank" rel="noopener noreferrer"
                    className="relative p-6 rounded-xl border border-border bg-card hover:bg-muted/60 transition-colors group overflow-hidden">
                    <div className="absolute inset-0 opacity-10 blur-2xl rounded-xl pointer-events-none"
                      style={{ background: `radial-gradient(circle at 30% 50%, ${color}, transparent 70%)` }} />
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color }}>{label}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-4xl font-black tabular-nums" style={{ color }}>{m[valueKey].toFixed(2)}%</p>
                        <p className="text-muted-foreground text-sm mt-1">{m.token} · {m.protocol === 'marginfi' ? 'MarginFi' : 'Kamino'}</p>
                      </div>
                      <ExternalLink size={16} className="text-muted-foreground group-hover:text-foreground transition-colors mb-1" />
                    </div>
                  </a>
                ))
              })()}
            </div>

            {/* Table */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: '↑ Best to Lend',        color: '#2ecc00', list: [...markets].sort((a,b) => b.supplyApy - a.supplyApy).slice(0,6), key: 'supplyApy', colorFn: apyColor },
                { title: '↓ Cheapest to Borrow',  color: '#00c8e0', list: [...markets].filter(m => m.borrowApy > 0.01).sort((a,b) => a.borrowApy - b.borrowApy).slice(0,6), key: 'borrowApy',
                  colorFn: v => v <= 3 ? '#2ecc00' : v <= 7 ? '#00c8e0' : v <= 12 ? '#e06000' : '#e0007a' },
              ].map(({ title, color, list, key, colorFn }) => (
                <div key={title} className="rounded-xl border border-border overflow-hidden bg-card">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{title}</span>
                  </div>
                  {list.map((m, i) => (
                    <a key={i} href={m.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                      <div className="flex flex-col gap-0">
                        <span className="text-sm font-bold" style={{ color: PROTOCOL_COLOR[m.protocol] ?? 'inherit' }}>{m.token}</span>
                        <span className="text-[10px] text-muted-foreground">{m.protocol === 'marginfi' ? 'MarginFi' : 'Kamino'}</span>
                      </div>
                      <span className="font-black text-sm tabular-nums" style={{ color: colorFn(m[key]) }}>
                        {m[key].toFixed(2)}%
                      </span>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
        </section>
      )}

      <Separator />

      {/* Jupiter Perps */}
      {perps.length > 0 && (
        <section className="w-full py-20 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#c7f284' }}>Jupiter Perps</span>
              <h2 className="text-3xl sm:text-4xl font-black mt-2">Live Perpetuals Markets</h2>
              <p className="text-muted-foreground mt-2 text-sm">Long &amp; short borrow rates and utilization · updates every 5 min</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {perps.map(p => <PerpsCard key={p.token} p={p} />)}
            </div>
          </div>
        </section>
      )}

      <Separator />

      {/* How it works */}
      <section className="py-20 bg-muted/40">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-12">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map(s => (
              <Card key={s.n} style={{ borderTop: `4px solid ${s.color}` }}>
                <CardContent className="flex flex-col gap-3 pt-5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black" style={{ background: s.color }}>
                    {s.n}
                  </div>
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="text-muted-foreground text-sm">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-black text-center mb-12">Everything you need</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map(f => (
            <Card key={f.title} style={{ borderLeft: `4px solid ${f.color}` }}>
              <CardContent className="flex gap-4 pt-5">
                <span className="text-3xl">{f.icon}</span>
                <div>
                  <h3 className="font-bold mb-1">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Pricing */}
      <section className="py-20 bg-muted/40">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-12">Pricing</h2>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map(p => (
              <Card key={p.name} className={`relative flex flex-col overflow-visible ${p.highlight ? 'ring-2' : ''}`}
                style={{ borderTop: `4px solid ${p.color}`, ...(p.highlight ? { ringColor: p.color } : {}) }}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge style={{ background: p.color, color: 'white', border: 'none' }}>Most Popular</Badge>
                  </div>
                )}
                <CardContent className="flex flex-col gap-4 flex-1 pt-5">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1 font-medium">{p.name}</p>
                    {p.price ? (
                      <div className="text-4xl font-black">
                        {p.price} <span className="text-muted-foreground text-sm font-normal">/ forever</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-black" style={{ color: p.color }}>Coming Soon</div>
                    )}
                  </div>
                  <ul className="flex flex-col gap-2 flex-1">
                    {p.features.map(f => (
                      <li key={f} className="text-muted-foreground text-sm flex items-center gap-2">
                        <span className="font-bold" style={{ color: p.color }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  {p.cta === 'Get Started' ? (
                    <ConnectWallet onAuth={handleAuth} compact />
                  ) : (
                    <Button disabled variant="secondary" className="w-full mt-auto">{p.cta}</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Bottom CTA */}
      <section className="max-w-5xl mx-auto px-6 py-24 flex flex-col items-center text-center gap-6">
        <h2 className="text-4xl font-black">Start exploring <span className="gradient-text">for free</span></h2>
        <p className="text-muted-foreground text-lg">Connect your wallet and see your positions, live rates, and risk analysis in seconds.</p>
        <ConnectWallet onAuth={handleAuth} />
      </section>

      {/* Footer */}
      <Separator />
      <footer className="px-6 py-6 flex flex-col items-center gap-2">
        <p className="text-muted-foreground text-sm">© 2026 Vrynn Protocol · vrynn.xyz</p>
        <p className="text-muted-foreground text-xs max-w-xl text-center">
          Vrynn is in early beta. Alerts are informational only and do not constitute financial advice.
          Always monitor your own positions. We are not responsible for any liquidations or losses.
        </p>
      </footer>

    </div>
  )
}