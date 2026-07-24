/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bookmy.es',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.bookmy.es',
        pathname: '/**',
      },
    ],
    unoptimized: false,
  },
  
  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_BASE_URL_IMG: process.env.NEXT_PUBLIC_API_BASE_URL_IMG,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  
  // Output configuration for deployment
  output: 'standalone',
  
  // Build optimizations
  swcMinify: true,
  
  // Disable powered by header for security
  poweredByHeader: false,
  
  // Compression
  compress: true,
  
  // Strict mode for better error handling
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
