/** @type {import('next').NextConfig} */
const path = require('path')
const { withSentryConfig } = require('@sentry/nextjs')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
]

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Next.js 15 최적화
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['antd', '@ant-design/plots', 'axios', 'moment'],
  },
  
  // styled-components 컴파일러 설정
  compiler: {
    styledComponents: true,
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // 환경 변수 매핑
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://videoplanet.up.railway.app',
    NEXT_PUBLIC_VERSION: process.env.NEXT_PUBLIC_VERSION || '1.0.9',
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME || 'VLanet',
  },
  
  // 보안 헤더
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  
  // 리다이렉트
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/cmshome',
        permanent: true,
      },
      // www to non-www redirect
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.vlanet.net',
          },
        ],
        destination: 'https://vlanet.net/:path*',
        permanent: true,
      },
    ]
  },
  
  // API 프록시 (개발 환경)
  async rewrites() {
    return process.env.NODE_ENV === 'development' ? [
      {
        source: '/api/:path*',
        destination: 'https://videoplanet.up.railway.app/api/:path*',
      },
    ] : []
  },
  
  // Webpack 설정
  webpack: (config, { isServer, dev }) => {
    // 경로 별칭
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-router-dom': path.resolve(__dirname, './src/util/nextNavigation.js'),
      'components': path.resolve(__dirname, './src/components'),
      'page': path.resolve(__dirname, './src/page'),
      'util': path.resolve(__dirname, './src/util'),
      'hooks': path.resolve(__dirname, './src/hooks'),
      'images': path.resolve(__dirname, './src/images'),
      'api': path.resolve(__dirname, './src/api'),
      'utils': path.resolve(__dirname, './src/utils'),
      'tasks': path.resolve(__dirname, './src/tasks'),
      '@redux': path.resolve(__dirname, './src/redux'),
      'config': path.resolve(__dirname, './src/config'),
      'styles': path.resolve(__dirname, './src/styles'),
      'css': path.resolve(__dirname, './src/css'),
    }
    
    // SVG 및 이미지 처리
    config.module.rules.push({
      test: /\.svg$/,
      type: 'asset/resource',
    })
    
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif)$/,
      type: 'asset/resource',
    })
    
    // 프로덕션 최적화
    if (!dev && !isServer) {
      // 번들 크기 최적화
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module) {
              return module.size() > 160000 &&
                /node_modules[/\\]/.test(module.identifier())
            },
            name(module) {
              const hash = crypto.createHash('sha1')
              hash.update(module.identifier())
              return hash.digest('hex').substring(0, 8)
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name(module, chunks) {
              return crypto
                .createHash('sha1')
                .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                .digest('hex')
                .substring(0, 8)
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
        maxAsyncRequests: 6,
        maxInitialRequests: 4,
      }
    }
    
    return config
  },
  
  // 이미지 최적화
  images: {
    domains: ['videoplanet.up.railway.app', 'vlanet.net'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // SCSS 지원
  sassOptions: {
    includePaths: ['./src/css', './src/styles'],
    additionalData: `@import "src/styles/_variables.scss";`
  },
  
  // 성능 최적화
  poweredByHeader: false,
  compress: true,
  
  // 타입스크립트 (향후 마이그레이션 대비)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 출력 설정
  output: 'standalone',
  
  // 빌드 ID (배포 추적용)
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA || 'local-build'
  },
}

// Sentry 설정 (옵션)
const sentryWebpackPluginOptions = {
  silent: true,
  org: 'winnmedia',
  project: 'vlanet',
}

// 번들 분석기와 Sentry 통합
module.exports = process.env.SENTRY_DSN
  ? withSentryConfig(withBundleAnalyzer(nextConfig), sentryWebpackPluginOptions)
  : withBundleAnalyzer(nextConfig)