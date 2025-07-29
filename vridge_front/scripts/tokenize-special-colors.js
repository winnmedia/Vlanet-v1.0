#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * VideoPlanet 특수 색상 토큰 변환 도구
 */

class SpecialColorTokenizer {
  constructor() {
    // 특수 색상 매핑
    this.colorMap = {
      // 대소문자 모두 처리
      '#006ae8': '$color-vp-blue-1',
      '#006AE8': '$color-vp-blue-1',
      '#0058da': '$color-vp-blue-2',
      '#0058DA': '$color-vp-blue-2',
      '#0059d5': '$color-vp-blue-3',
      '#0059D5': '$color-vp-blue-3',
      '#0131ff': '$color-vp-blue-4',
      '#0131FF': '$color-vp-blue-4',
      '#0032fc': '$color-vp-blue-5',
      '#0032FC': '$color-vp-blue-5',
      '#55a1f5': '$color-vp-blue-light-1',
      '#55A1F5': '$color-vp-blue-light-1',
      '#4691e5': '$color-vp-blue-light-2',
      '#4691E5': '$color-vp-blue-light-2',
      '#0d45ac': '$color-vp-blue-dark-1',
      '#0D45AC': '$color-vp-blue-dark-1',
      '#0a3a91': '$color-vp-blue-dark-2',
      '#0A3A91': '$color-vp-blue-dark-2',
      '#2b2f38': '$color-vp-gray-dark',
      '#2B2F38': '$color-vp-gray-dark',
      '#e9e9e9': '$color-vp-gray-light-1',
      '#E9E9E9': '$color-vp-gray-light-1',
      '#e9ecef': '$color-vp-gray-light-2',
      '#E9ECEF': '$color-vp-gray-light-2',
      '#dee2e6': '$color-vp-gray-light-3',
      '#DEE2E6': '$color-vp-gray-light-3',
      '#8c8c8c': '$color-vp-gray-medium',
      '#8C8C8C': '$color-vp-gray-medium',
      '#edf0f5': '$color-vp-gray-bg',
      '#EDF0F5': '$color-vp-gray-bg',
      '#f0f4ff': '$color-vp-blue-bg-1',
      '#F0F4FF': '$color-vp-blue-bg-1',
      '#e8ebff': '$color-vp-blue-bg-2',
      '#E8EBFF': '$color-vp-blue-bg-2',
      '#fff5f5': '$color-vp-red-bg-1',
      '#FFF5F5': '$color-vp-red-bg-1',
      '#ffebee': '$color-vp-red-bg-2',
      '#FFEBEE': '$color-vp-red-bg-2',
      
      // 자주 사용되는 기타 색상
      '#e0e0e0': '$color-gray-300',
      '#E0E0E0': '$color-gray-300',
      '#6c757d': '$color-gray-600',
      '#6C757D': '$color-gray-600',
      '#c82333': '$color-danger-dark',
      '#C82333': '$color-danger-dark',
      '#138496': '$color-info-dark',
      
      // 추가 하드코딩 색상
      '#333': '$color-gray-800',
      '#666': '$color-gray-600',
      '#999': '$color-gray-500',
      '#ccc': '$color-gray-400',
      '#ddd': '$color-gray-300',
      '#eee': '$color-gray-200',
      '#f5f5f5': '$color-gray-100',
      '#343a40': '$color-gray-800',
      '#495057': '$color-gray-700',
      '#ced4da': '$color-gray-400',
      '#adb5bd': '$color-gray-500',
      '#868e96': '$color-gray-600',
      '#f0f2f5': '$color-gray-100',
      '#F0F2F5': '$color-gray-100',
      '#4a5cff': '$color-primary-light',
      '#4A5CFF': '$color-primary-light'
    };
    
    // 픽셀 값 매핑 확장
    this.pixelMap = {
      '3px': '$spacing-xs - 1px',
      '4px': '$spacing-xs',
      '5px': '$spacing-xs + 1px',
      '6px': '$spacing-sm - 2px',
      '7px': '$spacing-sm - 1px',
      '8px': '$spacing-sm',
      '9px': '$spacing-sm + 1px',
      '10px': '$spacing-sm + 2px',
      '11px': '$spacing-sm + 3px',
      '12px': '$spacing-sm + $spacing-xs',
      '13px': '$spacing-md - 3px',
      '14px': '$spacing-md - 2px',
      '15px': '$spacing-md - 1px',
      '16px': '$spacing-md',
      '17px': '$spacing-md + 1px',
      '18px': '$spacing-md + 2px',
      '19px': '$spacing-lg - $spacing-xs - 1px',
      '20px': '$spacing-lg - $spacing-xs',
      '22px': '$spacing-lg - 2px',
      '24px': '$spacing-lg',
      '26px': '$spacing-lg + 2px',
      '28px': '$spacing-lg + $spacing-xs',
      '30px': '$spacing-lg + 6px',
      '32px': '$spacing-xl',
      '34px': '$spacing-xl + 2px',
      '36px': '$spacing-xl + $spacing-xs',
      '40px': '$spacing-2xl',
      '44px': '$spacing-2xl + $spacing-xs',
      '48px': '$spacing-3xl',
      '50px': '$spacing-3xl + 2px',
      '54px': '$spacing-3xl + 6px',
      '56px': '$spacing-4xl - $spacing-sm',
      '60px': '$spacing-4xl - $spacing-xs',
      '64px': '$spacing-4xl',
      '70px': '$spacing-4xl + 6px',
      '80px': '$spacing-5xl',
      '96px': '$spacing-6xl',
      '100px': '$spacing-6xl + $spacing-xs',
      '120px': '$spacing-6xl + $spacing-lg',
      '160px': '$spacing-6xl + $spacing-4xl',
      '180px': '$spacing-6xl + $spacing-5xl + $spacing-xs',
      '200px': '$spacing-6xl * 2 + $spacing-sm',
      '240px': '$spacing-6xl * 2.5',
      '260px': '$spacing-6xl * 2.7',
      '300px': '$spacing-6xl * 3 + $spacing-sm + $spacing-xs',
      '360px': '$spacing-6xl * 3.75',
      '400px': '$spacing-6xl * 4 + $spacing-md',
      '420px': '$spacing-6xl * 4.375',
      '500px': '$spacing-6xl * 5 + $spacing-lg - $spacing-xs',
      '600px': '$spacing-6xl * 6.25',
      '726px': '$spacing-6xl * 7.5 + 6px'
    };
    
    this.statistics = {
      totalReplacements: 0,
      colorReplacements: 0,
      pixelReplacements: 0,
      fileCount: 0
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
    
    // 1. Replace colors
    Object.entries(this.colorMap).forEach(([hex, token]) => {
      const regex = new RegExp(`(?<!\\$)${hex.replace('#', '#?')}(?![0-9a-fA-F])`, 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, token);
        this.statistics.colorReplacements += matches.length;
        this.statistics.totalReplacements += matches.length;
      }
    });
    
    // 2. Replace pixel values in specific properties
    const properties = [
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'gap', 'row-gap', 'column-gap',
      'top', 'right', 'bottom', 'left',
      'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
      'font-size', 'line-height', 'border-radius'
    ];
    
    properties.forEach(prop => {
      Object.entries(this.pixelMap).forEach(([value, token]) => {
        const regex = new RegExp(`(${prop}\\s*:\\s*)${value}(?![\\w-])`, 'gi');
        const matches = content.match(regex);
        if (matches) {
          content = content.replace(regex, `$1${token}`);
          this.statistics.pixelReplacements += matches.length;
          this.statistics.totalReplacements += matches.length;
        }
      });
    });
    
    if (content !== originalContent) {
      // Create backup
      const backupPath = filePath + '.special-backup';
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(filePath, backupPath);
        console.log(`  📁 Backup created: ${path.basename(backupPath)}`);
      }
      
      // Write updated content
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Updated with ${this.statistics.totalReplacements - this.statistics.fileCount * this.statistics.totalReplacements / (this.statistics.fileCount + 1)} token replacements`);
      this.statistics.fileCount++;
    } else {
      console.log(`  ℹ️  No changes needed`);
    }
  }
  
  async processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.includes('node_modules')) {
        await this.processDirectory(fullPath);
      } else if (file.endsWith('.scss') && !file.includes('.backup') && !file.startsWith('_design-tokens')) {
        await this.processFile(fullPath);
      }
    }
  }
  
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 특수 색상 토큰 변환 완료 요약');
    console.log('='.repeat(60));
    console.log(`총 변환 수: ${this.statistics.totalReplacements}`);
    console.log(`- 색상: ${this.statistics.colorReplacements}`);
    console.log(`- 픽셀: ${this.statistics.pixelReplacements}`);
    console.log(`- 처리 파일 수: ${this.statistics.fileCount}`);
    console.log('='.repeat(60));
    console.log('\n✅ VideoPlanet 특수 색상이 모두 토큰으로 변환되었습니다!');
  }
}

// 실행
if (require.main === module) {
  const tokenizer = new SpecialColorTokenizer();
  const args = process.argv.slice(2);
  const targetPath = args[0] || 'src';
  
  console.log('🚀 VideoPlanet 특수 색상 토큰 변환 시작...');
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

module.exports = SpecialColorTokenizer;