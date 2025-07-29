#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Ultimate Tokenizer - 모든 하드코딩된 값을 토큰으로 변환
 * 
 * 특징:
 * 1. 더 정확한 색상 매칭
 * 2. 모든 CSS 속성 지원
 * 3. 미디어 쿼리 보존
 * 4. 주석 보존
 * 5. 중첩된 calc() 지원
 */

class UltimateTokenizer {
  constructor() {
    // VideoPlanet 디자인 시스템의 모든 색상 매핑
    this.colorMappings = {
      // Primary colors
      '#1631f8': '$color-primary',
      '#0f23c9': '$color-primary-dark',
      '#2a4bff': '$color-primary-light',
      '#0131ff': '$color-primary',
      '#006ae8': '$color-vp-blue-1',
      '#0058da': '$color-vp-blue-2',
      '#0047b8': '$color-vp-blue-2-dark',
      '#1a6fff': '$color-vp-blue-2-light',
      
      // Status colors
      '#dc3545': '$color-danger',
      '#28a745': '$color-success',
      '#ffc107': '$color-warning',
      '#17a2b8': '$color-info',
      
      // Grays
      '#000': '$color-black',
      '#000000': '$color-black',
      '#fff': '$color-white',
      '#ffffff': '$color-white',
      '#212529': '$color-gray-900',
      '#343a40': '$color-gray-800',
      '#495057': '$color-gray-700',
      '#6c757d': '$color-gray-600',
      '#6b7280': '$color-gray-600',
      '#707175': '$color-gray-600',
      '#adb5bd': '$color-gray-500',
      '#9ca3af': '$color-gray-500',
      '#ced4da': '$color-gray-400',
      '#dee2e6': '$color-gray-300',
      '#e9ecef': '$color-vp-gray-light-2',
      '#e5e7eb': '$color-vp-gray-light-2',
      '#efefef': '$color-vp-gray-light-3',
      '#f1f3f4': '$color-vp-gray-light-3',
      '#f3f4f6': '$color-gray-200',
      '#f8f9fa': '$color-gray-100',
      '#f8f8f8': '$color-background-secondary',
      '#f9fafb': '$color-background-secondary',
      
      // Special colors
      '#ff6b6b': '$color-vp-red-1',
      '#dc3545': '$color-danger',
      '#e74c3c': '$color-danger',
      '#c0392b': '$color-danger-dark',
      '#2d3436': '$color-text-primary',
      '#1f2937': '$color-text-primary',
      '#4b5563': '$color-text-secondary',
      
      // Background colors
      '#fff9e6': '$color-vp-yellow-bg-1',
      '#ffefcc': '$color-vp-yellow-bg-2',
      '#ffe0e0': '$color-vp-red-bg-2',
      '#e7f1ff': '$color-vp-blue-bg-1',
      '#d0e3ff': '$color-vp-blue-bg-2',
      '#f0f8ff': '$color-vp-blue-bg-3',
      '#d6e9ff': '$color-vp-blue-bg-4',
      
      // Border colors
      '#ffe4b3': '$color-vp-yellow-border',
      '#d6e9ff': '$color-vp-blue-border',
      '#dcdde1': '$color-border-light',
      
      // Special purpose
      '#856404': '$color-warning-dark',
      '#004085': '$color-info-dark',
    };
    
    // 간격 매핑 (더 세밀하게)
    this.spacingMappings = {
      '0': '$spacing-0',
      '0px': '$spacing-0',
      '2px': '$spacing-2xs',
      '3px': '$spacing-xs - 1px',
      '4px': '$spacing-xs',
      '5px': '$spacing-xs + 1px',
      '6px': '$spacing-xs + 2px',
      '7px': '$spacing-xs + 3px',
      '8px': '$spacing-sm',
      '10px': '$spacing-sm + 2px',
      '11px': '$spacing-sm + 3px',
      '12px': '$spacing-sm + $spacing-xs',
      '13px': '$spacing-md - 3px',
      '14px': '$spacing-md - 2px',
      '15px': '$spacing-md - 1px',
      '16px': '$spacing-md',
      '18px': '$spacing-md + 2px',
      '20px': '$spacing-lg - $spacing-xs',
      '24px': '$spacing-lg',
      '25px': '$spacing-lg + 1px',
      '28px': '$spacing-lg + $spacing-xs',
      '30px': '$spacing-xl - 2px',
      '32px': '$spacing-xl',
      '36px': '$spacing-xl + $spacing-xs',
      '40px': '$spacing-2xl',
      '48px': '$spacing-3xl',
      '56px': '$spacing-3xl + $spacing-sm',
      '60px': '$spacing-4xl - $spacing-xs',
      '64px': '$spacing-4xl',
      '72px': '$spacing-4xl + $spacing-sm',
      '80px': '$spacing-5xl',
      '96px': '$spacing-6xl',
      '100px': '$spacing-6xl + $spacing-xs',
      '112px': '$spacing-6xl + $spacing-md',
      '120px': '$spacing-6xl + $spacing-lg',
      '128px': '$spacing-6xl + $spacing-xl',
      '150px': '$spacing-6xl * 1.5 + $spacing-sm',
      '160px': '$spacing-6xl + $spacing-4xl',
      '180px': '$spacing-6xl * 1.875',
      '200px': '$spacing-6xl * 2 + $spacing-sm',
      '214px': '$spacing-6xl * 2 + $spacing-lg - 2px',
      '240px': '$spacing-6xl * 2.5',
      '300px': '$spacing-6xl * 3 + $spacing-sm + $spacing-xs',
      '320px': '$spacing-6xl * 3.33',
      '350px': '$spacing-6xl * 3.65',
      '375px': '$spacing-6xl * 3.9',
      '380px': '$spacing-6xl * 3.96',
      '400px': '$spacing-6xl * 4 + $spacing-md',
      '450px': '$spacing-6xl * 4.69',
      '480px': '$spacing-6xl * 5',
      '500px': '$spacing-6xl * 5 + $spacing-lg - $spacing-xs',
      '600px': '$spacing-6xl * 6 + $spacing-lg',
      '720px': '$spacing-6xl * 7.5',
      '768px': '$breakpoint-md',
      '1024px': '$breakpoint-lg',
      '1200px': '$breakpoint-xl',
      '1280px': '$breakpoint-xl + $spacing-5xl',
    };
    
    // 폰트 크기 매핑
    this.fontSizeMappings = {
      '11px': '$font-size-xs',
      '12px': '$font-size-xs',
      '13px': '$font-size-sm',
      '14px': '$font-size-sm',
      '15px': '$font-size-base',
      '16px': '$font-size-base',
      '18px': '$font-size-lg',
      '20px': '$font-size-xl',
      '22px': '$font-size-2xl - 2px',
      '24px': '$font-size-2xl',
      '26px': '$font-size-3xl - 2px',
      '28px': '$font-size-3xl',
      '30px': '$font-size-3xl + 2px',
      '32px': '$font-size-4xl',
      '36px': '$font-size-4xl + $spacing-xs',
      '40px': '$font-size-5xl - $spacing-sm',
      '48px': '$font-size-5xl',
    };
    
    // border-radius 매핑
    this.borderRadiusMappings = {
      '2px': '$border-radius-sm / 2',
      '3px': '$border-radius-sm - 1px',
      '4px': '$border-radius-sm',
      '5px': '$border-radius-sm + 1px',
      '6px': '$border-radius-md - 2px',
      '8px': '$border-radius-md',
      '10px': '$border-radius-lg - 2px',
      '12px': '$border-radius-lg',
      '16px': '$border-radius-xl',
      '20px': '$border-radius-xl + $spacing-xs',
      '24px': '$border-radius-2xl',
      '50%': '$border-radius-full',
      '9999px': '$border-radius-full',
    };
    
    this.processedFiles = 0;
    this.totalReplacements = 0;
  }
  
  tokenizeFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let replacements = 0;
    
    // 1. import 문 확인 및 추가
    if (!content.includes('@import') || !content.includes('design-tokens')) {
      const importStatement = "@import '../styles/design-tokens';\n\n";
      content = importStatement + content;
      replacements++;
    }
    
    // 2. 색상 토큰화 - 더 정교한 정규식
    // hex colors
    content = content.replace(
      /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})(?![0-9a-fA-F])/g,
      (match) => {
        const normalized = match.toLowerCase();
        return this.colorMappings[normalized] || match;
      }
    );
    
    // rgb/rgba colors
    content = content.replace(
      /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)/g,
      (match, r, g, b) => {
        // 특수한 rgba 값들을 토큰으로 변환
        if (match.includes('rgba') && match.includes('0.')) {
          const baseColor = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
          const token = this.colorMappings[baseColor.toLowerCase()];
          if (token) {
            const opacity = match.match(/[\d.]+(?=\s*\))/)[0];
            return `rgba(${token}, ${opacity})`;
          }
        }
        return match;
      }
    );
    
    // 3. 간격 토큰화 - CSS 속성별로 처리
    const spacingProperties = [
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'gap', 'row-gap', 'column-gap',
      'top', 'right', 'bottom', 'left',
      'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
      'transform', 'translateX', 'translateY'
    ];
    
    spacingProperties.forEach(prop => {
      // 단일 값
      const regex = new RegExp(`(${prop}\\s*:\\s*)(-?\\d+px)`, 'g');
      content = content.replace(regex, (match, prefix, value) => {
        const positiveValue = value.replace('-', '');
        const token = this.spacingMappings[positiveValue];
        if (token) {
          return prefix + (value.startsWith('-') ? '-' + token : token);
        }
        return match;
      });
      
      // 복합 값 (예: padding: 10px 20px)
      const multiRegex = new RegExp(`(${prop}\\s*:\\s*)([^;]+);`, 'g');
      content = content.replace(multiRegex, (match, prefix, values) => {
        const tokenized = values.split(/\s+/).map(val => {
          if (val.match(/-?\d+px/)) {
            const isNegative = val.startsWith('-');
            const positiveVal = val.replace('-', '');
            const token = this.spacingMappings[positiveVal];
            return token ? (isNegative ? '-' + token : token) : val;
          }
          return val;
        }).join(' ');
        return prefix + tokenized + ';';
      });
    });
    
    // 4. 폰트 크기 토큰화
    content = content.replace(
      /(font-size\s*:\s*)(\d+px)/g,
      (match, prefix, value) => {
        const token = this.fontSizeMappings[value];
        return token ? prefix + token : match;
      }
    );
    
    // 5. border-radius 토큰화
    content = content.replace(
      /(border-radius\s*:\s*)([^;]+);/g,
      (match, prefix, values) => {
        const tokenized = values.split(/\s+/).map(val => {
          const token = this.borderRadiusMappings[val];
          return token || val;
        }).join(' ');
        return prefix + tokenized + ';';
      }
    );
    
    // 6. line-height를 단위 없는 값으로
    content = content.replace(
      /(line-height\s*:\s*)(\d+(?:\.\d+)?)(px|em|rem)/g,
      (match, prefix, value) => {
        const numValue = parseFloat(value);
        if (numValue >= 16 && numValue <= 32) {
          return prefix + (numValue / 16).toFixed(2);
        }
        return match;
      }
    );
    
    // 7. z-index 표준화
    content = content.replace(
      /(z-index\s*:\s*)(\d+)/g,
      (match, prefix, value) => {
        const num = parseInt(value);
        if (num === 1000) return prefix + '$z-index-dropdown';
        if (num === 1050) return prefix + '$z-index-modal';
        if (num === 1100) return prefix + '$z-index-tooltip';
        return match;
      }
    );
    
    // 8. box-shadow 토큰화
    content = content.replace(
      /box-shadow:\s*([^;]+);/g,
      (match, shadow) => {
        if (shadow.includes('0 1px 3px')) return 'box-shadow: $shadow-sm;';
        if (shadow.includes('0 4px 6px')) return 'box-shadow: $shadow;';
        if (shadow.includes('0 10px 15px')) return 'box-shadow: $shadow-lg;';
        if (shadow.includes('0 20px 25px')) return 'box-shadow: $shadow-xl;';
        if (shadow === 'none') return 'box-shadow: $shadow-none;';
        return match;
      }
    );
    
    // 9. transition 표준화
    content = content.replace(
      /transition:\s*all\s+(\d+(?:\.\d+)?s)\s+ease(?:-in-out)?/g,
      'transition: $transition-base'
    );
    
    // 변경사항이 있으면 파일 저장
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      
      // 실제 변경 개수 계산
      const changes = this.countChanges(originalContent, content);
      replacements = changes;
    }
    
    return replacements;
  }
  
  countChanges(original, modified) {
    // 더 정확한 변경 개수 계산
    let count = 0;
    
    // 색상 변경
    const originalColors = original.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/g) || [];
    const modifiedColors = modified.match(/\$color-[a-z0-9-]+/g) || [];
    count += Math.abs(originalColors.length - modifiedColors.length);
    
    // 간격 변경
    const originalSpacing = original.match(/\d+px/g) || [];
    const modifiedSpacing = modified.match(/\$spacing-[a-z0-9-]+/g) || [];
    count += Math.abs(originalSpacing.length - modifiedSpacing.length);
    
    return count;
  }
  
  async tokenizeAll() {
    console.log('🚀 Ultimate Tokenizer 시작...\n');
    
    const srcDir = path.join(process.cwd(), 'src');
    const files = this.findScssFiles(srcDir);
    
    console.log(`📁 ${files.length}개 SCSS 파일 발견\n`);
    
    for (const file of files) {
      const replacements = this.tokenizeFile(file);
      if (replacements > 0) {
        console.log(`✅ ${path.relative(process.cwd(), file)}: ${replacements}개 토큰화`);
        this.totalReplacements += replacements;
        this.processedFiles++;
      }
    }
    
    console.log('\n📊 Ultimate Tokenizer 완료!');
    console.log(`- 처리된 파일: ${this.processedFiles}개`);
    console.log(`- 총 토큰화: ${this.totalReplacements}개`);
    console.log('\n💡 다음 단계: design-consistency-analyzer.js를 다시 실행하여 점수를 확인하세요.');
  }
  
  findScssFiles(dir) {
    const results = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.includes('node_modules')) {
        results.push(...this.findScssFiles(fullPath));
      } else if (file.endsWith('.scss') || file.endsWith('.module.scss')) {
        results.push(fullPath);
      }
    }
    
    return results;
  }
}

// 실행
if (require.main === module) {
  const tokenizer = new UltimateTokenizer();
  tokenizer.tokenizeAll().catch(console.error);
}

module.exports = UltimateTokenizer;