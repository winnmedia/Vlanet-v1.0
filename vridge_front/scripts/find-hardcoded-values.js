#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 하드코딩된 값 찾기 도구
 * 아직 토큰으로 변환되지 않은 모든 하드코딩 값을 찾습니다.
 */

class HardcodedValueFinder {
  constructor() {
    this.findings = {
      hexColors: [],
      rgbColors: [],
      pixelValues: [],
      importantUsage: [],
      inlineStyles: [],
      cssVariables: [],
      unknownColors: []
    };
    
    // 알려진 토큰들
    this.knownTokens = new Set([
      // Colors
      '$color-primary', '$color-primary-dark', '$color-primary-light',
      '$color-danger', '$color-success', '$color-warning', '$color-info',
      '$color-black', '$color-white',
      '$color-gray-900', '$color-gray-800', '$color-gray-700',
      '$color-gray-600', '$color-gray-500', '$color-gray-400',
      '$color-gray-300', '$color-gray-200', '$color-gray-100',
      '$color-background', '$color-background-secondary',
      '$color-text', '$color-text-secondary',
      '$color-border', '$color-border-light', '$color-border-dark',
      
      // Spacing
      '$spacing-0', '$spacing-xs', '$spacing-sm', '$spacing-md',
      '$spacing-lg', '$spacing-xl', '$spacing-2xl', '$spacing-3xl',
      '$spacing-4xl', '$spacing-5xl', '$spacing-6xl',
      
      // Font sizes
      '$font-size-xs', '$font-size-sm', '$font-size-base',
      '$font-size-lg', '$font-size-xl', '$font-size-2xl',
      '$font-size-3xl', '$font-size-4xl', '$font-size-5xl',
      
      // Border radius
      '$border-radius-none', '$border-radius-sm', '$border-radius-md',
      '$border-radius-lg', '$border-radius-xl', '$border-radius-2xl',
      '$border-radius-full',
      
      // Shadows
      '$shadow-none', '$shadow-xs', '$shadow-sm', '$shadow-md',
      '$shadow-lg', '$shadow-xl', '$shadow-2xl',
      
      // Other
      '$opacity-0', '$opacity-25', '$opacity-50', '$opacity-75', '$opacity-100',
      '$duration-fast', '$duration-normal', '$duration-slow', '$duration-slower',
      '$breakpoint-sm', '$breakpoint-md', '$breakpoint-lg', '$breakpoint-xl'
    ]);
    
    // 특수 색상 패턴
    this.specialColors = {
      '#006ae8': 'VideoPlanet 특수 파란색',
      '#0058da': 'VideoPlanet 특수 파란색 2',
      '#0059d5': 'VideoPlanet 특수 파란색 3',
      '#0131ff': 'VideoPlanet 특수 파란색 4',
      '#0032fc': 'VideoPlanet 특수 파란색 5',
      '#2b2f38': 'VideoPlanet 특수 어두운 회색',
      '#55a1f5': 'VideoPlanet 밝은 파란색',
      '#4691e5': 'VideoPlanet 밝은 파란색 2',
      '#0d45ac': 'VideoPlanet 진한 파란색',
      '#0a3a91': 'VideoPlanet 진한 파란색 2',
      '#e9e9e9': 'VideoPlanet 연한 회색',
      '#e9ecef': 'VideoPlanet 연한 회색 2',
      '#dee2e6': 'VideoPlanet 연한 회색 3',
      '#edf0f5': 'VideoPlanet 배경 회색',
      '#f0f4ff': 'VideoPlanet 연한 파란 배경',
      '#e8ebff': 'VideoPlanet 연한 파란 배경 2',
      '#fff5f5': 'VideoPlanet 연한 빨간 배경',
      '#ffebee': 'VideoPlanet 연한 빨간 배경 2',
      '#8c8c8c': 'VideoPlanet 중간 회색'
    };
  }

  async analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const fileName = path.relative(process.cwd(), filePath);
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Skip commented lines
      if (line.trim().startsWith('//')) return;
      
      // 1. Hex colors
      const hexMatches = line.match(/#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])/g);
      if (hexMatches) {
        hexMatches.forEach(hex => {
          if (!this.isTokenUsed(line, hex)) {
            const specialNote = this.specialColors[hex.toLowerCase()];
            this.findings.hexColors.push({
              file: fileName,
              line: lineNumber,
              value: hex,
              context: line.trim(),
              note: specialNote || ''
            });
          }
        });
      }
      
      // 2. RGB/RGBA colors
      const rgbMatches = line.match(/rgba?\([^)]+\)/g);
      if (rgbMatches) {
        rgbMatches.forEach(rgb => {
          if (!this.isTokenUsed(line, rgb)) {
            this.findings.rgbColors.push({
              file: fileName,
              line: lineNumber,
              value: rgb,
              context: line.trim()
            });
          }
        });
      }
      
