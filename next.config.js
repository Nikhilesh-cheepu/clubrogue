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
        permanent: false,
      },
      {
        source: "/venue/gachibowli/:path*",
        destination: "/club-rogue-gachibowli",
        permanent: false,
      },
      {
        source: "/venue/kondapur",
        destination: "/club-rogue-kondapur",
        permanent: false,
      },
      {
        source: "/venue/kondapur/:path*",
        destination: "/club-rogue-kondapur",
        permanent: false,
      },
      {
        source: "/venue/jubilee-hills",
        destination: "/club-rogue-jubilee-hills",
        permanent: false,
      },
      {
        source: "/venue/jubilee-hills/:path*",
        destination: "/club-rogue-jubilee-hills",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
