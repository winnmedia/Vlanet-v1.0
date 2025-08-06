#!/usr/bin/env node

/**
 * 기존 이미지 사용 코드를 OptimizedImage로 마이그레이션하는 스크립트
 * - img 태그를 OptimizedImage 컴포넌트로 변환
 * - import 문 자동 추가
 * - props 변환 및 최적화
 * - 백업 파일 생성
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');
const chalk = require('chalk');

// 설정
const CONFIG = {
  sourceDir: path.join(__dirname, '../src'),
  pagesDir: path.join(__dirname, '../pages'),
  backupDir: path.join(__dirname, '../backup/image-migration'),
  extensions: ['jsx', 'js', 'tsx', 'ts'],
  exclude: ['node_modules', '.next', 'backup'],
  dryRun: process.argv.includes('--dry-run')
};

class ImageMigrator {
  constructor() {
    this.stats = {
      filesProcessed: 0,
      imagesConverted: 0,
      importsAdded: 0,
      errors: 0,
      skipped: 0
    };
    this.conversions = [];
  }

  log(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red
    };
    console.log(colors[type](`[IMAGE-MIGRATOR] ${message}`));
  }

  async init() {
    try {
      if (!CONFIG.dryRun) {
        await fs.mkdir(CONFIG.backupDir, { recursive: true });
      }
      
      this.log(CONFIG.dryRun ? 'DRY RUN 모드로 이미지 마이그레이션 시작' : '이미지 마이그레이션 시작');
      
      const files = await this.findReactFiles();
      this.log(`총 ${files.length}개의 파일 발견`);

      for (const filePath of files) {
        await this.processFile(filePath);
      }

      await this.generateMigrationReport();
      this.printReport();

    } catch (error) {
      this.log(`초기화 오류: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async findReactFiles() {
    const patterns = CONFIG.extensions.map(ext => 
      `**/*.${ext}`
    );
    
    const allFiles = [];
    
    for (const pattern of patterns) {
      const sourceFiles = await this.globPromise(path.join(CONFIG.sourceDir, pattern));
      const pageFiles = await this.globPromise(path.join(CONFIG.pagesDir, pattern));
      allFiles.push(...sourceFiles, ...pageFiles);
    }

    // 제외 디렉토리 필터링
    return allFiles.filter(file => {
      return !CONFIG.exclude.some(exclude => file.includes(exclude));
    });
  }

  async globPromise(pattern) {
    try {
      const files = await glob(pattern);
      return files;
    } catch (error) {
      throw error;
    }
  }

  async processFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const originalContent = content;
      
      // img 태그가 있는지 확인
      if (!this.hasImageTags(content)) {
        return;
      }

      this.log(`처리 중: ${path.relative(process.cwd(), filePath)}`);
      
      let newContent = content;
      const conversions = [];
      
      // 1. img 태그를 OptimizedImage로 변환
      newContent = this.convertImgTags(newContent, conversions);
      
      // 2. OptimizedImage import 추가
      newContent = this.addOptimizedImageImport(newContent);
      
      // 3. 변경사항이 있는 경우에만 처리
      if (newContent !== originalContent) {
        if (!CONFIG.dryRun) {
          // 백업 생성
          await this.createBackup(filePath, originalContent);
          
          // 새 파일 작성
          await fs.writeFile(filePath, newContent, 'utf-8');
        }
        
        this.conversions.push({
          file: filePath,
          conversions: conversions
        });
        
        this.stats.filesProcessed++;
        this.stats.imagesConverted += conversions.length;
        if (this.needsImport(originalContent)) {
          this.stats.importsAdded++;
        }
        
        this.log(`변환 완료: ${conversions.length}개 이미지`, 'success');
      }

    } catch (error) {
      this.log(`파일 처리 오류 (${filePath}): ${error.message}`, 'error');
      this.stats.errors++;
    }
  }

  hasImageTags(content) {
    return /<img\s+[^>]*>/gi.test(content);
  }

  convertImgTags(content, conversions) {
    const imgRegex = /<img\s+([^>]*?)>/gi;
    
    return content.replace(imgRegex, (match, attributes) => {
      const props = this.parseAttributes(attributes);
      const optimizedProps = this.convertToOptimizedProps(props);
      
      conversions.push({
        original: match,
        converted: this.buildOptimizedImageTag(optimizedProps),
        props: optimizedProps
      });
      
      return this.buildOptimizedImageTag(optimizedProps);
    });
  }

  parseAttributes(attributeString) {
    const props = {};
    
    // 속성 파싱 정규식
    const attrRegex = /(\w+)=(?:"([^"]*)"|'([^']*)'|(\w+))/g;
    let match;
    
    while ((match = attrRegex.exec(attributeString)) !== null) {
      const [, name, doubleQuoted, singleQuoted, unquoted] = match;
      props[name] = doubleQuoted || singleQuoted || unquoted;
    }
    
    return props;
  }

  convertToOptimizedProps(props) {
    const optimized = {};
    
    // 기본 props 변환
    if (props.src) optimized.src = props.src;
    if (props.alt) optimized.alt = props.alt;
    if (props.width) optimized.width = this.parseNumber(props.width);
    if (props.height) optimized.height = this.parseNumber(props.height);
    if (props.className || props.class) optimized.className = props.className || props.class;
    if (props.style) optimized.style = props.style;
    
    // 최적화 추가 props
    if (this.isHeroImage(props)) {
      optimized.priority = true;
      optimized.quality = 85;
    } else if (this.isAvatarImage(props)) {
      optimized.quality = 80;
      optimized.aspectRatio = '"1/1"';
    } else if (this.isThumbnailImage(props)) {
      optimized.quality = 70;
      optimized.lazy = true;
    }
    
    // 접근성 개선
    if (!optimized.alt) {
      optimized.alt = '""';
    }
    
    return optimized;
  }

  parseNumber(value) {
    const num = parseInt(value);
    return isNaN(num) ? value : num;
  }

  isHeroImage(props) {
    const src = props.src || '';
    const className = props.className || props.class || '';
    
    return src.includes('hero') || 
           src.includes('banner') || 
           className.includes('hero') ||
           className.includes('banner') ||
           (props.width && parseInt(props.width) > 1200);
  }

  isAvatarImage(props) {
    const src = props.src || '';
    const className = props.className || props.class || '';
    
    return src.includes('avatar') ||
           src.includes('profile') ||
           className.includes('avatar') ||
           className.includes('profile') ||
           (props.width && props.height && parseInt(props.width) <= 100);
  }

  isThumbnailImage(props) {
    const src = props.src || '';
    const className = props.className || props.class || '';
    
    return src.includes('thumb') ||
           src.includes('thumbnail') ||
           className.includes('thumb') ||
           className.includes('thumbnail');
  }

  buildOptimizedImageTag(props) {
    const propStrings = [];
    
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'number') {
        propStrings.push(`${key}={${value}}`);
      } else if (typeof value === 'boolean') {
        propStrings.push(value ? key : `${key}={${value}}`);
      } else if (key === 'style' && typeof value === 'string' && value.startsWith('{')) {
        propStrings.push(`${key}={${value}}`);
      } else {
        propStrings.push(`${key}="${value}"`);
      }
    }
    
    return `<OptimizedImage ${propStrings.join(' ')} />`;
  }

  addOptimizedImageImport(content) {
    // 이미 import가 있는지 확인
    if (content.includes("import OptimizedImage from")) {
      return content;
    }
    
    // React import 찾기
    const reactImportMatch = content.match(/import\s+.*?from\s+['"]react['"];?\n/);
    
    if (reactImportMatch) {
      // React import 다음 줄에 추가
      const importIndex = reactImportMatch.index + reactImportMatch[0].length;
      const importStatement = "import OptimizedImage from '@/components/OptimizedImage';\n";
      
      return content.slice(0, importIndex) + importStatement + content.slice(importIndex);
    } else {
      // 파일 시작 부분에 추가
      const importStatement = "import OptimizedImage from '@/components/OptimizedImage';\n";
      return importStatement + content;
    }
  }

  needsImport(content) {
    return !content.includes("import OptimizedImage from");
  }

  async createBackup(filePath, content) {
    const relativePath = path.relative(process.cwd(), filePath);
    const backupPath = path.join(CONFIG.backupDir, relativePath);
    
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    await fs.writeFile(backupPath, content, 'utf-8');
  }

  async generateMigrationReport() {
    const reportPath = path.join(CONFIG.backupDir, 'migration-report.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      conversions: this.conversions,
      config: CONFIG
    };
    
    if (!CONFIG.dryRun) {
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    }
    
    // 마크다운 리포트 생성
    await this.generateMarkdownReport(report);
  }

  async generateMarkdownReport(report) {
    const markdown = `# 이미지 마이그레이션 리포트

