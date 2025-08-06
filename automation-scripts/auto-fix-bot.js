#!/usr/bin/env node

/**
 * VideoPlanet 자동 수정 봇
 * 코드 오류를 자동으로 감지하고 수정하는 완벽한 자동화 시스템
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const colors = require('colors');
const chokidar = require('chokidar');
const ImportValidator = require('./import-validator');

class AutoFixBot {
  constructor() {
    this.rootPath = path.join(__dirname, '../vridge_front');
    this.backupPath = path.join(__dirname, 'backups');
    this.logPath = path.join(__dirname, 'logs');
    
    this.fixCount = 0;
    this.errorCount = 0;
    this.fixedFiles = new Set();
    this.isProcessing = false;
    
    this.validator = new ImportValidator();
    
    // 자동 수정 규칙들
    this.fixRules = [
      {
        name: 'Missing Ant Design Icons',
        pattern: /FolderOpenOutlined|UserOutlined|SettingOutlined|DeleteOutlined|EditOutlined|PlusOutlined/g,
        fix: this.fixAntdIcons.bind(this),
      },
      {
        name: 'Missing React Imports',
        pattern: /useState|useEffect|useCallback|useMemo|useRef/g,
        fix: this.fixReactImports.bind(this),
      },
      {
        name: 'Missing Next.js Imports',
        pattern: /useRouter|Link|Head|Image/g,
        fix: this.fixNextjsImports.bind(this),
      },
      {
        name: 'Unused Imports',
        pattern: /import\s+\{[^}]+\}\s+from\s+['"`][^'"`]+['"`]/g,
        fix: this.fixUnusedImports.bind(this),
      },
      {
        name: 'Wrong Import Paths',
        pattern: /import\s+.*\s+from\s+['"`]\.\.?\/[^'"`]+['"`]/g,
        fix: this.fixImportPaths.bind(this),
      },
      {
        name: 'Missing Semicolons',
        pattern: /\n\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*.*[^;]$/gm,
        fix: this.fixSemicolons.bind(this),
      },
      {
        name: 'Console Logs',
        pattern: /console\.(log|debug|info|warn)\s*\([^)]*\)/g,
        fix: this.fixConsoleLogs.bind(this),
      },
    ];
    
    this.initializeDirectories();
  }

  async initializeDirectories() {
    await fs.ensureDir(this.backupPath);
    await fs.ensureDir(this.logPath);
    this.log('🤖 자동 수정 봇 초기화 완료', 'info');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    switch (type) {
      case 'error':
        console.log(`🚨 ${message}`.red);
        break;
      case 'warning':
        console.log(`⚠️ ${message}`.yellow);
        break;
      case 'success':
        console.log(`✅ ${message}`.green);
        break;
      case 'fix':
        console.log(`🔧 ${message}`.blue);
        break;
      case 'info':
      default:
        console.log(`🤖 ${message}`.cyan);
        break;
    }

    // 로그 파일에 저장
    const logFile = path.join(this.logPath, `autofix-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, logEntry + '\n');
  }

  // 파일 백업
  async backupFile(filePath) {
    const relativePath = path.relative(this.rootPath, filePath);
    const backupFilePath = path.join(this.backupPath, `${Date.now()}-${relativePath.replace(/\//g, '_')}`);
    
    await fs.copy(filePath, backupFilePath);
    this.log(`백업 생성: ${backupFilePath}`, 'info');
    
    return backupFilePath;
  }

  // 파일 자동 수정
  async autoFixFile(filePath) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      this.log(`파일 자동 수정 시작: ${path.relative(this.rootPath, filePath)}`, 'fix');
      
      // 백업 생성
      await this.backupFile(filePath);
      
      const originalContent = await fs.readFile(filePath, 'utf-8');
      let fixedContent = originalContent;
      let appliedFixes = [];
      
      // 각 수정 규칙 적용
      for (const rule of this.fixRules) {
        const beforeContent = fixedContent;
        fixedContent = await rule.fix(fixedContent, filePath);
        
        if (beforeContent !== fixedContent) {
          appliedFixes.push(rule.name);
          this.log(`✅ ${rule.name} 적용됨`, 'success');
        }
      }
      
      // 변경사항이 있으면 파일 저장
      if (originalContent !== fixedContent) {
        await fs.writeFile(filePath, fixedContent, 'utf-8');
        this.fixCount++;
        this.fixedFiles.add(filePath);
        
        this.log(`자동 수정 완료: ${appliedFixes.join(', ')}`, 'success');
        
        // ESLint와 Prettier도 실행
        await this.runESLintFix(filePath);
        await this.runPrettierFix(filePath);
        
        return {
          success: true,
          appliedFixes,
          changes: fixedContent.length - originalContent.length,
        };
      } else {
        this.log('수정할 내용이 없습니다.', 'info');
        return { success: true, appliedFixes: [], changes: 0 };
      }
      
    } catch (error) {
      this.errorCount++;
      this.log(`자동 수정 실패: ${error.message}`, 'error');
      return { success: false, error: error.message };
    } finally {
      this.isProcessing = false;
    }
  }

  // Ant Design Icons 수정
  async fixAntdIcons(content, filePath) {
    const iconImports = new Set();
    const iconRegex = /(FolderOpenOutlined|UserOutlined|SettingOutlined|DeleteOutlined|EditOutlined|PlusOutlined|HomeOutlined|MenuOutlined|SearchOutlined|CloseOutlined)/g;
    
    let match;
    while ((match = iconRegex.exec(content)) !== null) {
      iconImports.add(match[1]);
    }
    
    if (iconImports.size === 0) return content;
    
    // 기존 @ant-design/icons import 확인
    const antdIconImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"`]@ant-design\/icons['"`]/;
    const existingImportMatch = content.match(antdIconImportRegex);
    
    if (existingImportMatch) {
      // 기존 import에 추가
      const existingIcons = existingImportMatch[1]
        .split(',')
        .map(icon => icon.trim())
        .filter(icon => icon.length > 0);
      
      const allIcons = new Set([...existingIcons, ...iconImports]);
      const newImportString = Array.from(allIcons).sort().join(', ');
      
      content = content.replace(
        antdIconImportRegex,
        `import { ${newImportString} } from '@ant-design/icons'`
      );
    } else {
      // 새로운 import 추가
      const newImportString = Array.from(iconImports).sort().join(', ');
      const importStatement = `import { ${newImportString} } from '@ant-design/icons';\n`;
      
      // 첫 번째 import 뒤에 추가
      const firstImportIndex = content.indexOf('import ');
      if (firstImportIndex !== -1) {
        const nextLineIndex = content.indexOf('\n', firstImportIndex);
        if (nextLineIndex !== -1) {
          content = content.slice(0, nextLineIndex + 1) + 
                   importStatement + 
                   content.slice(nextLineIndex + 1);
        }
      } else {
        // import가 없으면 파일 맨 위에 추가
        content = importStatement + '\n' + content;
      }
    }
    
    return content;
  }

  // React Hooks import 수정
  async fixReactImports(content, filePath) {
    const reactHooks = new Set();
    const hookRegex = /(useState|useEffect|useCallback|useMemo|useRef|useContext|useReducer)/g;
    
    let match;
    while ((match = hookRegex.exec(content)) !== null) {
      reactHooks.add(match[1]);
    }
    
    if (reactHooks.size === 0) return content;
    
    // 기존 React import 확인
    const reactImportRegex = /import\s+(?:(React)(?:\s*,\s*\{([^}]+)\})?|\{([^}]+)\})\s+from\s+['"`]react['"`]/;
    const existingImportMatch = content.match(reactImportRegex);
    
    if (existingImportMatch) {
      const hasReactDefault = existingImportMatch[1];
      const existingHooks = (existingImportMatch[2] || existingImportMatch[3] || '')
        .split(',')
        .map(hook => hook.trim())
        .filter(hook => hook.length > 0);
      
      const allHooks = new Set([...existingHooks, ...reactHooks]);
      const newHooksString = Array.from(allHooks).sort().join(', ');
      
      let newImportString;
      if (hasReactDefault) {
        newImportString = `import React, { ${newHooksString} } from 'react'`;
      } else {
        newImportString = `import { ${newHooksString} } from 'react'`;
      }
      
      content = content.replace(reactImportRegex, newImportString);
    } else {
      // 새로운 React import 추가
      const newHooksString = Array.from(reactHooks).sort().join(', ');
      const importStatement = `import { ${newHooksString} } from 'react';\n`;
      
      // 파일 맨 위에 추가
      content = importStatement + content;
    }
    
    return content;
  }

  // Next.js import 수정
  async fixNextjsImports(content, filePath) {
    const fixes = [];
    
    // useRouter 수정
    if (content.includes('useRouter') && !content.includes("from 'next/router'")) {
      if (!content.includes("import { useRouter } from 'next/router'")) {
        fixes.push("import { useRouter } from 'next/router';");
      }
    }
    
    // Link 수정
    if (content.includes('<Link') && !content.includes("from 'next/link'")) {
      if (!content.includes("import Link from 'next/link'")) {
        fixes.push("import Link from 'next/link';");
      }
    }
    
    // Head 수정
    if (content.includes('<Head') && !content.includes("from 'next/head'")) {
      if (!content.includes("import Head from 'next/head'")) {
        fixes.push("import Head from 'next/head';");
      }
    }
    
    // Image 수정
    if (content.includes('<Image') && !content.includes("from 'next/image'")) {
      if (!content.includes("import Image from 'next/image'")) {
        fixes.push("import Image from 'next/image';");
      }
    }
    
    if (fixes.length > 0) {
      const importStatements = fixes.join('\n') + '\n';
      
      // 첫 번째 import 뒤에 추가
      const firstImportIndex = content.indexOf('import ');
      if (firstImportIndex !== -1) {
        const nextLineIndex = content.indexOf('\n', firstImportIndex);
        if (nextLineIndex !== -1) {
          content = content.slice(0, nextLineIndex + 1) + 
                   importStatements + 
                   content.slice(nextLineIndex + 1);
        }
      } else {
        content = importStatements + content;
      }
    }
    
    return content;
  }

  // 미사용 import 제거
  async fixUnusedImports(content, filePath) {
    const lines = content.split('\n');
    const filteredLines = [];
    
    for (const line of lines) {
      if (line.trim().startsWith('import ') && line.includes('{')) {
        // Named import 분석
        const match = line.match(/import\s+\{([^}]+)\}\s+from\s+['"`]([^'"`]+)['"`]/);
        if (match) {
          const imports = match[1].split(',').map(imp => imp.trim());
          const moduleName = match[2];
          
          // 실제로 사용되는 import만 필터링
          const usedImports = imports.filter(importName => {
            const usageRegex = new RegExp(`\\b${importName}\\b`, 'g');
            const matches = content.match(usageRegex);
            return matches && matches.length > 1; // 1개는 import 구문 자체
          });
          
          if (usedImports.length > 0) {
            const newLine = `import { ${usedImports.join(', ')} } from '${moduleName}';`;
            filteredLines.push(newLine);
          }
          // 사용되지 않는 import는 제거 (라인을 추가하지 않음)
        } else {
          filteredLines.push(line);
        }
      } else {
        filteredLines.push(line);
      }
    }
    
    return filteredLines.join('\n');
  }

  // Import 경로 수정
  async fixImportPaths(content, filePath) {
    const lines = content.split('\n');
    const fixedLines = [];
    
    for (const line of lines) {
      if (line.trim().startsWith('import ') && line.includes('./')) {
        // 상대 경로 import 검사
        const match = line.match(/from\s+['"`](\.\.?\/[^'"`]+)['"`]/);
        if (match) {
          const importPath = match[1];
          const currentDir = path.dirname(filePath);
          const targetPath = path.resolve(currentDir, importPath);
          
          // 파일이 존재하는지 확인
          const possibleExtensions = ['.js', '.jsx', '.ts', '.tsx'];
          let validPath = null;
          
          for (const ext of possibleExtensions) {
            if (await fs.pathExists(targetPath + ext)) {
              validPath = importPath;
              break;
            }
          }
          
          // index 파일 확인
          if (!validPath) {
            const indexPath = path.join(targetPath, 'index');
            for (const ext of possibleExtensions) {
              if (await fs.pathExists(indexPath + ext)) {
                validPath = importPath;
                break;
              }
            }
          }
          
          if (validPath) {
            fixedLines.push(line);
          } else {
            // 경로를 찾을 수 없으면 주석 처리
            fixedLines.push(`// ${line} // 경로를 찾을 수 없음`);
            this.log(`경로 수정 필요: ${importPath} in ${filePath}`, 'warning');
          }
        } else {
          fixedLines.push(line);
        }
      } else {
        fixedLines.push(line);
      }
    }
    
    return fixedLines.join('\n');
  }

  // 세미콜론 추가
  async fixSemicolons(content, filePath) {
    const lines = content.split('\n');
    const fixedLines = lines.map(line => {
      const trimmed = line.trim();
      
      // 세미콜론이 필요한 구문들
      if (trimmed && 
          !trimmed.endsWith(';') && 
          !trimmed.endsWith('{') && 
          !trimmed.endsWith('}') && 
          !trimmed.startsWith('//') && 
          !trimmed.startsWith('/*') && 
          !trimmed.includes('if ') && 
          !trimmed.includes('for ') && 
          !trimmed.includes('while ') && 
          !trimmed.includes('function ') &&
          !trimmed.includes('class ') &&
          (trimmed.includes('=') || 
           trimmed.includes('return ') || 
           trimmed.includes('import ') || 
           trimmed.includes('export '))) {
        return line + ';';
      }
      
      return line;
    });
    
    return fixedLines.join('\n');
  }

  // Console.log 제거/주석 처리
  async fixConsoleLogs(content, filePath) {
    // production 환경에서만 제거
    if (process.env.NODE_ENV === 'production') {
      return content.replace(/console\.(log|debug|info|warn)\s*\([^)]*\);?/g, '// $&');
    }
    
    return content;
  }

  // ESLint 자동 수정 실행
  async runESLintFix(filePath) {
    return new Promise((resolve) => {
      const relativePath = path.relative(this.rootPath, filePath);
      const command = `cd ${this.rootPath} && npx eslint --fix "${relativePath}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (!error) {
          this.log(`ESLint 자동 수정 완료: ${relativePath}`, 'success');
        }
        resolve(!error);
      });
    });
  }

  // Prettier 자동 수정 실행
  async runPrettierFix(filePath) {
    return new Promise((resolve) => {
      const relativePath = path.relative(this.rootPath, filePath);
      const command = `cd ${this.rootPath} && npx prettier --write "${relativePath}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (!error) {
          this.log(`Prettier 포맷팅 완료: ${relativePath}`, 'success');
        }
        resolve(!error);
      });
    });
  }

  // 프로젝트 전체 자동 수정
  async fixAllFiles() {
    this.log('🚀 프로젝트 전체 자동 수정을 시작합니다...', 'info');
    
    const glob = require('glob');
    const patterns = [
      path.join(this.rootPath, 'src/**/*.{js,jsx}'),
      path.join(this.rootPath, 'pages/**/*.{js,jsx}'),
      path.join(this.rootPath, 'components/**/*.{js,jsx}'),
    ];
    
    const allFiles = [];
    for (const pattern of patterns) {
      const files = glob.sync(pattern);
      allFiles.push(...files);
    }
    
    this.log(`총 ${allFiles.length}개 파일을 처리합니다.`, 'info');
    
    let processedFiles = 0;
    let successCount = 0;
    let errorCount = 0;
    
    for (const file of allFiles) {
      try {
        const result = await this.autoFixFile(file);
        if (result.success) {
          successCount++;
          if (result.appliedFixes.length > 0) {
            this.log(`✅ ${path.relative(this.rootPath, file)}: ${result.appliedFixes.length}개 수정`, 'success');
          }
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
        this.log(`❌ ${path.relative(this.rootPath, file)}: ${error.message}`, 'error');
      }
      
      processedFiles++;
      
      // 진행률 출력 (10개마다)
      if (processedFiles % 10 === 0) {
        this.log(`진행률: ${processedFiles}/${allFiles.length} (${((processedFiles/allFiles.length)*100).toFixed(1)}%)`, 'info');
      }
    }
    
    // 최종 결과
    this.log(`\n🎉 전체 자동 수정 완료!`, 'success');
    this.log(`- 처리된 파일: ${processedFiles}개`, 'info');
    this.log(`- 성공: ${successCount}개`, 'success');
    this.log(`- 실패: ${errorCount}개`, 'error');
    this.log(`- 수정된 파일: ${this.fixedFiles.size}개`, 'success');
    
    return {
      processedFiles,
      successCount,
      errorCount,
      fixedFiles: this.fixedFiles.size,
    };
  }

  // 실시간 감시 모드
  startWatchMode() {
    const watchPaths = [
      path.join(this.rootPath, 'src/**/*.{js,jsx}'),
      path.join(this.rootPath, 'pages/**/*.{js,jsx}'),
      path.join(this.rootPath, 'components/**/*.{js,jsx}'),
    ];

    const watcher = chokidar.watch(watchPaths, {
      ignored: /node_modules|\.next|dist|build|\.git/,
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on('change', async (filePath) => {
      // 짧은 지연 후 처리 (연속 변경 방지)
      setTimeout(async () => {
        await this.autoFixFile(filePath);
      }, 1000);
    });

    this.log('👀 실시간 자동 수정 감시 모드 시작!', 'success');
    
    return watcher;
  }

  // 통계 출력
  printStats() {
    console.log('\n📊 자동 수정 봇 통계:'.bold);
    console.log(`- 총 수정 횟수: ${this.fixCount.toString().green}`);
    console.log(`- 처리 오류: ${this.errorCount.toString().red}`);
    console.log(`- 수정된 파일: ${this.fixedFiles.size.toString().blue}`);
    console.log(`- 성공률: ${this.fixCount > 0 ? ((this.fixCount / (this.fixCount + this.errorCount)) * 100).toFixed(1) : 0}%`);
  }

  // 백업 복원
  async restoreFromBackup(backupPath) {
    const backupFile = path.basename(backupPath);
    const timestamp = backupFile.split('-')[0];
    const originalPath = backupFile.substring(timestamp.length + 1).replace(/_/g, '/');
    const targetPath = path.join(this.rootPath, originalPath);
    
    await fs.copy(backupPath, targetPath);
    this.log(`백업 복원 완료: ${targetPath}`, 'success');
  }

  // 백업 목록 조회
  async listBackups() {
    const backupFiles = await fs.readdir(this.backupPath);
    const backups = backupFiles.map(file => {
      const timestamp = file.split('-')[0];
      const originalPath = file.substring(timestamp.length + 1).replace(/_/g, '/');
      return {
        timestamp: new Date(parseInt(timestamp)).toLocaleString(),
        originalPath,
        backupPath: path.join(this.backupPath, file),
      };
    });
    
    return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
}

// CLI 명령어 처리
if (require.main === module) {
  const args = process.argv.slice(2);
  const bot = new AutoFixBot();

  async function main() {
    if (args.includes('--fix-all')) {
      await bot.fixAllFiles();
    } else if (args.includes('--watch')) {
      const watcher = bot.startWatchMode();
      
      // Ctrl+C로 종료
      process.on('SIGINT', () => {
        console.log('\n👋 자동 수정 봇을 종료합니다...');
        bot.printStats();
        watcher.close();
        process.exit(0);
      });
      
    } else if (args.includes('--fix')) {
      const fileIndex = args.indexOf('--fix') + 1;
      const filePath = args[fileIndex];
      
      if (filePath) {
        const fullPath = path.resolve(filePath);
        await bot.autoFixFile(fullPath);
      } else {
        console.log('파일 경로를 지정해주세요.');
      }
      
    } else if (args.includes('--list-backups')) {
      const backups = await bot.listBackups();
      console.log('\n📋 백업 목록:');
      backups.forEach((backup, index) => {
        console.log(`  ${index + 1}. ${backup.timestamp} - ${backup.originalPath}`);
      });
      
    } else if (args.includes('--restore')) {
      const backupIndex = args.indexOf('--restore') + 1;
      const backupPath = args[backupIndex];
      
      if (backupPath) {
        await bot.restoreFromBackup(backupPath);
      } else {
        console.log('백업 파일 경로를 지정해주세요.');
      }
      
    } else {
      console.log(`
🤖 VideoPlanet Auto-Fix Bot v1.0.0

코드 오류를 자동으로 감지하고 수정합니다.

사용법:
  node auto-fix-bot.js --fix-all     # 프로젝트 전체 자동 수정
  node auto-fix-bot.js --watch       # 실시간 감시 모드
  node auto-fix-bot.js --fix <file>  # 특정 파일 수정
  node auto-fix-bot.js --list-backups # 백업 목록 조회
  node auto-fix-bot.js --restore <backup> # 백업 복원

자동 수정 기능:
  ✅ Ant Design Icons import 자동 추가
  ✅ React Hooks import 자동 추가
  ✅ Next.js import 자동 추가
  ✅ 미사용 import 제거
  ✅ Import 경로 수정
  ✅ 세미콜론 자동 추가
  ✅ Console.log 정리
  ✅ ESLint 자동 수정
  ✅ Prettier 자동 포맷팅

모든 변경사항은 자동으로 백업됩니다.
`.cyan);
    }
  }
  
  main().catch(error => {
    console.error('Auto-Fix Bot 실행 중 오류:', error);
    process.exit(1);
  });
}

module.exports = AutoFixBot;