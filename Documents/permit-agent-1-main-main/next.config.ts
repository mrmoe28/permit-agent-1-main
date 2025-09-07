import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Optimize memory usage during build
    largePageDataBytes: 128 * 1000, // 128KB
  },
  // Optimize build performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Minimize bundle size
  output: 'standalone',
};

export default nextConfig;
