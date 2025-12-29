/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Optimize images
    formats: ['image/avif', 'image/webp'],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for different breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimum quality for optimized images
    minimumCacheTTL: 60,
    // Enable image optimization
    dangerouslyAllowSVG: false,
  },
}

module.exports = nextConfig


