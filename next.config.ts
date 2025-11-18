import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "game-aesy.c5game.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "game-aesy.oss-cn-shanghai.aliyuncs.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "game-aesy.oss-cn-shanghai.aliyuncs.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.nncsgp.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