생성일: ${new Date(report.timestamp).toLocaleString('ko-KR')}

## 통계

- 처리된 파일: ${this.stats.filesProcessed}개
- 변환된 이미지: ${this.stats.imagesConverted}개  
- 추가된 import: ${this.stats.importsAdded}개
- 오류 발생: ${this.stats.errors}개

## 변환된 파일 목록

${this.conversions.map(conv => {
  const relativePath = path.relative(process.cwd(), conv.file);
  return `### ${relativePath}

변환된 이미지: ${conv.conversions.length}개

${conv.conversions.map((c, i) => `
**${i + 1}. 변환**
- Before: \`${c.original}\`
- After: \`${c.converted}\`
`).join('')}
`;
}).join('\n')}

## 권장 사항

1. **테스트 실행**: 변환된 파일들이 올바르게 작동하는지 테스트하세요.
2. **스타일 확인**: CSS나 인라인 스타일이 올바르게 적용되는지 확인하세요.
3. **성능 모니터링**: 이미지 로딩 성능을 모니터링하세요.
4. **점진적 적용**: 한 번에 모든 파일을 배포하지 말고 점진적으로 적용하세요.

## 롤백 방법

백업된 파일들은 \`${CONFIG.backupDir}\`에 저장되어 있습니다.
롤백이 필요한 경우 백업 파일을 원본 위치로 복사하세요.

\`\`\`bash
# 전체 롤백
cp -r ${CONFIG.backupDir}/src/* src/
cp -r ${CONFIG.backupDir}/pages/* pages/
\`\`\`
`;

    const reportPath = path.join(CONFIG.backupDir, 'MIGRATION_REPORT.md');
    if (!CONFIG.dryRun) {
      await fs.writeFile(reportPath, markdown);
    } else {
      console.log('\n' + chalk.cyan('마이그레이션 리포트 미리보기:'));
      console.log(markdown);
    }
  }

  printReport() {
    console.log('\n' + chalk.bold.green('========== 이미지 마이그레이션 완료 =========='));
    console.log(`처리된 파일: ${chalk.cyan(this.stats.filesProcessed)}개`);
    console.log(`변환된 이미지: ${chalk.cyan(this.stats.imagesConverted)}개`);
    console.log(`추가된 import: ${chalk.cyan(this.stats.importsAdded)}개`);
    console.log(`오류 발생: ${chalk.red(this.stats.errors)}개`);
    
    if (CONFIG.dryRun) {
      console.log(chalk.yellow('\n⚠️  DRY RUN 모드: 실제 파일 변경은 수행되지 않았습니다.'));
      console.log(chalk.yellow('실제 마이그레이션을 위해 --dry-run 옵션 없이 다시 실행하세요.'));
    } else {
      console.log(chalk.green(`\n✅ 백업 파일 위치: ${CONFIG.backupDir}`));
      console.log(chalk.green('✅ 마이그레이션 완료! 테스트 후 배포해주세요.'));
    }
    
    console.log('==============================================\n');
  }
}

