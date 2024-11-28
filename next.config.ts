import type { NextConfig } from "next";
import withSerwistConfig from "@serwist/next";
import MillionLint from "@million/lint";

const withSerwist = withSerwistConfig({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // disable: process.env.NODE_ENV === 'development',
  cacheOnNavigation: true,
  reloadOnOnline: true,
  register: true,
});

const nextConfig: NextConfig = {
  // output: 'standalone',
  compress: false,
  experimental: {
    cssChunking: 'loose',
  },
  // webpack(config) {
  //   config.infrastructureLogging = { debug: /PackFileCache/ }
  //   return config;
  // },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
};

export default MillionLint.next({ rsc: true, optimizeDOM: true, experimental: { stabilize: true } })(withSerwist(nextConfig));
// console.log(JSON.stringify(nextConfig, null, 2));
