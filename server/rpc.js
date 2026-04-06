import { Connection } from '@solana/web3.js';
import { config } from './config.js';

// Single shared connection — reused by monitor, protocols, and any one-off queries.
export const connection = new Connection(config.heliusRpcUrl, {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60_000,
  disableRetryOnRateLimit: false,
});

/**
 * Returns the SOL balance of a wallet in lamports.
 * Useful as a quick liveness check and for dashboard display.
 */
export async function getSolBalance(walletAddress) {
  const { PublicKey } = await import('@solana/web3.js');
  return connection.getBalance(new PublicKey(walletAddress));
}

/**
 * Returns all SPL token accounts owned by a wallet.
 * Filters by programId so results are always complete (more reliable than getTokenAccountsByOwner).
 */
export async function getTokenAccounts(walletAddress) {
  const { PublicKey } = await import('@solana/web3.js');
  const { value } = await connection.getParsedTokenAccountsByOwner(
    new PublicKey(walletAddress),
    { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
  );
  return value;
}
