#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 건강도 점수 계산
class StyleHealthChecker {
  constructor() {
    this.scores = {
      noHardcoding: 100,
      noImportant: 100,
      useTokens: 100,
      noDuplication: 100,
      fileOrganization: 100,
      performance: 100
    };
    
    this.issues = [];
    this.recommendations = [];
  }
  
  // 하드코딩 검사
  checkHardcoding(files) {
    let totalHardcoded = 0;
    let totalValues = 0;
    
    files.forEach(file => {
      const content = fs.readFileSync(file.path, 'utf8');
      
      // 색상 하드코딩
      const colorMatches = content.match(/#[0-9a-fA-F]{3,6}/g) || [];
      const validColors = colorMatches.filter(color => {
        const line = content.split('\n').find(l => l.includes(color));
        return line && !line.includes('$') && !line.includes('var(');
      });
      
      // 픽셀 하드코딩
      const pixelMatches = content.match(/\d+px/g) || [];
      const validPixels = pixelMatches.filter(pixel => {
        const line = content.split('\n').find(l => l.includes(pixel));
        return line && !line.includes('$') && !line.includes('var(');
      });
      
      totalHardcoded += validColors.length + validPixels.length;
      totalValues += colorMatches.length + pixelMatches.length;
      
      if (validColors.length > 5 || validPixels.length > 10) {
        this.issues.push({
          type: 'hardcoding',
          severity: 'high',
          file: file.path,
          message: `하드코딩된 값: 색상 ${validColors.length}개, 픽셀 ${validPixels.length}개`
        });
      }
    });
    
    if (totalValues > 0) {
      this.scores.noHardcoding = Math.max(0, 100 - (totalHardcoded / totalValues * 100));
    }
  }
  
  // !important 검사
  checkImportant(files) {
    let totalImportant = 0;
    let totalDeclarations = 0;
    
    files.forEach(file => {
      const content = fs.readFileSync(file.path, 'utf8');
      const importantCount = (content.match(/!important/g) || []).length;
      const declarationCount = (content.match(/:[^;]+;/g) || []).length;
      
      totalImportant += importantCount;
      totalDeclarations += declarationCount;
      
      if (importantCount > 10) {
        this.issues.push({
          type: 'important',
          severity: 'high',
          file: file.path,
          message: `!important ${importantCount}개 사용`
        });
      }
    });
    
    if (totalDeclarations > 0) {
      this.scores.noImportant = Math.max(0, 100 - (totalImportant / totalDeclarations * 100));
    }
  }
  
  // 디자인 토큰 사용률
  checkTokenUsage(files) {
    let tokenUsage = 0;
    let totalUsage = 0;
    
    files.forEach(file => {
      const content = fs.readFileSync(file.path, 'utf8');
      
      // 토큰 사용
      const tokenMatches = content.match(/\$[a-zA-Z-]+|var\(--[a-zA-Z-]+\)/g) || [];
      tokenUsage += tokenMatches.length;
      
      // 전체 값
      const valueMatches = content.match(/:\s*[^;]+;/g) || [];
      totalUsage += valueMatches.length;
    });
    
    if (totalUsage > 0) {
      this.scores.useTokens = (tokenUsage / totalUsage * 100);
    }
    
    if (this.scores.useTokens < 50) {
      this.recommendations.push({
        type: 'tokens',
        message: '디자인 토큰 사용률이 낮습니다. 하드코딩된 값을 토큰으로 교체하세요.'
      });
    }
  }
  
  // 중복 검사
  checkDuplication(files) {
    const patterns = new Map();
    
    files.forEach(file => {
      const content = fs.readFileSync(file.path, 'utf8');
      const classes = content.match(/\.[a-zA-Z0-9_-]+\s*{[^}]+}/g) || [];
      
      classes.forEach(classBlock => {
        const className = classBlock.match(/\.([a-zA-Z0-9_-]+)/)[1];
        if (!patterns.has(className)) {
          patterns.set(className, []);
        }
        patterns.get(className).push(file.path);
      });
    });
    
    let duplicateCount = 0;
    patterns.forEach((files, className) => {
      if (files.length > 1) {
        duplicateCount++;
      }
    });
    
    if (patterns.size > 0) {
      this.scores.noDuplication = Math.max(0, 100 - (duplicateCount / patterns.size * 100));
    }
  }
  
  // 파일 구조 검사
  checkFileOrganization(files) {
    const fileGroups = new Map();
    let score = 100;
    
    files.forEach(file => {
      const dir = path.dirname(file.path);
      if (!fileGroups.has(dir)) {
        fileGroups.set(dir, 0);
      }
      fileGroups.set(dir, fileGroups.get(dir) + 1);
    });
    
    // Fix, Temp, Old 등의 파일 검사
    const badPatterns = /Fix|Temp|Old|Backup|Copy|Test/i;
    const badFiles = files.filter(f => badPatterns.test(f.path));
    
    if (badFiles.length > 0) {
      score -= (badFiles.length / files.length * 50);
      this.issues.push({
        type: 'organization',
        severity: 'medium',
        message: `임시/수정 파일 ${badFiles.length}개 발견`
      });
    }
    
    // 디렉토리당 파일 수 검사
    fileGroups.forEach((count, dir) => {
      if (count > 20) {
        score -= 10;
        this.issues.push({
          type: 'organization',
          severity: 'low',
          file: dir,
          message: `디렉토리에 파일이 너무 많음 (${count}개)`
        });
      }
    });
    
    this.scores.fileOrganization = Math.max(0, score);
  }
  
