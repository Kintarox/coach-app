import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // HIER DARF NICHTS MEHR STEHEN (kein 'output', kein 'images')
};

export default nextConfig;