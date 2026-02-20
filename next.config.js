/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turbopack is the default bundler in Next.js 16 (dev). No canvas alias needed
  // because the browser provides native canvas. Keep webpack alias for `next build`.
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
