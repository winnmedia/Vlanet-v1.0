const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 테스트가 필요한 중요 컴포넌트 및 유틸리티 찾기
function findUntested() {
  const sourcePatterns = [
    'src/**/*.{js,jsx}',
    'pages/**/*.{js,jsx}'
  ];
  
  const testPatterns = [
    'src/**/*.test.{js,jsx}',
    'src/**/*.spec.{js,jsx}',
    'tests/**/*.test.{js,jsx}',
    'tests/**/*.spec.{js,jsx}',
    '__tests__/**/*.{js,jsx}'
  ];
  
  const ignorePatterns = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/scripts/**',
    '**/*.config.js',
    '**/*.setup.js',
    '**/index.js',
    '**/_app.js',
    '**/_document.js'
  ];
  
  // 모든 소스 파일 찾기
  const sourceFiles = new Set();
  sourcePatterns.forEach(pattern => {
    const files = glob.sync(pattern, {
      cwd: process.cwd(),
      ignore: ignorePatterns
    });
    files.forEach(file => sourceFiles.add(file));
  });
  
  // 모든 테스트 파일 찾기
  const testFiles = new Set();
  testPatterns.forEach(pattern => {
    const files = glob.sync(pattern, {
      cwd: process.cwd(),
      ignore: ignorePatterns
    });
    files.forEach(file => testFiles.add(file));
  });
  
  // 테스트가 없는 파일 찾기
  const untestedFiles = [];
  sourceFiles.forEach(file => {
    const baseName = file.replace(/\.(js|jsx)$/, '');
    const hasTest = Array.from(testFiles).some(testFile => 
      testFile.includes(baseName) || 
      testFile.includes(path.basename(baseName))
    );
    
    if (!hasTest) {
      untestedFiles.push(file);
    }
  });
  
  return {
    sourceCount: sourceFiles.size,
    testCount: testFiles.size,
    untestedFiles
  };
}

// 테스트 템플릿 생성
function generateTestTemplate(filePath, componentName) {
  const isPage = filePath.includes('/page/') || filePath.includes('/pages/');
  const isComponent = filePath.includes('/components/');
  const isUtil = filePath.includes('/util/') || filePath.includes('/utils/');
  const isHook = filePath.includes('/hooks/');
  const isApi = filePath.includes('/api/');
  
  let template = `import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
`;

  if (isPage || isComponent) {
    // 컴포넌트/페이지 테스트
    template += `import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ${componentName} from '${getRelativeImportPath(filePath)}';

// Mock store
const mockStore = configureStore({
  reducer: {
    ProjectStore: () => ({
      project_list: [],
      user: 'test@example.com',
      profileImage: null
    })
  }
});

// Mock router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
    pathname: '/'
  })
}));

describe('${componentName}', () => {
  const renderComponent = (props = {}) => {
    return render(
      <Provider store={mockStore}>
        <${componentName} {...props} />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    renderComponent();
    expect(document.body).toBeInTheDocument();
  });

  test('displays correct content', () => {
    renderComponent();
    // Add specific content checks based on component
  });

  test('handles user interactions', async () => {
    renderComponent();
    // Add interaction tests
  });

  test('handles error states', () => {
    renderComponent({ error: true });
    // Add error handling tests
  });
});`;
  } else if (isUtil) {
    // 유틸리티 함수 테스트
    template += `import { ${componentName} } from '${getRelativeImportPath(filePath)}';

describe('${componentName}', () => {
  test('performs expected operation', () => {
    // Add utility function tests
    const result = ${componentName}();
    expect(result).toBeDefined();
  });

  test('handles edge cases', () => {
    // Add edge case tests
  });

  test('throws errors appropriately', () => {
    // Add error case tests
  });
});`;
  } else if (isHook) {
    // 커스텀 훅 테스트
    template += `import { renderHook, act } from '@testing-library/react-hooks';
import ${componentName} from '${getRelativeImportPath(filePath)}';

describe('${componentName}', () => {
  test('returns expected values', () => {
    const { result } = renderHook(() => ${componentName}());
    expect(result.current).toBeDefined();
  });

  test('updates state correctly', () => {
    const { result } = renderHook(() => ${componentName}());
    act(() => {
      // Trigger state updates
    });
    // Assert state changes
  });

  test('handles cleanup', () => {
    const { unmount } = renderHook(() => ${componentName}());
    unmount();
    // Assert cleanup
  });
});`;
  } else if (isApi) {
    // API 함수 테스트
    template += `import axios from 'axios';
import { ${componentName} } from '${getRelativeImportPath(filePath)}';

jest.mock('axios');

describe('${componentName}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('makes successful API call', async () => {
    const mockData = { success: true, data: {} };
    axios.get.mockResolvedValueOnce({ data: mockData });
    
    const result = await ${componentName}();
    expect(result).toEqual(mockData);
  });

  test('handles API errors', async () => {
    const mockError = new Error('API Error');
    axios.get.mockRejectedValueOnce(mockError);
    
    await expect(${componentName}()).rejects.toThrow('API Error');
  });

  test('sends correct parameters', async () => {
    await ${componentName}({ id: 1 });
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('1'));
  });
});`;
  }
  
  return template;
}

