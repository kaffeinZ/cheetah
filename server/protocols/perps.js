const TOKEN_MINTS = {
  SOL: 'So11111111111111111111111111111111111111112',
  BTC: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
  ETH: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
}

const COINGECKO_IDS = { SOL: 'solana', BTC: 'bitcoin', ETH: 'ethereum' }

let _cache   = null
let _cacheAt = 0
const TTL_MS = 5 * 60 * 1000

export async function getPerpsMarkets() {
  if (_cache && Date.now() - _cacheAt < TTL_MS) return _cache

  // Fetch prices + 24h change in parallel
  let prices = {}
  let changes = {}

  await Promise.allSettled([
    (async () => {
      const ids = Object.values(TOKEN_MINTS).join(',')
      const res = await fetch(`https://api.jup.ag/price/v3?ids=${ids}`)
      if (!res.ok) return
      const data = await res.json()
      for (const [sym, mint] of Object.entries(TOKEN_MINTS)) {
        prices[sym] = data[mint]?.usdPrice ?? 0
      }
    })(),
    (async () => {
      const ids = Object.values(COINGECKO_IDS).join(',')
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`)
      if (!res.ok) return
      const data = await res.json()
      for (const [sym, cgId] of Object.entries(COINGECKO_IDS)) {
        changes[sym] = data[cgId]?.usd_24h_change ?? null
      }
    })(),
  ])

  const results = await Promise.allSettled(
    Object.entries(TOKEN_MINTS).map(async ([token, mint]) => {
      const res = await fetch(`https://perps-api.jup.ag/v1/pool-info?mint=${mint}`)
      if (!res.ok) throw new Error(`${token} perps API failed`)
      const d = await res.json()
      const longRateHr  = parseFloat(d.longBorrowRatePercent)  || 0
      const shortRateHr = parseFloat(d.shortBorrowRatePercent) || 0
      return {
        token,
        price:              prices[token] ?? 0,
        price24hChange:     changes[token] ?? null,
        longBorrowRateHr:   longRateHr,
        shortBorrowRateHr:  shortRateHr,
        longBorrowRateApr:  longRateHr  * 24 * 365,
        shortBorrowRateApr: shortRateHr * 24 * 365,
        longUtilization:    parseFloat(d.longUtilizationPercent)  || 0,
        shortUtilization:   parseFloat(d.shortUtilizationPercent) || 0,
        openFeePercent:     parseFloat(d.openFeePercent) || 0,
      }
    })
  )

  const markets = results.filter(r => r.status === 'fulfilled').map(r => r.value)
  _cache   = markets
  _cacheAt = Date.now()
  return markets
}
