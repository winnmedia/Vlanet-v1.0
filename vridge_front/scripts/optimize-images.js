#!/usr/bin/env node

/**
 * 빌드 시 이미지 최적화 스크립트
 * - 이미지 압축 및 형식 변환
 * - WebP/AVIF 변환 자동화
 * - 반응형 이미지 생성
 * - 성능 예산 검증
 * - 메타데이터 생성
 */

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { glob } = require('glob');
const chalk = require('chalk');

// 설정
const CONFIG = {
  sourceDir: path.join(__dirname, '../public/images'),
  outputDir: path.join(__dirname, '../public/images/optimized'),
  formats: ['webp', 'avif'],
  quality: {
    jpeg: 75,
    webp: 80,
    avif: 70,
    png: 85
  },
  sizes: {
    thumbnail: [300, 200],
    card: [400, 300], 
    hero: [1920, 1080],
    mobile: [640, 480],
    tablet: [1024, 768],
    desktop: [1440, 900]
  },
  performanceBudget: {
    maxFileSize: 500 * 1024, // 500KB
    totalBudget: 5 * 1024 * 1024 // 5MB
  }
};

class ImageOptimizer {
  constructor() {
    this.stats = {
      processed: 0,
      compressed: 0,
      converted: 0,
      errors: 0,
      originalSize: 0,
      optimizedSize: 0,
      savedBytes: 0
    };
    this.manifest = {
      images: {},
      metadata: {
        optimizedAt: new Date().toISOString(),
        version: '1.0.0'
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
    console.log(colors[type](`[IMAGE-OPTIMIZER] ${message}`));
  }

  async init() {
    try {
      await fs.mkdir(CONFIG.outputDir, { recursive: true });
      this.log('이미지 최적화 시작');
      
      const imageFiles = await this.findImages();
      this.log(`총 ${imageFiles.length}개의 이미지 파일 발견`);

      for (const imagePath of imageFiles) {
        await this.processImage(imagePath);
      }

      await this.generateManifest();
      await this.validatePerformanceBudget();
      this.printReport();

    } catch (error) {
      this.log(`초기화 오류: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async findImages() {
    try {
      const files = await glob(path.join(CONFIG.sourceDir, '**/*.{jpg,jpeg,png,gif,svg}'));
      return files;
    } catch (error) {
      throw error;
    }
  }

  async processImage(imagePath) {
    try {
      const relativePath = path.relative(CONFIG.sourceDir, imagePath);
      const ext = path.extname(imagePath).toLowerCase();
      const name = path.basename(imagePath, ext);
      const dir = path.dirname(relativePath);
      
      this.log(`처리 중: ${relativePath}`);

      // SVG 파일은 그대로 복사
      if (ext === '.svg') {
        await this.copySvg(imagePath, relativePath);
        return;
      }

      // 원본 이미지 정보 수집
      const originalStats = await fs.stat(imagePath);
      const imageInfo = await sharp(imagePath).metadata();
      
      this.stats.originalSize += originalStats.size;

      // 다양한 형식으로 변환
      const conversions = await this.convertToFormats(imagePath, name, dir, imageInfo);
      
      // 반응형 이미지 생성
      const responsiveImages = await this.generateResponsiveImages(imagePath, name, dir, imageInfo);

      // 매니페스트 업데이트
      this.manifest.images[relativePath] = {
        original: {
          width: imageInfo.width,
          height: imageInfo.height,
          size: originalStats.size,
          format: imageInfo.format
        },
        conversions,
        responsive: responsiveImages,
        aspectRatio: imageInfo.width / imageInfo.height
      };

      this.stats.processed++;

    } catch (error) {
      this.log(`이미지 처리 오류 (${imagePath}): ${error.message}`, 'error');
      this.stats.errors++;
    }
  }

  async copySvg(sourcePath, relativePath) {
    const targetPath = path.join(CONFIG.outputDir, relativePath);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
    this.log(`SVG 복사 완료: ${relativePath}`, 'success');
  }

  async convertToFormats(imagePath, name, dir, imageInfo) {
    const conversions = {};
    const outputDir = path.join(CONFIG.outputDir, dir);
    await fs.mkdir(outputDir, { recursive: true });

    for (const format of CONFIG.formats) {
      try {
        const outputPath = path.join(outputDir, `${name}.${format}`);
        const quality = CONFIG.quality[format] || CONFIG.quality.webp;

        const result = await sharp(imagePath)
          .toFormat(format, { 
            quality,
            effort: format === 'avif' ? 6 : undefined
          })
          .toFile(outputPath);

        const stats = await fs.stat(outputPath);
        
        conversions[format] = {
          path: path.relative(CONFIG.outputDir, outputPath),
          size: stats.size,
          quality: quality,
          savings: ((imageInfo.size - stats.size) / imageInfo.size * 100).toFixed(1)
        };

        this.stats.optimizedSize += stats.size;
        this.stats.converted++;

        this.log(`${format.toUpperCase()} 변환 완료: ${name}.${format} (${this.formatBytes(stats.size)})`, 'success');

      } catch (error) {
        this.log(`${format} 변환 실패 (${name}): ${error.message}`, 'warning');
      }
    }

    return conversions;
  }

  async generateResponsiveImages(imagePath, name, dir, imageInfo) {
    const responsiveImages = {};
    const outputDir = path.join(CONFIG.outputDir, dir, 'responsive');
    await fs.mkdir(outputDir, { recursive: true });

    for (const [sizeName, [width, height]] of Object.entries(CONFIG.sizes)) {
      try {
        // 원본보다 큰 크기는 건너뛰기
        if (width > imageInfo.width || height > imageInfo.height) {
          continue;
        }

        const outputPath = path.join(outputDir, `${name}-${sizeName}.webp`);
        
        const result = await sharp(imagePath)
          .resize(width, height, {
            fit: 'cover',
            position: 'center'
          })
          .toFormat('webp', { quality: CONFIG.quality.webp })
          .toFile(outputPath);

        const stats = await fs.stat(outputPath);
        
        responsiveImages[sizeName] = {
          path: path.relative(CONFIG.outputDir, outputPath),
          width: result.width,
          height: result.height,
          size: stats.size
        };

        this.stats.optimizedSize += stats.size;

      } catch (error) {
        this.log(`반응형 이미지 생성 실패 (${name}-${sizeName}): ${error.message}`, 'warning');
      }
    }

    return responsiveImages;
  }

  async generateManifest() {
    try {
      const manifestPath = path.join(CONFIG.outputDir, 'manifest.json');
      this.manifest.metadata.stats = this.stats;
      
      await fs.writeFile(manifestPath, JSON.stringify(this.manifest, null, 2));
      this.log('이미지 매니페스트 생성 완료', 'success');

      // TypeScript 타입 정의 생성
      await this.generateTypeDefinitions();

    } catch (error) {
      this.log(`매니페스트 생성 오류: ${error.message}`, 'error');
    }
  }

  async generateTypeDefinitions() {
    const typeDefinitions = `
// 자동 생성된 이미지 타입 정의
export interface OptimizedImageManifest {
  images: {
    [key: string]: {
      original: {
        width: number;
        height: number;
        size: number;
        format: string;
      };
      conversions: {
        [format: string]: {
          path: string;
          size: number;
          quality: number;
          savings: string;
        };
      };
      responsive: {
        [size: string]: {
          path: string;
          width: number;
          height: number;
          size: number;
        };
      };
      aspectRatio: number;
    };
  };
  metadata: {
    optimizedAt: string;
    version: string;
    stats: {
      processed: number;
      compressed: number;
      converted: number;
      errors: number;
      originalSize: number;
      optimizedSize: number;
      savedBytes: number;
    };
  };
}

// 사용 가능한 이미지 경로들
export type OptimizedImagePath = ${Object.keys(this.manifest.images).map(path => `'${path}'`).join(' | ')};
    `;

    const typesPath = path.join(__dirname, '../src/types/images.d.ts');
    await fs.mkdir(path.dirname(typesPath), { recursive: true });
    await fs.writeFile(typesPath, typeDefinitions.trim());
  }

  async validatePerformanceBudget() {
    this.stats.savedBytes = this.stats.originalSize - this.stats.optimizedSize;
    
    // 파일 크기 체크
    const oversizedFiles = [];
    for (const [imagePath, imageData] of Object.entries(this.manifest.images)) {
      if (imageData.original.size > CONFIG.performanceBudget.maxFileSize) {
        oversizedFiles.push({
          path: imagePath,
          size: imageData.original.size
        });
      }
    }

    // 총 예산 체크
    const totalBudgetExceeded = this.stats.optimizedSize > CONFIG.performanceBudget.totalBudget;

    if (oversizedFiles.length > 0) {
      this.log('성능 예산 초과 파일들:', 'warning');
      oversizedFiles.forEach(file => {
        this.log(`  - ${file.path}: ${this.formatBytes(file.size)}`, 'warning');
      });
    }

    if (totalBudgetExceeded) {
      this.log(`총 이미지 크기가 예산을 초과했습니다: ${this.formatBytes(this.stats.optimizedSize)} / ${this.formatBytes(CONFIG.performanceBudget.totalBudget)}`, 'warning');
    }

    if (oversizedFiles.length === 0 && !totalBudgetExceeded) {
      this.log('성능 예산 검증 통과!', 'success');
    }
  }

  printReport() {
    const savingsPercent = ((this.stats.savedBytes / this.stats.originalSize) * 100).toFixed(1);
    
    console.log('\n' + chalk.bold.green('========== 이미지 최적화 완료 =========='));
    console.log(`처리된 이미지: ${chalk.cyan(this.stats.processed)}개`);
    console.log(`변환된 이미지: ${chalk.cyan(this.stats.converted)}개`);
    console.log(`오류 발생: ${chalk.red(this.stats.errors)}개`);
    console.log(`원본 크기: ${chalk.yellow(this.formatBytes(this.stats.originalSize))}`);
    console.log(`최적화된 크기: ${chalk.green(this.formatBytes(this.stats.optimizedSize))}`);
    console.log(`절약된 용량: ${chalk.bold.green(this.formatBytes(this.stats.savedBytes))} (${savingsPercent}%)`);
    console.log('==========================================\n');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 명령행 인터페이스
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
이미지 최적화 스크립트

사용법:
  node optimize-images.js [옵션]

옵션:
  --help, -h     도움말 표시
  --dry-run      실제 처리 없이 분석만 실행
  --format=webp  특정 형식으로만 변환 (webp, avif)
  --quality=80   품질 설정 (1-100)

예시:
  node optimize-images.js
  node optimize-images.js --dry-run
  node optimize-images.js --format=webp --quality=85
    `);
    return;
  }

  // 옵션 파싱
  if (args.includes('--dry-run')) {
    console.log(chalk.yellow('DRY RUN 모드: 실제 파일 처리는 하지 않습니다.'));
    return;
  }

  const formatArg = args.find(arg => arg.startsWith('--format='));
  if (formatArg) {
    const format = formatArg.split('=')[1];
    CONFIG.formats = [format];
  }

  const qualityArg = args.find(arg => arg.startsWith('--quality='));
  if (qualityArg) {
    const quality = parseInt(qualityArg.split('=')[1]);
    Object.keys(CONFIG.quality).forEach(key => {
      CONFIG.quality[key] = quality;
    });
  }

  const optimizer = new ImageOptimizer();
  await optimizer.init();
}

// 스크립트 실행
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('스크립트 실행 오류:'), error.message);
    process.exit(1);
  });
}

module.exports = ImageOptimizer;