#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * VideoPlanet 디자인 일치율 분석 도구 v2
 * 
 * 개선사항:
 * 1. 디자인 토큰 파일 자체는 분석에서 제외
 * 2. 데이터 URI 내 색상은 허용
 * 3. 더 정확한 토큰 사용률 계산
 * 4. 컴포넌트 통합 시스템 인식
 */

class DesignConsistencyAnalyzerV2 {
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
        used: 0,
        percentage: 0
      },
      componentConsistency: {},
      responsiveIssues: [],
      typographyConsistency: {},
      overallScore: 0,
      detailedScores: {}
    };
    
    // 토큰 사용 패턴
    this.tokenPatterns = {
      colors: /\$color-[a-z0-9-]+/g,
      spacing: /\$spacing-[a-z0-9-]+/g,
      fontSize: /\$font-size-[a-z0-9-]+/g,
      borderRadius: /\$border-radius-[a-z0-9-]+/g,
      shadow: /\$shadow(-[a-z0-9-]+)?/g,
      breakpoint: /\$breakpoint-[a-z]+/g,
      zIndex: /\$z-index-[a-z-]+/g,
      transition: /\$transition-[a-z-]+/g
    };
    
    // 허용된 하드코딩 값
    this.allowedHardcoded = {
      colors: ['transparent', 'inherit', 'currentColor'],
      spacing: ['auto', 'inherit', '0', '100%', '50%'],
      special: ['calc', 'var', 'url']
    };
  }

  async analyze() {
    console.log('🎨 VideoPlanet 디자인 일치율 분석 v2 시작...\n');

    // 1. SCSS 파일 분석
    await this.analyzeStyleFiles();
    
    // 2. 컴포넌트 일관성 분석
    await this.analyzeComponents();
    
    // 3. 토큰 사용률 계산
    this.calculateTokenUsage();
    
    // 4. 종합 점수 계산
    this.calculateOverallScore();
    
    // 5. 리포트 생성
    this.generateReport();
  }

  async analyzeStyleFiles() {
    console.log('📁 SCSS 파일 분석 중...');
    
    const scssFiles = this.findFiles('src', '.scss').filter(
      file => !file.includes('_design-tokens.scss') && 
              !file.includes('/tokens/') &&
              !file.includes('node_modules')
    );
    
    let totalCssProperties = 0;
    let tokenizedProperties = 0;
    
    for (const file of scssFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        // CSS 속성 라인인지 확인
        if (line.includes(':') && line.includes(';') && !line.trim().startsWith('//')) {
          totalCssProperties++;
          
          // 토큰 사용 여부 확인
          let hasToken = false;
          for (const [type, pattern] of Object.entries(this.tokenPatterns)) {
            if (pattern.test(line)) {
              hasToken = true;
              tokenizedProperties++;
              break;
            }
          }
          
          // 하드코딩된 값 찾기
          if (!hasToken) {
            this.findHardcodedValues(line, file);
          }
        }
      }
    }
    
    this.results.tokenUsage.total = totalCssProperties;
    this.results.tokenUsage.used = tokenizedProperties;
    this.results.tokenUsage.percentage = totalCssProperties > 0 
      ? Math.round((tokenizedProperties / totalCssProperties) * 100)
      : 0;
    
    console.log(`✅ ${scssFiles.length}개 SCSS 파일 분석 완료`);
  }

  findHardcodedValues(line, file) {
    // 데이터 URI는 제외
    if (line.includes('data:') || line.includes('url(')) {
      return;
    }
    
    // 색상 찾기
    const hexColors = line.match(/#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])/g) || [];
    const rgbColors = line.match(/rgba?\([^)]+\)/g) || [];
    
    [...hexColors, ...rgbColors].forEach(color => {
      if (!this.allowedHardcoded.colors.includes(color)) {
        this.results.hardcodedValues.colors.push({
          file: path.relative(process.cwd(), file),
          value: color,
          line: line.trim()
        });
      }
    });
    
    // px 값 찾기
    const pxValues = line.match(/\d+px/g) || [];
    pxValues.forEach(px => {
      // calc() 내부의 px는 허용
      if (!line.includes('calc(')) {
        this.results.hardcodedValues.spacing.push({
          file: path.relative(process.cwd(), file),
          value: px,
          line: line.trim()
        });
      }
    });
  }

  async analyzeComponents() {
    console.log('🧩 컴포넌트 일관성 분석 중...');
    
    const componentFiles = this.findFiles('src', '.jsx', '.tsx');
    const componentUsage = {
      buttons: {
        unified: 0,
        custom: 0
      },
      inputs: {
        unified: 0,
        custom: 0
      },
      cards: {
        unified: 0,
        custom: 0
      },
      modals: {
        unified: 0,
        custom: 0
      }
    };
    
    for (const file of componentFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // 통합 컴포넌트 사용 확인
      if (content.includes('import Button from') && content.includes('/unified/Button')) {
        componentUsage.buttons.unified++;
      } else if (content.match(/<button|<Button/)) {
        componentUsage.buttons.custom++;
      }
      
      if (content.includes('import Input from') && content.includes('/unified/Input')) {
        componentUsage.inputs.unified++;
      } else if (content.match(/<input|<Input/)) {
        componentUsage.inputs.custom++;
      }
    }
    
    // 일관성 점수 계산
    for (const [component, usage] of Object.entries(componentUsage)) {
      const total = usage.unified + usage.custom;
      if (total > 0) {
        this.results.componentConsistency[component] = 
          Math.round((usage.unified / total) * 100);
      } else {
        this.results.componentConsistency[component] = 100;
      }
    }
    
    console.log(`✅ ${componentFiles.length}개 컴포넌트 파일 분석 완료`);
  }

  calculateTokenUsage() {
    // 더 정교한 토큰 사용률 계산
    const fileGroups = {
      components: { count: 0, tokenized: 0 },
      pages: { count: 0, tokenized: 0 },
      styles: { count: 0, tokenized: 0 }
    };
    
    // 파일별 토큰 사용률 계산
    const scssFiles = this.findFiles('src', '.scss').filter(
      file => !file.includes('_design-tokens.scss') && !file.includes('/tokens/')
    );
    
    for (const file of scssFiles) {
      const content = fs.readFileSync(file, 'utf8');
      let hasTokens = false;
      
      for (const pattern of Object.values(this.tokenPatterns)) {
        if (pattern.test(content)) {
          hasTokens = true;
          break;
        }
      }
      
      // 파일 카테고리 분류
      if (file.includes('/components/')) {
        fileGroups.components.count++;
        if (hasTokens) fileGroups.components.tokenized++;
      } else if (file.includes('/page/')) {
        fileGroups.pages.count++;
        if (hasTokens) fileGroups.pages.tokenized++;
      } else {
        fileGroups.styles.count++;
        if (hasTokens) fileGroups.styles.tokenized++;
      }
    }
    
    // 카테고리별 점수 저장
    this.results.detailedScores.tokenUsageByCategory = fileGroups;
  }

  calculateOverallScore() {
    // 각 항목별 가중치와 점수
    const scores = {
      // 토큰 사용률 (40%)
      tokenUsage: {
        weight: 0.4,
        score: this.results.tokenUsage.percentage
      },
      
      // 하드코딩 값 (30%)
      hardcoding: {
        weight: 0.3,
        score: Math.max(0, 100 - (
          this.results.hardcodedValues.colors.length * 0.5 +
          this.results.hardcodedValues.spacing.length * 0.3
        ))
      },
      
      // 컴포넌트 일관성 (20%)
      componentConsistency: {
        weight: 0.2,
        score: Object.values(this.results.componentConsistency)
          .reduce((sum, score) => sum + score, 0) / 
          Object.keys(this.results.componentConsistency).length
      },
      
      // 디자인 시스템 준수 (10%)
      designSystem: {
        weight: 0.1,
        score: this.calculateDesignSystemScore()
      }
    };
    
    // 전체 점수 계산
    this.results.overallScore = Math.round(
      Object.values(scores).reduce((sum, item) => sum + (item.score * item.weight), 0)
    );
    
    // 세부 점수 저장
    this.results.detailedScores = { ...this.results.detailedScores, ...scores };
  }

  calculateDesignSystemScore() {
    // 디자인 시스템 파일 존재 여부 확인
    let score = 0;
    
    if (fs.existsSync('src/styles/_design-tokens.scss')) score += 20;
    if (fs.existsSync('src/components/unified/Button')) score += 20;
    if (fs.existsSync('.stylelintrc.json')) score += 20;
    if (fs.existsSync('.husky/pre-commit')) score += 20;
    if (fs.existsSync('src/design-system')) score += 20;
    
    return score;
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
          percentage: this.results.tokenUsage.percentage,
          used: this.results.tokenUsage.used,
          total: this.results.tokenUsage.total,
          recommendation: this.results.tokenUsage.percentage < 50 
            ? '디자인 토큰 사용을 늘려주세요' : '훌륭합니다!'
        },
        hardcodedValues: {
          colors: this.results.hardcodedValues.colors.length,
          spacing: this.results.hardcodedValues.spacing.length,
          topOffenders: this.getTopOffenders()
        },
        componentConsistency: this.results.componentConsistency,
        responsiveIssues: this.results.responsiveIssues,
        brandColorUsage: this.results.brandColorUsage,
        detailedScores: this.results.detailedScores
      },
      recommendations: this.generateRecommendations()
    };
    
    // 리포트 파일 저장
    fs.writeFileSync(
      'design-consistency-report-v2.json',
      JSON.stringify(report, null, 2)
    );
    
    // 콘솔 출력
    console.log('\n📊 디자인 일치율 분석 결과 (v2)\n');
    console.log(`전체 점수: ${report.summary.overallScore}/100 (${report.summary.grade})`);
    console.log('\n세부 점수:');
    console.log(`- 토큰 사용률: ${report.details.tokenUsage.percentage}% (${report.details.tokenUsage.used}/${report.details.tokenUsage.total})`);
    console.log(`- 하드코딩된 색상: ${report.details.hardcodedValues.colors}개`);
    console.log(`- 하드코딩된 간격: ${report.details.hardcodedValues.spacing}개`);
    console.log(`- 버튼 일관성: ${report.details.componentConsistency.buttons}%`);
    console.log(`- 입력 필드 일관성: ${report.details.componentConsistency.inputs}%`);
    
    console.log('\n💡 주요 개선사항:');
    report.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
    
    console.log('\n✅ 상세 리포트가 design-consistency-report-v2.json에 저장되었습니다.');
  }

  // 유틸리티 함수들
  findFiles(dir, ...extensions) {
    const results = [];
    
    try {
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
    } catch (error) {
      // 디렉토리 읽기 실패 시 무시
    }
    
    return results;
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
    
    if (this.results.tokenUsage.percentage < 50) {
      recommendations.push('디자인 토큰 사용률을 50% 이상으로 높이세요');
    }
    
    if (this.results.hardcodedValues.colors.length > 10) {
      recommendations.push(`${this.results.hardcodedValues.colors.length}개의 하드코딩된 색상을 디자인 토큰으로 변경하세요`);
    }
    
    if (this.results.componentConsistency.buttons < 80) {
      recommendations.push('버튼 컴포넌트를 통합 시스템으로 마이그레이션하세요');
    }
    
    if (this.results.componentConsistency.inputs < 80) {
      recommendations.push('입력 필드 컴포넌트를 통합 시스템으로 마이그레이션하세요');
    }
    
    return recommendations;
  }
}

// 실행
if (require.main === module) {
  const analyzer = new DesignConsistencyAnalyzerV2();
  analyzer.analyze().catch(console.error);
}

module.exports = DesignConsistencyAnalyzerV2;