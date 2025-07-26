// 번들 크기 분석 유틸리티
// 개발 환경에서만 동작하도록 설정

export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV !== 'development') {
    return
  }
  
  // Webpack Bundle Analyzer 설정
  console.log(`
📊 번들 크기 분석을 위한 설정:

1. webpack-bundle-analyzer 설치:
   npm install --save-dev webpack-bundle-analyzer

2. webpack.config.js 또는 next.config.js에 추가:

   const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

   // Webpack 설정
   plugins: [
     new BundleAnalyzerPlugin({
       analyzerMode: 'static',
       reportFilename: 'bundle-report.html',
       openAnalyzer: false
     })
   ]

   // Next.js 설정
   const withBundleAnalyzer = require('@next/bundle-analyzer')({
     enabled: process.env.ANALYZE === 'true',
   })
   
   module.exports = withBundleAnalyzer({
     // 기존 설정...
   })

3. 분석 실행:
   ANALYZE=true npm run build
  `)
}

// 동적 임포트 크기 추적
export const trackDynamicImportSize = (chunkName) => {
  if (process.env.NODE_ENV !== 'development') {
    return
  }
  
  // Performance API를 사용한 리소스 크기 측정
  const measureResourceSize = () => {
    const resources = performance.getEntriesByType('resource')
    const chunk = resources.find(r => r.name.includes(chunkName))
    
    if (chunk) {
      const sizeInKB = (chunk.transferSize / 1024).toFixed(2)
      console.log(`📦 Chunk "${chunkName}" loaded: ${sizeInKB} KB`)
      
      // 큰 청크 경고
      if (chunk.transferSize > 250 * 1024) { // 250KB
        console.warn(`⚠️ Large chunk detected: ${chunkName} (${sizeInKB} KB)`)
      }
    }
  }
  
  // 약간의 지연 후 측정 (리소스가 로드된 후)
  setTimeout(measureResourceSize, 100)
}

// 컴포넌트별 번들 크기 예상치
export const estimateComponentSize = (componentName) => {
  const estimates = {
    // 미니멀 컴포넌트
    'MinimalCard': '2KB',
    'MinimalButton': '3KB',
    'MinimalInput': '4KB',
    'StepWizard': '8KB',
    
    // 페이지 컴포넌트
    'CmsHome': '15KB',
    'VideoPlanning': '20KB',
    'Login': '10KB',
    
    // 큰 라이브러리
    'moment': '67KB',
    'react-dnd': '45KB',
    'react-color': '38KB'
  }
  
  return estimates[componentName] || 'Unknown'
}

// 코드 스플리팅 기회 찾기
export const findCodeSplittingOpportunities = () => {
  if (process.env.NODE_ENV !== 'development') {
    return []
  }
  
  const opportunities = []
  
  // 큰 라이브러리 체크
  const largeLibraries = [
    { name: 'moment', suggestion: 'date-fns 또는 dayjs로 교체 고려' },
    { name: 'lodash', suggestion: 'lodash-es 사용 및 tree-shaking 활성화' },
    { name: 'react-dnd', suggestion: '드래그 앤 드롭이 필요한 페이지만 동적 임포트' },
    { name: 'react-color', suggestion: '색상 선택기가 필요한 페이지만 동적 임포트' }
  ]
  
  // 실제 import 검사 (개발 환경에서만)
  if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('🔍 코드 스플리팅 기회:')
    largeLibraries.forEach(lib => {
      console.log(`- ${lib.name}: ${lib.suggestion}`)
    })
  }
  
  return opportunities
}

// 리소스 힌트 생성
export const generateResourceHints = () => {
  return {
    preconnect: [
      'https://fonts.googleapis.com',
      'https://api.videoplanet.com'
    ],
    dns_prefetch: [
      'https://cdn.videoplanet.com',
      'https://analytics.videoplanet.com'
    ],
    preload: [
      { href: '/fonts/sf-pro-display.woff2', as: 'font', type: 'font/woff2' },
      { href: '/css/minimal-design-system.css', as: 'style' }
    ]
  }
}

// 성능 예산 체크
export const checkPerformanceBudget = () => {
  const budget = {
    js: 200 * 1024, // 200KB
    css: 50 * 1024, // 50KB
    images: 1024 * 1024, // 1MB
    total: 1500 * 1024 // 1.5MB
  }
  
  if (typeof window !== 'undefined') {
    const resources = performance.getEntriesByType('resource')
    
    const sizes = {
      js: 0,
      css: 0,
      images: 0,
      total: 0
    }
    
    resources.forEach(resource => {
      sizes.total += resource.transferSize || 0
      
      if (resource.name.endsWith('.js')) {
        sizes.js += resource.transferSize || 0
      } else if (resource.name.endsWith('.css')) {
        sizes.css += resource.transferSize || 0
      } else if (/\.(jpg|jpeg|png|gif|webp|svg)/.test(resource.name)) {
        sizes.images += resource.transferSize || 0
      }
    })
    
    console.log('📊 Performance Budget Check:')
    Object.keys(budget).forEach(key => {
      const used = sizes[key]
      const limit = budget[key]
      const percentage = ((used / limit) * 100).toFixed(1)
      const status = used > limit ? '❌' : '✅'
      
      console.log(`${status} ${key}: ${(used / 1024).toFixed(1)}KB / ${(limit / 1024).toFixed(1)}KB (${percentage}%)`)
    })
  }
}

// 초기화 함수
export const initBundleAnalyzer = () => {
  if (process.env.NODE_ENV === 'development') {
    // 페이지 로드 완료 후 분석 실행
    window.addEventListener('load', () => {
      setTimeout(() => {
        checkPerformanceBudget()
        findCodeSplittingOpportunities()
      }, 2000)
    })
  }
}

export default {
  analyzeBundleSize,
  trackDynamicImportSize,
  estimateComponentSize,
  findCodeSplittingOpportunities,
  generateResourceHints,
  checkPerformanceBudget,
  initBundleAnalyzer
}