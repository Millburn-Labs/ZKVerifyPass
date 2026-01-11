'use client';

import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { defineChain } from 'viem';

// Mantle Sepolia testnet configuration
const mantleSepolia = defineChain({
  id: 5003,
  name: 'Mantle Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Mantle',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Sepolia Explorer',
      url: 'https://explorer.sepolia.mantle.xyz',
    },
  },
  testnet: true,
});

// Get project ID from environment variable
// You need to get your project ID from https://dashboard.reown.com
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '';

// Metadata for AppKit
const metadata = {
  name: 'ZKVerifyPass',
  description: 'Zero-Knowledge Proof Verification Platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://zkverifypass.com',
  icons: [],
};

// Define networks
const networks = [mantleSepolia];

// Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
});

// Initialize AppKit (call this once, outside component)
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
});

// Create query client
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
