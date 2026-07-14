import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  // App is a simple client-heavy personal tool
};

// next-pwa injects a webpack config. Next 16 defaults to Turbopack for `next dev`,
// which errors if a webpack config is present. Only wrap for production builds.
const isProd = process.env.NODE_ENV === "production";

const withPWA = withPWAInit({
  dest: "public",
  disable: !isProd,
  register: true,
  fallbacks: {
    document: "/",
  },
});

export default isProd ? withPWA(nextConfig) : nextConfig;
