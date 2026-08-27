import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Clean URL slugs — no extensions exposed
  trailingSlash: false,

  // Image optimization: allow our own domain + any CDN we might add
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "barakahfinancebd.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
    formats: ["image/avif", "image/webp"],
    // Profile photos, product images — reasonable limits
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 300, 570],
  },

  // Security headers applied on every response
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            // Adjust 'script-src' when adding third-party CDN scripts
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js needs unsafe-eval in dev
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https:",
              "frame-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Clean rewrite: /dashboard → internal /dashboard (no .html leakage)
  async rewrites() {
    return [];
  },

  // TypeScript build errors must not be silenced in production
  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  // Enable experimental features useful for the app
  experimental: {
    // Server Actions are stable in Next.js 14; no flag needed
  },
};

export default nextConfig;
