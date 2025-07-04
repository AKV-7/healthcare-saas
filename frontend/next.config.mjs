/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration with fewer experimental features
  swcMinify: true,
  reactStrictMode: true,
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image configuration for external domains
  images: {
    domains: ['res.cloudinary.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Handle the critical dependency warnings
  webpack: (config, { isServer }) => {
    // Ignore the warnings for the problematic modules
    config.ignoreWarnings = [
      { module: /@opentelemetry\/instrumentation/ },
      { module: /require-in-the-middle/ }
    ];
    
    return config;
  }
};

export default nextConfig;