  // 성능 검사
  checkPerformance(files) {
    let totalSize = 0;
    let largeFiles = 0;
    
    files.forEach(file => {
      if (file.size > 50 * 1024) { // 50KB 이상
        largeFiles++;
        this.issues.push({
          type: 'performance',
          severity: 'medium',
          file: file.path,
          message: `파일 크기가 큼 (${(file.size / 1024).toFixed(2)} KB)`
        });
      }
      totalSize += file.size;
    });
    
    this.scores.performance = Math.max(0, 100 - (largeFiles / files.length * 100));
    
    if (totalSize > 1024 * 1024) { // 1MB 이상
      this.recommendations.push({
        type: 'performance',
        message: `전체 스타일 크기가 ${(totalSize / 1024 / 1024).toFixed(2)} MB입니다. 최적화가 필요합니다.`
      });
    }
  }
  
  // 전체 점수 계산
  calculateOverallScore() {
    const weights = {
      noHardcoding: 0.25,
      noImportant: 0.25,
      useTokens: 0.20,
      noDuplication: 0.15,
      fileOrganization: 0.10,
      performance: 0.05
    };
    
    let overall = 0;
    Object.entries(this.scores).forEach(([key, score]) => {
      overall += score * weights[key];
    });
    
    return Math.round(overall);
  }
  
  // 등급 계산
  getGrade(score) {
    if (score >= 90) return { grade: 'A', color: '\x1b[32m' };
    if (score >= 80) return { grade: 'B', color: '\x1b[32m' };
    if (score >= 70) return { grade: 'C', color: '\x1b[33m' };
    if (score >= 60) return { grade: 'D', color: '\x1b[33m' };
    return { grade: 'F', color: '\x1b[31m' };
  }
}

// 메인 실행
async function main() {
  console.log('🏥 VideoPlanet 스타일 건강도 검사\n');
  
  const checker = new StyleHealthChecker();
  
  // SCSS 파일 로드
  const scssFiles = glob.sync('src/**/*.scss', {
    ignore: ['**/node_modules/**']
  });
  
  const files = scssFiles.map(filePath => {
    const stats = fs.statSync(filePath);
    return {
      path: filePath,
      size: stats.size
    };
  });
  
  console.log(`📊 ${files.length}개 스타일 파일 검사 중...\n`);
  
  // 각 항목 검사
  checker.checkHardcoding(files);
  checker.checkImportant(files);
  checker.checkTokenUsage(files);
  checker.checkDuplication(files);
  checker.checkFileOrganization(files);
  checker.checkPerformance(files);
  
  // 결과 출력
  const overall = checker.calculateOverallScore();
  const { grade, color } = checker.getGrade(overall);
  
  console.log('📈 건강도 점수\n');
  console.log(`${color}전체 점수: ${overall}/100 (${grade})${'\x1b[0m'}\n`);
  
  console.log('항목별 점수:');
  Object.entries(checker.scores).forEach(([key, score]) => {
    const { color } = checker.getGrade(score);
    const label = {
      noHardcoding: '하드코딩 없음',
      noImportant: '!important 없음',
      useTokens: '토큰 사용률',
      noDuplication: '중복 없음',
      fileOrganization: '파일 구조',
      performance: '성능'
    }[key];
    console.log(`  ${color}${label}: ${Math.round(score)}/100${'\x1b[0m'}`);
  });
  
  // 주요 이슈
  if (checker.issues.length > 0) {
    console.log('\n🚨 주요 이슈:');
    const highIssues = checker.issues.filter(i => i.severity === 'high');
    const mediumIssues = checker.issues.filter(i => i.severity === 'medium');
    
    if (highIssues.length > 0) {
      console.log('\n  심각:');
      highIssues.slice(0, 5).forEach(issue => {
        console.log(`    • ${issue.message}${issue.file ? ` (${path.basename(issue.file)})` : ''}`);
      });
    }
    
    if (mediumIssues.length > 0) {
      console.log('\n  보통:');
      mediumIssues.slice(0, 5).forEach(issue => {
        console.log(`    • ${issue.message}${issue.file ? ` (${path.basename(issue.file)})` : ''}`);
      });
    }
  }
  
  // 권장사항
  if (checker.recommendations.length > 0) {
    console.log('\n💡 권장사항:');
    checker.recommendations.forEach(rec => {
      console.log(`  • ${rec.message}`);
    });
  }
  
  // 개선 가이드
  console.log('\n📋 개선 우선순위:');
  const priorities = [];
  
  if (checker.scores.noImportant < 80) {
    priorities.push('1. !important 제거 작업 진행');
  }
  if (checker.scores.noHardcoding < 80) {
    priorities.push('2. 하드코딩된 값을 디자인 토큰으로 교체');
  }
  if (checker.scores.useTokens < 70) {
    priorities.push('3. 디자인 시스템 활용도 증가');
  }
  if (checker.scores.noDuplication < 80) {
    priorities.push('4. 중복된 스타일 통합');
  }
  
  priorities.forEach(p => console.log(`  ${p}`));
  
  // 상세 리포트 저장
  const report = {
    timestamp: new Date().toISOString(),
    overallScore: overall,
    grade: grade,
    scores: checker.scores,
    totalFiles: files.length,
    totalSize: files.reduce((sum, f) => sum + f.size, 0),
    issues: checker.issues,
    recommendations: checker.recommendations
  };
  
  fs.writeFileSync('style-health-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 상세 리포트: style-health-report.json');
}

// 실행
main().catch(console.error);