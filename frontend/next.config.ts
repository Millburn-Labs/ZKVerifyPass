import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack to avoid panics in Next.js 16.1.1
  experimental: {
    turbo: false,
  },
};

export default nextConfig;
