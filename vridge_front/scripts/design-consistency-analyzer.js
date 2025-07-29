#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

/**
 * VideoPlanet 디자인 일치율 분석 도구
 * 
 * 분석 항목:
 * 1. 브랜드 색상 사용률
 * 2. 디자인 토큰 활용도
 * 3. 컴포넌트 일관성
 * 4. 반응형 브레이크포인트 준수
 * 5. 타이포그래피 일관성
 */

// VideoPlanet 브랜드 가이드라인
const BRAND_COLORS = {
  primary: '#1631F8',
  primaryDark: '#0F23C9',
  danger: '#dc3545',
  success: '#28a745',
  warning: '#ffc107',
  info: '#17a2b8',
  dark: '#343a40',
  light: '#f8f9fa'
};

const DESIGN_TOKENS = {
  // 색상 토큰
  colors: [
    '$color-primary', '$color-primary-dark', '$color-primary-light',
    '$color-danger', '$color-success', '$color-warning', '$color-info'
  ],
  // 간격 토큰
  spacing: [
    '$spacing-xs', '$spacing-sm', '$spacing-md', '$spacing-lg', '$spacing-xl', '$spacing-2xl'
  ],
  // 폰트 크기 토큰
  fontSize: [
    '$font-size-xs', '$font-size-sm', '$font-size-base', '$font-size-lg', '$font-size-xl'
  ],
  // 그림자 토큰
  shadows: [
    '$shadow-sm', '$shadow', '$shadow-lg', '$shadow-xl'
  ]
};

const STANDARD_BREAKPOINTS = {
  mobile: 375,
  tablet: 768,
  desktop: 1280
};

class DesignConsistencyAnalyzer {
  constructor() {
    this.results = {
      brandColorUsage: {},
      hardcodedValues: {
        colors: [],
        spacing: [],
        fontSize: []
      },
      tokenUsage: {
        total: 0,
        used: 0
      },
      componentConsistency: {},
      responsiveIssues: [],
      typographyConsistency: {},
      overallScore: 0
    };
  }

  async analyze() {
    console.log('🎨 VideoPlanet 디자인 일치율 분석 시작...\n');

    // 1. SCSS 파일 분석
    await this.analyzeStyleFiles();
    
    // 2. 컴포넌트 일관성 분석
    await this.analyzeComponents();
    
    // 3. 런타임 스타일 분석 (옵션)
    if (process.env.SKIP_RUNTIME !== 'true') {
      try {
        await this.analyzeRuntimeStyles();
      } catch (error) {
        console.log('⚠️  런타임 분석 스킵 (브라우저 설치 필요)');
      }
    }
    
    // 4. 종합 점수 계산
    this.calculateOverallScore();
    
    // 5. 리포트 생성
    this.generateReport();
  }

  async analyzeStyleFiles() {
    console.log('📁 SCSS 파일 분석 중...');
    
    const scssFiles = this.findFiles('src', '.scss');
    let totalLines = 0;
    let tokenUsageCount = 0;
    
    for (const file of scssFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      totalLines += lines.length;
      
      // 하드코딩된 색상 찾기
      const colorRegex = /#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/g;
      const hardcodedColors = content.match(colorRegex) || [];
      
      hardcodedColors.forEach(color => {
        // 브랜드 색상인지 확인
        const isBrandColor = Object.values(BRAND_COLORS).some(
          brandColor => this.normalizeColor(color) === this.normalizeColor(brandColor)
        );
        
        if (!isBrandColor) {
          this.results.hardcodedValues.colors.push({
            file: path.relative(process.cwd(), file),
            value: color,
            line: this.findLineNumber(content, color)
          });
        }
      });
      
      // 하드코딩된 간격 찾기
      const spacingRegex = /padding:|margin:|gap:|top:|right:|bottom:|left:|width:|height:\s*\d+px/g;
      const hardcodedSpacing = content.match(spacingRegex) || [];
      
      hardcodedSpacing.forEach(spacing => {
        const value = spacing.match(/\d+px/);
        if (value && !this.isStandardSpacing(value[0])) {
          this.results.hardcodedValues.spacing.push({
            file: path.relative(process.cwd(), file),
            value: value[0],
            line: this.findLineNumber(content, spacing)
          });
        }
      });
      
      // 디자인 토큰 사용 카운트
      Object.values(DESIGN_TOKENS).flat().forEach(token => {
        const tokenRegex = new RegExp(token.replace('$', '\\$'), 'g');
        const matches = content.match(tokenRegex);
        if (matches) {
          tokenUsageCount += matches.length;
        }
      });
    }
    
    this.results.tokenUsage.total = totalLines;
    this.results.tokenUsage.used = tokenUsageCount;
    
    console.log(`✅ ${scssFiles.length}개 SCSS 파일 분석 완료`);
  }

