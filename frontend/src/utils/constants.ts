import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey('8e6GFqAX399AqEei4irCWsTm1GgBnvUsd4YSsyfdBKEw');
export const BUSINESS_SEED = Buffer.from('business');
export const CUSTOMER_SEED = Buffer.from('customer');

export const DEVNET_RPC_URL = 'https://api.devnet.solana.com';

export const LAMPORTS_PER_SOL = 1_000_000_000;

export function getBusinessPda(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [BUSINESS_SEED, authority.toBuffer()],
    PROGRAM_ID
  );
}

export function getCustomerPda(business: PublicKey, customerWallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [CUSTOMER_SEED, business.toBuffer(), customerWallet.toBuffer()],
    PROGRAM_ID
  );
}

export function formatSol(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(4);
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

