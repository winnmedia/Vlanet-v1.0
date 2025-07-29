#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 자동 디자인 토큰 변환 도구
 * 하드코딩된 값을 디자인 토큰으로 자동 변환합니다.
 */

class AutoTokenizer {
  constructor() {
    // 색상 매핑
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
      
      // Common colors
      '#333': '$color-gray-800',
      '#666': '$color-gray-600',
      '#999': '$color-gray-500',
      '#ccc': '$color-gray-400',
      '#ddd': '$color-gray-300',
      '#eee': '$color-gray-200',
      '#f5f5f5': '$color-gray-100',
    };

    // 간격 매핑
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
      
      // Common non-standard values
      '5px': '$spacing-xs',
      '10px': '$spacing-sm + 2px',
      '12px': '$spacing-sm + $spacing-xs',
      '14px': '$spacing-md - 2px',
      '15px': '$spacing-md - 1px',
      '18px': '$spacing-md + 2px',
      '20px': '$spacing-lg - $spacing-xs',
      '28px': '$spacing-lg + $spacing-xs',
      '30px': '$spacing-lg + 6px',
      '36px': '$spacing-xl + $spacing-xs',
      '50px': '$spacing-3xl + 2px',
      '60px': '$spacing-4xl - $spacing-xs',
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
      
      // rem values
      '0.75rem': '$font-size-xs',
      '0.875rem': '$font-size-sm',
      '1rem': '$font-size-base',
      '1.125rem': '$font-size-lg',
      '1.25rem': '$font-size-xl',
      '1.5rem': '$font-size-2xl',
    };

    // Border radius 매핑
    this.borderRadiusMap = {
      '0': '$border-radius-none',
      '0px': '$border-radius-none',
      '4px': '$border-radius-sm',
      '8px': '$border-radius-md',
      '12px': '$border-radius-lg',
      '16px': '$border-radius-xl',
      '24px': '$border-radius-2xl',
      '50%': '$border-radius-full',
      '9999px': '$border-radius-full',
      
      // Common values
      '2px': '$border-radius-sm / 2',
      '3px': '$border-radius-sm - 1px',
      '5px': '$border-radius-sm + 1px',
      '6px': '$border-radius-md - 2px',
      '10px': '$border-radius-lg - 2px',
    };

    // Shadow 매핑
    this.shadowMap = {
      'none': '$shadow-none',
      '0 1px 2px 0 rgba(0, 0, 0, 0.05)': '$shadow-xs',
      '0 1px 3px 0 rgba(0, 0, 0, 0.1)': '$shadow-sm',
      '0 4px 6px -1px rgba(0, 0, 0, 0.1)': '$shadow-md',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)': '$shadow-lg',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1)': '$shadow-xl',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)': '$shadow-2xl',
    };

    this.statistics = {
      totalReplacements: 0,
      colorReplacements: 0,
      spacingReplacements: 0,
      fontSizeReplacements: 0,
      borderRadiusReplacements: 0,
      shadowReplacements: 0,
    };
  }

  async processFile(filePath) {
    console.log(`\n📄 Processing: ${path.basename(filePath)}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Import design tokens if not already imported
    if (!content.includes('design-tokens')) {
      const importStatement = `@import '../styles/design-tokens';\n\n`;
      content = importStatement + content;
    }
    
    // 1. Replace colors
    content = this.replaceColors(content);
    
    // 2. Replace spacing
    content = this.replaceSpacing(content);
    
    // 3. Replace font sizes
    content = this.replaceFontSizes(content);
    
    // 4. Replace border radius
    content = this.replaceBorderRadius(content);
    
    // 5. Replace shadows
    content = this.replaceShadows(content);
    
    // 6. Replace gradients
    content = this.replaceGradients(content);
    
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
    
    // Replace rgb/rgba colors
    const rgbMap = {
      'rgb(26, 31, 54)': '$color-gray-900',
      'rgba(26, 31, 54, 1)': '$color-gray-900',
      'rgb(113, 128, 150)': '$color-gray-600',
      'rgba(113, 128, 150, 1)': '$color-gray-600',
      'rgb(0, 0, 0)': '$color-black',
      'rgba(0, 0, 0, 1)': '$color-black',
      'rgb(255, 255, 255)': '$color-white',
      'rgba(255, 255, 255, 1)': '$color-white',
    };
    
    Object.entries(rgbMap).forEach(([rgb, token]) => {
      const regex = new RegExp(rgb.replace(/[()]/g, '\\$&'), 'gi');
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
        const regex = new RegExp(`(${prop}\\s*:\\s*)${value.replace(/[+\-]/g, '\\$&')}(?![-\\w])`, 'gi');
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

  replaceFontSizes(content) {
    let replacementCount = 0;
    
    Object.entries(this.fontSizeMap).forEach(([value, token]) => {
      const regex = new RegExp(`(font-size\\s*:\\s*)${value}(?![-\\w])`, 'gi');
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
    
    Object.entries(this.borderRadiusMap).forEach(([value, token]) => {
      const regex = new RegExp(`(border-radius\\s*:\\s*)${value}(?![-\\w])`, 'gi');
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
    
    Object.entries(this.shadowMap).forEach(([value, token]) => {
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

  replaceGradients(content) {
    let replacementCount = 0;
    
    // Primary gradient
    const primaryGradientRegex = /linear-gradient\([^,]+,\s*#1631[fF]8[^,]*,\s*#0[fF]23[cC]9[^)]*\)/gi;
    if (primaryGradientRegex.test(content)) {
      content = content.replace(primaryGradientRegex, '$gradient-primary');
      replacementCount++;
    }
    
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
    console.log('📊 토큰 변환 완료 요약');
    console.log('='.repeat(60));
    console.log(`총 변환 수: ${this.statistics.totalReplacements}`);
    console.log(`- 색상: ${this.statistics.colorReplacements}`);
    console.log(`- 간격: ${this.statistics.spacingReplacements}`);
    console.log(`- 폰트 크기: ${this.statistics.fontSizeReplacements}`);
    console.log(`- 테두리 반경: ${this.statistics.borderRadiusReplacements}`);
    console.log(`- 그림자: ${this.statistics.shadowReplacements}`);
    console.log('='.repeat(60));
  }
}

// 실행
if (require.main === module) {
  const tokenizer = new AutoTokenizer();
  const args = process.argv.slice(2);
  const targetPath = args[0] || 'src/styles';
  
  console.log('🚀 VideoPlanet 자동 토큰 변환 시작...');
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

module.exports = AutoTokenizer;