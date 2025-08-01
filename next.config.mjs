/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Add these critical settings for Vercel deployment
  output: 'standalone', // or 'export' for static sites
  trailingSlash: true, // Ensures proper routing
}

export default nextConfig