  async analyzeComponents() {
    console.log('🧩 컴포넌트 일관성 분석 중...');
    
    const componentFiles = this.findFiles('src', '.jsx', '.tsx');
    const componentPatterns = {
      buttons: [],
      inputs: [],
      cards: [],
      modals: []
    };
    
    for (const file of componentFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // 버튼 패턴 분석
      const buttonMatches = content.match(/<(button|Button)[^>]*>/g) || [];
      buttonMatches.forEach(match => {
        const className = match.match(/className=["']([^"']+)["']/);
        if (className) {
          componentPatterns.buttons.push({
            file: path.relative(process.cwd(), file),
            className: className[1]
          });
        }
      });
      
      // 입력 필드 패턴 분석
      const inputMatches = content.match(/<(input|Input)[^>]*>/g) || [];
      inputMatches.forEach(match => {
        const className = match.match(/className=["']([^"']+)["']/);
        if (className) {
          componentPatterns.inputs.push({
            file: path.relative(process.cwd(), file),
            className: className[1]
          });
        }
      });
    }
    
    // 일관성 점수 계산
    this.results.componentConsistency = {
      buttons: this.calculateConsistencyScore(componentPatterns.buttons),
      inputs: this.calculateConsistencyScore(componentPatterns.inputs),
      cards: this.calculateConsistencyScore(componentPatterns.cards),
      modals: this.calculateConsistencyScore(componentPatterns.modals)
    };
    
    console.log(`✅ ${componentFiles.length}개 컴포넌트 파일 분석 완료`);
  }

