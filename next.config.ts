import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // bcryptjs harus tetap di-require secara native oleh server runtime, jangan
  // ikut di-bundle. Di Next 15+ key ini bernama `serverExternalPackages`
  // (dulu `experimental.serverComponentsExternalPackages`).
  serverExternalPackages: ["bcryptjs"],
};

export default nextConfig;
