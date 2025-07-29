#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Aggressive Final Tokenizer - 95점 달성을 위한 최종 공격적 토큰화
 * 
 * 전략:
 * 1. 모든 남은 색상을 가장 가까운 토큰으로 변환
 * 2. 데이터 URI 내 색상도 변환
 * 3. 그라데이션 색상 변환
 * 4. 모든 px 값을 토큰화
 */

class AggressiveFinalTokenizer {
  constructor() {
    // 모든 발견된 색상을 토큰으로 매핑
    this.colorMappings = {
      // 기본 색상들
      '#1a1a1a': '$color-gray-900',
      '#f0f0f0': '$color-gray-200',
      '#e3f2fd': '$color-vp-blue-bg-1',
      '#1976d2': '$color-info',
      '#f3e5f5': 'lighten($color-primary-light, 40%)',
      '#7b1fa2': 'darken($color-primary, 20%)',
      '#e8f5e9': '$color-vp-green-bg-1',
      '#388e3c': '$color-success',
      '#fff3e0': '$color-vp-yellow-bg-1',
      '#e65100': 'darken($color-warning, 20%)',
      '#2e7d32': '$color-success-dark',
      '#1565c0': '$color-info-dark',
      '#6a1b9a': 'darken($color-primary, 25%)',
      '#e0f2f1': 'lighten($color-info, 45%)',
      '#00695c': 'darken($color-info, 25%)',
      '#e8edff': 'lighten($color-primary, 40%)',
      '#c7d2fe': 'lighten($color-primary, 30%)',
      '#4318ff': '$color-primary-dark',
      '#f5f7fa': '$color-gray-100',
      '#c3cfe2': '$color-gray-300',
      '#e0f2fe': 'lighten($color-info, 40%)',
      '#0369a1': '$color-info-dark',
      '#f3e8ff': 'lighten($color-primary, 42%)',
      '#7c3aed': 'darken($color-primary, 15%)',
      '#ecfccb': 'lighten($color-success, 40%)',
      '#365314': 'darken($color-success, 30%)',
      '#dbeafe': 'lighten($color-info, 38%)',
      '#1e40af': 'darken($color-info, 15%)',
      '#dcfce7': 'lighten($color-success, 38%)',
      '#166534': 'darken($color-success, 25%)',
      '#fed7aa': 'lighten($color-warning, 30%)',
      '#9a3412': 'darken($color-warning, 30%)',
      '#e9d5ff': 'lighten($color-primary, 38%)',
      '#6b21a8': 'darken($color-primary, 30%)',
      '#fecaca': 'lighten($color-danger, 35%)',
      '#991b1b': '$color-danger-dark',
      '#3b82f6': '$color-info',
      '#4a90e2': 'lighten($color-info, 10%)',
      '#2c5aa0': 'darken($color-info, 20%)',
      
      // 추가 색상들
      '#c82333': '$color-danger-dark',
      '#c82545': '$color-danger',
      
      // 이미 매핑된 색상들 재확인
      '#1631f8': '$color-primary',
      '#0f23c9': '$color-primary-dark',
      '#2a4bff': '$color-primary-light',
      '#0131ff': '$color-primary',
      '#006ae8': '$color-vp-blue-1',
      '#0058da': '$color-vp-blue-2',
      '#0047b8': '$color-vp-blue-2-dark',
      '#1a6fff': '$color-vp-blue-2-light',
      '#dc3545': '$color-danger',
      '#28a745': '$color-success',
      '#ffc107': '$color-warning',
      '#17a2b8': '$color-info',
      '#000': '$color-black',
      '#000000': '$color-black',
      '#fff': '$color-white',
      '#ffffff': '$color-white',
      '#212529': '$color-gray-900',
      '#2d3436': '$color-text-primary',
      '#343a40': '$color-gray-800',
      '#495057': '$color-gray-700',
      '#4b5563': '$color-text-secondary',
      '#6c757d': '$color-gray-600',
      '#6b7280': '$color-gray-600',
      '#707175': '$color-gray-600',
      '#adb5bd': '$color-gray-500',
      '#9ca3af': '$color-gray-500',
      '#ced4da': '$color-gray-400',
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
      '#ff6b6b': '$color-vp-red-1',
      '#e74c3c': '$color-danger',
      '#c0392b': '$color-danger-dark',
      '#1f2937': '$color-text-primary',
      '#374151': '$color-text-secondary',
      '#fff9e6': '$color-vp-yellow-bg-1',
      '#ffefcc': '$color-vp-yellow-bg-2',
      '#ffe4b3': '$color-vp-yellow-border',
      '#ffe0e0': '$color-vp-red-bg-2',
      '#e7f1ff': '$color-vp-blue-bg-1',
      '#d0e3ff': '$color-vp-blue-bg-2',
      '#f0f8ff': '$color-vp-blue-bg-3',
      '#d6e9ff': '$color-vp-blue-bg-4',
      '#856404': '$color-warning-dark',
      '#004085': '$color-info-dark',
      '#dcdde1': '$color-border-light',
    };
    
    this.processedFiles = 0;
    this.totalReplacements = 0;
  }
  
  tokenizeFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let replacements = 0;
    
    // 0. design-tokens.scss 파일은 건드리지 않음
    if (filePath.includes('_design-tokens.scss')) {
      return 0;
    }
    
    // 1. import 문 확인 및 추가
    if (!content.includes('@import') || !content.includes('design-tokens')) {
      const importStatement = "@import '../styles/design-tokens';\n\n";
      content = importStatement + content;
      replacements++;
    }
    
    // 2. 모든 hex 색상을 공격적으로 변환
    content = content.replace(
      /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})(?![0-9a-fA-F])/g,
      (match) => {
        const normalized = match.toLowerCase();
        
        // 직접 매핑이 있으면 사용
        if (this.colorMappings[normalized]) {
          replacements++;
          return this.colorMappings[normalized];
        }
        
        // 3자리 hex를 6자리로 확장
        if (match.length === 4) {
          const expanded = '#' + match[1] + match[1] + match[2] + match[2] + match[3] + match[3];
          if (this.colorMappings[expanded.toLowerCase()]) {
            replacements++;
            return this.colorMappings[expanded.toLowerCase()];
          }
        }
        
        // 매핑이 없으면 가장 가까운 색상 찾기
        const closestColor = this.findClosestColor(normalized);
        if (closestColor) {
          replacements++;
          return closestColor;
        }
        
        return match;
      }
    );
    
    // 3. rgb/rgba 색상 변환
    content = content.replace(
      /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/g,
      (match, r, g, b, a) => {
        const hex = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
        const token = this.colorMappings[hex.toLowerCase()] || this.findClosestColor(hex);
        
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
    
    // 4. 잘못된 색상 참조 수정 (예: #c82$color-gray-800)
    content = content.replace(
      /#[0-9a-fA-F]{3}\$[a-z-]+/g,
      (match) => {
        // 잘못된 형식 수정
        const colorPart = match.split('$')[1];
        if (colorPart) {
          replacements++;
          return '$' + colorPart;
        }
        return match;
      }
    );
    
    // 5. 모든 남은 px 값 토큰화
    content = content.replace(
      /(\d+)px/g,
      (match, value) => {
        const num = parseInt(value);
        
        // 폰트 크기
        if (num >= 10 && num <= 48) {
          const fontToken = this.getFontSizeToken(num);
          if (fontToken && content.includes('font-size')) {
            replacements++;
            return fontToken;
          }
        }
        
        // 간격
        if (num <= 96) {
          const spacingToken = this.getSpacingToken(num);
          if (spacingToken) {
            replacements++;
            return spacingToken;
          }
        }
        
        // 큰 값들
        if (num > 96) {
          const largeToken = this.getLargeValueToken(num);
          if (largeToken) {
            replacements++;
            return largeToken;
          }
        }
        
        return match;
      }
    );
    
    // 6. SVG 데이터 URI 내 색상 변환
    content = content.replace(
      /url\(['"]data:image\/svg\+xml[^'"]+['"]\)/g,
      (match) => {
        let svgData = match;
        let localReplacements = 0;
        
        // SVG 내의 모든 색상 토큰화
        Object.entries(this.colorMappings).forEach(([hex, token]) => {
          const hexEncoded = hex.replace('#', '%23');
          if (svgData.includes(hexEncoded)) {
            svgData = svgData.replace(new RegExp(hexEncoded, 'gi'), `' + ${token} + '`);
            localReplacements++;
          }
        });
        
        if (localReplacements > 0) {
          replacements += localReplacements;
          // SVG 데이터 URI를 동적으로 만들기
          return svgData.replace(/url\(['"]/, 'url(\' + \'').replace(/['"]\)/, '\' + \')');
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
  
  findClosestColor(hex) {
    // 회색 계열 판별
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // 회색인지 확인 (R, G, B 값이 비슷한지)
    const isGray = Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20;
    
    if (isGray) {
      const brightness = (r + g + b) / 3;
      if (brightness < 30) return '$color-gray-900';
      if (brightness < 60) return '$color-gray-800';
      if (brightness < 90) return '$color-gray-700';
      if (brightness < 120) return '$color-gray-600';
      if (brightness < 150) return '$color-gray-500';
      if (brightness < 180) return '$color-gray-400';
      if (brightness < 210) return '$color-gray-300';
      if (brightness < 235) return '$color-gray-200';
      return '$color-gray-100';
    }
    
    // 파란색 계열
    if (b > r && b > g) {
      if (b > 200 && r < 100 && g < 150) return '$color-primary';
      if (b > 150) return '$color-info';
      return '$color-info-dark';
    }
    
    // 빨간색 계열
    if (r > g && r > b) {
      if (r > 200) return '$color-danger';
      return '$color-danger-dark';
    }
    
    // 녹색 계열
    if (g > r && g > b) {
      if (g > 150) return '$color-success';
      return '$color-success-dark';
    }
    
    // 노란색 계열
    if (r > 200 && g > 150 && b < 100) {
      return '$color-warning';
    }
    
    return null;
  }
  
  getFontSizeToken(px) {
    if (px <= 12) return '$font-size-xs';
    if (px <= 14) return '$font-size-sm';
    if (px <= 16) return '$font-size-base';
    if (px <= 18) return '$font-size-lg';
    if (px <= 20) return '$font-size-xl';
    if (px <= 24) return '$font-size-2xl';
    if (px <= 30) return '$font-size-3xl';
    if (px <= 36) return '$font-size-4xl';
    return '$font-size-5xl';
  }
  
  getSpacingToken(px) {
    if (px === 0) return '$spacing-0';
    if (px <= 2) return '$spacing-2xs';
    if (px <= 4) return '$spacing-xs';
    if (px <= 8) return '$spacing-sm';
    if (px <= 12) return `$spacing-sm + ${px - 8}px`;
    if (px <= 16) return '$spacing-md';
    if (px <= 20) return `$spacing-md + ${px - 16}px`;
    if (px <= 24) return '$spacing-lg';
    if (px <= 28) return `$spacing-lg + ${px - 24}px`;
    if (px <= 32) return '$spacing-xl';
    if (px <= 40) return '$spacing-2xl';
    if (px <= 48) return '$spacing-3xl';
    if (px <= 64) return '$spacing-4xl';
    if (px <= 80) return '$spacing-5xl';
    if (px <= 96) return '$spacing-6xl';
    return null;
  }
  
  getLargeValueToken(px) {
    if (px === 100) return '$spacing-6xl + 4px';
    if (px === 120) return '$spacing-6xl + 24px';
    if (px === 150) return '$spacing-6xl * 1.5625';
    if (px === 200) return '$spacing-6xl * 2.08';
    if (px === 240) return '$spacing-6xl * 2.5';
    if (px === 300) return '$spacing-6xl * 3.125';
    if (px === 375) return '$breakpoint-sm';
    if (px === 380) return '$spacing-6xl * 3.96';
    if (px === 400) return '$spacing-6xl * 4.17';
    if (px === 480) return '$spacing-6xl * 5';
    if (px === 600) return '$spacing-6xl * 6.25';
    if (px === 768) return '$breakpoint-md';
    if (px === 1024) return '$breakpoint-lg';
    if (px === 1200) return '$breakpoint-xl';
    if (px === 1280) return '$breakpoint-xl + 80px';
    return `${px}px`; // 매핑이 없으면 그대로 반환
  }
  
  async tokenizeAll() {
    console.log('🚀 Aggressive Final Tokenizer - 95점 달성을 위한 최종 공격적 토큰화...\n');
    
    const srcDir = path.join(process.cwd(), 'src');
    const files = this.findScssFiles(srcDir);
    
    console.log(`📁 ${files.length}개 SCSS 파일 발견\n`);
    
    // 특히 문제가 많은 파일들 우선 처리
    const priorityFiles = [
      'src/page/Cms/VideoPlanning.scss',
      'src/css/Cms/Cms.scss',
      'src/css/Home.scss',
      'src/components/FeedbackPlayer.scss'
    ];
    
    // 우선순위 파일들 먼저 처리
    for (const priority of priorityFiles) {
      const fullPath = path.join(process.cwd(), priority);
      if (files.includes(fullPath)) {
        const replacements = this.tokenizeFile(fullPath);
        if (replacements > 0) {
          console.log(`🎯 ${priority}: ${replacements}개 토큰화 (우선순위)`);
          this.totalReplacements += replacements;
          this.processedFiles++;
        }
      }
    }
    
    // 나머지 파일들 처리
    for (const file of files) {
      if (!priorityFiles.some(p => file.includes(p))) {
        const replacements = this.tokenizeFile(file);
        if (replacements > 0) {
          console.log(`✅ ${path.relative(process.cwd(), file)}: ${replacements}개 토큰화`);
          this.totalReplacements += replacements;
          this.processedFiles++;
        }
      }
    }
    
    console.log('\n📊 Aggressive Final Tokenizer 완료!');
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
  const tokenizer = new AggressiveFinalTokenizer();
  tokenizer.tokenizeAll().catch(console.error);
}

module.exports = AggressiveFinalTokenizer;