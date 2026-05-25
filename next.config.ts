import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/sprint",
        destination: "/bugs",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
