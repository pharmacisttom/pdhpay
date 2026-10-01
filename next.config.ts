import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        protocol: "https",
        hostname: "*.pdhpay.pluakdaenghospital.cloud",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        "pdhpay.pluakdaenghospital.cloud",
        "*.pdhpay.pluakdaenghospital.cloud",
      ],
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'" +
              (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "") +
              "; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https:; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
          },
        ],
      },
    ];
  },
};

export default config;
