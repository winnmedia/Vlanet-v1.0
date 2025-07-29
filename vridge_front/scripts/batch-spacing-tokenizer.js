#!/usr/bin/env node

/**
 * Batch Spacing Tokenizer
 * 
 * 4,050개의 하드코딩된 간격 값을 효율적으로 토큰화하는 자동화 도구
 * 8px 그리드 시스템 준수 및 컴포넌트별 최적화
 */

const fs = require('fs');
const path = require('path');

// 간격 매핑 테이블 (사용 빈도 기반)
const SPACING_MAPPINGS = {
  // 표준 간격 (8px 그리드)
  '0': '$spacing-0',
  '0px': '$spacing-0',
  '2px': '$spacing-2xs',
  '4px': '$spacing-xs',
  '8px': '$spacing-sm',
  '12px': 'calc($spacing-sm + $spacing-xs)',
  '16px': '$spacing-md',
  '20px': 'calc($spacing-md + $spacing-xs)',
  '24px': '$spacing-lg',
  '32px': '$spacing-xl',
  '40px': '$spacing-2xl',
  '48px': '$spacing-3xl',
  '56px': 'calc($spacing-3xl + $spacing-sm)',
  '64px': '$spacing-4xl',
  '80px': '$spacing-5xl',
  '96px': '$spacing-6xl',
  '112px': '$spacing-7xl',
  '128px': '$spacing-8xl',
  
  // 테두리 너비
  '1px': '$border-width-thin',
  '2px': '$border-width-medium',
  '4px': '$border-width-thick',
  
  // 특수 값 처리
  '100%': '100%',
  'auto': 'auto',
  'inherit': 'inherit'
};

// 비표준 간격 처리 규칙
const NON_STANDARD_RULES = [
  { value: 3, calc: '$spacing-2xs + 1px' },
  { value: 5, calc: '$spacing-xs + 1px' },
  { value: 6, calc: '$spacing-xs + 2px' },
  { value: 7, calc: '$spacing-sm - 1px' },
  { value: 9, calc: '$spacing-sm + 1px' },
  { value: 10, calc: '$spacing-sm + 2px' },
  { value: 11, calc: '$spacing-sm + 3px' },
  { value: 14, calc: '$spacing-md - 2px' },
  { value: 15, calc: '$spacing-md - 1px' },
  { value: 18, calc: '$spacing-md + 2px' },
  { value: 28, calc: '$spacing-lg + $spacing-xs' },
  { value: 30, calc: '$spacing-lg + 6px' },
  { value: 36, calc: '$spacing-xl + $spacing-xs' }
];

// 컨텍스트별 특수 매핑
const CONTEXT_MAPPINGS = {
  'padding': {
    patterns: ['padding:', 'padding-'],
    specialMappings: {
      '16px 24px': '$spacing-button-y $spacing-button-x',
      '8px 16px': '$spacing-sm $spacing-md',
      '12px 24px': 'calc($spacing-sm + $spacing-xs) $spacing-lg'
    }
  },
  'margin': {
    patterns: ['margin:', 'margin-'],
    specialMappings: {
      '0 auto': '0 auto',
      '24px 0': '$spacing-lg 0',
      '0 16px': '0 $spacing-md'
    }
  },
  'gap': {
    patterns: ['gap:', 'grid-gap:', 'column-gap:', 'row-gap:'],
    specialMappings: {}
  },
  'border-radius': {
    patterns: ['border-radius:', 'border-top-left-radius:', 'border-top-right-radius:', 'border-bottom-left-radius:', 'border-bottom-right-radius:'],
    specialMappings: {
      '4px': '$border-radius-sm',
      '8px': '$border-radius-md',
      '12px': '$border-radius-lg',
      '16px': '$border-radius-xl',
      '24px': '$border-radius-2xl',
      '50%': '50%',
      '9999px': '$border-radius-full'
    }
  }
};

class BatchSpacingTokenizer {
  constructor() {
    this.stats = {
      totalFiles: 0,
      totalReplacements: 0,
      spacingFrequency: {},
      nonStandardValues: new Map(),
      contextualReplacements: {}
    };
  }

