import { getPriceTrend } from './birdeye.js';
import { analyzeRisk }   from './ai.js';

// SOL mint — always track this
const SOL_MINT = 'So11111111111111111111111111111111111111112';

/**
 * For a set of positions, fetch price trends for all collateral tokens
 * and return a summary string to feed into the AI prompt.
 */
export async function buildPriceTrendContext(positions) {
  // Collect unique collateral mints
  const mints = new Set();
  for (const pos of positions) {
    for (const b of pos.balances ?? []) {
      if (b.assetUsd > 0.01 && b.mint) mints.add(b.mint);
    }
  }
  mints.add(SOL_MINT);

  const trends = [];
  for (const mint of mints) {
    try {
      const trend = await getPriceTrend(mint, 6);
      if (trend) trends.push(trend);
    } catch (err) {
      console.warn(`[birdeye] trend failed for ${mint.slice(0, 8)}: ${err.message}`);
    }
  }

  if (!trends.length) return null;

  return trends.map(t =>
    `Token ${t.mint.slice(0, 8)}…: ` +
    `current $${t.currentPrice?.toFixed(4)}, ` +
    `${t.priceChangePct >= 0 ? '+' : ''}${t.priceChangePct.toFixed(1)}% over last ${t.hours}h, ` +
    `high $${t.high?.toFixed(4)}, low $${t.low?.toFixed(4)}`
  ).join('\n');
}
