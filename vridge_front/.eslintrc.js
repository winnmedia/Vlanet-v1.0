module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'prettier',
  ],
  plugins: [
    'react',
    'react-hooks',
    'import',
    'prettier',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // 오류 방지를 위한 엄격한 규칙들
    'import/no-unresolved': 'error',
    'import/no-duplicates': 'error',
    'import/no-unused-modules': 'warn',
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
      },
    ],
    
    // React 관련 규칙
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'warn',
    'react/jsx-key': 'error',
    'react/no-unescaped-entities': 'warn',
    'react/no-unused-state': 'warn',
    'react/jsx-no-duplicate-props': 'error',
    
    // Hooks 규칙
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // 일반적인 JavaScript 규칙
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-unreachable': 'error',
    'no-undef': 'error',
    
    // Prettier와 통합
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src/'],
      },
    },
  },
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'build/',
    '*.d.ts',
  ],
};