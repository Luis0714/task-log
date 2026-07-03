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
        destination: "/analysis/sprints",
        permanent: false,
      },
      {
        source: "/proyecto",
        destination: "/analysis/proyecto",
        permanent: false,
      },
      {
        source: "/analisis/sprints",
        destination: "/analysis/sprints",
        permanent: true,
      },
      {
        source: "/analisis/proyecto",
        destination: "/analysis/proyecto",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
