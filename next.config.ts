import type { NextConfig } from "next";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const adminBaseUrl = process.env.NEXT_PUBLIC_BACKEND_ADMIN_URL ?? apiBaseUrl;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb"
    }
  },
  async rewrites() {
    const rules: { source: string; destination: string }[] = [];
    if (apiBaseUrl) {
      rules.push({
        source: "/api/:path*",
        destination: `${apiBaseUrl}/api/:path*`
      });
    }
    if (adminBaseUrl) {
      rules.push({
        source: "/admin/:path*",
        destination: `${adminBaseUrl}/admin/:path*`
      });
    }
    return rules;
  }
};

export default nextConfig;
