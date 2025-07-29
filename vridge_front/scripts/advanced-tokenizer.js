#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 고급 디자인 토큰 변환 도구
 * rgba, calc, CSS 변수, 미디어 쿼리 등을 지원합니다.
 */

class AdvancedTokenizer {
  constructor() {
    // 기본 색상 매핑
    this.colorMap = {
      // Primary
      '#1631F8': '$color-primary',
      '#1631f8': '$color-primary',
      '#0F23C9': '$color-primary-dark',
      '#0f23c9': '$color-primary-dark',
      '#4B5EFF': '$color-primary-light',
      '#4b5eff': '$color-primary-light',
      
      // Semantic Colors
      '#28a745': '$color-success',
      '#dc3545': '$color-danger',
      '#ffc107': '$color-warning',
      '#17a2b8': '$color-info',
      
      // Grays
      '#000000': '$color-black',
      '#000': '$color-black',
      '#1a1f36': '$color-gray-900',
      '#2d3748': '$color-gray-800',
      '#4a5568': '$color-gray-700',
      '#718096': '$color-gray-600',
      '#a0aec0': '$color-gray-500',
      '#cbd5e0': '$color-gray-400',
      '#e2e8f0': '$color-gray-300',
      '#edf2f7': '$color-gray-200',
      '#f7fafc': '$color-gray-100',
      '#f8f9fa': '$color-background-secondary',
      '#ffffff': '$color-white',
      '#fff': '$color-white',
    };

    // RGB to 토큰 매핑
    this.rgbToToken = {
      '0, 0, 0': '$color-black',
      '255, 255, 255': '$color-white',
      '26, 31, 54': '$color-gray-900',
      '45, 55, 72': '$color-gray-800',
      '74, 85, 104': '$color-gray-700',
      '113, 128, 150': '$color-gray-600',
      '160, 174, 192': '$color-gray-500',
      '203, 213, 224': '$color-gray-400',
      '226, 232, 240': '$color-gray-300',
      '237, 242, 247': '$color-gray-200',
      '247, 250, 252': '$color-gray-100',
      '248, 249, 250': '$color-background-secondary',
      '22, 49, 248': '$color-primary',
      '15, 35, 201': '$color-primary-dark',
      '75, 94, 255': '$color-primary-light',
      '40, 167, 69': '$color-success',
      '220, 53, 69': '$color-danger',
      '255, 193, 7': '$color-warning',
      '23, 162, 184': '$color-info',
    };

    // 간격 매핑 (calc 표현식 포함)
    this.spacingMap = {
      '0': '$spacing-0',
      '0px': '$spacing-0',
      '4px': '$spacing-xs',
      '8px': '$spacing-sm',
      '16px': '$spacing-md',
      '24px': '$spacing-lg',
      '32px': '$spacing-xl',
      '40px': '$spacing-2xl',
      '48px': '$spacing-3xl',
      '64px': '$spacing-4xl',
      '80px': '$spacing-5xl',
      '96px': '$spacing-6xl',
    };

    // 폰트 크기 매핑
    this.fontSizeMap = {
      '12px': '$font-size-xs',
      '14px': '$font-size-sm',
      '16px': '$font-size-base',
      '18px': '$font-size-lg',
      '20px': '$font-size-xl',
      '24px': '$font-size-2xl',
      '30px': '$font-size-3xl',
      '36px': '$font-size-4xl',
      '48px': '$font-size-5xl',
      '60px': '$font-size-6xl',
    };

    // 투명도 매핑
    this.opacityMap = {
      '0': '$opacity-0',
      '0.25': '$opacity-25',
      '0.5': '$opacity-50',
      '0.75': '$opacity-75',
      '1': '$opacity-100',
    };

    this.statistics = {
      totalReplacements: 0,
      colorReplacements: 0,
      spacingReplacements: 0,
      fontSizeReplacements: 0,
      borderRadiusReplacements: 0,
      shadowReplacements: 0,
      rgbaReplacements: 0,
      calcReplacements: 0,
      varReplacements: 0,
    };
  }

  async processFile(filePath) {
    console.log(`\n📄 Processing: ${path.basename(filePath)}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Import design tokens if not already imported
    if (!content.includes('design-tokens') && !content.includes('_design-tokens')) {
      const importStatement = `@import '../styles/design-tokens';\n\n`;
      content = importStatement + content;
    }
    
    // Process in order
    content = this.replaceColors(content);
    content = this.replaceRgbaColors(content);
    content = this.replaceSpacing(content);
    content = this.replaceFontSizes(content);
    content = this.replaceBorderRadius(content);
    content = this.replaceShadows(content);
    content = this.replaceCalcExpressions(content);
    content = this.replaceCssVariables(content);
    content = this.replaceMediaQueryValues(content);
    content = this.replaceAnimationValues(content);
    
    if (content !== originalContent) {
      // Create backup
      const backupPath = filePath + '.backup';
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(filePath, backupPath);
        console.log(`  📁 Backup created: ${path.basename(backupPath)}`);
      }
      
      // Write updated content
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Updated with ${this.statistics.totalReplacements} token replacements`);
    } else {
      console.log(`  ℹ️  No changes needed`);
    }
    
