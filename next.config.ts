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
      {
        protocol: "https",
        hostname: "www.nncsgo.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "oss.66images.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.c5game.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "steamcommunity-a.akamaihd.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "nngogo.oss-ap-northeast-1.aliyuncs.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "dev-api.flamedraw.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
