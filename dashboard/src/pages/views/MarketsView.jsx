import { useState, useMemo, useEffect } from 'react'
import { useMarkets } from '../../hooks/useMarkets'
import { Button as MovingBorderButton } from '@/components/ui/moving-border'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ExternalLink, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

const PROTOCOL_COLOR = { marginfi: '#00c8e0', kamino: '#a855f7' }
const STABLES = new Set(['USDC','USDT','USDS','USDH','USDG','PYUSD','FDUSD','USD1TT','DAI','BUSD','FRAX','TUSD','LUSD','USDE','USDP'])
const CATEGORIES = ['All', 'Stablecoins', 'SOL', 'Other']

function isSolToken(t = '') { const u = t.toUpperCase(); return u === 'SOL' || u === 'WSOL' || u.endsWith('SOL') }
function isStable(t = '')   { return STABLES.has(t.toUpperCase()) }

function apyColor(apy) {
  if (apy >= 20) return '#ffd700'
  if (apy >= 10) return '#2ecc00'
  if (apy >= 5)  return '#00c8e0'
  if (apy >= 2)  return '#e06000'
  return '#888'
}

function utilColor(u) {
  if (u >= 80) return '#e0007a'
  if (u >= 60) return '#e06000'
  if (u >= 30) return '#00c8e0'
  return '#888'
}

function ProtocolBadge({ m }) {
  const color = PROTOCOL_COLOR[m.protocol] ?? '#888'
  const label = m.protocol === 'marginfi' ? 'MarginFi' : 'Kamino'
  return (
    <Badge className="text-[10px] px-1.5 py-0 font-bold uppercase shrink-0"
      style={{ background: color + '22', color, border: 'none' }}>
      {label}
    </Badge>
  )
}

function SortIcon({ col, sort }) {
  if (sort.col !== col) return <ChevronsUpDown size={12} className="text-muted-foreground/50" />
  return sort.dir === 'desc'
    ? <ChevronDown size={12} className="text-primary" />
    : <ChevronUp size={12} className="text-primary" />
}

function SortHeader({ label, col, sort, onSort, className = '' }) {
  return (
    <button
      onClick={() => onSort(col)}
      className={`flex items-center gap-1 text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition-colors ${className}`}
    >
      {label}<SortIcon col={col} sort={sort} />
    </button>
  )
}

function TopCard({ m, maxApy }) {
  const color = apyColor(m.supplyApy)
  const pct   = Math.min(100, (m.supplyApy / maxApy) * 100)
  return (
    <MovingBorderButton
      as="a" href={m.url} target="_blank" rel="noopener noreferrer"
      borderRadius="0.75rem" containerClassName="w-full h-auto"
      borderClassName={`bg-[radial-gradient(${color}_40%,transparent_60%)] opacity-80`}
      className="flex flex-col gap-3 p-5 bg-card text-left w-full h-auto items-start"
    >
      <div className="flex items-start justify-between w-full">
        <div className="flex flex-col gap-1.5">
          <span className="text-lg font-black">{m.token ?? '—'}</span>
          <ProtocolBadge m={m} />
        </div>
        <ExternalLink size={14} className="text-muted-foreground mt-1 opacity-50" />
      </div>
      <div>
        <p className="text-3xl font-black tabular-nums" style={{ color }}>{m.supplyApy.toFixed(2)}%</p>
        <p className="text-muted-foreground text-xs mt-0.5">supply APY</p>
      </div>
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
        {m.borrowApy > 0.01 ? <span>{m.borrowApy.toFixed(2)}% borrow</span> : <span />}
        <div className="flex gap-3">
          {m.tvlUsd   != null && <span>TVL ${(m.tvlUsd / 1e6).toFixed(1)}M</span>}
          {m.utilization != null && <span style={{ color: utilColor(m.utilization) }}>{m.utilization}% util</span>}
        </div>
      </div>
    </MovingBorderButton>
  )
}