// 추가 유틸리티 함수들
class ImageMigrationUtilities {
  static async rollback() {
    const backupDir = CONFIG.backupDir;
    
    try {
      // 백업 디렉토리 확인
      await fs.access(backupDir);
      
      console.log(chalk.yellow('백업에서 파일 복원 중...'));
      
      // src 디렉토리 복원
      const srcBackup = path.join(backupDir, 'src');
      try {
        await fs.access(srcBackup);
        await this.copyRecursive(srcBackup, CONFIG.sourceDir);
        console.log(chalk.green('src 디렉토리 복원 완료'));
      } catch (e) {
        console.log(chalk.yellow('src 백업을 찾을 수 없습니다'));
      }
      
      // pages 디렉토리 복원
      const pagesBackup = path.join(backupDir, 'pages');
      try {
        await fs.access(pagesBackup);
        await this.copyRecursive(pagesBackup, CONFIG.pagesDir);
        console.log(chalk.green('pages 디렉토리 복원 완료'));
      } catch (e) {
        console.log(chalk.yellow('pages 백업을 찾을 수 없습니다'));
      }
      
      console.log(chalk.green('롤백 완료!'));
      
    } catch (error) {
      console.log(chalk.red(`롤백 실패: ${error.message}`));
    }
  }

  static async copyRecursive(src, dest) {
    const stat = await fs.stat(src);
    
    if (stat.isDirectory()) {
      await fs.mkdir(dest, { recursive: true });
      const files = await fs.readdir(src);
      
      for (const file of files) {
        await this.copyRecursive(
          path.join(src, file),
          path.join(dest, file)
        );
      }
    } else {
      await fs.copyFile(src, dest);
    }
  }
}

// 명령행 인터페이스
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
이미지 마이그레이션 스크립트

사용법:
  node migrate-images.js [옵션]

옵션:
  --help, -h     도움말 표시
  --dry-run      실제 변경 없이 시뮬레이션만 실행
  --rollback     백업에서 파일 복원

예시:
  node migrate-images.js --dry-run     # 시뮬레이션
  node migrate-images.js               # 실제 마이그레이션
  node migrate-images.js --rollback    # 롤백
    `);
    return;
  }

  if (args.includes('--rollback')) {
    await ImageMigrationUtilities.rollback();
    return;
  }

  const migrator = new ImageMigrator();
  await migrator.init();
}

// 스크립트 실행
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('스크립트 실행 오류:'), error.message);
    process.exit(1);
  });
}

module.exports = { ImageMigrator, ImageMigrationUtilities };