    return this.statistics.totalReplacements;
  }

  replaceColors(content) {
    let replacementCount = 0;
    
    // Replace hex colors
    Object.entries(this.colorMap).forEach(([hex, token]) => {
      const regex = new RegExp(`(?<!\\$)${hex.replace('#', '#?')}(?![0-9a-fA-F])`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, token);
        replacementCount += matches.length;
        this.statistics.colorReplacements += matches.length;
      }
    });
    
    this.statistics.totalReplacements += replacementCount;
    return content;
  }

  replaceRgbaColors(content) {
    let replacementCount = 0;
    
    // Match rgba/rgb colors and convert
    const rgbaRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/g;
    
    content = content.replace(rgbaRegex, (match, r, g, b, a) => {
      const rgbKey = `${r}, ${g}, ${b}`;
      const token = this.rgbToToken[rgbKey];
      
      if (token) {
        replacementCount++;
        this.statistics.rgbaReplacements++;
        
        if (a && a !== '1') {
          // Handle opacity
          const opacityToken = this.opacityMap[a] || a;
          return `rgba(${token}, ${opacityToken})`;
        }
        return token;
      }
      
      return match;
    });
    
    this.statistics.totalReplacements += replacementCount;
    return content;
  }

  replaceSpacing(content) {
    let replacementCount = 0;
    
    // Properties that use spacing
    const spacingProperties = [
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'gap', 'row-gap', 'column-gap',
      'top', 'right', 'bottom', 'left',
      'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height'
    ];
    
    spacingProperties.forEach(prop => {
      Object.entries(this.spacingMap).forEach(([value, token]) => {
        const regex = new RegExp(`(${prop}\\s*:\\s*)${value}(?![\\w-])`, 'gi');
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, `$1${token}`);
          replacementCount += matches.length;
          this.statistics.spacingReplacements += matches.length;
        }
      });
    });
    
    this.statistics.totalReplacements += replacementCount;
    return content;
  }

  replaceCalcExpressions(content) {
    let replacementCount = 0;
    
    // Replace values inside calc()
    const calcRegex = /calc\([^)]+\)/g;
    
    content = content.replace(calcRegex, (match) => {
      let calcContent = match;
      let modified = false;
      
      // Replace spacing values in calc
      Object.entries(this.spacingMap).forEach(([value, token]) => {
        const regex = new RegExp(`\\b${value}\\b`, 'g');
        if (regex.test(calcContent)) {
          calcContent = calcContent.replace(regex, token);
          modified = true;
        }
      });
      
      if (modified) {
        replacementCount++;
        this.statistics.calcReplacements++;
      }
      
      return calcContent;
    });
    
    this.statistics.totalReplacements += replacementCount;
    return content;
  }

  replaceCssVariables(content) {
    let replacementCount = 0;
    
    // Map CSS variables to SCSS variables
    const varMap = {
      '--primary': '$color-primary',
      '--primary-dark': '$color-primary-dark',
      '--primary-light': '$color-primary-light',
      '--danger': '$color-danger',
      '--success': '$color-success',
      '--warning': '$color-warning',
      '--info': '$color-info',
    };
    
    Object.entries(varMap).forEach(([cssVar, scssVar]) => {
      const regex = new RegExp(`var\\(${cssVar}\\)`, 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, scssVar);
        replacementCount += matches.length;
        this.statistics.varReplacements += matches.length;
      }
    });
    
    this.statistics.totalReplacements += replacementCount;
    return content;
  }

  replaceMediaQueryValues(content) {
    let replacementCount = 0;
    
    // Replace breakpoint values in media queries
    const breakpointMap = {
      '576px': '$breakpoint-sm',
      '768px': '$breakpoint-md',
      '1024px': '$breakpoint-lg',
      '1280px': '$breakpoint-xl',
      '1536px': '$breakpoint-2xl',
    };
    
    Object.entries(breakpointMap).forEach(([value, token]) => {
      const regex = new RegExp(`@media[^{]+(max-width|min-width):\\s*${value}`, 'g');
      content = content.replace(regex, (match) => {
        replacementCount++;
        return match.replace(value, token);
      });
    });
    
    this.statistics.totalReplacements += replacementCount;
    return content;
  }

  replaceAnimationValues(content) {
    let replacementCount = 0;
    
    // Replace animation duration values
    const durationMap = {
      '150ms': '$duration-fast',
      '250ms': '$duration-normal',
      '350ms': '$duration-slow',
      '500ms': '$duration-slower',
      '0.15s': '$duration-fast',
      '0.25s': '$duration-normal',
      '0.35s': '$duration-slow',
      '0.5s': '$duration-slower',
    };
    
    Object.entries(durationMap).forEach(([value, token]) => {
      const regex = new RegExp(`(transition[^;]*)(${value})`, 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, `$1${token}`);
        replacementCount += matches.length;
      }
    });
    
    this.statistics.totalReplacements += replacementCount;
    return content;
  }

  replaceFontSizes(content) {
    let replacementCount = 0;
    
    Object.entries(this.fontSizeMap).forEach(([value, token]) => {
      const regex = new RegExp(`(font-size\\s*:\\s*)${value}(?![\\w-])`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, `$1${token}`);
        replacementCount += matches.length;
        this.statistics.fontSizeReplacements += matches.length;
      }
    });
    
    this.statistics.totalReplacements += replacementCount;
    return content;
  }

  replaceBorderRadius(content) {
    let replacementCount = 0;
    
    const borderRadiusMap = {
      '0': '$border-radius-none',
      '0px': '$border-radius-none',
      '4px': '$border-radius-sm',
      '8px': '$border-radius-md',
      '12px': '$border-radius-lg',
      '16px': '$border-radius-xl',
      '24px': '$border-radius-2xl',
      '50%': '$border-radius-full',
      '9999px': '$border-radius-full',
    };
    
    Object.entries(borderRadiusMap).forEach(([value, token]) => {
      const regex = new RegExp(`(border-radius\\s*:\\s*)${value}(?![\\w-])`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, `$1${token}`);
        replacementCount += matches.length;
        this.statistics.borderRadiusReplacements += matches.length;
      }
    });
    
    this.statistics.totalReplacements += replacementCount;
    return content;
  }

  replaceShadows(content) {
    let replacementCount = 0;
    
    const shadowMap = {
      'none': '$shadow-none',
      '0 1px 2px 0 rgba(0, 0, 0, 0.05)': '$shadow-xs',
      '0 1px 3px 0 rgba(0, 0, 0, 0.1)': '$shadow-sm',
      '0 4px 6px -1px rgba(0, 0, 0, 0.1)': '$shadow-md',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)': '$shadow-lg',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1)': '$shadow-xl',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)': '$shadow-2xl',
    };
    
    Object.entries(shadowMap).forEach(([value, token]) => {
      const escapedValue = value.replace(/[()]/g, '\\$&');
      const regex = new RegExp(`(box-shadow\\s*:\\s*)${escapedValue}`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, `$1${token}`);
        replacementCount += matches.length;
        this.statistics.shadowReplacements += matches.length;
      }
    });
    
    this.statistics.totalReplacements += replacementCount;
    return content;
  }

  async processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.includes('node_modules')) {
        await this.processDirectory(fullPath);
      } else if (file.endsWith('.scss') && !file.startsWith('_design-tokens')) {
        await this.processFile(fullPath);
      }
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 고급 토큰 변환 완료 요약');
    console.log('='.repeat(60));
    console.log(`총 변환 수: ${this.statistics.totalReplacements}`);
    console.log(`- 색상: ${this.statistics.colorReplacements}`);
    console.log(`- RGBA: ${this.statistics.rgbaReplacements}`);
    console.log(`- 간격: ${this.statistics.spacingReplacements}`);
    console.log(`- 폰트 크기: ${this.statistics.fontSizeReplacements}`);
    console.log(`- 테두리 반경: ${this.statistics.borderRadiusReplacements}`);
    console.log(`- 그림자: ${this.statistics.shadowReplacements}`);
    console.log(`- Calc 표현식: ${this.statistics.calcReplacements}`);
    console.log(`- CSS 변수: ${this.statistics.varReplacements}`);
    console.log('='.repeat(60));
  }
}

// 실행
if (require.main === module) {
  const tokenizer = new AdvancedTokenizer();
  const args = process.argv.slice(2);
  const targetPath = args[0] || 'src/styles';
  
  console.log('🚀 VideoPlanet 고급 토큰 변환 시작...');
  console.log(`📁 대상: ${targetPath}`);
  
  if (fs.existsSync(targetPath)) {
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      tokenizer.processDirectory(targetPath);
    } else {
      tokenizer.processFile(targetPath);
    }
    tokenizer.printSummary();
  } else {
    console.error('❌ 경로를 찾을 수 없습니다:', targetPath);
  }
}

module.exports = AdvancedTokenizer;