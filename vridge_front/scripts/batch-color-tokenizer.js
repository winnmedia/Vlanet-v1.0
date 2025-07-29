#!/usr/bin/env node

/**
 * Batch Color Tokenizer
 * 
 * 433개의 하드코딩된 색상을 효율적으로 토큰화하는 자동화 도구
 * 데이터 기반 접근으로 가장 많이 사용되는 색상부터 우선 처리
 */

const fs = require('fs');
const path = require('path');

// 색상 매핑 테이블 (사용 빈도 기반 우선순위)
const COLOR_MAPPINGS = {
  // 흑백 (164회, 37.9%)
  '#fff': '$color-white',
  '#ffffff': '$color-white',
  'white': '$color-white',
  'rgb(255, 255, 255)': '$color-white',
  'rgba(255, 255, 255, 1)': '$color-white',
  
  '#000': '$color-black',
  '#000000': '$color-black',
  'black': '$color-black',
  'rgb(0, 0, 0)': '$color-black',
  'rgba(0, 0, 0, 1)': '$color-black',
  
  // 회색 계열 (192회, 44.3%)
  '#f0f0f0': '$color-gray-100',
  '#eee': '$color-gray-200',
  '#e9e9e9': '$color-gray-300',
  '#ddd': '$color-gray-300',
  '#d9d9d9': '$color-border',
  '#ccc': '$color-gray-400',
  '#bbb': '$color-gray-500',
  '#999': '$color-gray-500',
  '#888': '$color-gray-600',
  '#777': '$color-gray-600',
  '#666': '$color-gray-600',
  '#555': '$color-gray-700',
  '#444': '$color-gray-800',
  '#333': '$color-gray-800',
  '#222': '$color-gray-900',
  '#111': '$color-gray-900',
  
  // 브랜드 색상 (7회)
  '#1631f8': '$color-primary',
  '#0f23c9': '$color-primary-dark',
  '#216ba5': '$color-vp-blue-1',
  '#1890ff': '$color-info',
  
  // 시맨틱 색상
  '#dc3545': '$color-danger',
  '#28a745': '$color-success',
  '#ffc107': '$color-warning',
  '#17a2b8': '$color-info',
  
  // 특수 회색
  '#2b333f': '$color-vp-gray-dark',
  '#2b2f38': '$color-vp-gray-dark',
  '#aeaeae': '$color-gray-500',
  '#f5f5f5': '$color-gray-50',
  '#fafafa': '$color-gray-50',
  '#f8f8f8': '$color-gray-50'
};

// RGBA 색상을 가장 가까운 토큰으로 매핑
const RGBA_MAPPINGS = [
  { pattern: /rgba\(0,\s*0,\s*0,\s*0\.85\)/, token: '$color-text' },
  { pattern: /rgba\(0,\s*0,\s*0,\s*0\.65\)/, token: '$color-text-secondary' },
  { pattern: /rgba\(0,\s*0,\s*0,\s*0\.45\)/, token: '$color-text-tertiary' },
  { pattern: /rgba\(0,\s*0,\s*0,\s*0\.25\)/, token: '$color-gray-400' },
  { pattern: /rgba\(255,\s*255,\s*255,\s*0\.\d+\)/, token: 'rgba($color-white, $1)' },
  { pattern: /rgba\(0,\s*0,\s*0,\s*0\.\d+\)/, token: 'rgba($color-black, $1)' }
];

class BatchColorTokenizer {
  constructor() {
    this.stats = {
      totalFiles: 0,
      totalReplacements: 0,
      colorFrequency: {},
      unmappedColors: new Set()
    };
  }

