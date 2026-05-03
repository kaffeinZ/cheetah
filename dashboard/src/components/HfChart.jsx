import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const API = 'https://vrynn.xyz/api'

function formatTime(t, period) {
  const d = new Date(t * 1000)
  return period === '24h'
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function MiniChart({ title, data, dataKey, color, domain, dangerY, dangerLabel, tooltipFormatter, period }) {
  if (!data.length) return (
    <div className="flex flex-col gap-1">
      <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
      <div className="h-20 flex items-center justify-center text-zinc-300 dark:text-zinc-700 text-xs">No data yet</div>
    </div>
  )

  return (
    <div className="flex flex-col gap-1">
      <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
      <ResponsiveContainer width="100%" height={90}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="t" tickFormatter={t => formatTime(t, period)} tick={{ fontSize: 9, fill: '#a1a1aa' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 9, fill: '#a1a1aa' }} tickLine={false} axisLine={false} domain={domain} />
          <Tooltip
            formatter={(v) => [tooltipFormatter(v)]}
            labelFormatter={t => formatTime(t, period)}
            contentStyle={{ background: 'var(--tooltip-bg, #fff)', border: '1px solid #e4e4e7', borderRadius: 8, fontSize: 11 }}
          />
          {dangerY !== undefined && (
            <ReferenceLine y={dangerY} stroke="#e0007a" strokeDasharray="3 3"
              label={{ value: dangerLabel, position: 'insideTopLeft', fontSize: 9, fill: '#e0007a' }} />
          )}
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function HfChart({ walletAddress }) {
  const [data,    setData]    = useState({ lending: [], perps: [] })
  const [period,  setPeriod]  = useState('24h')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) return
    setLoading(true)
    fetch(`${API}/hf-history/${walletAddress}?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [walletAddress, period])

  const hasLending = data.lending?.length > 0
  const hasPerps   = data.perps?.length > 0

  if (!loading && !hasLending && !hasPerps) return null

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-zinc-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider">History</h2>
        <div className="flex gap-1">
          {['24h', '7d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                period === p ? 'bg-[#00c8e0] text-white' : 'text-zinc-400 hover:text-zinc-600'
              }`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-16 flex items-center justify-center text-zinc-300 text-xs">Loading...</div>
      ) : (
        <div className="flex flex-col gap-4">
          {hasLending && (
            <MiniChart
              title="Lending — Health Factor"
              data={data.lending}
              dataKey="hf"
              color="#00c8e0"
              domain={[0, 5]}
              dangerY={1.0}
              dangerLabel="Danger"
              tooltipFormatter={v => `HF ${v.toFixed(3)}`}
              period={period}
            />
          )}
          {hasPerps && (
            <MiniChart
              title="Perps — % from liquidation"
              data={data.perps}
              dataKey="pct"
              color="#e06000"
              domain={[0, 50]}
              dangerY={5}
              dangerLabel="5%"
              tooltipFormatter={v => `${v.toFixed(1)}% from liq`}
              period={period}
            />
          )}
        </div>
      )}
    </div>
  )
}
