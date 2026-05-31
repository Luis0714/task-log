import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/sprint",
        destination: "/bugs",
        permanent: true,
      },
      {
        source: "/sprints",
        destination: "/analisis/sprints",
        permanent: false,
      },
      {
        source: "/proyecto",
        destination: "/analisis/proyecto",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
