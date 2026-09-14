import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // bcryptjs harus tetap di-require secara native oleh server runtime, jangan
  // ikut di-bundle. Di Next 15+ key ini bernama `serverExternalPackages`
  // (dulu `experimental.serverComponentsExternalPackages`).
  serverExternalPackages: ["bcryptjs"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
        ],
      },
    ]
  },
};

export default nextConfig;
