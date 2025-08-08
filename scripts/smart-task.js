#!/usr/bin/env node
/**
 * VideoPlanet Smart Task Selector
 * 작업 복잡도를 자동 판단하여 최적의 프로세스 선택
 */

// 작업 복잡도 자동 판단
function analyzeTask(description) {
  const keywords = {
    simple: ['색상', '텍스트', '라벨', '간단한', '수정', 'typo', '오타'],
    medium: ['버그', '에러', '오류', 'API', '컴포넌트', '추가', '개선'],
    complex: ['기능', '설계', '아키텍처', '마이그레이션', '리팩토링', '성능', '최적화'],
    parallel: ['여러', '동시에', '모든', '전체', '통합']
  };
  
  const desc = description.toLowerCase();
  let complexity = 'simple';
  let needsParallel = false;
  
  // 키워드 매칭
  for (const [level, words] of Object.entries(keywords)) {
    if (words.some(word => desc.includes(word))) {
      if (level === 'parallel') {
        needsParallel = true;
      } else if (level !== 'simple' || complexity === 'simple') {
        complexity = level;
      }
    }
  }
  
  // 예상 시간 계산
  const timeEstimates = {
    simple: 5,
    medium: 30,
    complex: 120
  };
  
  return {
    complexity,
    estimatedMinutes: timeEstimates[complexity],
    needsParallel,
    workflow: getWorkflow(complexity, needsParallel)
  };
}

// 워크플로우 결정
function getWorkflow(complexity, needsParallel) {
  if (complexity === 'simple') {
    return {
      type: 'DIRECT',
      description: '직접 수정 (에이전트 불필요)',
      agents: [],
      steps: ['직접 파일 수정', '테스트', '커밋']
    };
  }
  
  if (complexity === 'medium' && !needsParallel) {
    return {
      type: 'SINGLE_AGENT',
      description: '단일 에이전트 실행',
      agents: ['적절한 전문 에이전트 1명'],
      steps: ['에이전트 실행', '결과 확인', '배포']
    };
  }
  
  if (complexity === 'medium' && needsParallel) {
    return {
      type: 'PARALLEL',
      description: '병렬 실행 (2-3명)',
      agents: ['API 개발자', 'UI 개발자', '테스트 엔지니어'],
      steps: ['병렬 실행', '통합', '배포']
    };
  }
  
  return {
    type: 'PLAN_AND_EXECUTE',
    description: '계획 수립 후 병렬 실행',
    agents: ['아키텍트 (계획)', '다수 개발자 (병렬 실행)'],
    steps: ['간단 계획', '병렬 구현', '통합', '최적화', '배포']
  };
}

// 에이전트 추천
function recommendAgents(task) {
  const agentMap = {
    'api': 'api-developer-noah',
    'ui': 'component-developer-lucas',
    'css': 'styling-layout-specialist-ava',
    '스타일': 'styling-layout-specialist-ava',
    '테스트': 'automation-engineer-henry',
    '성능': 'performance-interaction-engineer',
    '배포': 'cicd-engineer-emily',
    '통합': 'integration-engineer-chloe',
    '비즈니스': 'business-logic-developer-ethan',
    '데이터베이스': 'database-reliability-engineer-victoria',
    'db': 'database-reliability-engineer-victoria'
  };
  
  const recommended = [];
  const taskLower = task.toLowerCase();
  
  for (const [keyword, agent] of Object.entries(agentMap)) {
    if (taskLower.includes(keyword)) {
      recommended.push(agent);
    }
  }
  
  return recommended.length > 0 ? recommended : ['component-developer-lucas'];
}

// 실행 명령 생성
function generateCommand(task, analysis) {
  const agents = recommendAgents(task);
  
  if (analysis.workflow.type === 'DIRECT') {
    return `# 직접 수정 (5분 이내)
Edit [파일명]
# 수정 작업 수행
git add -A && git commit -m "fix: ${task}"`;
  }
  
  if (analysis.workflow.type === 'SINGLE_AGENT') {
    return `# 단일 에이전트 실행 (${analysis.estimatedMinutes}분)
Task("${agents[0]}", "${task}")`;
  }
  
  if (analysis.workflow.type === 'PARALLEL') {
    const parallelTasks = agents.map(agent => 
      `  Task("${agent}", "${task}")`
    ).join(',\n');
    
    return `# 병렬 실행 (${analysis.estimatedMinutes}분)
Promise.all([
${parallelTasks}
])`;
  }
  
  // PLAN_AND_EXECUTE
  return `# 계획 수립 후 실행 (${analysis.estimatedMinutes}분)
// Step 1: 간단 계획
const plan = await Task("system-architect-arthur", "${task} 아키텍처 검토");

// Step 2: 병렬 구현
const results = await Promise.all([
${agents.map(agent => `  Task("${agent}", "${task}")`).join(',\n')}
]);

// Step 3: 통합 및 배포
await Task("integration-engineer-chloe", "통합");
await Task("cicd-engineer-emily", "배포");`;
}

// CLI 인터페이스
if (require.main === module) {
  const task = process.argv.slice(2).join(' ');
  
  if (!task || task === '--help' || task === '-h') {
    console.log(`
🎯 VideoPlanet Smart Task Selector

사용법:
  node smart-task.js [작업 설명]

예시:
  node smart-task.js "로그인 버튼 색상 변경"
  node smart-task.js "사용자 피드백 API 추가"
  node smart-task.js "전체 시스템 성능 최적화"

자동으로:
- 작업 복잡도 분석
- 예상 시간 계산
- 최적 워크플로우 선택
- 실행 명령 생성
    `);
    process.exit(0);
  }
  
  console.log(`\n🔍 작업 분석: "${task}"`);
  console.log('=====================================\n');
  
  const analysis = analyzeTask(task);
  const agents = recommendAgents(task);
  
  console.log(`📊 복잡도: ${analysis.complexity.toUpperCase()}`);
  console.log(`⏱️  예상 시간: ${analysis.estimatedMinutes}분`);
  console.log(`🔄 워크플로우: ${analysis.workflow.description}`);
  
  if (agents.length > 0) {
    console.log(`👥 추천 에이전트:`);
    agents.forEach(agent => console.log(`   - ${agent}`));
  }
  
  console.log(`\n📝 실행 단계:`);
  analysis.workflow.steps.forEach((step, i) => {
    console.log(`   ${i + 1}. ${step}`);
  });
  
  console.log('\n💻 실행 명령:\n');
  console.log('```javascript');
  console.log(generateCommand(task, analysis));
  console.log('```\n');
  
  console.log('=====================================');
  console.log('✨ 이 명령을 복사하여 실행하세요!\n');
}

module.exports = { analyzeTask, recommendAgents, generateCommand };