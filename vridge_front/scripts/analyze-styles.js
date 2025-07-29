#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 색상 추출 정규식
const COLOR_REGEX = /#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/g;
const PIXEL_REGEX = /\d+px/g;
const IMPORTANT_REGEX = /!important/g;

// 분석 결과 저장
const results = {
  totalFiles: 0,
  totalLines: 0,
  totalSize: 0,
  byDirectory: {},
  largestFiles: [],
  mostImportant: [],
  hardcodedColors: [],
  hardcodedPixels: [],
  duplicatePatterns: new Map(),
  unusedFiles: []
};

// 파일 분석 함수
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const stats = fs.statSync(filePath);
  
  const fileInfo = {
    path: filePath,
    lines: lines.length,
    size: stats.size,
    importantCount: 0,
    colorCount: 0,
    pixelCount: 0,
    imports: [],
    classes: [],
    mixins: []
  };
  
  // !important 카운트
  const importantMatches = content.match(IMPORTANT_REGEX);
  if (importantMatches) {
    fileInfo.importantCount = importantMatches.length;
  }
  
  // 하드코딩된 색상
  const colorMatches = content.match(COLOR_REGEX);
  if (colorMatches) {
    fileInfo.colorCount = colorMatches.length;
    colorMatches.forEach(color => {
      if (!color.includes('$') && !color.includes('var(')) {
        results.hardcodedColors.push({ file: filePath, color });
      }
    });
  }
  
  // 하드코딩된 픽셀값
  const pixelMatches = content.match(PIXEL_REGEX);
  if (pixelMatches) {
    fileInfo.pixelCount = pixelMatches.length;
    pixelMatches.forEach(pixel => {
      const line = lines.find(l => l.includes(pixel));
      if (line && !line.includes('$') && !line.includes('var(')) {
        results.hardcodedPixels.push({ file: filePath, pixel });
      }
    });
  }
  
  // import 문 찾기
  lines.forEach(line => {
    if (line.includes('@import') || line.includes('@use')) {
      fileInfo.imports.push(line.trim());
    }
    // 클래스명 추출
    const classMatch = line.match(/^\s*\.([a-zA-Z0-9_-]+)/);
    if (classMatch) {
      fileInfo.classes.push(classMatch[1]);
    }
    // 믹스인 추출
    const mixinMatch = line.match(/@mixin\s+([a-zA-Z0-9_-]+)/);
    if (mixinMatch) {
      fileInfo.mixins.push(mixinMatch[1]);
    }
  });
  
  return fileInfo;
}

// 디렉토리별 통계
function updateDirectoryStats(filePath, fileInfo) {
  const dir = path.dirname(filePath);
  if (!results.byDirectory[dir]) {
    results.byDirectory[dir] = {
      files: 0,
      totalSize: 0,
      totalLines: 0,
      totalImportant: 0
    };
  }
  
  results.byDirectory[dir].files++;
  results.byDirectory[dir].totalSize += fileInfo.size;
  results.byDirectory[dir].totalLines += fileInfo.lines;
  results.byDirectory[dir].totalImportant += fileInfo.importantCount;
}

// 중복 패턴 찾기
function findDuplicatePatterns(files) {
  const patterns = new Map();
  
  files.forEach(file => {
    file.classes.forEach(className => {
      if (!patterns.has(className)) {
        patterns.set(className, []);
      }
      patterns.get(className).push(file.path);
    });
  });
  
  // 2개 이상 파일에서 사용된 클래스만 저장
  patterns.forEach((files, className) => {
    if (files.length > 1) {
      results.duplicatePatterns.set(className, files);
    }
  });
}

// 사용되지 않는 파일 찾기
async function findUnusedFiles(scssFiles) {
  const allFiles = glob.sync('src/**/*.{tsx,jsx,ts,js}');
  
  for (const scssFile of scssFiles) {
    const fileName = path.basename(scssFile, '.scss');
    const moduleName = fileName.replace('.module', '');
    let isUsed = false;
    
    // 모든 소스 파일에서 import 확인
    for (const sourceFile of allFiles) {
      const content = fs.readFileSync(sourceFile, 'utf8');
      if (content.includes(fileName) || content.includes(moduleName)) {
        isUsed = true;
        break;
      }
    }
    
    if (!isUsed) {
      results.unusedFiles.push(scssFile);
    }
  }
}

