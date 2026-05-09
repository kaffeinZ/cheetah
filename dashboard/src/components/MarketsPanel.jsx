import { useMarkets } from '../hooks/useMarkets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'

const PROTOCOL_COLOR = {
  marginfi: '#00c8e0',
  kamino:   '#a855f7',
}

function rateColor(apy) {
  if (apy >= 10) return '#2ecc00'
  if (apy >= 5)  return '#00c8e0'
  if (apy >= 2)  return '#e06000'
  return '#888'
}

export default function MarketsPanel() {
  const { markets, loading, error } = useMarkets()

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Best Lending Rates
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading && <p className="text-muted-foreground text-xs px-4 pb-3">Loading…</p>}
        {error   && <p className="text-destructive text-xs px-4 pb-3">Unavailable</p>}
        <div className="divide-y divide-border">
          {markets.slice(0, 10).map((m, i) => (
            <a
              key={i}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-2 hover:bg-muted/40 transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-sm truncate">{m.token ?? '—'}</span>
                <Badge
                  className="text-[10px] px-1.5 py-0 font-bold uppercase shrink-0"
                  style={{
                    background: (PROTOCOL_COLOR[m.protocol] ?? '#888') + '22',
                    color: PROTOCOL_COLOR[m.protocol] ?? '#888',
                    border: 'none',
                  }}
                >
                  {m.protocol === 'marginfi' ? 'mrgn' : m.market ?? m.protocol}
                </Badge>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-sm font-black tabular-nums" style={{ color: rateColor(m.supplyApy) }}>
                  {m.supplyApy.toFixed(2)}%
                </span>
                <ExternalLink size={11} className="text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity" />
              </div>
            </a>
          ))}
        </div>
        {markets.length > 0 && (
          <p className="text-muted-foreground text-[10px] px-4 py-2">
            Supply APY · updated every 5 min
          </p>
        )}
      </CardContent>
    </Card>
  )
}