  async run(options = {}) {
    const { dryRun = true, targetDir = 'src' } = options;
    
    console.log('📏 Batch Spacing Tokenizer 시작...\n');
    console.log(`모드: ${dryRun ? 'DRY RUN (미리보기)' : 'EXECUTE (실행)'}`);
    console.log(`대상 디렉토리: ${targetDir}\n`);

    const files = await this.findStyleFiles(targetDir);
    console.log(`📁 ${files.length}개 스타일 파일 발견\n`);

    for (const file of files) {
      await this.processFile(file, dryRun);
    }

    this.printReport();
  }

  findStyleFiles(targetDir) {
    const files = [];
    
    function walkDir(dir) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!item.includes('node_modules') && !item.includes('dist')) {
            walkDir(fullPath);
          }
        } else if (stat.isFile()) {
          if ((item.endsWith('.scss') || item.endsWith('.css')) && 
              !item.includes('.min.') && 
              !item.includes('design-tokens')) {
            files.push(fullPath);
          }
        }
      }
    }
    
    walkDir(targetDir);
    return files;
  }

  async processFile(filePath, dryRun) {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = content;
    let fileReplacements = 0;

    // 간격 패턴 찾기
    const spacingPattern = /(-?\d+(?:\.\d+)?)(px|em|rem|%|vh|vw)\b/g;
    const replacements = [];

    // 컨텍스트별 처리
    for (const [contextType, context] of Object.entries(CONTEXT_MAPPINGS)) {
      for (const pattern of context.patterns) {
        const contextRegex = new RegExp(`${pattern}\\s*([^;]+)`, 'g');
        const contextMatches = content.matchAll(contextRegex);

        for (const contextMatch of contextMatches) {
          const value = contextMatch[1].trim();
          
          // 특수 매핑 확인
          if (context.specialMappings[value]) {
            replacements.push({
              original: contextMatch[0],
              replacement: contextMatch[0].replace(value, context.specialMappings[value]),
              index: contextMatch.index,
              context: contextType
            });
            continue;
          }

          // 일반 간격 값 처리
          const valueMatches = value.matchAll(spacingPattern);
          for (const match of valueMatches) {
            const fullValue = match[0];
            const numValue = match[1];
            const unit = match[2];
            
            if (unit === 'px') {
              const token = this.findBestToken(fullValue, numValue);
              
              if (token && !this.isAlreadyToken(content, contextMatch.index + match.index)) {
                const startIndex = contextMatch.index + match.index;
                replacements.push({
                  original: fullValue,
                  replacement: token,
                  index: startIndex,
                  context: contextType
                });
                
                // 통계 수집
                this.stats.spacingFrequency[fullValue] = (this.stats.spacingFrequency[fullValue] || 0) + 1;
                
                if (!this.stats.contextualReplacements[contextType]) {
                  this.stats.contextualReplacements[contextType] = 0;
                }
                this.stats.contextualReplacements[contextType]++;
              }
            }
          }
        }
      }
    }

    // 일반 간격 값 처리 (컨텍스트 외부)
    const generalMatches = content.matchAll(spacingPattern);
    for (const match of generalMatches) {
      const fullValue = match[0];
      const numValue = match[1];
      const unit = match[2];
      
      if (unit === 'px' && !this.isInContext(content, match.index)) {
        const token = this.findBestToken(fullValue, numValue);
        
        if (token && !this.isAlreadyToken(content, match.index)) {
          replacements.push({
            original: fullValue,
            replacement: token,
            index: match.index,
            context: 'general'
          });
          
          this.stats.spacingFrequency[fullValue] = (this.stats.spacingFrequency[fullValue] || 0) + 1;
        } else if (!token && parseInt(numValue) > 0) {
          this.stats.nonStandardValues.set(fullValue, (this.stats.nonStandardValues.get(fullValue) || 0) + 1);
        }
      }
    }

    // 중복 제거 및 정렬
    const uniqueReplacements = this.deduplicateReplacements(replacements);
    uniqueReplacements.sort((a, b) => b.index - a.index);

    // 교체 수행
    for (const replacement of uniqueReplacements) {
      modified = modified.substring(0, replacement.index) + 
                 replacement.replacement + 
                 modified.substring(replacement.index + replacement.original.length);
      
      fileReplacements++;
    }

    if (fileReplacements > 0) {
      console.log(`\n📝 ${path.relative(process.cwd(), filePath)}`);
      console.log(`   ${fileReplacements}개 간격 토큰화 가능`);
      
      if (!dryRun) {
        fs.writeFileSync(filePath, modified, 'utf8');
        console.log('   ✅ 파일 업데이트 완료');
      }
      
      this.stats.totalFiles++;
      this.stats.totalReplacements += fileReplacements;
    }
  }

  findBestToken(fullValue, numValue) {
    // 직접 매핑 확인
    if (SPACING_MAPPINGS[fullValue]) {
      return SPACING_MAPPINGS[fullValue];
    }

    // 비표준 값 처리
    const num = parseInt(numValue);
    const rule = NON_STANDARD_RULES.find(r => r.value === num);
    if (rule) {
      return `calc(${rule.calc})`;
    }

    // 8px 그리드에 맞는 값인지 확인
    if (num > 0 && num % 8 === 0 && num <= 128) {
      const gridValue = num / 8;
      const tokenMap = {
        1: '$spacing-sm',
        2: '$spacing-md',
        3: '$spacing-lg',
        4: '$spacing-xl',
        5: '$spacing-2xl',
        6: '$spacing-3xl',
        8: '$spacing-4xl',
        10: '$spacing-5xl',
        12: '$spacing-6xl',
        14: '$spacing-7xl',
        16: '$spacing-8xl'
      };
      
      if (tokenMap[gridValue]) {
        return tokenMap[gridValue];
      }
    }

    return null;
  }

  isAlreadyToken(content, index) {
    const before = content.substring(Math.max(0, index - 20), index);
    return before.includes('$spacing-') || 
           before.includes('$border-') || 
           before.includes('calc(') ||
           before.includes('var(--');
  }

  isInContext(content, index) {
    const before = content.substring(Math.max(0, index - 50), index);
    for (const context of Object.values(CONTEXT_MAPPINGS)) {
      for (const pattern of context.patterns) {
        if (before.includes(pattern)) {
          return true;
        }
      }
    }
    return false;
  }

  deduplicateReplacements(replacements) {
    const seen = new Set();
    return replacements.filter(r => {
      const key = `${r.index}-${r.original}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  printReport() {
    console.log('\n📊 간격 토큰화 분석 보고서');
    console.log('='.repeat(50));
    console.log(`총 파일 수: ${this.stats.totalFiles}개`);
    console.log(`총 교체 가능: ${this.stats.totalReplacements}개`);
    
    console.log('\n📏 간격 사용 빈도 TOP 15:');
    const sortedSpacing = Object.entries(this.stats.spacingFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    
    sortedSpacing.forEach(([value, count], index) => {
      const token = this.findBestToken(value, value.replace('px', '')) || '(매핑 필요)';
      console.log(`  ${index + 1}. ${value}: ${count}회 → ${token}`);
    });

    console.log('\n🎯 컨텍스트별 교체 통계:');
    Object.entries(this.stats.contextualReplacements).forEach(([context, count]) => {
      console.log(`  - ${context}: ${count}개`);
    });

    if (this.stats.nonStandardValues.size > 0) {
      console.log('\n⚠️  비표준 값 (8px 그리드 미준수):');
      const nonStandard = Array.from(this.stats.nonStandardValues.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      nonStandard.forEach(([value, count]) => {
        const num = parseInt(value);
        const suggestion = this.suggestNearestGrid(num);
        console.log(`  - ${value}: ${count}회 → 제안: ${suggestion}`);
      });
    }

    console.log('\n💡 예상 효과:');
    console.log(`  - 간격 하드코딩 ${Math.round(this.stats.totalReplacements / 4050 * 100)}% 감소`);
    console.log(`  - 8px 그리드 준수율 향상`);
    console.log(`  - 반응형 디자인 일관성 개선`);
  }

  suggestNearestGrid(value) {
    const gridValues = [0, 4, 8, 16, 24, 32, 40, 48, 64, 80, 96, 112, 128];
    const nearest = gridValues.reduce((prev, curr) => 
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
    
    const token = this.findBestToken(`${nearest}px`, nearest.toString());
    return `${nearest}px (${token})`;
  }
}

// CLI 실행
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: !args.includes('--execute'),
    targetDir: args.find(arg => !arg.startsWith('--')) || 'src'
  };

  const tokenizer = new BatchSpacingTokenizer();
  tokenizer.run(options).catch(console.error);
}

module.exports = BatchSpacingTokenizer;