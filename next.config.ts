import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignoriere Fehler beim Bauen (wie gehabt)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // DER NEUE TEIL: Serverseitige Weiterleitung
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false, // false ist besser für Tests, damit der Browser es nicht für immer cached
      },
    ];
  },
};

export default nextConfig;