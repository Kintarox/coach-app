import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript Fehler ignorieren wir weiterhin hier
  typescript: {
    ignoreBuildErrors: true,
  },
  // Den ESLint-Block LÖSCHEN wir, das machen wir jetzt via Vercel-Einstellung
};

export default nextConfig;