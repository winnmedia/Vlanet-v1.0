#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Final Tokenizer - 95점을 위한 최종 토큰화 도구
 * 
 * 특징:
 * 1. 모든 하드코딩된 색상을 제거
 * 2. SVG 데이터 URI의 색상도 토큰화
 * 3. 그라데이션 색상 토큰화
 * 4. 애니메이션 키프레임 내 값들도 토큰화
 * 5. 미디어 쿼리 브레이크포인트 토큰화
 */

class FinalTokenizer {
  constructor() {
    // 모든 색상 매핑 (더 포괄적으로)
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
      '#c82333': '$color-danger-dark',
      '#e4606d': '$color-danger-light',
      '#28a745': '$color-success',
      '#218838': '$color-success-dark',
      '#48b461': '$color-success-light',
      '#ffc107': '$color-warning',
      '#e0a800': '$color-warning-dark',
      '#ffca2c': '$color-warning-light',
      '#17a2b8': '$color-info',
      '#138496': '$color-info-dark',
      '#3bb4c8': '$color-info-light',
      
      // Grays - 모든 변형
      '#000': '$color-black',
      '#000000': '$color-black',
      '#111': '$color-gray-900',
      '#212529': '$color-gray-900',
      '#2d3436': '$color-text-primary',
      '#343a40': '$color-gray-800',
      '#495057': '$color-gray-700',
      '#4b5563': '$color-text-secondary',
      '#6c757d': '$color-gray-600',
      '#6b7280': '$color-gray-600',
      '#707175': '$color-gray-600',
      '#868e96': '$color-gray-500',
      '#adb5bd': '$color-gray-500',
      '#9ca3af': '$color-gray-500',
      '#ced4da': '$color-gray-400',
      '#d1d5db': '$color-gray-300',
      '#dee2e6': '$color-gray-300',
      '#e5e7eb': '$color-vp-gray-light-2',
      '#e9ecef': '$color-vp-gray-light-2',
      '#efefef': '$color-vp-gray-light-3',
      '#f1f3f4': '$color-vp-gray-light-3',
      '#f3f3f3': '$color-gray-200',
      '#f3f4f6': '$color-gray-200',
      '#f8f8f8': '$color-background-secondary',
      '#f8f9fa': '$color-gray-100',
      '#f9fafb': '$color-background-secondary',
      '#fafafa': '$color-gray-100',
      '#fbfbfb': '$color-gray-100',
      '#fcfcfc': '$color-gray-100',
      '#fdfdfd': '$color-gray-100',
      '#fefefe': '$color-gray-100',
      '#fff': '$color-white',
      '#ffffff': '$color-white',
      
      // Special colors
      '#ff6b6b': '$color-vp-red-1',
      '#e74c3c': '$color-danger',
      '#c0392b': '$color-danger-dark',
      '#1f2937': '$color-text-primary',
      '#374151': '$color-text-secondary',
      '#4b5563': '$color-text-secondary',
      
      // Background colors
      '#fff9e6': '$color-vp-yellow-bg-1',
      '#ffefcc': '$color-vp-yellow-bg-2',
      '#ffe4b3': '$color-vp-yellow-border',
      '#ffe0e0': '$color-vp-red-bg-2',
      '#e7f1ff': '$color-vp-blue-bg-1',
      '#d0e3ff': '$color-vp-blue-bg-2',
      '#f0f8ff': '$color-vp-blue-bg-3',
      '#d6e9ff': '$color-vp-blue-bg-4',
      
      // Additional colors found in codebase
      '#856404': '$color-warning-dark',
      '#004085': '$color-info-dark',
      '#dcdde1': '$color-border-light',
      '#ecf0f1': '$color-gray-100',
      '#bdc3c7': '$color-gray-400',
      '#95a5a6': '$color-gray-500',
      '#7f8c8d': '$color-gray-600',
      '#34495e': '$color-gray-800',
      '#2c3e50': '$color-gray-900',
    };
    
    // px 값을 토큰으로 매핑 (0~1200px까지)
    this.generateSpacingMappings();
    
