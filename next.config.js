/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async redirects() {
    return [
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
