/**
 * Global Teardown for VideoPlanet E2E Tests
 * 테스트 종료 후 정리 작업
 */

const fs = require('fs').promises;
const path = require('path');

async function globalTeardown(config) {
  console.log('\n🧹 테스트 환경 정리 시작');
  
  // 테스트 결과 집계
  const resultsPath = path.join(__dirname, '../reports/test-results.json');
  
  try {
    const results = await fs.readFile(resultsPath, 'utf-8');
    const data = JSON.parse(results);
    
    console.log('\n📊 테스트 결과 요약:');
    console.log(`  - 총 테스트: ${data.stats?.total || 0}`);
    console.log(`  - 성공: ${data.stats?.passed || 0}`);
    console.log(`  - 실패: ${data.stats?.failed || 0}`);
    console.log(`  - 건너뜀: ${data.stats?.skipped || 0}`);
    console.log(`  - 실행 시간: ${data.stats?.duration || 0}ms`);
  } catch (error) {
    console.log('⚠️  테스트 결과 파일을 읽을 수 없습니다');
  }
  
  // 임시 파일 정리 (선택적)
  if (process.env.CLEANUP_TEMP) {
    console.log('🧹 임시 파일 정리 중...');
    // 테스트 중 생성된 임시 파일 정리
  }
  
  console.log('✅ 테스트 환경 정리 완료');
}

module.exports = globalTeardown;