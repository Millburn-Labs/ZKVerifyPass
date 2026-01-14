import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable webpack build worker to prevent "Call retries were exceeded" error
  // This is required when using custom webpack configurations
  experimental: {
    webpackBuildWorker: true,
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent client-side bundling of Node.js-only modules
      // Note: buffer, crypto, stream, util are kept as they may be needed by viem/wagmi
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
        child_process: false,
      };
    }
    
    return config;
  },
  
  // Mark CDP SDK as server-only package
  serverExternalPackages: ['@coinbase/cdp-sdk'],
};

export default nextConfig;