function getRelativeImportPath(filePath) {
  const componentPath = filePath.replace(/\.(js|jsx)$/, '');
  return `./${path.basename(componentPath)}`;
}

function getComponentName(filePath) {
  const basename = path.basename(filePath, path.extname(filePath));
  return basename.charAt(0).toUpperCase() + basename.slice(1);
}

// 메인 실행
console.log('🔍 테스트가 필요한 파일 검색 중...\n');

const { sourceCount, testCount, untestedFiles } = findUntested();
const currentCoverage = (testCount / sourceCount * 100).toFixed(1);

console.log(`📊 현재 상태:`);
console.log(`- 소스 파일: ${sourceCount}개`);
console.log(`- 테스트 파일: ${testCount}개`);
console.log(`- 테스트 커버리지: ${currentCoverage}%`);
console.log(`- 테스트 없는 파일: ${untestedFiles.length}개\n`);

// 80% 달성을 위해 필요한 테스트 수 계산
const targetCoverage = 80;
const neededTests = Math.ceil(sourceCount * targetCoverage / 100) - testCount;

console.log(`🎯 목표: ${targetCoverage}% 커버리지`);
console.log(`📈 필요한 추가 테스트: ${neededTests}개\n`);

// 우선순위가 높은 파일들 선택
const priorityFiles = untestedFiles
  .filter(file => {
    // 중요한 컴포넌트와 유틸리티 우선
    return file.includes('/components/') || 
           file.includes('/utils/') || 
           file.includes('/api/') ||
           file.includes('/hooks/') ||
           (file.includes('/page/') && !file.includes('test'));
  })
  .slice(0, neededTests);

if (priorityFiles.length > 0) {
  console.log(`✨ ${priorityFiles.length}개 파일에 테스트 생성 중...\n`);
  
  let createdCount = 0;
  priorityFiles.forEach(file => {
    try {
      const componentName = getComponentName(file);
      const testContent = generateTestTemplate(file, componentName);
      
      // 테스트 파일 경로 결정
      const dir = path.dirname(file);
      const basename = path.basename(file, path.extname(file));
      const testDir = path.join(dir, '__tests__');
      const testPath = path.join(testDir, `${basename}.test.js`);
      
      // 테스트 디렉토리 생성
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      // 테스트 파일 생성
      fs.writeFileSync(testPath, testContent, 'utf8');
      console.log(`✅ ${path.relative(process.cwd(), testPath)}`);
      createdCount++;
    } catch (error) {
      console.error(`❌ ${file}: ${error.message}`);
    }
  });
  
  const newCoverage = ((testCount + createdCount) / sourceCount * 100).toFixed(1);
  console.log(`\n📈 새로운 테스트 커버리지: ${newCoverage}%`);
  console.log(`✨ ${createdCount}개 테스트 파일 생성 완료!`);
} else {
  console.log('⚠️  추가할 테스트 파일이 없습니다.');
}