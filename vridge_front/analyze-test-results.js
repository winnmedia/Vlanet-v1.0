const fs = require('fs').promises;

async function analyzeResults() {
  // 최신 테스트 결과 파일 찾기
  const files = await fs.readdir('.');
  const testFiles = files.filter(f => f.startsWith('test-results-') && f.endsWith('.json'));
  
  if (testFiles.length === 0) {
    console.log('테스트 결과 파일을 찾을 수 없습니다.');
    return;
  }
  
  // 가장 최근 파일 선택
  const latestFile = testFiles.sort().pop();
  console.log(`분석 중: ${latestFile}\n`);
  
  const data = JSON.parse(await fs.readFile(latestFile, 'utf8'));
  
  console.log('🎯 Next.js 애플리케이션 최종 테스트 보고서');
  console.log('='.repeat(60));
  
  console.log('\n📅 테스트 정보:');
  console.log(`  - 테스트 시간: ${new Date(data.testDate).toLocaleString('ko-KR')}`);
  console.log(`  - 서버 URL: ${data.serverUrl}`);
  
  console.log('\n📊 전체 결과:');
  console.log(`  - 총 페이지 수: ${data.summary.totalPages}`);
  console.log(`  - 성공: ${data.summary.successCount} (${(data.summary.successCount/data.summary.totalPages*100).toFixed(1)}%)`);
  console.log(`  - 실패: ${data.summary.failCount}`);
  
  console.log('\n⚡ 성능 분석:');
  console.log(`  - 평균 로딩 시간: ${data.summary.averageLoadTime.toFixed(2)}ms`);
  console.log(`  - 가장 빠른 페이지: ${data.summary.fastestPage.name} (${data.summary.fastestPage.loadTime}ms)`);
  console.log(`  - 가장 느린 페이지: ${data.summary.slowestPage.name} (${data.summary.slowestPage.loadTime}ms)`);
  
  console.log('\n📄 페이지별 상세 결과:');
  console.log('-'.repeat(60));
  console.log('페이지명'.padEnd(20) + '상태'.padEnd(8) + '로딩시간'.padEnd(12) + '크기');
  console.log('-'.repeat(60));
  
  data.pages.forEach(page => {
    const status = page.statusCode === 200 ? '✅ OK' : `❌ ${page.statusCode || 'ERR'}`;
    const loadTime = page.statusCode === 200 ? `${page.loadTime}ms` : '-';
    const size = page.statusCode === 200 ? `${(page.contentLength/1024).toFixed(1)}KB` : '-';
    
    console.log(
      page.name.padEnd(20) +
      status.padEnd(8) +
      loadTime.padEnd(12) +
      size
    );
  });
  
  // 성능 기준 평가
  console.log('\n🎯 성능 기준 평가:');
  const perfMetrics = {
    excellent: { loadTime: 100, size: 50 },
    good: { loadTime: 300, size: 200 },
    acceptable: { loadTime: 1000, size: 500 }
  };
  
  const successPages = data.pages.filter(p => p.statusCode === 200);
  
  const excellentPages = successPages.filter(p => 
    p.loadTime <= perfMetrics.excellent.loadTime && 
    p.contentLength/1024 <= perfMetrics.excellent.size
  );
  
  const goodPages = successPages.filter(p => 
    p.loadTime <= perfMetrics.good.loadTime && 
    p.contentLength/1024 <= perfMetrics.good.size &&
    !excellentPages.includes(p)
  );
  
  console.log(`  - 최고 수준 (≤100ms, ≤50KB): ${excellentPages.length}개`);
  console.log(`  - 우수 수준 (≤300ms, ≤200KB): ${goodPages.length}개`);
  console.log(`  - 개선 필요: ${successPages.length - excellentPages.length - goodPages.length}개`);
  
  // Next.js 특성 분석
  console.log('\n🔧 Next.js 특성:');
  const nextDataPages = data.pages.filter(p => p.hasNextData);
  console.log(`  - Next.js 데이터 포함: ${nextDataPages.length}/${successPages.length}`);
  console.log(`  - 서버 사이드 렌더링: ${nextDataPages.length > 0 ? '활성화' : '비활성화'}`);
  
  // 최종 평가
  console.log('\n✅ 최종 평가:');
  const score = (data.summary.successCount / data.summary.totalPages) * 100;
  
  if (score === 100 && data.summary.averageLoadTime < 200) {
    console.log('  🏆 완벽! 모든 페이지가 정상 작동하며 성능도 우수합니다.');
  } else if (score === 100) {
    console.log('  ✅ 훌륭함! 모든 페이지가 정상 작동합니다.');
  } else if (score >= 80) {
    console.log('  ⚠️  양호함. 일부 페이지에 문제가 있습니다.');
  } else {
    console.log('  ❌ 개선 필요. 많은 페이지에 문제가 있습니다.');
  }
  
  // 권장사항
  console.log('\n💡 권장사항:');
  
  if (data.summary.failCount > 0) {
    console.log('  1. 실패한 페이지의 라우팅 설정 및 컴포넌트 확인');
  }
  
  const slowPages = successPages.filter(p => p.loadTime > 300);
  if (slowPages.length > 0) {
    console.log(`  2. 느린 페이지 최적화 필요: ${slowPages.map(p => p.name).join(', ')}`);
  }
  
  const largePages = successPages.filter(p => p.contentLength > 200 * 1024);
  if (largePages.length > 0) {
    console.log(`  3. 큰 페이지 최적화 필요: ${largePages.map(p => p.name).join(', ')}`);
  }
  
  console.log('\n📈 배포 준비 상태:');
  if (data.summary.failCount === 0 && data.summary.averageLoadTime < 500) {
    console.log('  ✅ 배포 준비 완료!');
  } else {
    console.log('  ⚠️  배포 전 개선 사항을 처리하세요.');
  }
}

analyzeResults().catch(console.error);