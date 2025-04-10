import type { NextConfig } from "next";
const { i18n } = require('./next-i18next.config');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  i18n,
  eslint: {
    // This will disable ESLint checking during builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
