import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence Turbopack warning by explicitly choosing webpack
  turbopack: {},
  
  // Enable webpack build worker to prevent "Call retries were exceeded" error
  experimental: {
    webpackBuildWorker: true,
    serverComponentsExternalPackages: ['@coinbase/cdp-sdk'],
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent client-side bundling of Node.js-only modules
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