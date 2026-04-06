import { Bot } from 'grammy';
import { config } from './config.js';
import {
  upsertUser,
  addWallet,
  getWalletsByUserId,
  getUserByTelegramId,
  saveAlert,
  getLastAlertTime,
} from './db.js';
import { PublicKey } from '@solana/web3.js';

export const bot = new Bot(config.telegramBotToken);

// ── Commands ───────────────────────────────────────────────────────────────
bot.command('start', (ctx) => {
  upsertUser(String(ctx.from.id));
  ctx.reply(
    '👋 Welcome to *Cheetah* — your DeFi liquidation shield on Solana\\.\n\n' +
    'Commands:\n' +
    '/addwallet `<address>` — monitor a wallet\n' +
    '/wallets — list your watched wallets\n' +
    '/removewallet `<address>` — stop monitoring a wallet\n' +
    '/status — show current positions and health factors',
    { parse_mode: 'MarkdownV2' }
  );
});

bot.command('addwallet', (ctx) => {
  const address = ctx.match?.trim();
  if (!address) return ctx.reply('Usage: /addwallet <Solana wallet address>');

  try { new PublicKey(address); } catch {
    return ctx.reply('❌ Invalid Solana address.');
  }

  const user = upsertUser(String(ctx.from.id));
  const wallet = addWallet(user.id, address);

  if (!wallet) {
    return ctx.reply(`⚠️ ${address.slice(0, 8)}... is already being monitored.`);
  }
  ctx.reply(`✅ Now monitoring \`${address}\``, { parse_mode: 'MarkdownV2' });
});

bot.command('wallets', (ctx) => {
  const user = getUserByTelegramId(String(ctx.from.id));
  if (!user) return ctx.reply('No wallets registered. Use /addwallet first.');

  const wallets = getWalletsByUserId(user.id);
  if (!wallets.length) return ctx.reply('No wallets registered. Use /addwallet first.');

  const list = wallets.map((w, i) => `${i + 1}\\. \`${w.address}\``).join('\n');
  ctx.reply(`*Your monitored wallets:*\n${list}`, { parse_mode: 'MarkdownV2' });
});

bot.command('removewallet', (ctx) => {
  const address = ctx.match?.trim();
  if (!address) return ctx.reply('Usage: /removewallet <Solana wallet address>');

  const user = getUserByTelegramId(String(ctx.from.id));
  if (!user) return ctx.reply('No wallets registered.');

  const { changes } = removeWallet(user.id, address);
  if (changes === 0) return ctx.reply('Wallet not found in your list.');
  ctx.reply(`✅ Removed \`${address}\``, { parse_mode: 'MarkdownV2' });
});

bot.command('status', async (ctx) => {
  ctx.reply('📊 Fetching positions... (not yet implemented — add wallets first)');
});

// ── Alert sender ───────────────────────────────────────────────────────────
/**
 * Send a risk alert to all Telegram users watching this wallet.
 * Respects the cooldown to avoid spam.
 */
import db from './db.js';

export async function sendAlert({ walletAddress, protocol, riskLevel, healthFactor, message }) {
  const now = Date.now();
  const lastSent = getLastAlertTime(walletAddress, protocol);

  if (now - lastSent < config.alertCooldownMs) return; // still in cooldown

  saveAlert({ walletAddress, protocol, riskLevel, healthFactor, message });

  const emoji = riskLevel === 'CRITICAL' ? '🚨' : riskLevel === 'HIGH' ? '⚠️' : 'ℹ️';
  const text =
    `${emoji} *Cheetah Alert*\n` +
    `Protocol: ${escMd(protocol)}\n` +
    `Wallet: \`${escMd(walletAddress.slice(0, 8))}\\.\\.\\.\`\n` +
    `Health Factor: *${healthFactor?.toFixed(3) ?? 'N/A'}*\n` +
    `Risk: *${riskLevel}*\n\n` +
    escMd(message);

  // Find all users watching this wallet
  const users = db.prepare(`
    SELECT DISTINCT u.telegram_id FROM users u
    JOIN wallets w ON w.user_id = u.id
    WHERE w.address = ?
  `).all(walletAddress);

  for (const user of users) {
    if (!user.telegram_id.startsWith('wallet:')) {
      await bot.api.sendMessage(user.telegram_id, text, { parse_mode: 'MarkdownV2' }).catch(() => {});
    }
  }
}

function escMd(text) {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}
