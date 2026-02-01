import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignoriert TypeScript-Fehler beim Build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignoriert ESLint-Fehler beim Build (DAS ersetzt --no-lint)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;