#!/usr/bin/env node

/**
 * Pixel Perfect Validator
 * 
 * 이 스크립트는 Fronty의 철학인 "Every pixel must be in its rightful place"를
 * 구현하여 UI의 모든 요소가 디자인 시스템과 정확히 일치하는지 검증합니다.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class PixelPerfectValidator {
  constructor() {
    this.violations = [];
    this.warnings = [];
    this.designTokens = this.loadDesignTokens();
    this.totalScore = 100;
  }

  loadDesignTokens() {
    // 디자인 토큰 파일에서 값 추출 (간단한 파싱)
    const tokensPath = path.join(__dirname, '..', 'src', 'styles', '_design-tokens.scss');
    const content = fs.readFileSync(tokensPath, 'utf8');
    
    const tokens = {
      colors: {},
      spacing: {},
      borderRadius: {},
      shadows: {},
      typography: {}
    };

    // 색상 토큰 추출
    const colorMatches = content.matchAll(/\$color-[a-z-]+:\s*([^;]+);/g);
    for (const match of colorMatches) {
      tokens.colors[match[0].split(':')[0].trim()] = match[1].trim();
    }

    // 간격 토큰 추출
    const spacingMatches = content.matchAll(/\$spacing-[a-z0-9-]+:\s*([^;]+);/g);
    for (const match of spacingMatches) {
      tokens.spacing[match[0].split(':')[0].trim()] = match[1].trim();
    }

    return tokens;
  }

  validateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // 1. !important 검증
    const importantMatches = content.match(/!important/g);
    if (importantMatches) {
      this.violations.push({
        file: filePath,
        type: 'CRITICAL',
        issue: `${importantMatches.length}개의 !important 발견`,
        impact: -importantMatches.length * 0.5,
        line: this.findLineNumbers(content, '!important')
      });
    }

    // 2. 하드코딩된 색상 검증
    const hardcodedColors = content.match(/#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])/g);
    if (hardcodedColors) {
      const uniqueColors = [...new Set(hardcodedColors)];
      this.violations.push({
        file: filePath,
        type: 'HIGH',
        issue: `${uniqueColors.length}개의 하드코딩된 색상`,
        details: uniqueColors,
        impact: -uniqueColors.length * 0.3
      });
    }

    // 3. 하드코딩된 픽셀 값 검증
    const pixelValues = content.match(/\d+px/g);
    if (pixelValues) {
      const nonTokenPixels = pixelValues.filter(px => {
        const value = parseInt(px);
        // 8의 배수가 아닌 값은 토큰이 아닐 가능성이 높음
        return value % 8 !== 0 && value !== 0;
      });
      
      if (nonTokenPixels.length > 0) {
        this.warnings.push({
          file: filePath,
          type: 'MEDIUM',
          issue: `${nonTokenPixels.length}개의 비표준 픽셀 값`,
          details: [...new Set(nonTokenPixels)],
          impact: -nonTokenPixels.length * 0.1
        });
      }
    }

    // 4. 일관되지 않은 border-radius 검증
    const borderRadiusValues = content.match(/border-radius:\s*([^;]+);/g);
    if (borderRadiusValues) {
      const nonTokenRadius = borderRadiusValues.filter(value => {
        return !value.includes('$border-radius') && !value.includes('$radius');
      });
      
      if (nonTokenRadius.length > 0) {
        this.warnings.push({
          file: filePath,
          type: 'MEDIUM',
          issue: `${nonTokenRadius.length}개의 하드코딩된 border-radius`,
          impact: -nonTokenRadius.length * 0.2
        });
      }
    }

    // 5. 중복 클래스명 검증
    const classNames = content.match(/\.[a-zA-Z-_]+\s*{/g);
    if (classNames) {
      const duplicates = this.findDuplicates(classNames);
      if (duplicates.length > 0) {
        this.warnings.push({
          file: filePath,
          type: 'LOW',
          issue: `${duplicates.length}개의 중복 클래스 정의`,
          details: duplicates,
          impact: -duplicates.length * 0.1
        });
      }
    }

    // 6. 미디어 쿼리 일관성 검증
    const mediaQueries = content.match(/@media[^{]+/g);
    if (mediaQueries) {
      const nonStandardQueries = mediaQueries.filter(query => {
        return !query.includes('$breakpoint');
      });
      
      if (nonStandardQueries.length > 0) {
        this.violations.push({
          file: filePath,
          type: 'HIGH',
          issue: `${nonStandardQueries.length}개의 비표준 미디어 쿼리`,
          details: nonStandardQueries,
          impact: -nonStandardQueries.length * 0.4
        });
      }
    }
  }

  findLineNumbers(content, pattern) {
    const lines = content.split('\n');
    const results = [];
    lines.forEach((line, index) => {
      if (line.includes(pattern)) {
        results.push(index + 1);
      }
    });
    return results;
  }

  findDuplicates(arr) {
    const seen = {};
    const duplicates = [];
    
    arr.forEach(item => {
      const cleaned = item.replace(/\s*{/, '');
      if (seen[cleaned]) {
        duplicates.push(cleaned);
      }
      seen[cleaned] = true;
    });
    
    return [...new Set(duplicates)];
  }

  generateReport() {
    // 점수 계산
    let currentScore = this.totalScore;
    
    this.violations.forEach(v => {
      currentScore += v.impact;
    });
    
    this.warnings.forEach(w => {
      currentScore += w.impact;
    });

    currentScore = Math.max(0, Math.min(100, currentScore));

    // 등급 산정
    let grade = 'F';
    if (currentScore >= 95) grade = 'A+';
    else if (currentScore >= 90) grade = 'A';
    else if (currentScore >= 85) grade = 'B+';
    else if (currentScore >= 80) grade = 'B';
    else if (currentScore >= 75) grade = 'C+';
    else if (currentScore >= 70) grade = 'C';
    else if (currentScore >= 65) grade = 'D+';
    else if (currentScore >= 60) grade = 'D';

    const report = {
      timestamp: new Date().toISOString(),
      score: Math.round(currentScore),
      grade,
      totalViolations: this.violations.length,
      totalWarnings: this.warnings.length,
      criticalIssues: this.violations.filter(v => v.type === 'CRITICAL'),
      highPriorityIssues: this.violations.filter(v => v.type === 'HIGH'),
      mediumPriorityIssues: this.warnings.filter(w => w.type === 'MEDIUM'),
      lowPriorityIssues: this.warnings.filter(w => w.type === 'LOW'),
      topOffenders: this.getTopOffenders(),
      recommendations: this.generateRecommendations(currentScore)
    };

    return report;
  }

  getTopOffenders() {
    const fileScores = {};
    
    [...this.violations, ...this.warnings].forEach(issue => {
      if (!fileScores[issue.file]) {
        fileScores[issue.file] = 0;
      }
      fileScores[issue.file] += Math.abs(issue.impact);
    });

    return Object.entries(fileScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([file, impact]) => ({
        file: path.relative(process.cwd(), file),
        impactScore: Math.round(impact * 10) / 10
      }));
  }

  generateRecommendations(score) {
    const recommendations = [];

    if (score < 60) {
      recommendations.push({
        priority: 'CRITICAL',
        action: '즉시 !important 사용을 제거하세요. CSS 특정성으로 해결 가능합니다.',
        impact: '+15점'
      });
    }

    if (this.violations.filter(v => v.issue.includes('하드코딩된 색상')).length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: '모든 하드코딩된 색상을 디자인 토큰으로 교체하세요.',
        impact: '+10점'
      });
    }

    if (this.warnings.filter(w => w.issue.includes('비표준 픽셀')).length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: '8px 그리드 시스템을 준수하여 간격을 조정하세요.',
        impact: '+5점'
      });
    }

    return recommendations;
  }

  run() {
    console.log('🔍 Pixel Perfect Validation 시작...\n');

    // SCSS 파일 검색
    const scssFiles = glob.sync('src/**/*.scss', {
      ignore: ['**/node_modules/**', '**/design-tokens.scss']
    });

    console.log(`📁 ${scssFiles.length}개의 SCSS 파일 검증 중...\n`);

    // 각 파일 검증
    scssFiles.forEach(file => {
      this.validateFile(file);
    });

    // 리포트 생성
    const report = this.generateReport();

    // 콘솔 출력
    console.log('📊 Pixel Perfect Validation 결과\n');
    console.log(`점수: ${report.score}/100 (${report.grade}등급)`);
    console.log(`위반사항: ${report.totalViolations}개`);
    console.log(`경고사항: ${report.totalWarnings}개\n`);

    if (report.criticalIssues.length > 0) {
      console.log('🚨 치명적 문제:');
      report.criticalIssues.forEach(issue => {
        console.log(`  - ${path.relative(process.cwd(), issue.file)}: ${issue.issue}`);
      });
      console.log('');
    }

    if (report.topOffenders.length > 0) {
      console.log('📍 가장 문제가 많은 파일:');
      report.topOffenders.forEach(file => {
        console.log(`  - ${file.file}: -${file.impactScore}점`);
      });
      console.log('');
    }

    if (report.recommendations.length > 0) {
      console.log('💡 개선 권장사항:');
      report.recommendations.forEach(rec => {
        console.log(`  [${rec.priority}] ${rec.action} (${rec.impact})`);
      });
    }

    // JSON 리포트 저장
    fs.writeFileSync(
      'pixel-perfect-report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('\n✅ 상세 리포트가 pixel-perfect-report.json에 저장되었습니다.');

    // 점수가 낮으면 종료 코드 1 반환
    if (report.score < 70) {
      console.log('\n❌ UI 품질이 기준에 미달합니다. 즉시 개선이 필요합니다.');
      process.exit(1);
    }
  }
}

// 실행
const validator = new PixelPerfectValidator();
validator.run();