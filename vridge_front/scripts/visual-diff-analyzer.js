#!/usr/bin/env node

const { chromium } = require('playwright');
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

/**
 * 시각적 차이 분석 도구
 * 디자인 시안과 실제 구현의 픽셀 단위 일치율 측정
 */

class VisualDiffAnalyzer {
  constructor() {
    this.results = {
      pages: {},
      overallScore: 0,
      totalPixelsDiff: 0,
      totalPixelsAnalyzed: 0
    };
  }

  async analyze(designFolder = 'design-mockups', implementationUrl = 'http://localhost:3000') {
    console.log('🔍 VideoPlanet 시각적 일치율 분석 시작...\n');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // 디자인 목업 파일 찾기
    const mockups = this.findMockups(designFolder);
    
    if (mockups.length === 0) {
      console.log('⚠️  디자인 목업 파일을 찾을 수 없습니다.');
      console.log(`📁 ${designFolder} 폴더에 디자인 파일을 추가해주세요.`);
      await browser.close();
      return;
    }

    for (const mockup of mockups) {
      await this.comparePageWithMockup(page, mockup, implementationUrl);
    }

    await browser.close();

    // 전체 점수 계산
    this.calculateOverallScore();
    
    // 리포트 생성
    this.generateReport();
  }

  async comparePageWithMockup(page, mockupPath, baseUrl) {
    const mockupName = path.basename(mockupPath, path.extname(mockupPath));
    console.log(`📸 ${mockupName} 분석 중...`);

    // 페이지 매핑 (목업 파일명 -> URL)
    const pageMapping = {
      'home': '/',
      'login': '/login',
      'signup': '/signup',
      'cms-home': '/cmshome',
      'project-management': '/cmshome',
      'feedback': '/feedback/1',
      'video-planning': '/videoplanning'
    };

    const pagePath = pageMapping[mockupName.toLowerCase()] || '/';

    try {
      // 목업 이미지 로드
      const mockupBuffer = fs.readFileSync(mockupPath);
      const mockupPng = PNG.sync.read(mockupBuffer);

      // 실제 페이지 스크린샷
      await page.goto(`${baseUrl}${pagePath}`, { waitUntil: 'networkidle' });
      await page.setViewportSize({
        width: mockupPng.width,
        height: mockupPng.height
      });
      await page.waitForTimeout(1000); // 렌더링 안정화

      const screenshotBuffer = await page.screenshot();
      const screenshotPng = PNG.sync.read(screenshotBuffer);

      // 크기 조정 (필요한 경우)
      if (mockupPng.width !== screenshotPng.width || mockupPng.height !== screenshotPng.height) {
        console.log(`  ⚠️  크기 불일치: 목업(${mockupPng.width}x${mockupPng.height}) vs 구현(${screenshotPng.width}x${screenshotPng.height})`);
      }

      // 픽셀 비교
      const width = Math.min(mockupPng.width, screenshotPng.width);
      const height = Math.min(mockupPng.height, screenshotPng.height);
      const diff = new PNG({ width, height });

      const numDiffPixels = pixelmatch(
        mockupPng.data,
        screenshotPng.data,
        diff.data,
        width,
        height,
        { threshold: 0.1 } // 10% 차이까지 허용
      );

      const totalPixels = width * height;
      const matchPercentage = ((totalPixels - numDiffPixels) / totalPixels) * 100;

      // 결과 저장
      this.results.pages[mockupName] = {
        matchPercentage: matchPercentage.toFixed(2),
        totalPixels,
        diffPixels: numDiffPixels,
        dimensions: { width, height },
        areas: await this.analyzeDiffAreas(diff, width, height)
      };

      this.results.totalPixelsAnalyzed += totalPixels;
      this.results.totalPixelsDiff += numDiffPixels;

      // 차이 이미지 저장
      const diffPath = path.join('visual-diff-results', `${mockupName}-diff.png`);
      fs.mkdirSync('visual-diff-results', { recursive: true });
      fs.writeFileSync(diffPath, PNG.sync.write(diff));

      // 실제 스크린샷도 저장
      const actualPath = path.join('visual-diff-results', `${mockupName}-actual.png`);
      fs.writeFileSync(actualPath, screenshotBuffer);

      console.log(`  ✅ 일치율: ${matchPercentage.toFixed(2)}%`);

    } catch (error) {
      console.log(`  ❌ 오류: ${error.message}`);
      this.results.pages[mockupName] = {
        error: error.message
      };
    }
  }