  async run(options = {}) {
    const { dryRun = true, targetDir = 'src' } = options;
    
    console.log('🎨 Batch Color Tokenizer 시작...\n');
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
          if ((item.endsWith('.scss') || item.endsWith('.css')) && !item.includes('.min.')) {
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

    // 색상 패턴 찾기
    const colorPatterns = [
      // Hex 색상
      /#([0-9a-fA-F]{3}){1,2}\b/g,
      // RGB/RGBA
      /rgba?\([^)]+\)/g,
      // 색상 키워드
      /\b(white|black|red|blue|green|yellow|gray|grey)\b/g
    ];

    const replacements = [];

    for (const pattern of colorPatterns) {
      const matches = content.matchAll(pattern);
      
      for (const match of matches) {
        const color = match[0].toLowerCase();
        const token = this.findBestToken(color);
        
        if (token && !this.isAlreadyToken(content, match.index)) {
          replacements.push({
            original: match[0],
            token: token,
            index: match.index
          });
          
          // 통계 수집
          this.stats.colorFrequency[color] = (this.stats.colorFrequency[color] || 0) + 1;
        } else if (!token) {
          this.stats.unmappedColors.add(color);
        }
      }
    }

    // 중복 제거 및 정렬 (뒤에서부터 교체)
    const uniqueReplacements = this.deduplicateReplacements(replacements);
    uniqueReplacements.sort((a, b) => b.index - a.index);

    // 교체 수행
    for (const replacement of uniqueReplacements) {
      const before = modified.substring(replacement.index - 20, replacement.index + replacement.original.length + 20);
      modified = modified.substring(0, replacement.index) + 
                 replacement.token + 
                 modified.substring(replacement.index + replacement.original.length);
      
      fileReplacements++;
      
      if (!dryRun) {
        console.log(`  ✓ ${replacement.original} → ${replacement.token}`);
      }
    }

    if (fileReplacements > 0) {
      console.log(`\n📝 ${path.relative(process.cwd(), filePath)}`);
      console.log(`   ${fileReplacements}개 색상 토큰화 가능\n`);
      
      if (!dryRun) {
        fs.writeFileSync(filePath, modified, 'utf8');
      }
      
      this.stats.totalFiles++;
      this.stats.totalReplacements += fileReplacements;
    }
  }

  findBestToken(color) {
    // 직접 매핑 확인
    if (COLOR_MAPPINGS[color]) {
      return COLOR_MAPPINGS[color];
    }

    // RGBA 패턴 확인
    for (const { pattern, token } of RGBA_MAPPINGS) {
      if (pattern.test(color)) {
        return color.replace(pattern, token);
      }
    }

    // 유사 색상 찾기 (차후 구현)
    return null;
  }

  isAlreadyToken(content, index) {
    // 이미 변수를 사용하고 있는지 확인
    const before = content.substring(Math.max(0, index - 10), index);
    return before.includes('$color-') || before.includes('var(--');
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
    console.log('\n📊 토큰화 분석 보고서');
    console.log('='.repeat(50));
    console.log(`총 파일 수: ${this.stats.totalFiles}개`);
    console.log(`총 교체 가능: ${this.stats.totalReplacements}개`);
    
    console.log('\n🎨 색상 사용 빈도 TOP 10:');
    const sortedColors = Object.entries(this.stats.colorFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    sortedColors.forEach(([color, count], index) => {
      const token = this.findBestToken(color) || '(매핑 필요)';
      console.log(`  ${index + 1}. ${color}: ${count}회 → ${token}`);
    });

    if (this.stats.unmappedColors.size > 0) {
      console.log('\n⚠️  매핑되지 않은 색상:');
      const unmapped = Array.from(this.stats.unmappedColors).slice(0, 10);
      unmapped.forEach(color => {
        console.log(`  - ${color}`);
      });
      
      if (this.stats.unmappedColors.size > 10) {
        console.log(`  ... 외 ${this.stats.unmappedColors.size - 10}개`);
      }
    }

    console.log('\n💡 예상 효과:');
    console.log(`  - 색상 하드코딩 ${Math.round(this.stats.totalReplacements / 433 * 100)}% 감소`);
    console.log(`  - 토큰 사용률 약 ${Math.round(46 + (this.stats.totalReplacements / 433 * 39))}% 예상`);
  }
}

// CLI 실행
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: !args.includes('--execute'),
    targetDir: args.find(arg => !arg.startsWith('--')) || 'src'
  };

  const tokenizer = new BatchColorTokenizer();
  tokenizer.run(options).catch(console.error);
}

module.exports = BatchColorTokenizer;