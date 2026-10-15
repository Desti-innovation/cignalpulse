import type { NextConfig } from "next"
import withBundleAnalyzer from "@next/bundle-analyzer"

const nextConfig: NextConfig = {
  // ---------- Bundle optimization ----------
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
      "@radix-ui/react-icons",
      "date-fns",
    ],
  },

  // ---------- Image optimization ----------
  images: {
    // Serve modern formats first
    formats: ["image/avif", "image/webp"],
    // Device sizes Next.js generates for <Image>
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Allow your Vercel Blob logos + any external image hosts
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "jzyxmzceljb2vb18.public.blob.vercel-storage.com",
      },
    ],
  },

  // ---------- Misc ----------
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // ---------- Security headers (existing) ----------
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co https://checkout.paystack.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.paystack.co https://checkout.paystack.com https://api.resend.com",
              "frame-src 'self' https://checkout.paystack.com",
              "form-action 'self'",
              "base-uri 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig)