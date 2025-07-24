const fs = require('fs')
const path = require('path')

console.log('\n=== 페이지 import 문제 점검 ===')

// 문제가 되는 페이지들
const problematicPages = [
  '/home/winnmedia/VideoPlanet/vridge_front/pages/videoplanning.js',
  '/home/winnmedia/VideoPlanet/vridge_front/pages/project/[id].js',
  '/home/winnmedia/VideoPlanet/vridge_front/pages/feedback/[id].js'
]

// 컴포넌트 파일들
const componentFiles = [
  '/home/winnmedia/VideoPlanet/vridge_front/src/page/Cms/VideoPlanning.jsx',
  '/home/winnmedia/VideoPlanet/vridge_front/src/page/Cms/ProjectView.jsx',
  '/home/winnmedia/VideoPlanet/vridge_front/src/page/Cms/Feedback.jsx'
]

// import 문 분석
function analyzeImports(filePath) {
  console.log(`\n🔍 ${path.basename(filePath)} 분석:`)
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    
    // import 문 찾기
    const imports = lines.filter(line => 
      line.includes('import') && !line.trim().startsWith('//')
    )
    
    console.log(`  📦 전체 import 개수: ${imports.length}`)
    
    // 문제가 될 수 있는 import 찾기
    const problematicImports = imports.filter(imp => {
      return (
        imp.includes('components/') ||
        imp.includes('hooks/') ||
        imp.includes('util/') ||
        imp.includes('api/') ||
        imp.includes('images/') ||
        imp.includes('tasks/') ||
        imp.includes('redux/') ||
        imp.includes('config/')
      ) && !imp.includes('../')
    })
    
    if (problematicImports.length > 0) {
      console.log('  ⚠️  상대 경로 문제가 있는 import:')
      problematicImports.forEach(imp => {
        console.log(`    - ${imp.trim()}`)
      })
    }
    
    // CSS/SCSS import 찾기
    const styleImports = imports.filter(imp => 
      imp.includes('.scss') || imp.includes('.css')
    )
    
    if (styleImports.length > 0) {
      console.log('  🎨 스타일 import:')
      styleImports.forEach(imp => {
        console.log(`    - ${imp.trim()}`)
      })
    }
    
    // React Router 사용 확인
    const routerImports = imports.filter(imp => 
      imp.includes('react-router') || imp.includes('next/router') || imp.includes('nextNavigation')
    )
    
    if (routerImports.length > 0) {
      console.log('  🚀 라우터 import:')
      routerImports.forEach(imp => {
        console.log(`    - ${imp.trim()}`)
      })
    }
    
    // Redux 사용 확인
    const reduxUsage = content.includes('useSelector') || content.includes('useDispatch')
    if (reduxUsage) {
      console.log('  📡 Redux 사용 확인됨')
    }
    
  } catch (error) {
    console.error(`  ❌ 파일 읽기 오류: ${error.message}`)
  }
}

// 모든 파일 분석
console.log('\n### 페이지 파일 분석 ###')
problematicPages.forEach(analyzeImports)

console.log('\n### 컴포넌트 파일 분석 ###')
componentFiles.forEach(analyzeImports)

// config 파일 확인
console.log('\n### Next.js 설정 파일 확인 ###')
const nextConfigPath = '/home/winnmedia/VideoPlanet/vridge_front/next.config.js'
try {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf-8')
  console.log('✅ next.config.js 파일 존재')
  
  // webpack 설정 확인
  if (nextConfig.includes('webpack')) {
    console.log('  🔧 webpack 설정 포함됨')
  }
  
  // alias 설정 확인  
  if (nextConfig.includes('alias') || nextConfig.includes('resolve')) {
    console.log('  🔗 경로 alias 설정 포함됨')
  }
} catch (error) {
  console.error('❌ next.config.js 파일 없음')
}

console.log('\n=== 분석 완료 ===')