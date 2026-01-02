/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Optimize images - prioritize smaller formats
    formats: ['image/avif', 'image/webp'],
    // Device sizes for responsive images (reduced sizes for faster loading)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Image sizes for different breakpoints (smaller sizes)
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Longer cache TTL for better performance
    minimumCacheTTL: 31536000, // 1 year
    // Enable image optimization
    dangerouslyAllowSVG: false,
    // Enable image optimization
    unoptimized: false,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle PayPal SDK - use it as external dependency
      config.externals = [...(config.externals || []), '@paypal/checkout-server-sdk']
    }
    return config
  },
}

module.exports = nextConfig


