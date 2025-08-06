const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 실험적 기능 활성화
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['antd', '@ant-design/plots'],
    webpackBuildWorker: true,
  },
  
  // 컴파일러 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    styledComponents: true,
  },
  
  // 이미지 최적화 (성능 최적화)
  images: {
    domains: ['videoplanet.up.railway.app', 'vlanet.net', 'localhost'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 420, 640, 768, 1024, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    quality: 75,
    minimumCacheTTL: 3600,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
    priority: false,
    loading: 'lazy',
    placeholder: 'blur',
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyrmrWOH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyrmrWOH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyrmrWOH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyrmrWOH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyrmrWOH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyrmrWOH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyrmrWOH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyrmrWOH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyrmrWOH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyrmrWOH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyrmrWOH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyrmrWOH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyrmrWOH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyrmrWOH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyrmrWOH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyrmrWOH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyrmr',
  },
  
  // 보안 헤더 및 캐시 헤더
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        // Service Worker 캐싱
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        // 정적 자산 캐싱 최적화
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // 이미지 캐싱 최적화
        source: '/(.*\\.(png|jpg|jpeg|gif|webp|avif|svg|ico))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=31536000',
          },
        ],
      },
      {
        // API 응답 캐싱 제어
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, max-age=300, must-revalidate',
          },
          {
            key: 'ETag',
            value: 'W/"cache-version-1.1.0"',
          },
        ],
      },
    ];
  },
  
  // 환경변수
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_VERSION: process.env.NEXT_PUBLIC_VERSION,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  },
  
  // API 프록시 설정 (개발 환경)
  async rewrites() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },

  // Webpack 설정
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 번들 최적화
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            enforce: true,
          },
          antd: {
            test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
            name: 'antd',
            priority: 20,
            enforce: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
    }

    // 미사용 moment 로케일 제거
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      })
    )

    // 소스맵 최적화 (프로덕션)
    if (!dev && !isServer) {
      config.devtool = 'source-map'
    }

    return config
  },

  // 성능 예산 설정
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // 압축 최적화
  compress: true,

  // 정적 파일 최적화
  generateBuildId: async () => {
    return 'videoplanet-' + Date.now()
  },
};

module.exports = withBundleAnalyzer(nextConfig);