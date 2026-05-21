import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/:path*`,
      },
    
    ];
  },
  images: {
    domains:[ "images.unsplash.com","res.cloudinary.com"],
  },

};

export default nextConfig;
