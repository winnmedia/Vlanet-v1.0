#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// ANSI 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}🧪 테스트 생성기${colors.reset}\n`);

// 테스트가 필요한 주요 컴포넌트/유틸리티
const priorityFiles = [
  'src/utils/dateUtils.js',
  'src/utils/imageProxy.js',
  'src/utils/validation.js',
  'src/utils/mobile-utils.js',
  'src/components/CustomAlert.jsx',
  'src/components/LoadingAnimation.jsx',
  'src/components/ToggleButton.jsx',
  'src/components/PageTemplate.jsx'
];

let testsCreated = 0;

// 유틸리티 함수용 테스트 템플릿
const utilTestTemplate = (fileName, functions) => `import { ${functions.join(', ')} } from '../${fileName}';

describe('${fileName}', () => {
${functions.map(fn => `  describe('${fn}', () => {
    it('should work correctly with valid input', () => {
      // TODO: Add specific test case
      expect(${fn}).toBeDefined();
    });

    it('should handle edge cases', () => {
      // TODO: Add edge case tests
    });
  });`).join('\n\n')}
});
`;

// 컴포넌트용 테스트 템플릿
const componentTestTemplate = (componentName) => `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ${componentName} from '../${componentName}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} />);
    expect(screen.getByTestId('${componentName.toLowerCase()}')).toBeInTheDocument();
  });

  it('handles props correctly', () => {
    const props = {
      // TODO: Add test props
    };
    render(<${componentName} {...props} />);
    // TODO: Add assertions
  });

  it('handles user interactions', () => {
    render(<${componentName} />);
    // TODO: Add interaction tests
  });
});
`;

// 각 파일에 대해 테스트 생성
priorityFiles.forEach(file => {
  const testDir = path.dirname(file).replace('src', 'src') + '/__tests__';
  const testFileName = path.basename(file).replace(/\.(js|jsx)$/, '.test.js');
  const testPath = path.join(testDir, testFileName);
  
  // 이미 테스트가 있는지 확인
  if (fs.existsSync(testPath)) {
    console.log(`${colors.yellow}⚠️${colors.reset} ${testPath}: 이미 존재함`);
    return;
  }
  
  // 테스트 디렉토리 생성
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // 파일 타입에 따라 템플릿 선택
  let testContent;
  if (file.endsWith('.jsx')) {
    const componentName = path.basename(file, '.jsx');
    testContent = componentTestTemplate(componentName);
  } else {
    // 간단한 함수 이름 추출 (실제로는 AST를 사용해야 하지만 간단히 처리)
    const fileContent = fs.readFileSync(file, 'utf8');
    const exportMatches = fileContent.match(/export\s+(?:const|function)\s+(\w+)/g) || [];
    const functionNames = exportMatches.map(match => {
      const parts = match.split(/\s+/);
      return parts[parts.length - 1];
    });
    
    if (functionNames.length > 0) {
      testContent = utilTestTemplate(path.basename(file, '.js'), functionNames);
    } else {
      testContent = `import * as utils from '../${path.basename(file)}';

describe('${path.basename(file)}', () => {
  it('should export functions', () => {
    expect(utils).toBeDefined();
  });
});
`;
    }
  }
  
  // 테스트 파일 생성
  fs.writeFileSync(testPath, testContent);
  testsCreated++;
  console.log(`${colors.green}✓${colors.reset} ${testPath} 생성됨`);
});

// 추가 통합 테스트 생성
const integrationTestPath = 'src/__tests__/integration/navigation.test.js';
if (!fs.existsSync(integrationTestPath)) {
  const integrationTest = `import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RouterContext } from 'next/dist/shared/lib/router-context';
import mockRouter from '../../test-utils/mockRouter';

describe('Navigation Integration', () => {
  it('navigates between pages correctly', async () => {
    // TODO: Add navigation tests
  });

  it('handles authentication flow', async () => {
    // TODO: Add auth flow tests
  });

  it('manages state across navigation', async () => {
    // TODO: Add state persistence tests
  });
});
`;
  
  const integrationDir = path.dirname(integrationTestPath);
  if (!fs.existsSync(integrationDir)) {
    fs.mkdirSync(integrationDir, { recursive: true });
  }
  fs.writeFileSync(integrationTestPath, integrationTest);
  testsCreated++;
  console.log(`${colors.green}✓${colors.reset} ${integrationTestPath} 생성됨`);
}

// E2E 테스트 생성
const e2eTestPath = 'src/__tests__/e2e/userJourney.test.js';
if (!fs.existsSync(e2eTestPath)) {
  const e2eTest = `describe('User Journey E2E', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('completes full user registration and login flow', () => {
    cy.get('[data-testid="signup-button"]').click();
    // TODO: Complete registration flow
  });

  it('creates and manages a project', () => {
    // TODO: Add project management flow
  });

  it('provides feedback on a video', () => {
    // TODO: Add feedback flow
  });
});
`;
  
  const e2eDir = path.dirname(e2eTestPath);
  if (!fs.existsSync(e2eDir)) {
    fs.mkdirSync(e2eDir, { recursive: true });
  }
  fs.writeFileSync(e2eTestPath, e2eTest);
  testsCreated++;
  console.log(`${colors.green}✓${colors.reset} ${e2eTestPath} 생성됨`);
}

// 결과 출력
console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.green}✓ 완료!${colors.reset}`);
console.log(`  - ${testsCreated}개의 새로운 테스트 파일 생성됨`);

// 테스트 실행 명령어 제공
console.log(`\n${colors.yellow}📝 다음 단계:${colors.reset}`);
console.log('  1. 생성된 테스트 파일의 TODO 부분을 구현하세요');
console.log('  2. npm test로 테스트를 실행하세요');
console.log('  3. npm run test:coverage로 커버리지를 확인하세요');

// jest 설정 확인
if (!fs.existsSync('jest.config.js')) {
  console.log(`\n${colors.red}⚠️ jest.config.js가 없습니다. 다음 내용으로 생성하세요:${colors.reset}`);
  console.log(`
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/test-utils/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
  `);
}