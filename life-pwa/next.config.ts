import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {};

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
