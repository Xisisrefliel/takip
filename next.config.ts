import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ["image/avif", "image/webp"],
    // Cache images for 30 days - TMDB posters/backdrops never change
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      { hostname: "d28hgpri8am2if.cloudfront.net" },
      { hostname: "framerusercontent.com" },
      { hostname: "books.google.com" },
      { hostname: "books.googleusercontent.com" },
      { hostname: "assets.hardcover.app" },
    ],
  },
};

export default nextConfig;