function TableRow({ m, cols }) {
  return (
    <a href={m.url} target="_blank" rel="noopener noreferrer"
      className="grid items-center px-4 py-3 border-b border-border last:border-0 hover:bg-muted/40 transition-colors group"
      style={{ gridTemplateColumns: cols }}>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-semibold text-sm truncate">{m.token ?? '—'}</span>
        <ProtocolBadge m={m} />
      </div>
      <span className="text-xs text-right tabular-nums text-muted-foreground pr-4">
        {m.tvlUsd != null ? `$${(m.tvlUsd / 1e6).toFixed(1)}M` : '—'}
      </span>
      <span className="text-xs text-right tabular-nums pr-4" style={{ color: m.utilization != null ? utilColor(m.utilization) : '#888' }}>
        {m.utilization != null ? `${m.utilization}%` : '—'}
      </span>
      <span className="text-xs text-right tabular-nums text-muted-foreground pr-4">
        {m.borrowApy > 0.01 ? `${m.borrowApy.toFixed(2)}%` : '—'}
      </span>
      <div className="flex items-center gap-1 justify-end">
        <span className="font-black tabular-nums text-sm" style={{ color: apyColor(m.supplyApy) }}>
          {m.supplyApy.toFixed(2)}%
        </span>
        <ExternalLink size={11} className="text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity" />
      </div>
    </a>
  )
}

const COLS_DESKTOP = '1fr 80px 80px 90px 90px'
const COLS_MOBILE  = '1fr 60px 60px 68px 68px'

export default function MarketsView() {
  const { markets, loading, error } = useMarkets()
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('All')
  const [sort,     setSort]     = useState({ col: 'supplyApy', dir: 'desc' })
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const COLS = isMobile ? COLS_MOBILE : COLS_DESKTOP

  function handleSort(col) {
    setSort(s => s.col === col
      ? { col, dir: s.dir === 'desc' ? 'asc' : 'desc' }
      : { col, dir: 'desc' })
  }

  const filtered = useMemo(() => {
    const list = markets.filter(m => {
      const token = m.token ?? ''
      if (search && !token.toLowerCase().includes(search.toLowerCase())) return false
      if (category === 'Stablecoins' && !isStable(token))                return false
      if (category === 'SOL'         && !isSolToken(token))              return false
      if (category === 'Other'       && (isStable(token) || isSolToken(token))) return false
      return true
    })
    return list.sort((a, b) => {
      const av = a[sort.col] ?? -1
      const bv = b[sort.col] ?? -1
      return sort.dir === 'desc' ? bv - av : av - bv
    })
  }, [markets, search, category, sort])

  const top3   = filtered.slice(0, 3)
  const rest   = filtered.slice(3)
  const maxApy = [...filtered].sort((a,b) => b.supplyApy - a.supplyApy)[0]?.supplyApy ?? 1

  return (
    <div className="flex flex-col gap-6">

      <div>
        <h2 className="text-lg font-black">Best Yields Right Now</h2>
        <p className="text-muted-foreground text-sm">MarginFi &amp; Kamino · updates every 5 min</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border
              ${category === c ? 'bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground border-border hover:text-foreground'}`}>
            {c}
          </button>
        ))}
      </div>

      {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
      {error   && <p className="text-destructive text-sm">Failed to load rates</p>}
      {!loading && filtered.length === 0 && <p className="text-muted-foreground text-sm">No results for "{search}"</p>}

      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {top3.map((m, i) => <TopCard key={i} m={m} maxApy={maxApy} />)}
        </div>
      )}

      {(top3.length > 0 || rest.length > 0) && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search token…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm w-full" />
        </div>
      )}

      {rest.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="grid items-center px-4 py-2.5 border-b border-border bg-muted/30 gap-0"
            style={{ gridTemplateColumns: COLS }}>
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Asset</span>
            <SortHeader label="TVL"   col="tvlUsd"      sort={sort} onSort={handleSort} className="justify-end pr-4" />
            <SortHeader label="Util"  col="utilization" sort={sort} onSort={handleSort} className="justify-end pr-4" />
            <SortHeader label="Borrow" col="borrowApy"  sort={sort} onSort={handleSort} className="justify-end pr-4" />
            <SortHeader label="Supply" col="supplyApy"  sort={sort} onSort={handleSort} className="justify-end" />
          </div>
          {rest.map((m, i) => <TableRow key={i} m={m} cols={COLS} />)}
        </div>
      )}
    </div>
  )
}
