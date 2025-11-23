import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {hostname: "d28hgpri8am2if.cloudfront.net"},
      {hostname: "framerusercontent.com"},
      {hostname: "books.google.com"},
      {hostname: "books.googleusercontent.com"},
      {hostname: "assets.hardcover.app"},
    ],
  },
};

export default nextConfig;
