import { config } from './config.js';

const BASE = 'https://public-api.birdeye.so';

const HEADERS = {
  'X-API-KEY':  config.birdeyeApiKey,
  'x-chain':    'solana',
  'accept':     'application/json',
};

/**
 * Get OHLCV price history for a token mint over the last N hours.
 * Returns array of { unixTime, open, high, low, close, volume }
 */
export async function getPriceHistory(mintAddress, hours = 6) {
  const now      = Math.floor(Date.now() / 1000);
  const from     = now - hours * 3600;
  const url      = `${BASE}/defi/ohlcv?address=${mintAddress}&type=1H&time_from=${from}&time_to=${now}`;

  const res  = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Birdeye OHLCV ${res.status}`);
  const data = await res.json();
  return data?.data?.items ?? [];
}

/**
 * Get current price of a token by mint address.
 */
export async function getCurrentPrice(mintAddress) {
  const url  = `${BASE}/defi/price?address=${mintAddress}`;
  const res  = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Birdeye price ${res.status}`);
  const data = await res.json();
  return data?.data?.value ?? null;
}

/**
 * Summarise price trend over the last N hours.
 * Returns { mint, priceChange, priceChangePct, high, low, currentPrice, hours }
 */
export async function getPriceTrend(mintAddress, hours = 6) {
  const candles = await getPriceHistory(mintAddress, hours);
  if (!candles.length) return null;

  const first        = candles[0].o;
  const last         = candles[candles.length - 1].c;
  const high         = Math.max(...candles.map(c => c.h));
  const low          = Math.min(...candles.map(c => c.l));
  const priceChange    = last - first;
  const priceChangePct = ((priceChange / first) * 100);

  return {
    mint: mintAddress,
    currentPrice:    last,
    priceChange,
    priceChangePct,
    high,
    low,
    hours,
  };
}
