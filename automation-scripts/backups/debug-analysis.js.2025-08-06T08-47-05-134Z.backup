/**
 * 사용자 여정 테스트 결과 분석 및 디버깅
 * 발견된 문제점들에 대한 상세 분석
 */

const axios = require('axios');
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

console.log(`${colors.magenta}========================================${colors.reset}`);
console.log(`${colors.magenta}VideoPlanet 에러 분석 및 디버깅${colors.reset}`);
console.log(`${colors.magenta}========================================${colors.reset}\n`);

// 발견된 문제점 분석
const issues = [
    {
        id: 1,
        category: '인증/회원',
        title: '회원가입 API 오류 (400)',
        description: '필수 필드 누락으로 인한 회원가입 실패',
        impact: 'CRITICAL',
        solution: [
            '회원가입 API의 필수 필드 확인',
            'users/serializers.py의 SignupSerializer 검증',
            '프론트엔드 회원가입 폼의 데이터 전송 확인'
        ],
        testData: {
            endpoint: '/api/users/signup/',
            requiredFields: ['email', 'password', 'username', 'phone', 'organization'],
            errorMessage: '모든 필드를 입력해주세요.'
        }
    },
    {
        id: 2,
        category: '인증/회원',
        title: '로그인 API 오류 (404)',
        description: '사용자를 찾을 수 없음 - 회원가입이 실패했기 때문',
        impact: 'CRITICAL',
        solution: [
            '로그인 엔드포인트 URL 확인',
            '사용자 모델의 email 필드 unique 제약 확인',
            '테스트 사용자 생성 스크립트 필요'
        ],
        testData: {
            endpoint: '/api/users/login/',
            errorMessage: '존재하지 않는 사용자입니다.'
        }
    },
    {
        id: 3,
        category: '프로젝트',
        title: '프로젝트 생성 API 오류 (405)',
        description: 'Method Not Allowed - HTTP 메서드 불일치',
        impact: 'HIGH',
        solution: [
            'projects/urls.py의 URL 패턴 확인',
            'ViewSet의 allowed methods 확인',
            'CSRF 토큰 처리 확인'
        ],
        testData: {
            endpoint: '/api/projects/',
            method: 'POST',
            errorCode: 405
        }
    },
    {
        id: 4,
        category: '프론트엔드',
        title: '프론트엔드 서버 연결 실패',
        description: 'Next.js 개발 서버가 3001 포트에서 응답하지 않음',
        impact: 'CRITICAL',
        solution: [
            'Next.js 개발 서버 실행 상태 확인',
            '포트 충돌 확인',
            '.next 폴더 정리 후 재시작'
        ],
        testData: {
            port: 3001,
            error: 'ECONNREFUSED'
        }
    }
];

// 각 문제에 대한 상세 분석
console.log(`${colors.blue}[발견된 문제점 분석]${colors.reset}\n`);

issues.forEach((issue, index) => {
    console.log(`${colors.yellow}${index + 1}. ${issue.title}${colors.reset}`);
    console.log(`   카테고리: ${issue.category}`);
    console.log(`   설명: ${issue.description}`);
    console.log(`   심각도: ${issue.impact === 'CRITICAL' ? colors.red : colors.yellow}${issue.impact}${colors.reset}`);
    console.log(`   해결 방안:`);
    issue.solution.forEach(sol => {
        console.log(`     • ${sol}`);
    });
    console.log(`   테스트 데이터: ${JSON.stringify(issue.testData, null, 2).split('\n').join('\n   ')}`);
    console.log('');
});

// 즉시 실행 가능한 디버깅 체크
console.log(`${colors.blue}[즉시 확인 사항]${colors.reset}\n`);

// 1. 백엔드 서버 상태 확인
async function checkBackendStatus() {
    console.log(`${colors.cyan}1. 백엔드 서버 상태 확인${colors.reset}`);
    try {
        const response = await axios.get('http://localhost:8000/api/health/', {
            timeout: 5000,
            validateStatus: () => true
        });
        
        if (response.status === 200) {
            console.log(`  ${colors.green}✓ 백엔드 서버 정상 작동${colors.reset}`);
            console.log(`    응답: ${JSON.stringify(response.data)}`);
        } else {
            console.log(`  ${colors.red}✗ 백엔드 서버 응답 이상${colors.reset}`);
            console.log(`    상태 코드: ${response.status}`);
        }
    } catch (error) {
        console.log(`  ${colors.red}✗ 백엔드 서버 연결 실패${colors.reset}`);
        console.log(`    에러: ${error.message}`);
    }
    console.log('');
}

