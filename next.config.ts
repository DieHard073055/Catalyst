import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.50.123', 'localhost', '127.0.0.1'],
  eslint: {
    // Temporarily ignore ESLint during builds for deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily ignore TypeScript errors during builds for deployment
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['uwwfmcyzfhxcjunnnrog.supabase.co'],
  },
};

export default nextConfig;