      // 3. Pixel values
      const pixelMatches = line.match(/\d+px/g);
      if (pixelMatches) {
        pixelMatches.forEach(px => {
          if (!this.isTokenUsed(line, px) && !this.isAcceptablePixel(px)) {
            this.findings.pixelValues.push({
              file: fileName,
              line: lineNumber,
              value: px,
              context: line.trim()
            });
          }
        });
      }
      
      // 4. !important usage
      if (line.includes('!important')) {
        this.findings.importantUsage.push({
          file: fileName,
          line: lineNumber,
          context: line.trim()
        });
      }
      
      // 5. CSS variables (should be SCSS variables)
      const cssVarMatches = line.match(/var\(--[^)]+\)/g);
      if (cssVarMatches) {
        cssVarMatches.forEach(cssVar => {
          this.findings.cssVariables.push({
            file: fileName,
            line: lineNumber,
            value: cssVar,
            context: line.trim()
          });
        });
      }
    });
  }
  
  isTokenUsed(line, value) {
    // Check if the value is part of a token
    for (const token of this.knownTokens) {
      if (line.includes(token)) {
        return true;
      }
    }
    return false;
  }
  
  isAcceptablePixel(px) {
    // Some pixel values are acceptable (borders, very small values)
    const value = parseInt(px);
    return value <= 2 || px === '9999px'; // border-width or border-radius-full hack
  }
  
  async analyzeDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.includes('node_modules')) {
        await this.analyzeDirectory(fullPath);
      } else if (file.endsWith('.scss') && !file.includes('.backup')) {
        await this.analyzeFile(fullPath);
      }
    }
  }
  
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 하드코딩된 값 상세 보고서');
    console.log('='.repeat(80));
    
    // 1. 특수 색상 보고
    console.log('\n📌 VideoPlanet 특수 색상 (토큰 필요):');
    const specialColorFindings = this.findings.hexColors.filter(f => f.note);
    const colorGroups = {};
    
    specialColorFindings.forEach(finding => {
      if (!colorGroups[finding.value]) {
        colorGroups[finding.value] = {
          note: finding.note,
          count: 0,
          files: new Set()
        };
      }
      colorGroups[finding.value].count++;
      colorGroups[finding.value].files.add(finding.file);
    });
    
    Object.entries(colorGroups).forEach(([color, info]) => {
      console.log(`\n${color}: ${info.note}`);
      console.log(`  사용 횟수: ${info.count}회`);
      console.log(`  파일: ${[...info.files].join(', ')}`);
    });
    
    // 2. 가장 많이 사용된 하드코딩 값
    console.log('\n\n📊 가장 많이 사용된 하드코딩 값 TOP 10:');
    const allValues = [
      ...this.findings.hexColors.map(f => f.value),
      ...this.findings.pixelValues.map(f => f.value)
    ];
    
    const valueCounts = {};
    allValues.forEach(value => {
      valueCounts[value] = (valueCounts[value] || 0) + 1;
    });
    
    const sortedValues = Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    sortedValues.forEach(([value, count], index) => {
      console.log(`${index + 1}. ${value}: ${count}회`);
    });
    
    // 3. 파일별 요약
    console.log('\n\n📁 파일별 하드코딩 수:');
    const fileStats = {};
    
    [...this.findings.hexColors, ...this.findings.rgbColors, ...this.findings.pixelValues].forEach(finding => {
      if (!fileStats[finding.file]) {
        fileStats[finding.file] = 0;
      }
      fileStats[finding.file]++;
    });
    
    const sortedFiles = Object.entries(fileStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    sortedFiles.forEach(([file, count]) => {
      console.log(`  ${file}: ${count}개`);
    });
    
    // 4. 전체 통계
    console.log('\n\n📈 전체 통계:');
    console.log(`- Hex 색상: ${this.findings.hexColors.length}개`);
    console.log(`- RGB/RGBA 색상: ${this.findings.rgbColors.length}개`);
    console.log(`- 픽셀 값: ${this.findings.pixelValues.length}개`);
    console.log(`- !important 사용: ${this.findings.importantUsage.length}개`);
    console.log(`- CSS 변수: ${this.findings.cssVariables.length}개`);
    console.log(`총 하드코딩: ${this.findings.hexColors.length + this.findings.rgbColors.length + this.findings.pixelValues.length}개`);
    
    // 상세 결과를 JSON 파일로 저장
    fs.writeFileSync(
      'hardcoded-values-report.json',
      JSON.stringify(this.findings, null, 2)
    );
    
    console.log('\n\n✅ 상세 리포트가 hardcoded-values-report.json에 저장되었습니다.');
    console.log('💡 다음 명령으로 특수 색상을 토큰으로 변환하세요:');
    console.log('   npm run tokenize:special');
  }
}

// 실행
if (require.main === module) {
  const finder = new HardcodedValueFinder();
  const targetPath = process.argv[2] || 'src';
  
  console.log('🔍 하드코딩된 값 검색 중...');
  console.log(`📁 대상: ${targetPath}`);
  
  finder.analyzeDirectory(targetPath)
    .then(() => finder.generateReport())
    .catch(console.error);
}

module.exports = HardcodedValueFinder;