// 2. 프론트엔드 서버 상태 확인
async function checkFrontendStatus() {
    console.log(`${colors.cyan}2. 프론트엔드 서버 상태 확인${colors.reset}`);
    
    const ports = [3000, 3001];
    let foundPort = null;
    
    for (const port of ports) {
        try {
            const response = await axios.get(`http://localhost:${port}`, {
                timeout: 5000,
                validateStatus: () => true
            });
            
            if (response.status === 200 || response.status === 404) {
                console.log(`  ${colors.green}✓ 프론트엔드 서버가 포트 ${port}에서 실행 중${colors.reset}`);
                foundPort = port;
                break;
            }
        } catch (error) {
            console.log(`  ${colors.yellow}포트 ${port}: 응답 없음${colors.reset}`);
        }
    }
    
    if (!foundPort) {
        console.log(`  ${colors.red}✗ 프론트엔드 서버가 실행되지 않음${colors.reset}`);
        console.log(`  ${colors.yellow}해결 방법:${colors.reset}`);
        console.log(`    1. cd /home/winnmedia/VideoPlanet/vridge_front`);
        console.log(`    2. npm run dev`);
    }
    console.log('');
}

// 3. API 엔드포인트 상세 확인
async function checkAPIEndpoints() {
    console.log(`${colors.cyan}3. 주요 API 엔드포인트 확인${colors.reset}`);
    
    const endpoints = [
        { url: '/api/', name: 'API Root' },
        { url: '/api/users/', name: 'Users API' },
        { url: '/api/projects/', name: 'Projects API' },
        { url: '/api/admin/', name: 'Admin Panel' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`http://localhost:8000${endpoint.url}`, {
                timeout: 5000,
                validateStatus: () => true
            });
            
            const statusColor = response.status === 200 ? colors.green : 
                               response.status === 401 ? colors.yellow : colors.red;
            const statusIcon = response.status === 200 ? '✓' : 
                              response.status === 401 ? '⚠' : '✗';
            
            console.log(`  ${statusColor}${statusIcon} ${endpoint.name}: ${response.status}${colors.reset}`);
        } catch (error) {
            console.log(`  ${colors.red}✗ ${endpoint.name}: 연결 실패${colors.reset}`);
        }
    }
    console.log('');
}

// 권장 해결 순서
console.log(`${colors.blue}[권장 해결 순서]${colors.reset}\n`);

const fixOrder = [
    {
        priority: 1,
        task: '프론트엔드 서버 재시작',
        commands: [
            'cd /home/winnmedia/VideoPlanet/vridge_front',
            'rm -rf .next',
            'npm run dev'
        ]
    },
    {
        priority: 2,
        task: '백엔드 서버 확인 및 재시작',
        commands: [
            'cd /home/winnmedia/VideoPlanet/vridge_back',
            'python manage.py runserver'
        ]
    },
    {
        priority: 3,
        task: '회원가입 API 필드 확인',
        files: [
            'vridge_back/users/serializers.py',
            'vridge_back/users/views.py'
        ]
    },
    {
        priority: 4,
        task: '프로젝트 API URL 패턴 확인',
        files: [
            'vridge_back/projects/urls.py',
            'vridge_back/config/urls.py'
        ]
    }
];

fixOrder.forEach(fix => {
    console.log(`${colors.yellow}${fix.priority}. ${fix.task}${colors.reset}`);
    if (fix.commands) {
        console.log('   명령어:');
        fix.commands.forEach(cmd => {
            console.log(`     $ ${cmd}`);
        });
    }
    if (fix.files) {
        console.log('   확인 파일:');
        fix.files.forEach(file => {
            console.log(`     • ${file}`);
        });
    }
    console.log('');
});

// 디버깅 실행
async function runDebugChecks() {
    console.log(`${colors.magenta}========================================${colors.reset}`);
    console.log(`${colors.magenta}자동 디버깅 체크 실행${colors.reset}`);
    console.log(`${colors.magenta}========================================${colors.reset}\n`);
    
    await checkBackendStatus();
    await checkFrontendStatus();
    await checkAPIEndpoints();
    
    console.log(`${colors.green}디버깅 체크 완료${colors.reset}\n`);
}

// 실행
runDebugChecks().catch(console.error);