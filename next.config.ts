import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  server: {
    port: process.env.PORT || 3080, // Default to 3080 if PORT is not set
  },
};

export default nextConfig;
