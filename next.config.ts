import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 최적화 설정
  reactStrictMode: true,
  swcMinify: true,
  
  // 이미지 최적화
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'videoplanet.up.railway.app',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'vlanet.net',
        pathname: '/images/**',
      },
    ],
  },
  
  // API 프록시 설정
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://videoplanet.up.railway.app/api/:path*',
      },
    ];
  },
  
  // 환경변수 설정
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://videoplanet.up.railway.app',
    NEXT_PUBLIC_SOCKET_URI: process.env.NEXT_PUBLIC_SOCKET_URI || 'wss://videoplanet.up.railway.app',
    NEXT_PUBLIC_PRODUCTION_DOMAIN: process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN || 'vlanet.net',
  },
  
  // 빌드 최적화
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons'],
  },
  
  // Sass 지원
  sassOptions: {
    includePaths: ['./src/styles'],
  },
};
