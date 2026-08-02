import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/2048",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
