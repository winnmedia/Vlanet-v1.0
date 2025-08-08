// Bundle analyzer - 선택적 로드
let withBundleAnalyzer = (config) => config;
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch (e) {
  // Bundle analyzer가 없으면 무시
  console.log('[Next.js] Bundle analyzer not found, skipping...');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // 실험적 기능 활성화
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['antd', '@ant-design/plots', 'react-player', 'video.js'],
    webpackBuildWorker: true,
  },
  
  // 서버 외부 패키지 설정
  serverExternalPackages: ['sharp'],

  // CSS 처리 설정
  transpilePackages: ['antd', '@ant-design/plots', 'rc-util', 'rc-pagination', 'rc-picker', 'rc-tree', 'rc-table'],
  
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
    minimumCacheTTL: 3600,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
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
        source: '/:path*.(png|jpg|jpeg|gif|webp|avif|svg|ico)',
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
  webpack: (config, { dev, isServer, webpack }) => {
    // 서버와 클라이언트 모두에서 self 정의
    config.plugins.push(
      new webpack.DefinePlugin({
        'typeof self': JSON.stringify(isServer ? 'undefined' : 'object'),
      })
    );
    
    // 서버 사이드에서 self를 global로 대체
    if (isServer) {
      config.plugins.push(
        new webpack.ProvidePlugin({
          self: 'global',
        })
      );
    }
    
    // SSR 환경에서 브라우저 전용 패키지 처리
    if (isServer) {
      // 서버 사이드에서 브라우저 전역 객체 정의
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
      
      // 문제가 되는 모듈들을 무시
      config.externals = [...(config.externals || []), 'sharp'];
    }
    
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