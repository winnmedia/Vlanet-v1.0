#!/usr/bin/env node

/**
 * VideoPlanet 프론트엔드 배포 체크리스트
 * 배포 전/후 실행하여 모든 설정이 올바른지 확인
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class FrontendDeploymentChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }
  
  checkEnvironmentVariables() {
    console.log('\n🔍 환경변수 확인...');
    
    // .env 파일 확인
    const envPath = path.join(__dirname, '.env');
    const envExamplePath = path.join(__dirname, '.env.example');
    
    if (fs.existsSync(envPath)) {
      this.successes.push('✅ .env 파일 존재');
      
      // 환경변수 내용 확인
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      // 필수 환경변수
      const requiredVars = [
        'REACT_APP_API_URL',
      ];
      
      const optionalVars = [
        'REACT_APP_WEBSOCKET_URL',
        'REACT_APP_GA_TRACKING_ID',
        'REACT_APP_SENTRY_DSN',
      ];
      
      requiredVars.forEach(varName => {
        if (envContent.includes(varName)) {
          this.successes.push(`✅ ${varName} 설정됨`);
        } else {
          this.errors.push(`❌ ${varName} 누락됨`);
        }
      });
      
      optionalVars.forEach(varName => {
        if (envContent.includes(varName)) {
          this.successes.push(`✅ ${varName} 설정됨`);
        } else {
          this.warnings.push(`⚠️  ${varName} 미설정 (선택사항)`);
        }
      });
      
    } else {
      this.errors.push('❌ .env 파일이 없습니다');
      
      if (fs.existsSync(envExamplePath)) {
        this.warnings.push('⚠️  .env.example 파일을 복사하여 .env 파일을 생성하세요');
      }
    }
  }
  
  checkBuildConfiguration() {
    console.log('\n🔍 빌드 설정 확인...');
    
    // package.json 확인
    const packageJsonPath = path.join(__dirname, 'package.json');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // 빌드 스크립트 확인
      if (packageJson.scripts && packageJson.scripts.build) {
        this.successes.push('✅ 빌드 스크립트 존재');
        
        // CI=false 설정 확인
        if (packageJson.scripts.build.includes('CI=false')) {
          this.successes.push('✅ CI=false 설정으로 경고를 에러로 처리하지 않음');
        }
      } else {
        this.errors.push('❌ 빌드 스크립트가 없습니다');
      }
      
      // 주요 의존성 확인
      const importantDeps = [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
      ];
      
      importantDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.successes.push(`✅ ${dep} 의존성 존재`);
        } else {
          this.errors.push(`❌ ${dep} 의존성 누락`);
        }
      });
      
    } catch (error) {
      this.errors.push(`❌ package.json 읽기 실패: ${error.message}`);
    }
  }
  
  checkDeploymentFiles() {
    console.log('\n🔍 배포 설정 파일 확인...');
    
    // Vercel 설정
    const vercelJsonPath = path.join(__dirname, 'vercel.json');
    if (fs.existsSync(vercelJsonPath)) {
      this.successes.push('✅ vercel.json 존재');
      
      try {
        const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
        
        if (vercelConfig.routes) {
          this.successes.push('✅ Vercel 라우팅 설정 존재');
        }
        
        if (vercelConfig.env && vercelConfig.env.REACT_APP_API_URL) {
          this.successes.push('✅ Vercel 환경변수 설정됨');
        }
      } catch (error) {
        this.warnings.push('⚠️  vercel.json 파싱 실패');
      }
    } else {
      this.warnings.push('⚠️  vercel.json 없음 (Vercel 배포 시 필요)');
    }
    
    // Railway 설정
    const railwayJsonPath = path.join(__dirname, 'railway.json');
    if (fs.existsSync(railwayJsonPath)) {
      this.successes.push('✅ railway.json 존재');
    } else {
      this.warnings.push('⚠️  railway.json 없음 (Railway 배포 시 필요)');
    }
    
    // Express 서버 (Railway용)
    const serverJsPath = path.join(__dirname, 'server.js');
    if (fs.existsSync(serverJsPath)) {
      this.successes.push('✅ server.js 존재 (Express 서버)');
    } else {
      this.warnings.push('⚠️  server.js 없음 (Railway 배포 시 필요)');
    }
  }
  
  checkProxyConfiguration() {
    console.log('\n🔍 프록시 설정 확인...');
    
    const packageJsonPath = path.join(__dirname, 'package.json');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (packageJson.proxy) {
        this.successes.push(`✅ 개발 프록시 설정됨: ${packageJson.proxy}`);
      } else {
        this.warnings.push('⚠️  개발 프록시 미설정');
      }
    } catch (error) {
      this.warnings.push('⚠️  프록시 설정 확인 실패');
    }
    
    // setupProxy.js 확인
    const setupProxyPath = path.join(__dirname, 'src', 'setupProxy.js');
    if (fs.existsSync(setupProxyPath)) {
      this.successes.push('✅ setupProxy.js 존재 (고급 프록시 설정)');
    }
  }
  
  checkBuildOptimization() {
    console.log('\n🔍 빌드 최적화 설정 확인...');
    
    // 빌드 디렉토리 확인
    const buildPath = path.join(__dirname, 'build');
    if (fs.existsSync(buildPath)) {
      this.successes.push('✅ 빌드 디렉토리 존재');
      
      // 빌드 크기 확인
      try {
        const buildSize = execSync(`du -sh ${buildPath}`).toString().trim();
        this.successes.push(`✅ 빌드 크기: ${buildSize}`);
      } catch (error) {
        this.warnings.push('⚠️  빌드 크기 확인 실패');
      }
    } else {
      this.warnings.push('⚠️  빌드 디렉토리 없음 (npm run build 실행 필요)');
    }
    
    // 코드 스플리팅 확인
    const appJsPath = path.join(__dirname, 'src', 'routes', 'AppRoute.js');
    if (fs.existsSync(appJsPath)) {
      const appJsContent = fs.readFileSync(appJsPath, 'utf8');
      if (appJsContent.includes('React.lazy')) {
        this.successes.push('✅ React.lazy를 사용한 코드 스플리팅 적용');
      } else {
        this.warnings.push('⚠️  코드 스플리팅 미적용');
      }
    }
  }
  
  checkAPIConfiguration() {
    console.log('\n🔍 API 설정 확인...');
    
    // axios 설정 확인
    const axiosConfigPath = path.join(__dirname, 'src', 'config', 'axios.js');
    if (fs.existsSync(axiosConfigPath)) {
      this.successes.push('✅ axios 설정 파일 존재');
      
      const axiosContent = fs.readFileSync(axiosConfigPath, 'utf8');
      
      // baseURL 설정 확인
      if (axiosContent.includes('baseURL')) {
        this.successes.push('✅ API baseURL 설정됨');
      }
      
      // 인터셉터 확인
      if (axiosContent.includes('interceptors')) {
        this.successes.push('✅ axios 인터셉터 설정됨');
      }
      
      // 토큰 처리 확인
      if (axiosContent.includes('localStorage.getItem') || axiosContent.includes('VGID')) {
        this.successes.push('✅ 인증 토큰 처리 로직 존재');
      }
    } else {
      this.errors.push('❌ axios 설정 파일 없음');
    }
  }
  
  checkSecurityHeaders() {
    console.log('\n🔍 보안 헤더 설정 확인...');
    
    // Express 서버의 보안 헤더 확인
    const serverJsPath = path.join(__dirname, 'server.js');
    if (fs.existsSync(serverJsPath)) {
      const serverContent = fs.readFileSync(serverJsPath, 'utf8');
      
      if (serverContent.includes('helmet')) {
        this.successes.push('✅ Helmet 보안 헤더 미들웨어 사용');
      } else {
        this.warnings.push('⚠️  Helmet 미들웨어 미사용');
      }
    }
    
    // Vercel 보안 헤더 확인
    const vercelJsonPath = path.join(__dirname, 'vercel.json');
    if (fs.existsSync(vercelJsonPath)) {
      try {
        const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
        if (vercelConfig.headers) {
          this.successes.push('✅ Vercel 보안 헤더 설정됨');
        }
      } catch (error) {
        // 이미 위에서 경고 처리
      }
    }
  }
  
  generateDeploymentScript() {
    console.log('\n📝 배포 스크립트 생성...');
    
    const deployScript = `#!/bin/bash
# VideoPlanet 프론트엔드 배포 스크립트

echo "🚀 VideoPlanet 프론트엔드 배포 시작..."

# 1. 의존성 설치
echo "📦 의존성 설치 중..."
npm ci --production=false

# 2. 환경변수 확인
if [ ! -f .env ]; then
  echo "❌ .env 파일이 없습니다!"
  echo "📝 .env.example을 복사하여 .env를 생성하세요."
  exit 1
fi

# 3. 빌드
echo "🔨 프로덕션 빌드 생성 중..."
npm run build

# 4. 빌드 결과 확인
if [ -d "build" ]; then
  echo "✅ 빌드 성공!"
  echo "📊 빌드 크기: $(du -sh build)"
else
  echo "❌ 빌드 실패!"
  exit 1
fi

# 5. Vercel 배포 (Vercel CLI 설치 필요)
# echo "🚀 Vercel에 배포 중..."
# vercel --prod

# 6. Railway 배포 (Railway CLI 설치 필요)
# echo "🚀 Railway에 배포 중..."
# railway up

echo "✅ 배포 준비 완료!"
`;
    
    const deployScriptPath = path.join(__dirname, 'deploy.sh');
    fs.writeFileSync(deployScriptPath, deployScript, { mode: 0o755 });
    this.successes.push('✅ deploy.sh 스크립트 생성됨');
  }
  
  runAllChecks() {
    console.log('='.repeat(80));
    console.log('🚀 VideoPlanet 프론트엔드 배포 환경 검증');
    console.log('='.repeat(80));
    
    this.checkEnvironmentVariables();
    this.checkBuildConfiguration();
    this.checkDeploymentFiles();
    this.checkProxyConfiguration();
    this.checkBuildOptimization();
    this.checkAPIConfiguration();
    this.checkSecurityHeaders();
    this.generateDeploymentScript();
    
    // 결과 출력
    console.log('\n' + '='.repeat(80));
    console.log('📊 검증 결과 요약');
    console.log('='.repeat(80));
    
    console.log(`\n✅ 성공: ${this.successes.length}개`);
    this.successes.forEach(success => {
      console.log(`  ${success}`);
    });
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  경고: ${this.warnings.length}개`);
      this.warnings.forEach(warning => {
        console.log(`  ${warning}`);
      });
    }
    
    if (this.errors.length > 0) {
      console.log(`\n❌ 오류: ${this.errors.length}개`);
      this.errors.forEach(error => {
        console.log(`  ${error}`);
      });
    }
    
    // 최종 평가
    console.log('\n' + '='.repeat(80));
    if (this.errors.length === 0) {
      console.log('✅ 배포 준비 완료! 모든 필수 검사를 통과했습니다.');
      console.log('\n다음 명령어로 배포를 진행하세요:');
      console.log('  Vercel: vercel --prod');
      console.log('  Railway: railway up');
      console.log('  또는: bash deploy.sh');
    } else {
      console.log('❌ 배포 전 해결해야 할 오류가 있습니다.');
      console.log('위의 오류를 먼저 해결한 후 다시 검사를 실행하세요.');
    }
    
    return this.errors.length === 0;
  }
}

// 실행
const checker = new FrontendDeploymentChecker();
const success = checker.runAllChecks();
process.exit(success ? 0 : 1);