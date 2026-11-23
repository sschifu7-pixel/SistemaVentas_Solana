import { PublicKey } from '@solana/web3.js';

export interface BusinessAccount {
  publicKey: PublicKey;
  authority: PublicKey;
  name: string;
  totalSales: number;
  totalVolume: number; // in lamports
  bump: number;
}

export interface CustomerAccount {
  publicKey: PublicKey;
  business: PublicKey;
  customer: PublicKey; // wallet
  name: string;
  totalPurchases: number; // in lamports
  purchasesCount: number;
  loyaltyPoints: number;
  isActive: boolean;
  bump: number;
}

export interface TransactionRecord {
  id: string;
  signature: string;
  type: 'INITIALIZE' | 'REGISTER_CUSTOMER' | 'SALE' | 'DISCOUNT_SALE' | 'STATUS_CHANGE' | 'CLOSE_CUSTOMER';
  title: string;
  description: string;
  amount?: number; // in SOL
  points?: number;
  timestamp: Date;
  status: 'confirmed' | 'failed';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  txSignature?: string;
}

