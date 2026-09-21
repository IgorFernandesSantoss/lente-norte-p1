import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.blob.core.windows.net",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "10000",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "10000",
      },
    ],
  },
};

export default nextConfig;