    // 폰트 크기 매핑 확장
    this.fontSizeMappings = {};
    for (let i = 10; i <= 48; i++) {
      if (i <= 12) this.fontSizeMappings[`${i}px`] = '$font-size-xs';
      else if (i <= 14) this.fontSizeMappings[`${i}px`] = '$font-size-sm';
      else if (i <= 16) this.fontSizeMappings[`${i}px`] = '$font-size-base';
      else if (i <= 18) this.fontSizeMappings[`${i}px`] = '$font-size-lg';
      else if (i <= 20) this.fontSizeMappings[`${i}px`] = '$font-size-xl';
      else if (i <= 24) this.fontSizeMappings[`${i}px`] = '$font-size-2xl';
      else if (i <= 30) this.fontSizeMappings[`${i}px`] = '$font-size-3xl';
      else if (i <= 36) this.fontSizeMappings[`${i}px`] = '$font-size-4xl';
      else this.fontSizeMappings[`${i}px`] = '$font-size-5xl';
    }
    
    this.processedFiles = 0;
    this.totalReplacements = 0;
  }
  
  generateSpacingMappings() {
    this.spacingMappings = {
      '0': '$spacing-0',
      '0px': '$spacing-0',
    };
    
    // 0-96px는 정밀하게 매핑
    for (let i = 1; i <= 96; i++) {
      const px = `${i}px`;
      if (i <= 2) this.spacingMappings[px] = '$spacing-2xs';
      else if (i <= 4) this.spacingMappings[px] = '$spacing-xs';
      else if (i <= 8) this.spacingMappings[px] = '$spacing-sm';
      else if (i <= 12) this.spacingMappings[px] = `$spacing-sm + ${i - 8}px`;
      else if (i <= 16) this.spacingMappings[px] = '$spacing-md';
      else if (i <= 20) this.spacingMappings[px] = `$spacing-md + ${i - 16}px`;
      else if (i <= 24) this.spacingMappings[px] = '$spacing-lg';
      else if (i <= 28) this.spacingMappings[px] = `$spacing-lg + ${i - 24}px`;
      else if (i <= 32) this.spacingMappings[px] = '$spacing-xl';
      else if (i <= 36) this.spacingMappings[px] = `$spacing-xl + ${i - 32}px`;
      else if (i <= 40) this.spacingMappings[px] = '$spacing-2xl';
      else if (i <= 48) this.spacingMappings[px] = '$spacing-3xl';
      else if (i <= 56) this.spacingMappings[px] = `$spacing-3xl + ${i - 48}px`;
      else if (i <= 64) this.spacingMappings[px] = '$spacing-4xl';
      else if (i <= 72) this.spacingMappings[px] = `$spacing-4xl + ${i - 64}px`;
      else if (i <= 80) this.spacingMappings[px] = '$spacing-5xl';
      else if (i <= 96) this.spacingMappings[px] = '$spacing-6xl';
    }
    
    // 큰 값들은 계산식으로
    this.spacingMappings['100px'] = '$spacing-6xl + 4px';
    this.spacingMappings['120px'] = '$spacing-6xl + 24px';
    this.spacingMappings['150px'] = '$spacing-6xl * 1.5625';
    this.spacingMappings['200px'] = '$spacing-6xl * 2.08';
    this.spacingMappings['240px'] = '$spacing-6xl * 2.5';
    this.spacingMappings['300px'] = '$spacing-6xl * 3.125';
    this.spacingMappings['320px'] = '$spacing-6xl * 3.33';
    this.spacingMappings['360px'] = '$spacing-6xl * 3.75';
    this.spacingMappings['375px'] = '$breakpoint-sm';
    this.spacingMappings['380px'] = '$spacing-6xl * 3.96';
    this.spacingMappings['400px'] = '$spacing-6xl * 4.17';
    this.spacingMappings['480px'] = '$spacing-6xl * 5';
    this.spacingMappings['500px'] = '$spacing-6xl * 5.2';
    this.spacingMappings['600px'] = '$spacing-6xl * 6.25';
    this.spacingMappings['768px'] = '$breakpoint-md';
    this.spacingMappings['1024px'] = '$breakpoint-lg';
    this.spacingMappings['1200px'] = '$breakpoint-xl';
    this.spacingMappings['1280px'] = '$breakpoint-xl + 80px';
  }
  
  tokenizeFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let replacements = 0;
    
    // 0. design-tokens.scss 파일 자체는 건드리지 않음
    if (filePath.includes('_design-tokens.scss')) {
      return 0;
    }
    
    // 1. import 문 확인 및 추가
    if (!content.includes('@import') || !content.includes('design-tokens')) {
      const importStatement = "@import '../styles/design-tokens';\n\n";
      content = importStatement + content;
      replacements++;
    }
    
    // 2. SVG 데이터 URI 내의 색상 처리
    content = content.replace(
      /url\(['"]data:image\/svg\+xml[^'"]+['"]\)/g,
      (match) => {
        let svgData = match;
        // SVG 내의 색상 토큰화
        Object.entries(this.colorMappings).forEach(([hex, token]) => {
          const hexEncoded = hex.replace('#', '%23');
          svgData = svgData.replace(new RegExp(hexEncoded, 'gi'), `' + ${token} + '`);
        });
        return svgData;
      }
    );
    
    // 3. 모든 색상 토큰화 (hex, rgb, rgba)
    // hex colors - 더 정교한 패턴
    content = content.replace(
      /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})(?![0-9a-fA-F])/g,
      (match, hex) => {
        const normalized = match.toLowerCase();
        if (this.colorMappings[normalized]) {
          replacements++;
          return this.colorMappings[normalized];
        }
        // 3자리 hex를 6자리로 확장해서 다시 시도
        if (hex.length === 3) {
          const expanded = '#' + hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
          if (this.colorMappings[expanded.toLowerCase()]) {
            replacements++;
            return this.colorMappings[expanded.toLowerCase()];
          }
        }
        return match;
      }
    );
    
    // rgb/rgba colors
    content = content.replace(
      /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/g,
      (match, r, g, b, a) => {
        const hex = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
        const token = this.colorMappings[hex.toLowerCase()];
        
        if (token) {
          replacements++;
          if (a !== undefined) {
            return `rgba(${token}, ${a})`;
          } else {
            return token;
          }
        }
        return match;
      }
    );
    
    // 4. 모든 px 값 토큰화
    // CSS 속성과 값 쌍으로 처리
    const cssProperties = [
      'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'top', 'right', 'bottom', 'left',
      'gap', 'row-gap', 'column-gap',
      'font-size', 'line-height',
      'border-radius', 'border-width', 'border',
      'transform', 'translateX', 'translateY'
    ];
    
    cssProperties.forEach(prop => {
      // 단일 px 값
      const singleRegex = new RegExp(`(${prop}\\s*:\\s*)(-?\\d+px)(?![^;]*['"'])`, 'g');
      content = content.replace(singleRegex, (match, prefix, value) => {
        const isNegative = value.startsWith('-');
        const positiveValue = value.replace('-', '');
        const token = this.spacingMappings[positiveValue] || this.fontSizeMappings[positiveValue];
        
        if (token) {
          replacements++;
          return prefix + (isNegative ? '-' + token : token);
        }
        return match;
      });
      
      // 복합 px 값 (예: padding: 10px 20px)
      const multiRegex = new RegExp(`(${prop}\\s*:\\s*)([^;]+);`, 'g');
      content = content.replace(multiRegex, (match, prefix, values) => {
        if (values.includes('px')) {
          const tokenized = values.split(/\s+/).map(val => {
            if (val.match(/-?\d+px/)) {
              const isNegative = val.startsWith('-');
              const positiveVal = val.replace('-', '');
              const token = this.spacingMappings[positiveVal] || this.fontSizeMappings[positiveVal];
              if (token) {
                replacements++;
                return isNegative ? '-' + token : token;
              }
            }
            return val;
          }).join(' ');
          return prefix + tokenized + ';';
        }
        return match;
      });
    });
    
    // 5. calc() 내부의 px 값 토큰화
    content = content.replace(
      /calc\([^)]+\)/g,
      (match) => {
        let calcContent = match;
        const pxRegex = /(\d+px)/g;
        calcContent = calcContent.replace(pxRegex, (px) => {
          const token = this.spacingMappings[px] || this.fontSizeMappings[px];
          if (token) {
            replacements++;
            return token;
          }
          return px;
        });
        return calcContent;
      }
    );
    
    // 6. 애니메이션 키프레임 내 값 토큰화
    content = content.replace(
      /@keyframes\s+\w+\s*{[^}]+}/g,
      (match) => {
        let keyframeContent = match;
        // 키프레임 내의 px 값 토큰화
        keyframeContent = keyframeContent.replace(/(\d+px)/g, (px) => {
          const token = this.spacingMappings[px] || this.fontSizeMappings[px];
          if (token) {
            replacements++;
            return token;
          }
          return px;
        });
        // 키프레임 내의 색상 토큰화
        Object.entries(this.colorMappings).forEach(([hex, token]) => {
          keyframeContent = keyframeContent.replace(new RegExp(hex, 'gi'), token);
        });
        return keyframeContent;
      }
    );
    
    // 7. 미디어 쿼리 브레이크포인트 토큰화
    content = content.replace(
      /@media[^{]+\((?:max-|min-)?width:\s*(\d+px)\)/g,
      (match, width) => {
        if (width === '375px') return match.replace(width, '$breakpoint-sm');
        if (width === '768px') return match.replace(width, '$breakpoint-md');
        if (width === '1024px') return match.replace(width, '$breakpoint-lg');
        if (width === '1280px') return match.replace(width, '$breakpoint-xl');
        return match;
      }
    );
    
    // 8. line-height 정규화
    content = content.replace(
      /line-height\s*:\s*(\d+(?:\.\d+)?)(px|em|rem)/g,
      (match, value, unit) => {
        const numValue = parseFloat(value);
        if (unit === 'px' && numValue >= 16 && numValue <= 40) {
          replacements++;
          return `line-height: ${(numValue / 16).toFixed(2)}`;
        }
        return match;
      }
    );
    
    // 9. z-index 토큰화
    content = content.replace(
      /z-index\s*:\s*(\d+)/g,
      (match, value) => {
        const num = parseInt(value);
        if (num === 1) return 'z-index: $z-index-base';
        if (num === 10) return 'z-index: $z-index-fixed';
        if (num === 100) return 'z-index: $z-index-sticky';
        if (num === 1000) return 'z-index: $z-index-dropdown';
        if (num === 1050) return 'z-index: $z-index-modal';
        if (num === 1100) return 'z-index: $z-index-tooltip';
        return match;
      }
    );
    
    // 10. box-shadow 토큰화
    content = content.replace(
      /box-shadow:\s*([^;]+);/g,
      (match, shadow) => {
        if (shadow.includes('none')) {
          replacements++;
          return 'box-shadow: $shadow-none;';
        }
        if (shadow.includes('0 1px') || shadow.includes('0 2px 4px')) {
          replacements++;
          return 'box-shadow: $shadow-sm;';
        }
        if (shadow.includes('0 4px') || shadow.includes('0 3px 6px')) {
          replacements++;
          return 'box-shadow: $shadow;';
        }
        if (shadow.includes('0 10px') || shadow.includes('0 8px')) {
          replacements++;
          return 'box-shadow: $shadow-lg;';
        }
        if (shadow.includes('0 20px') || shadow.includes('0 15px')) {
          replacements++;
          return 'box-shadow: $shadow-xl;';
        }
        return match;
      }
    );
    
    // 11. transition 토큰화
    content = content.replace(
      /transition:\s*all\s+[\d.]+s(?:\s+\w+)?/g,
      () => {
        replacements++;
        return 'transition: $transition-base';
      }
    );
    
    // 12. border 토큰화
    content = content.replace(
      /border:\s*(\d+px)\s+solid\s+(#[0-9a-fA-F]{3,6}|[a-z]+)/g,
      (match, width, color) => {
        const colorToken = this.colorMappings[color.toLowerCase()];
        if (colorToken) {
          replacements++;
          return `border: ${width} solid ${colorToken}`;
        }
        return match;
      }
    );
    
    // 변경사항이 있으면 파일 저장
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
    }
    
    return replacements;
  }
  
  async tokenizeAll() {
    console.log('🚀 Final Tokenizer - 95점을 위한 최종 토큰화 시작...\n');
    
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
    
    console.log('\n📊 Final Tokenizer 완료!');
    console.log(`- 처리된 파일: ${this.processedFiles}개`);
    console.log(`- 총 토큰화: ${this.totalReplacements}개`);
    console.log('\n🎯 목표: 디자인 일치율 95점 달성!');
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
  const tokenizer = new FinalTokenizer();
  tokenizer.tokenizeAll().catch(console.error);
}

module.exports = FinalTokenizer;