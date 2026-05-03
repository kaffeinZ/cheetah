import { PublicKey } from '@solana/web3.js';
import { connection } from '../rpc.js';

const PROGRAM_ID     = new PublicKey('PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu');
const POSITION_SIZE  = 216;

const CUSTODY_TO_TOKEN = {
  '7xS2gz2bTp3fwCC7knJvUWTEU9Tycczu6VhJYKgi1wdz': 'SOL',
  '5Pv3gM9JrFFH883SWAhvJC9RPYmo8UNxuFtv5bMMALkm': 'BTC',
  'AQCGyheWPLeo6Qp9WpYS9m3Qj479t7R636N9ey1rEjEn': 'ETH',
  'G18jKKXQwBbrHeiK3C9MRXhkHsLHf7XgCSisykV46EZa': 'USDC',
  '4vkNeXiYEUizLdrpdPS1eC2mccyM4NUPRtERrk6ZETkk': 'USDT',
};

const TOKEN_MINTS = {
  SOL:  'So11111111111111111111111111111111111111112',
  BTC:  '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
  ETH:  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
};

const SIDE = { 0: 'None', 1: 'Long', 2: 'Short' };

const COINGECKO_IDS = {
  SOL:  'solana',
  BTC:  'bitcoin',
  ETH:  'ethereum',
  USDC: 'usd-coin',
  USDT: 'tether',
};

let _prices   = {};
let _pricesAt = 0;
const PRICE_TTL = 60_000;

async function getPrices() {
  if (Date.now() - _pricesAt < PRICE_TTL) return _prices;

  // Primary: Jupiter Price API v3
  try {
    const ids = Object.values(TOKEN_MINTS).join(',');
    const res = await fetch(`https://api.jup.ag/price/v3?ids=${ids}`);
    if (res.ok) {
      const data = await res.json();
      const prices = {};
      for (const [sym, mint] of Object.entries(TOKEN_MINTS)) {
        prices[sym] = data[mint]?.usdPrice ?? 0;
      }
      _prices   = prices;
      _pricesAt = Date.now();
      return _prices;
    }
  } catch { /* fall through to CoinGecko */ }

  // Fallback: CoinGecko
  try {
    const ids = Object.values(COINGECKO_IDS).join(',');
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
    if (!res.ok) return _prices;
    const data = await res.json();
    const prices = {};
    for (const [sym, cgId] of Object.entries(COINGECKO_IDS)) {
      prices[sym] = data[cgId]?.usd ?? 0;
    }
    _prices   = prices;
    _pricesAt = Date.now();
  } catch { /* return stale */ }
  return _prices;
}

function parsePosition(data) {
  let offset = 8;
  const read32 = () => {
    const pk = new PublicKey(data.slice(offset, offset + 32)).toBase58();
    offset += 32;
    return pk;
  };
  const owner             = read32();
  const pool              = read32();
  const custody           = read32();
  const collateralCustody = read32();
  offset += 16;
  const side         = SIDE[data[offset]] ?? 'Unknown'; offset += 1;
  const price        = data.readBigUInt64LE(offset); offset += 8;
  const sizeUsd      = data.readBigUInt64LE(offset); offset += 8;
  const collateralUsd = data.readBigUInt64LE(offset);
  return { owner, pool, custody, collateralCustody, side, price, sizeUsd, collateralUsd };
}

function calcLiquidationPrice(entryPrice, sizeUsd, collateralUsd, side) {
  if (collateralUsd <= 0 || sizeUsd <= 0) return 0;
  const leverage = sizeUsd / collateralUsd;
  if (leverage <= 1) return 0;
  if (side === 'Long')  return entryPrice * (1 - 1 / leverage);
  if (side === 'Short') return entryPrice * (1 + 1 / leverage);
  return 0;
}

function classifyRisk(distancePct) {
  if (distancePct > 20) return 'SAFE';
  if (distancePct > 10) return 'WARNING';
  if (distancePct >  5) return 'HIGH';
  return 'CRITICAL';
}

const _cache   = new Map();
const _cacheAt = new Map();
const STALE_MS = 5 * 60_000;

export async function getJupiterPositions(walletAddress) {
  try {
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      commitment: 'confirmed',
      filters: [
        { dataSize: POSITION_SIZE },
        { memcmp: { offset: 8, bytes: walletAddress } },
      ],
    });

    if (!accounts.length) {
      _cache.set(walletAddress, []);
      _cacheAt.set(walletAddress, Date.now());
      return [];
    }

    const prices    = await getPrices();
    const positions = accounts
      .map(({ pubkey, account }) => {
        try { return { pubkey: pubkey.toBase58(), ...parsePosition(Buffer.from(account.data)) }; }
        catch { return null; }
      })
      .filter(p => p && BigInt(p.sizeUsd) > 0n && p.side !== 'None')
      .map(pos => {
        const token        = CUSTODY_TO_TOKEN[pos.custody] ?? 'UNKNOWN';
        const entryPrice   = Number(pos.price) / 1e6;
        const sizeUsd      = Number(pos.sizeUsd) / 1e6;
        const collateral   = Number(pos.collateralUsd) / 1e6;
        const leverage     = collateral > 0 ? sizeUsd / collateral : 0;
        const liqPrice     = calcLiquidationPrice(entryPrice, sizeUsd, collateral, pos.side);
        const currentPrice = prices[token] ?? 0;
        const distancePct  = liqPrice > 0 && currentPrice > 0
          ? Math.abs((currentPrice - liqPrice) / currentPrice * 100)
          : 100;
        const unrealizedPnl = currentPrice > 0 && sizeUsd > 0
          ? (pos.side === 'Long' ? 1 : -1) * (currentPrice - entryPrice) / entryPrice * sizeUsd
          : 0;
        const riskLevel    = classifyRisk(distancePct);
        // healthFactor scale: 1.0 = 5% from liq (perp danger zone), matches lending HF scale
        const healthFactor = liqPrice > 0 && currentPrice > 0 ? distancePct / 5 : null;
        return {
          protocol:       'jupiter',
          accountAddress: pos.pubkey,
          token,
          side:           pos.side,
          sizeUsd,
          collateralUsd:  collateral,
          borrowUsd:      sizeUsd - collateral,
          entryPrice,
          currentPrice,
          liqPrice,
          leverage:       parseFloat(leverage.toFixed(2)),
          unrealizedPnl,
          distancePct,
          healthFactor,
          riskLevel,
          positionType:   'perp',
          riskContext:    `${pos.side} ${token}-PERP ${leverage.toFixed(1)}x at $${currentPrice.toFixed(2)}. Liq at $${liqPrice.toFixed(2)} — ${distancePct.toFixed(1)}% away. Entry $${entryPrice.toFixed(2)}, PnL ${unrealizedPnl >= 0 ? '+' : ''}$${unrealizedPnl.toFixed(2)}.`,
          balances:       [],
        };
      });

    _cache.set(walletAddress, positions);
    _cacheAt.set(walletAddress, Date.now());
    return positions;

  } catch (err) {
    const stale    = _cache.get(walletAddress);
    const cacheAge = Date.now() - (_cacheAt.get(walletAddress) ?? 0);
    if (stale && cacheAge < STALE_MS) {
      console.warn(`[jupiter] RPC failed, using cache: ${err.message}`);
      return stale;
    }
    console.error(`[jupiter] failed: ${err.message}`);
    return [];
  }
}