  async analyzeRuntimeStyles() {
    console.log('🌐 런타임 스타일 분석 중...');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // 주요 페이지 분석
    const pages = [
      { name: '홈', path: '/' },
      { name: '로그인', path: '/login' },
      { name: '프로젝트 관리', path: '/cmshome' },
      { name: '피드백', path: '/feedback/1' }
    ];
    
    for (const pageInfo of pages) {
      try {
        await page.goto(`http://localhost:3000${pageInfo.path}`, {
          waitUntil: 'networkidle'
        });
        
        // 실제 사용된 색상 추출
        const usedColors = await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          const colors = new Set();
          
          elements.forEach(el => {
            const styles = window.getComputedStyle(el);
            colors.add(styles.color);
            colors.add(styles.backgroundColor);
            colors.add(styles.borderColor);
          });
          
          return Array.from(colors).filter(c => c && c !== 'rgba(0, 0, 0, 0)');
        });
        
        // 브랜드 색상 사용률 계산
        usedColors.forEach(color => {
          const normalizedColor = this.normalizeColor(color);
          Object.entries(BRAND_COLORS).forEach(([name, brandColor]) => {
            if (this.normalizeColor(brandColor) === normalizedColor) {
              this.results.brandColorUsage[name] = 
                (this.results.brandColorUsage[name] || 0) + 1;
            }
          });
        });
        
        // 반응형 체크
        for (const [breakpoint, width] of Object.entries(STANDARD_BREAKPOINTS)) {
          await page.setViewportSize({ width, height: 720 });
          await page.waitForTimeout(500);
          
          const hasOverflow = await page.evaluate(() => {
            return document.body.scrollWidth > window.innerWidth;
          });
          
          if (hasOverflow) {
            this.results.responsiveIssues.push({
              page: pageInfo.name,
              breakpoint,
              issue: 'horizontal overflow'
            });
          }
        }
        
      } catch (error) {
        console.warn(`⚠️  ${pageInfo.name} 페이지 분석 실패:`, error.message);
      }
    }
    
    await browser.close();
    console.log('✅ 런타임 스타일 분석 완료');
  }

  calculateConsistencyScore(patterns) {
    if (patterns.length === 0) return 100;
    
    const uniquePatterns = new Set(patterns.map(p => p.className));
    const consistencyRatio = 1 - (uniquePatterns.size - 1) / patterns.length;
    
    return Math.round(consistencyRatio * 100);
  }

  calculateOverallScore() {
    const scores = {
      // 디자인 토큰 사용률 (30%)
      tokenUsage: (this.results.tokenUsage.used / this.results.tokenUsage.total) * 100 * 0.3,
      
      // 하드코딩 감점 (30%)
      hardcoding: Math.max(0, 100 - (
        this.results.hardcodedValues.colors.length +
        this.results.hardcodedValues.spacing.length
      )) * 0.3,
      
      // 컴포넌트 일관성 (20%)
      consistency: Object.values(this.results.componentConsistency)
        .reduce((sum, score) => sum + score, 0) / 
        Object.keys(this.results.componentConsistency).length * 0.2,
      
      // 반응형 이슈 (20%)
      responsive: Math.max(0, 100 - this.results.responsiveIssues.length * 10) * 0.2
    };
    
    this.results.overallScore = Math.round(
      Object.values(scores).reduce((sum, score) => sum + score, 0)
    );
  }

  generateReport() {
    const report = {
      summary: {
        overallScore: this.results.overallScore,
        grade: this.getGrade(this.results.overallScore),
        timestamp: new Date().toISOString()
      },
      details: {
        tokenUsage: {
          percentage: Math.round((this.results.tokenUsage.used / this.results.tokenUsage.total) * 100),
          recommendation: this.results.tokenUsage.used < this.results.tokenUsage.total * 0.5 
            ? '디자인 토큰 사용을 늘려주세요' : '좋습니다!'
        },
        hardcodedValues: {
          colors: this.results.hardcodedValues.colors.length,
          spacing: this.results.hardcodedValues.spacing.length,
          topOffenders: this.getTopOffenders()
        },
        componentConsistency: this.results.componentConsistency,
        responsiveIssues: this.results.responsiveIssues,
        brandColorUsage: this.results.brandColorUsage
      },
      recommendations: this.generateRecommendations()
    };
    
    // 리포트 파일 저장
    fs.writeFileSync(
      'design-consistency-report.json',
      JSON.stringify(report, null, 2)
    );
    
    // 콘솔 출력
    console.log('\n📊 디자인 일치율 분석 결과\n');
    console.log(`전체 점수: ${report.summary.overallScore}/100 (${report.summary.grade})`);
    console.log('\n세부 점수:');
    console.log(`- 토큰 사용률: ${report.details.tokenUsage.percentage}%`);
    console.log(`- 하드코딩된 색상: ${report.details.hardcodedValues.colors}개`);
    console.log(`- 하드코딩된 간격: ${report.details.hardcodedValues.spacing}개`);
    console.log(`- 버튼 일관성: ${report.details.componentConsistency.buttons}%`);
    console.log(`- 반응형 이슈: ${report.details.responsiveIssues.length}개`);
    
    console.log('\n💡 주요 개선사항:');
    report.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
    
    console.log('\n✅ 상세 리포트가 design-consistency-report.json에 저장되었습니다.');
  }

  // 유틸리티 함수들
  findFiles(dir, ...extensions) {
    const results = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.includes('node_modules')) {
        results.push(...this.findFiles(fullPath, ...extensions));
      } else if (extensions.some(ext => file.endsWith(ext))) {
        results.push(fullPath);
      }
    }
    
    return results;
  }

  normalizeColor(color) {
    // 색상을 통일된 형식으로 변환
    return color.toLowerCase().replace(/\s/g, '');
  }

  isStandardSpacing(value) {
    const standardValues = ['0px', '4px', '8px', '12px', '16px', '20px', '24px', '32px', '40px', '48px'];
    return standardValues.includes(value);
  }

  findLineNumber(content, searchStr) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchStr)) {
        return i + 1;
      }
    }
    return 0;
  }

  getTopOffenders() {
    const allIssues = [
      ...this.results.hardcodedValues.colors,
      ...this.results.hardcodedValues.spacing
    ];
    
    const fileCount = {};
    allIssues.forEach(issue => {
      fileCount[issue.file] = (fileCount[issue.file] || 0) + 1;
    });
    
    return Object.entries(fileCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([file, count]) => ({ file, count }));
  }

  getGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 65) return 'D+';
    if (score >= 60) return 'D';
    return 'F';
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.tokenUsage.used < this.results.tokenUsage.total * 0.5) {
      recommendations.push('디자인 토큰 사용률을 50% 이상으로 높이세요');
    }
    
    if (this.results.hardcodedValues.colors.length > 10) {
      recommendations.push(`${this.results.hardcodedValues.colors.length}개의 하드코딩된 색상을 디자인 토큰으로 변경하세요`);
    }
    
    if (this.results.hardcodedValues.spacing.length > 20) {
      recommendations.push('간격 값에 $spacing-* 토큰을 사용하세요');
    }
    
    if (this.results.componentConsistency.buttons < 80) {
      recommendations.push('버튼 컴포넌트 스타일을 통일하세요');
    }
    
    if (this.results.responsiveIssues.length > 0) {
      recommendations.push('반응형 레이아웃 이슈를 해결하세요');
    }
    
    return recommendations;
  }
}

// 실행
if (require.main === module) {
  const analyzer = new DesignConsistencyAnalyzer();
  analyzer.analyze().catch(console.error);
}

module.exports = DesignConsistencyAnalyzer;