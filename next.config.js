/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com",
              "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.clubrogue.in" }],
        destination: "https://clubrogue.in/:path*",
        permanent: true,
      },
      {
        source: "/venue/gachibowli",
        destination: "/club-rogue-gachibowli",
        permanent: true,
      },
      {
        source: "/venue/gachibowli/:path*",
        destination: "/club-rogue-gachibowli",
        permanent: true,
      },
      {
        source: "/venue/kondapur",
        destination: "/club-rogue-kondapur",
        permanent: true,
      },
      {
        source: "/venue/kondapur/:path*",
        destination: "/club-rogue-kondapur",
        permanent: true,
      },
      {
        source: "/venue/jubilee-hills",
        destination: "/club-rogue-jubilee-hills",
        permanent: true,
      },
      {
        source: "/venue/jubilee-hills/:path*",
        destination: "/club-rogue-jubilee-hills",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