// 메인 실행 함수
async function main() {
  console.log('🔍 VideoPlanet 스타일 파일 분석 시작...\n');
  
  // SCSS 파일 찾기
  const scssFiles = glob.sync('src/**/*.scss', {
    ignore: ['**/node_modules/**']
  });
  
  results.totalFiles = scssFiles.length;
  
  // 각 파일 분석
  const fileInfos = [];
  scssFiles.forEach(file => {
    const fileInfo = analyzeFile(file);
    fileInfos.push(fileInfo);
    results.totalLines += fileInfo.lines;
    results.totalSize += fileInfo.size;
    updateDirectoryStats(file, fileInfo);
  });
  
  // 가장 큰 파일들
  results.largestFiles = fileInfos
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .map(f => ({
      path: f.path,
      size: `${(f.size / 1024).toFixed(2)} KB`,
      lines: f.lines
    }));
  
  // !important 가장 많은 파일들
  results.mostImportant = fileInfos
    .filter(f => f.importantCount > 0)
    .sort((a, b) => b.importantCount - a.importantCount)
    .slice(0, 10)
    .map(f => ({
      path: f.path,
      count: f.importantCount
    }));
  
  // 중복 패턴 찾기
  findDuplicatePatterns(fileInfos);
  
  // 사용되지 않는 파일 찾기
  console.log('📊 사용되지 않는 파일 검색 중...');
  await findUnusedFiles(scssFiles);
  
  // 결과 출력
  printResults();
  
  // JSON 파일로 저장
  fs.writeFileSync(
    'style-analysis-report.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n✅ 분석 완료! 상세 내용은 style-analysis-report.json 참조');
}

// 결과 출력 함수
function printResults() {
  console.log('\n📈 분석 결과 요약');
  console.log('================\n');
  
  console.log(`📁 총 SCSS 파일 수: ${results.totalFiles}개`);
  console.log(`📝 총 라인 수: ${results.totalLines.toLocaleString()}줄`);
  console.log(`💾 총 파일 크기: ${(results.totalSize / 1024 / 1024).toFixed(2)} MB`);
  
  console.log('\n📊 디렉토리별 통계:');
  Object.entries(results.byDirectory)
    .sort((a, b) => b[1].files - a[1].files)
    .slice(0, 5)
    .forEach(([dir, stats]) => {
      console.log(`  ${dir}: ${stats.files}개 파일, ${stats.totalImportant} !important`);
    });
  
  console.log('\n🔴 !important 최다 사용 파일:');
  results.mostImportant.slice(0, 5).forEach(file => {
    console.log(`  ${file.path}: ${file.count}개`);
  });
  
  console.log('\n📏 가장 큰 파일:');
  results.largestFiles.slice(0, 5).forEach(file => {
    console.log(`  ${file.path}: ${file.size} (${file.lines}줄)`);
  });
  
  console.log(`\n🎨 하드코딩된 색상: ${results.hardcodedColors.length}개`);
  console.log(`📐 하드코딩된 픽셀값: ${results.hardcodedPixels.length}개`);
  
  console.log(`\n♻️ 중복 클래스명: ${results.duplicatePatterns.size}개`);
  const topDuplicates = Array.from(results.duplicatePatterns.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5);
  topDuplicates.forEach(([className, files]) => {
    console.log(`  .${className}: ${files.length}개 파일에서 사용`);
  });
  
  if (results.unusedFiles.length > 0) {
    console.log(`\n⚠️  사용되지 않는 파일: ${results.unusedFiles.length}개`);
    results.unusedFiles.slice(0, 10).forEach(file => {
      console.log(`  ${file}`);
    });
  }
}

// 실행
main().catch(console.error);