import path from "node:path";
import type { NextConfig } from "next";

function backendOrigin() {
  const configuredUrl = process.env.BACKEND_API_URL
    || process.env.NEXT_PUBLIC_API_BASE_URL
    || "http://localhost:4000";
  return configuredUrl.trim().replace(/\/+$/, "").replace(/\/api$/, "");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: path.resolve(__dirname, "..") },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin()}/api/:path*`,
      },
    ];
  },
};
export default nextConfig;
