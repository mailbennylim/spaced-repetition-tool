/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // react-pdf uses canvas as an optional dependency — alias it away in Next.js
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
