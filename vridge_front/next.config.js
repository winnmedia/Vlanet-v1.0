/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: true,
  
  // styled-components 컴파일러 설정
  compiler: {
    styledComponents: true,
  },
  
  // 환경 변수 매핑
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://videoplanet.up.railway.app',
    NEXT_PUBLIC_VERSION: process.env.NEXT_PUBLIC_VERSION || '0.9.1',
  },
  
  // Webpack 설정
  webpack: (config, { isServer }) => {
    // React Router를 Next.js 라우터로 대체
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-router-dom': path.resolve(__dirname, './src/util/nextNavigation.js'),
      // 경로 별칭 추가
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
    
    // SVG를 URL로 처리하도록 설정
    config.module.rules.push({
      test: /\.svg$/,
      type: 'asset/resource',
    })
    
    // 기타 이미지 파일 처리
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif)$/,
      type: 'asset/resource',
    })
    
    return config
  },
  
  // 이미지 도메인 설정
  images: {
    domains: ['videoplanet.up.railway.app', 'vlanet.net'],
  },
  
  // SCSS 지원
  sassOptions: {
    includePaths: ['./src/css', './src/styles'],
    additionalData: `@import "src/styles/_variables.scss";`
  },
}

module.exports = nextConfig