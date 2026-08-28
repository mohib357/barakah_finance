// @ts-check
// Barakah Finance — Next.js 14 Configuration

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,

  // ── Prisma fix: externalize @prisma/client so webpack doesn't bundle it
  //    This prevents PrismaClient from being instantiated during static analysis
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs", "otplib"],
  },

  // ── Image optimization ──────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "barakahfinancebd.com" },
      { protocol: "http",  hostname: "localhost" },
    ],
    formats:     ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes:  [16, 32, 48, 64, 96, 128, 256, 300, 570],
  },

  // ── Security headers on every response ──────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-Frame-Options",          value: "SAMEORIGIN" },
          { key: "X-XSS-Protection",         value: "1; mode=block" },
          { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",       value: "camera=(), microphone=(), geolocation=()" },
          {
            key:   "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https: http:",
              "frame-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  async rewrites() { return []; },

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