  async analyzeDiffAreas(diffPng, width, height) {
    // 차이가 있는 영역 분석
    const areas = {
      header: { diffPixels: 0, totalPixels: 0 },
      content: { diffPixels: 0, totalPixels: 0 },
      footer: { diffPixels: 0, totalPixels: 0 }
    };

    // 영역 분할 (대략적)
    const headerHeight = Math.floor(height * 0.15);
    const footerHeight = Math.floor(height * 0.1);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2;
        const isDiff = diffPng.data[idx] !== 0 || diffPng.data[idx + 1] !== 0 || diffPng.data[idx + 2] !== 0;

        if (y < headerHeight) {
          areas.header.totalPixels++;
          if (isDiff) areas.header.diffPixels++;
        } else if (y > height - footerHeight) {
          areas.footer.totalPixels++;
          if (isDiff) areas.footer.diffPixels++;
        } else {
          areas.content.totalPixels++;
          if (isDiff) areas.content.diffPixels++;
        }
      }
    }

    // 각 영역의 일치율 계산
    Object.keys(areas).forEach(area => {
      const data = areas[area];
      data.matchPercentage = ((data.totalPixels - data.diffPixels) / data.totalPixels * 100).toFixed(2);
    });

    return areas;
  }

  calculateOverallScore() {
    if (this.results.totalPixelsAnalyzed === 0) {
      this.results.overallScore = 0;
      return;
    }

    const overallMatch = ((this.results.totalPixelsAnalyzed - this.results.totalPixelsDiff) / 
                         this.results.totalPixelsAnalyzed) * 100;
    
    this.results.overallScore = overallMatch.toFixed(2);
  }

  generateReport() {
    const report = {
      summary: {
        overallScore: this.results.overallScore,
        analyzedPages: Object.keys(this.results.pages).length,
        timestamp: new Date().toISOString()
      },
      pageScores: {},
      recommendations: []
    };

    // 페이지별 점수 정리
    Object.entries(this.results.pages).forEach(([page, data]) => {
      if (!data.error) {
        report.pageScores[page] = {
          score: data.matchPercentage,
          grade: this.getGrade(parseFloat(data.matchPercentage)),
          areas: data.areas
        };
      }
    });

    // 개선 권장사항 생성
    Object.entries(this.results.pages).forEach(([page, data]) => {
      if (!data.error && parseFloat(data.matchPercentage) < 90) {
        const worstArea = this.findWorstArea(data.areas);
        report.recommendations.push({
          page,
          issue: `${worstArea} 영역의 일치율이 낮습니다 (${data.areas[worstArea].matchPercentage}%)`,
          priority: parseFloat(data.matchPercentage) < 70 ? 'high' : 'medium'
        });
      }
    });

    // 리포트 저장
    fs.writeFileSync(
      'visual-diff-report.json',
      JSON.stringify(report, null, 2)
    );

    // 콘솔 출력
    console.log('\n' + '='.repeat(60));
    console.log('📊 VideoPlanet 디자인 일치율 분석 결과');
    console.log('='.repeat(60));
    console.log(`\n🎯 전체 일치율: ${report.summary.overallScore}%\n`);
    
    console.log('📄 페이지별 점수:');
    Object.entries(report.pageScores).forEach(([page, data]) => {
      console.log(`   ${page}: ${data.score}% (${data.grade})`);
      if (data.areas) {
        console.log(`     - Header: ${data.areas.header.matchPercentage}%`);
        console.log(`     - Content: ${data.areas.content.matchPercentage}%`);
        console.log(`     - Footer: ${data.areas.footer.matchPercentage}%`);
      }
    });

    if (report.recommendations.length > 0) {
      console.log('\n💡 개선 권장사항:');
      report.recommendations
        .sort((a, b) => a.priority === 'high' ? -1 : 1)
        .forEach((rec, i) => {
          const icon = rec.priority === 'high' ? '🔴' : '🟡';
          console.log(`   ${icon} ${rec.page}: ${rec.issue}`);
        });
    }

    console.log('\n📁 상세 결과:');
    console.log('   - 차이 이미지: visual-diff-results/');
    console.log('   - 상세 리포트: visual-diff-report.json');
    console.log('\n' + '='.repeat(60));
  }

  findMockups(folder) {
    if (!fs.existsSync(folder)) {
      return [];
    }

    return fs.readdirSync(folder)
      .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
      .map(file => path.join(folder, file));
  }

  findWorstArea(areas) {
    let worstArea = 'content';
    let lowestMatch = 100;

    Object.entries(areas).forEach(([area, data]) => {
      const match = parseFloat(data.matchPercentage);
      if (match < lowestMatch) {
        lowestMatch = match;
        worstArea = area;
      }
    });

    return worstArea;
  }

  getGrade(score) {
    if (score >= 95) return '완벽';
    if (score >= 90) return '우수';
    if (score >= 80) return '양호';
    if (score >= 70) return '보통';
    if (score >= 60) return '미흡';
    return '개선필요';
  }
}

// 실행
if (require.main === module) {
  const analyzer = new VisualDiffAnalyzer();
  
  // 명령줄 인자 처리
  const args = process.argv.slice(2);
  const designFolder = args[0] || 'design-mockups';
  const url = args[1] || 'http://localhost:3000';
  
  console.log(`📁 디자인 폴더: ${designFolder}`);
  console.log(`🌐 구현 URL: ${url}`);
  console.log('');
  
  analyzer.analyze(designFolder, url).catch(console.error);
}

module.exports = VisualDiffAnalyzer;