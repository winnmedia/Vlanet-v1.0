module.exports = {
  // 테스트 환경
  testEnvironment: 'jsdom',
  
  // 테스트 파일 패턴
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}'
  ],
  
  // 모듈 이름 매핑 (경로 별칭)
  moduleNameMapper: {
    // 스타일 파일 모킹
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/__mocks__/fileMock.js',
    
    // 경로 별칭
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@redux/(.*)$': '<rootDir>/src/redux/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@page/(.*)$': '<rootDir>/src/page/$1'
  },
  
  // 변환 설정
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  
  // 셋업 파일
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // 무시할 파일/폴더
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/build/',
    '<rootDir>/coverage/',
    '\\.bak',
    '__tests__\\.bak'
  ],
  
  // 커버리지 설정
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/types/**',
    '!src/**/index.{js,ts}',
    '!src/**/*.bak/**',
    '!src/**/__tests__.bak/**'
  ],
  
  // 커버리지 임계값 (초기에는 낮게 설정)
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },
  
  // 커버리지 리포터
  coverageReporters: ['text', 'lcov', 'html'],
  
  // 모듈 파일 확장자
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  
  // 타임아웃 설정
  testTimeout: 10000,
  
  // 워치 플러그인 (설치되지 않아 주석 처리)
  // watchPlugins: [
  //   'jest-watch-typeahead/filename',
  //   'jest-watch-typeahead/testname'
  // ]
};