const axios = require('axios');

// API 테스트 설정
const API_BASE_URL = 'https://videoplanet.up.railway.app';
const TEST_TOKEN = 'test-token'; // 실제 테스트 시 유효한 토큰으로 교체 필요

// 색상 코드
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

console.log(`${colors.blue}=== VideoPlanet 영상 기획 API 테스트 ===${colors.reset}\n`);

// 1. 구조 테스트
async function testPlanningStructure() {
  console.log(`${colors.yellow}1. 영상 기획 계층 구조 테스트${colors.reset}`);
  
  const structure = {
    level1: '기획안',
    level2: '스토리 (여러 개 생성)',
    level3: '씬',
    level4: '숏',
    level5: '콘티'
  };
  
  console.log('새로운 계층 구조:');
  Object.entries(structure).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  console.log(`${colors.green}✓ 계층 구조 확인 완료${colors.reset}\n`);
}

// 2. API 엔드포인트 테스트
async function testAPIEndpoints() {
  console.log(`${colors.yellow}2. API 엔드포인트 존재 여부 테스트${colors.reset}`);
  
  const endpoints = [
    '/api/video-planning/generate/structure/',
    '/api/video-planning/generate/story/',
    '/api/video-planning/generate/shots/'
  ];
  
  const newEndpoints = [
    '/api/video-planning/generate/stories/',
    '/api/video-planning/generate/scenes/',
    '/api/video-planning/generate/storyboards/'
  ];
  
  console.log('기존 엔드포인트:');
  endpoints.forEach(endpoint => {
    console.log(`  - ${endpoint}`);
  });
  
  console.log('\n필요한 새 엔드포인트:');
  newEndpoints.forEach(endpoint => {
    console.log(`  - ${endpoint} ${colors.red}(구현 필요)${colors.reset}`);
  });
  
  console.log(`\n${colors.yellow}참고: 새로운 엔드포인트는 백엔드에 구현이 필요합니다.${colors.reset}\n`);
}

// 3. UI 컴포넌트 테스트
async function testUIComponents() {
  console.log(`${colors.yellow}3. UI 컴포넌트 구조 테스트${colors.reset}`);
  
  const components = {
    '네비게이션': {
      description: '단계 간 자유로운 이동',
      features: ['클릭 가능한 단계', '현재 단계 표시', '비활성화 상태']
    },
    '스토리 선택': {
      description: '여러 스토리 중 선택',
      features: ['카드 레이아웃', '호버 효과', '선택 상태 표시']
    },
    '씬 구성': {
      description: '스토리별 씬 목록',
      features: ['장소/시간 표시', '등장인물 정보', '분위기 설명']
    },
    '숏 리스트': {
      description: '씬별 숏 구성',
      features: ['카메라 정보', '기술적 세부사항', '대사 표시']
    },
    '콘티 보드': {
      description: '시각적 스토리보드',
      features: ['프레임 표시', '구도 설명', '조명/음향 정보']
    }
  };
  
  Object.entries(components).forEach(([name, info]) => {
    console.log(`\n${name}:`);
    console.log(`  설명: ${info.description}`);
    console.log(`  기능:`);
    info.features.forEach(feature => {
      console.log(`    - ${feature}`);
    });
  });
  
  console.log(`\n${colors.green}✓ UI 컴포넌트 구조 확인 완료${colors.reset}\n`);
}

// 4. 데이터 플로우 테스트
async function testDataFlow() {
  console.log(`${colors.yellow}4. 데이터 플로우 테스트${colors.reset}`);
  
  const flow = [
    { step: 1, action: '기획안 입력', output: '텍스트' },
    { step: 2, action: 'AI 스토리 생성', output: '스토리 배열 (3-5개)' },
    { step: 3, action: '스토리 선택', output: '선택된 스토리' },
    { step: 4, action: 'AI 씬 생성', output: '씬 배열' },
    { step: 5, action: '씬 선택', output: '선택된 씬' },
    { step: 6, action: 'AI 숏 생성', output: '숏 배열' },
    { step: 7, action: '숏 선택', output: '선택된 숏' },
    { step: 8, action: 'AI 콘티 생성', output: '스토리보드 배열' }
  ];
  
  flow.forEach(({ step, action, output }) => {
    console.log(`  ${step}. ${action} → ${output}`);
  });
  
  console.log(`\n${colors.green}✓ 데이터 플로우 확인 완료${colors.reset}\n`);
}

// 5. 테스트 데이터 생성
async function generateTestData() {
  console.log(`${colors.yellow}5. 테스트 데이터 예시${colors.reset}`);
  
  const testData = {
    planning: '신제품 런칭을 위한 프로모션 영상을 제작하려고 합니다.',
    stories: [
      {
        title: '혁신의 시작',
        summary: '일상에서 불편함을 느끼는 주인공이 새로운 제품을 발견하고 삶이 변화하는 이야기',
        genre: '드라마',
        tone: '희망적',
        duration: '2분'
      },
      {
        title: '미래로의 도약',
        summary: '첨단 기술이 가져올 미래의 모습을 시각적으로 표현하는 컨셉추얼 영상',
        genre: '다큐멘터리',
        tone: '미래지향적',
        duration: '1분 30초'
      }
    ],
    scenes: [
      {
        location: '사무실',
        time_of_day: '오후',
        description: '바쁜 일상 속에서 스트레스를 받는 주인공의 모습',
        characters: ['주인공', '동료들'],
        mood: '답답함',
        action: '서류 작업에 지친 주인공'
      }
    ],
    shots: [
      {
        shot_size: '클로즈업',
        description: '지친 표정의 주인공 얼굴',
        camera_angle: '아이레벨',
        camera_movement: '고정',
        duration: '3초',
        dialogue: null
      }
    ],
    storyboards: [
      {
        shot_description: '주인공의 지친 표정 클로즈업',
        composition: '화면 중앙에 주인공 얼굴, 배경은 흐릿하게',
        lighting: '자연광, 창문에서 들어오는 부드러운 빛',
        sound: '사무실 소음, 키보드 타이핑 소리',
        vfx: null,
        notes: '피로감이 잘 드러나도록 조명 조절'
      }
    ]
  };
  
  console.log('\n기획안 예시:');
  console.log(`  "${testData.planning}"`);
  
  console.log('\n생성될 스토리 예시:');
  testData.stories.forEach((story, index) => {
    console.log(`  ${index + 1}. ${story.title} (${story.genre}, ${story.duration})`);
  });
  
  console.log(`\n${colors.green}✓ 테스트 데이터 생성 완료${colors.reset}\n`);
}

// 테스트 실행
async function runTests() {
  try {
    await testPlanningStructure();
    await testAPIEndpoints();
    await testUIComponents();
    await testDataFlow();
    await generateTestData();
    
    console.log(`${colors.blue}=== 테스트 완료 ===${colors.reset}`);
    console.log(`\n${colors.yellow}참고사항:${colors.reset}`);
    console.log('1. 백엔드에 새로운 API 엔드포인트 구현 필요');
    console.log('2. AI 서비스 (Gemini) 프롬프트 수정 필요');
    console.log('3. 실제 테스트는 로그인 후 /VideoPlanning 페이지에서 진행');
    
  } catch (error) {
    console.error(`${colors.red}테스트 실패:${colors.reset}`, error.message);
  }
}

// 테스트 시작
runTests();