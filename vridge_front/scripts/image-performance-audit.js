#!/usr/bin/env node

/**
 * 이미지 성능 감사 및 모니터링 스크립트
 * - 이미지 로딩 성능 측정
 * - Core Web Vitals 관련 메트릭 수집
 * - 최적화 권장사항 제공
 * - 성능 예산 검증
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');
const chalk = require('chalk');
const sharp = require('sharp');

// 설정
const CONFIG = {
  sourceDir: path.join(__dirname, '../public/images'),
  outputDir: path.join(__dirname, '../reports'),
  thresholds: {
    maxFileSize: 500 * 1024, // 500KB
    maxWidth: 2048,
    maxHeight: 2048,
    totalBudget: 5 * 1024 * 1024, // 5MB
    criticalPath: 1 * 1024 * 1024 // 1MB (critical path budget)
  },
  formats: {
    preferred: ['avif', 'webp'],
    fallback: ['jpeg', 'png']
  }
};

class ImagePerformanceAuditor {
  constructor() {
    this.results = {
      summary: {
        totalImages: 0,
        totalSize: 0,
        oversizedImages: 0,
        unoptimizedFormats: 0,
        criticalPathSize: 0,
        score: 0
      },
      images: [],
      recommendations: [],
      performance: {
        coreWebVitals: {},
        lighthouse: {}
      }
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red
    };
    console.log(colors[type](`[PERF-AUDIT] ${message}`));
  }

  async init() {
    try {
      await fs.mkdir(CONFIG.outputDir, { recursive: true });
      this.log('이미지 성능 감사 시작');
      
      const imageFiles = await this.findImages();
      this.log(`총 ${imageFiles.length}개의 이미지 분석 중...`);

      for (const imagePath of imageFiles) {
        await this.analyzeImage(imagePath);
      }

      await this.calculatePerformanceScore();
      await this.generateRecommendations();
      await this.generateReport();
      this.printSummary();

    } catch (error) {
      this.log(`감사 실행 오류: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async findImages() {
    try {
      const files = await glob(path.join(CONFIG.sourceDir, '**/*.{jpg,jpeg,png,gif,webp,avif,svg}'));
      return files;
    } catch (error) {
      throw error;
    }
  }

  async analyzeImage(imagePath) {
    try {
      const relativePath = path.relative(CONFIG.sourceDir, imagePath);
      const stats = await fs.stat(imagePath);
      const ext = path.extname(imagePath).toLowerCase().substring(1);
      
      let imageData = {
        path: relativePath,
        fullPath: imagePath,
        size: stats.size,
        format: ext,
        issues: [],
        recommendations: [],
        score: 100
      };

      // SVG는 별도 처리
      if (ext === 'svg') {
        imageData.width = 'vector';
        imageData.height = 'vector';
        imageData.aspectRatio = 'vector';
      } else {
        try {
          const metadata = await sharp(imagePath).metadata();
          imageData.width = metadata.width;
          imageData.height = metadata.height;
          imageData.aspectRatio = metadata.width / metadata.height;
          imageData.channels = metadata.channels;
          imageData.density = metadata.density;
        } catch (sharpError) {
          this.log(`이미지 메타데이터 읽기 실패 (${relativePath}): ${sharpError.message}`, 'warning');
          imageData.issues.push('메타데이터 읽기 실패');
          imageData.score -= 10;
        }
      }

      // 성능 이슈 검사
      await this.checkPerformanceIssues(imageData);
      
      // 중요 경로 이미지 식별
      this.identifyCriticalPathImages(imageData);

      this.results.images.push(imageData);
      this.results.summary.totalImages++;
      this.results.summary.totalSize += stats.size;

      if (imageData.issues.length > 0) {
        this.log(`이슈 발견 (${relativePath}): ${imageData.issues.join(', ')}`, 'warning');
      }

    } catch (error) {
      this.log(`이미지 분석 오류 (${imagePath}): ${error.message}`, 'error');
    }
  }

  async checkPerformanceIssues(imageData) {
    // 파일 크기 검사
    if (imageData.size > CONFIG.thresholds.maxFileSize) {
      imageData.issues.push('파일 크기 초과');
      imageData.recommendations.push(`파일 크기를 ${this.formatBytes(CONFIG.thresholds.maxFileSize)} 이하로 줄이세요`);
      imageData.score -= 20;
      this.results.summary.oversizedImages++;
    }

    // 이미지 차원 검사
    if (typeof imageData.width === 'number' && imageData.width > CONFIG.thresholds.maxWidth) {
      imageData.issues.push('이미지 너비 초과');
      imageData.recommendations.push(`이미지 너비를 ${CONFIG.thresholds.maxWidth}px 이하로 조정하세요`);
      imageData.score -= 15;
    }

    if (typeof imageData.height === 'number' && imageData.height > CONFIG.thresholds.maxHeight) {
      imageData.issues.push('이미지 높이 초과');
      imageData.recommendations.push(`이미지 높이를 ${CONFIG.thresholds.maxHeight}px 이하로 조정하세요`);
      imageData.score -= 15;
    }

    // 포맷 최적화 검사
    if (!CONFIG.formats.preferred.includes(imageData.format) && imageData.format !== 'svg') {
      imageData.issues.push('최적화되지 않은 포맷');
      imageData.recommendations.push(`WebP 또는 AVIF 포맷으로 변환하세요`);
      imageData.score -= 25;
      this.results.summary.unoptimizedFormats++;
    }

    // 종횡비 검사
    if (typeof imageData.aspectRatio === 'number') {
      if (imageData.aspectRatio > 5 || imageData.aspectRatio < 0.2) {
        imageData.issues.push('비정상적인 종횡비');
        imageData.recommendations.push('이미지 종횡비를 확인하세요');
        imageData.score -= 10;
      }
    }

    // 파일명 최적화 검사
    if (this.hasNonOptimizedFilename(imageData.path)) {
      imageData.issues.push('파일명 최적화 필요');
      imageData.recommendations.push('파일명을 의미있게 변경하고 SEO를 고려하세요');
      imageData.score -= 5;
    }
  }

  identifyCriticalPathImages(imageData) {
    const criticalPaths = [
      /hero/i,
      /banner/i,
      /logo/i,
      /avatar/i,
      /profile/i,
      /bg/i,
      /background/i
    ];

    const isCritical = criticalPaths.some(pattern => 
      pattern.test(imageData.path) || pattern.test(path.basename(imageData.path))
    );

    if (isCritical) {
      imageData.criticalPath = true;
      this.results.summary.criticalPathSize += imageData.size;
      
      if (imageData.size > CONFIG.thresholds.maxFileSize * 0.5) {
        imageData.recommendations.push('중요 경로 이미지는 더 작은 크기로 최적화하세요');
        imageData.score -= 15;
      }
    }
  }

  hasNonOptimizedFilename(filePath) {
    const basename = path.basename(filePath, path.extname(filePath));
    const nonOptimized = [
      /untitled/i,
      /image\d+/i,
      /img\d+/i,
      /photo\d+/i,
      /picture\d+/i,
      /screenshot/i,
      /temp/i,
      /tmp/i
    ];

    return nonOptimized.some(pattern => pattern.test(basename));
  }

  async calculatePerformanceScore() {
    if (this.results.images.length === 0) {
      this.results.summary.score = 0;
      return;
    }

    // 개별 이미지 점수의 평균
    const averageImageScore = this.results.images.reduce((sum, img) => sum + img.score, 0) / this.results.images.length;
    
    // 전체 성능 점수 계산
    let totalScore = averageImageScore;
    
    // 총 크기 페널티
    if (this.results.summary.totalSize > CONFIG.thresholds.totalBudget) {
      totalScore -= 20;
      this.results.recommendations.push({
        type: 'critical',
        message: `총 이미지 크기가 예산(${this.formatBytes(CONFIG.thresholds.totalBudget)})을 초과합니다`,
        impact: 'high'
      });
    }

    // 중요 경로 페널티
    if (this.results.summary.criticalPathSize > CONFIG.thresholds.criticalPath) {
      totalScore -= 15;
      this.results.recommendations.push({
        type: 'critical',
        message: `중요 경로 이미지 크기가 예산(${this.formatBytes(CONFIG.thresholds.criticalPath)})을 초과합니다`,
        impact: 'high'
      });
    }

    this.results.summary.score = Math.max(0, Math.min(100, Math.round(totalScore)));
  }

  async generateRecommendations() {
    const recommendations = this.results.recommendations;

    // 최적화되지 않은 포맷
    if (this.results.summary.unoptimizedFormats > 0) {
      recommendations.push({
        type: 'optimization',
        message: `${this.results.summary.unoptimizedFormats}개 이미지가 최적화되지 않은 포맷을 사용합니다`,
        solution: 'WebP 또는 AVIF 포맷으로 변환하세요',
        impact: 'medium',
        effort: 'low'
      });
    }

    // 큰 파일들
    if (this.results.summary.oversizedImages > 0) {
      recommendations.push({
        type: 'compression',
        message: `${this.results.summary.oversizedImages}개 이미지가 권장 크기를 초과합니다`,
        solution: '이미지 압축 및 리사이징을 적용하세요',
        impact: 'high',
        effort: 'low'
      });
    }

    // Next.js Image 컴포넌트 권장
    recommendations.push({
      type: 'implementation',
      message: 'OptimizedImage 컴포넌트 사용을 권장합니다',
      solution: '모든 img 태그를 OptimizedImage 컴포넌트로 교체하세요',
      impact: 'high',
      effort: 'medium'
    });

    // 지연 로딩 권장
    const nonCriticalImages = this.results.images.filter(img => !img.criticalPath).length;
    if (nonCriticalImages > 0) {
      recommendations.push({
        type: 'performance',
        message: `${nonCriticalImages}개의 비중요 이미지에 지연 로딩을 적용할 수 있습니다`,
        solution: 'loading="lazy" 속성 또는 OptimizedImage 컴포넌트를 사용하세요',
        impact: 'medium',
        effort: 'low'
      });
    }

    // 반응형 이미지 권장
    const largeImages = this.results.images.filter(img => 
      typeof img.width === 'number' && img.width > 1200
    ).length;
    
    if (largeImages > 0) {
      recommendations.push({
        type: 'responsive',
        message: `${largeImages}개의 큰 이미지에 반응형 처리를 권장합니다`,
        solution: 'srcset 또는 Next.js Image sizes 속성을 활용하세요',
        impact: 'medium',
        effort: 'medium'
      });
    }
  }

  async generateReport() {
    const timestamp = new Date().toISOString();
    const report = {
      metadata: {
        generatedAt: timestamp,
        version: '1.0.0',
        tool: 'VideoplaNet Image Performance Auditor'
      },
      summary: this.results.summary,
      recommendations: this.results.recommendations,
      images: this.results.images,
      thresholds: CONFIG.thresholds
    };

    // JSON 리포트
    const jsonPath = path.join(CONFIG.outputDir, `image-audit-${Date.now()}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));

    // HTML 리포트 생성
    await this.generateHTMLReport(report);

    // Markdown 리포트 생성  
    await this.generateMarkdownReport(report);

    this.log(`리포트 생성 완료: ${CONFIG.outputDir}`, 'success');
  }

  async generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>이미지 성능 감사 리포트</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .score { font-size: 72px; font-weight: bold; color: ${report.summary.score >= 90 ? '#22c55e' : report.summary.score >= 70 ? '#f59e0b' : '#ef4444'}; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .stat { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #1f2937; }
        .stat-label { color: #6b7280; margin-top: 5px; }
        .recommendations { margin: 30px 0; }
        .recommendation { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .recommendation.critical { background: #fef2f2; border-color: #ef4444; }
        .images-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .images-table th, .images-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .images-table th { background: #f9fafb; font-weight: 600; }
        .issue { background: #fef2f2; color: #b91c1c; padding: 2px 6px; border-radius: 3px; font-size: 12px; margin: 2px; display: inline-block; }
        .good { color: #059669; }
        .warning { color: #d97706; }
        .error { color: #dc2626; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>이미지 성능 감사 리포트</h1>
            <div class="score">${report.summary.score}</div>
            <p>생성일: ${new Date(report.metadata.generatedAt).toLocaleString('ko-KR')}</p>
        </div>

        <div class="stats">
            <div class="stat">
                <div class="stat-value">${report.summary.totalImages}</div>
                <div class="stat-label">총 이미지</div>
            </div>
            <div class="stat">
                <div class="stat-value">${this.formatBytes(report.summary.totalSize)}</div>
                <div class="stat-label">총 크기</div>
            </div>
            <div class="stat">
                <div class="stat-value ${report.summary.oversizedImages > 0 ? 'error' : 'good'}">${report.summary.oversizedImages}</div>
                <div class="stat-label">큰 파일</div>
            </div>
            <div class="stat">
                <div class="stat-value ${report.summary.unoptimizedFormats > 0 ? 'warning' : 'good'}">${report.summary.unoptimizedFormats}</div>
                <div class="stat-label">최적화 필요</div>
            </div>
        </div>

        <div class="recommendations">
            <h2>권장사항</h2>
            ${report.recommendations.map(rec => `
                <div class="recommendation ${rec.type === 'critical' ? 'critical' : ''}">
                    <h3>${rec.message}</h3>
                    <p>${rec.solution || ''}</p>
                    ${rec.impact ? `<small>영향도: ${rec.impact} | 난이도: ${rec.effort || 'unknown'}</small>` : ''}
                </div>
            `).join('')}
        </div>

        <div class="images-section">
            <h2>이미지 상세 분석</h2>
            <table class="images-table">
                <thead>
                    <tr>
                        <th>경로</th>
                        <th>크기</th>
                        <th>차원</th>
                        <th>포맷</th>
                        <th>점수</th>
                        <th>이슈</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.images.map(img => `
                        <tr>
                            <td>${img.path}</td>
                            <td>${this.formatBytes(img.size)}</td>
                            <td>${img.width === 'vector' ? 'Vector' : `${img.width}×${img.height}`}</td>
                            <td>${img.format.toUpperCase()}</td>
                            <td class="${img.score >= 90 ? 'good' : img.score >= 70 ? 'warning' : 'error'}">${img.score}</td>
                            <td>${img.issues.map(issue => `<span class="issue">${issue}</span>`).join('')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
    `;

    const htmlPath = path.join(CONFIG.outputDir, 'image-performance-report.html');
    await fs.writeFile(htmlPath, html);
  }

  async generateMarkdownReport(report) {
    const markdown = `# 이미지 성능 감사 리포트

**생성일:** ${new Date(report.metadata.generatedAt).toLocaleString('ko-KR')}  
**성능 점수:** ${report.summary.score}/100

## 📊 요약 통계

| 항목 | 값 |
|------|-----|
| 총 이미지 수 | ${report.summary.totalImages}개 |
| 총 크기 | ${this.formatBytes(report.summary.totalSize)} |
| 큰 파일 (>${this.formatBytes(CONFIG.thresholds.maxFileSize)}) | ${report.summary.oversizedImages}개 |
| 최적화 필요 포맷 | ${report.summary.unoptimizedFormats}개 |
| 중요 경로 크기 | ${this.formatBytes(report.summary.criticalPathSize)} |

## 🚨 권장사항

${report.recommendations.map(rec => `
### ${rec.type === 'critical' ? '🔴' : rec.impact === 'high' ? '🟡' : '🔵'} ${rec.message}

${rec.solution ? `**해결방법:** ${rec.solution}` : ''}

${rec.impact ? `- **영향도:** ${rec.impact}` : ''}
${rec.effort ? `- **난이도:** ${rec.effort}` : ''}
`).join('')}

## 📋 이미지 상세 분석

| 경로 | 크기 | 차원 | 포맷 | 점수 | 주요 이슈 |
|------|------|------|------|------|----------|
${report.images.map(img => 
  `| ${img.path} | ${this.formatBytes(img.size)} | ${img.width === 'vector' ? 'Vector' : `${img.width}×${img.height}`} | ${img.format.toUpperCase()} | ${img.score}/100 | ${img.issues.join(', ') || '없음'} |`
).join('\n')}

## 🔧 다음 단계

1. **즉시 조치**: 점수 50 이하의 이미지들을 우선적으로 최적화
2. **포맷 변환**: PNG/JPEG 이미지를 WebP/AVIF로 변환
3. **컴포넌트 적용**: OptimizedImage 컴포넌트 사용
4. **성능 모니터링**: 정기적인 감사 실행

---
*이 리포트는 VideoplaNet 이미지 성능 감사 도구에 의해 자동 생성되었습니다.*
`;

    const markdownPath = path.join(CONFIG.outputDir, 'IMAGE_PERFORMANCE_REPORT.md');
    await fs.writeFile(markdownPath, markdown);
  }

  printSummary() {
    const score = this.results.summary.score;
    const scoreColor = score >= 90 ? 'green' : score >= 70 ? 'yellow' : 'red';
    
    console.log('\n' + chalk.bold.blue('========== 이미지 성능 감사 결과 =========='));
    console.log(`성능 점수: ${chalk.bold[scoreColor](score)}/100`);
    console.log(`총 이미지: ${chalk.cyan(this.results.summary.totalImages)}개`);
    console.log(`총 크기: ${chalk.cyan(this.formatBytes(this.results.summary.totalSize))}`);
    console.log(`문제 이미지: ${chalk.red(this.results.summary.oversizedImages)}개`);
    console.log(`최적화 필요: ${chalk.yellow(this.results.summary.unoptimizedFormats)}개`);
    console.log(`권장사항: ${chalk.cyan(this.results.recommendations.length)}개`);
    console.log('===============================================\n');

    if (score < 70) {
      console.log(chalk.red('⚠️  성능 개선이 필요합니다. 상세 리포트를 확인하세요.'));
    } else if (score < 90) {
      console.log(chalk.yellow('✨ 좋은 성능입니다. 몇 가지 최적화로 더 향상시킬 수 있습니다.'));
    } else {
      console.log(chalk.green('🎉 훌륭한 성능입니다!'));
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

// 명령행 인터페이스
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
이미지 성능 감사 스크립트

사용법:
  node image-performance-audit.js [옵션]

옵션:
  --help, -h     도움말 표시
  --output=dir   리포트 출력 디렉토리 지정
  --threshold=n  파일 크기 임계값 설정 (KB)

예시:
  node image-performance-audit.js
  node image-performance-audit.js --output=./custom-reports
  node image-performance-audit.js --threshold=300
    `);
    return;
  }

  // 옵션 파싱
  const outputArg = args.find(arg => arg.startsWith('--output='));
  if (outputArg) {
    CONFIG.outputDir = path.resolve(outputArg.split('=')[1]);
  }

  const thresholdArg = args.find(arg => arg.startsWith('--threshold='));
  if (thresholdArg) {
    const threshold = parseInt(thresholdArg.split('=')[1]) * 1024;
    CONFIG.thresholds.maxFileSize = threshold;
  }

  const auditor = new ImagePerformanceAuditor();
  await auditor.init();
}

// 스크립트 실행
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('감사 실행 오류:'), error.message);
    process.exit(1);
  });
}

module.exports = ImagePerformanceAuditor;