import React, { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { clusterApiUrl } from '@solana/web3.js';

const ConnectionProviderComponent = ConnectionProvider as any;
const WalletProviderComponent = WalletProvider as any;
const WalletModalProviderComponent = WalletModalProvider as any;

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProviderComponent endpoint={endpoint}>
      <WalletProviderComponent wallets={wallets} autoConnect>
        <WalletModalProviderComponent>{children}</WalletModalProviderComponent>
      </WalletProviderComponent>
    </ConnectionProviderComponent>
  );
};
