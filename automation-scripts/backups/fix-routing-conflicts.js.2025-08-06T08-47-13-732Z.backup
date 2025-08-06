#!/usr/bin/env node

/**
 * VideoPlanet Routing Conflict Resolution Script
 * Fronty's Pixel-Perfect Solution
 * 
 * This script will fix all React Router conflicts with Next.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class RoutingFixer {
  constructor() {
    this.filesFixed = 0;
    this.errors = [];
    this.srcDir = path.join(__dirname, '..');
  }

  // Fix React Router imports to use Next.js compatibility layer
  fixImports(content, filePath) {
    let modified = false;
    let newContent = content;

    // Pattern 1: Direct react-router-dom imports
    if (content.includes('from "react-router-dom"') || content.includes("from 'react-router-dom'")) {
      newContent = newContent.replace(
        /import\s*{([^}]+)}\s*from\s*['"]react-router-dom['"]/g,
        (match, imports) => {
          // Check if nextNavigation already exists
          if (!content.includes("from '../util/nextNavigation'") && 
              !content.includes('from "../util/nextNavigation"') &&
              !content.includes("from '../../util/nextNavigation'") &&
              !content.includes('from "../../util/nextNavigation"')) {
            
            // Calculate relative path
            const relativePath = this.getRelativePath(filePath);
            modified = true;
            return `import {${imports}} from '${relativePath}/util/nextNavigation'`;
          }
          return match;
        }
      );
    }

    // Pattern 2: Individual imports from react-router-dom
    const routerImports = [
      'useNavigate', 'useParams', 'useLocation', 'useSearchParams',
      'Link', 'NavLink', 'Navigate'
    ];

    routerImports.forEach(importName => {
      const patterns = [
        new RegExp(`import\\s*{\\s*${importName}\\s*}\\s*from\\s*['"]react-router-dom['"]`, 'g'),
        new RegExp(`import\\s*${importName}\\s*from\\s*['"]react-router-dom/${importName}['"]`, 'g')
      ];

      patterns.forEach(pattern => {
        if (pattern.test(newContent)) {
          const relativePath = this.getRelativePath(filePath);
          newContent = newContent.replace(pattern, 
            `import { ${importName} } from '${relativePath}/util/nextNavigation'`
          );
          modified = true;
        }
      });
    });

    // Pattern 3: Fix useRouter imports (should use our wrapper)
    if (content.includes("useRouter } from 'next/router'") || 
        content.includes('useRouter } from "next/router"')) {
      // Check if it's not already importing from nextNavigation
      if (!content.includes('nextNavigation')) {
        const relativePath = this.getRelativePath(filePath);
        newContent = newContent.replace(
          /import\s*{\s*useRouter\s*}\s*from\s*['"]next\/router['"]/g,
          `import { useRouter } from '${relativePath}/util/nextNavigation'`
        );
        modified = true;
      }
    }

    // Pattern 4: Fix navigate() calls to use proper syntax
    if (content.includes('navigate(')) {
      // Fix navigate with state
      newContent = newContent.replace(
        /navigate\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*{\s*state:\s*({[^}]+})\s*}\s*\)/g,
        'navigate("$1", { state: $2 })'
      );

      // Fix navigate with replace
      newContent = newContent.replace(
        /navigate\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*{\s*replace:\s*true\s*}\s*\)/g,
        'navigate("$1", { replace: true })'
      );

      if (newContent !== content) {
        modified = true;
      }
    }

    return { content: newContent, modified };
  }

  // Calculate relative path from file to src directory
  getRelativePath(filePath) {
    const fileDir = path.dirname(filePath);
    const relativePath = path.relative(fileDir, this.srcDir);
    return relativePath || '.';
  }

  // Process a single file
  processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { content: newContent, modified } = this.fixImports(content, filePath);

      if (modified) {
        // Backup original file
        const backupPath = filePath + '.routing-backup';
        if (!fs.existsSync(backupPath)) {
          fs.writeFileSync(backupPath, content);
        }

        // Write fixed content
        fs.writeFileSync(filePath, newContent);
        this.filesFixed++;
        console.log(`✅ Fixed: ${path.relative(this.srcDir, filePath)}`.green);
      }
    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      console.error(`❌ Error processing ${filePath}: ${error.message}`.red);
    }
  }

  // Update nextNavigation.js to be more comprehensive
  updateNavigationUtil() {
    const utilPath = path.join(this.srcDir, 'util', 'nextNavigation.js');
    
    const improvedContent = `import { useRouter as useNextRouter } from 'next/router'
import NextLink from 'next/link'

// URL 매핑 테이블 (대문자 -> 소문자)
const urlMapping = {
  '/Login': '/login',
  '/Signup': '/signup',
  '/ResetPw': '/resetpw',
  '/MyPage': '/mypage',
  '/AdminDashboard': '/admindashboard',
  '/ProjectCreate': '/project/create',
  '/CmsHome': '/cmshome',
  '/EmailCheck': '/emailcheck',
  '/FeedbackAll': '/feedbackall',
  '/VideoPlanning': '/videoplanning',
  '/Calendar': '/calendar',
  '/EmailMonitor': '/emailmonitor',
}

// 동적 라우트 변환 함수
const convertDynamicRoute = (path) => {
  // /ProjectEdit/123 -> /project/123/edit
  if (path.startsWith('/ProjectEdit/')) {
    const id = path.split('/')[2]
    return \`/project/\${id}/edit\`
  }
  // /ProjectView/123 -> /project/123
  if (path.startsWith('/ProjectView/')) {
    const id = path.split('/')[2]
    return \`/project/\${id}\`
  }
  // /Feedback/123 -> /feedback/123
  if (path.startsWith('/Feedback/')) {
    const id = path.split('/')[2]
    return \`/feedback/\${id}\`
  }
  return path
}

// React Router의 useNavigate를 Next.js router로 대체
export const useNavigate = () => {
  const router = useNextRouter()
  
  return (path, options = {}) => {
    // URL 매핑 적용
    let mappedPath = urlMapping[path] || path
    
    // 동적 라우트 처리
    if (mappedPath === path) {
      mappedPath = convertDynamicRoute(path)
    }
    
    // Handle state passing through query params
    if (options.state) {
      const stateString = encodeURIComponent(JSON.stringify(options.state))
      mappedPath = \`\${mappedPath}?state=\${stateString}\`
    }
    
    if (options.replace) {
      router.replace(mappedPath)
    } else {
      router.push(mappedPath)
    }
  }
}

// Enhanced useRouter that includes navigate function
export const useRouter = () => {
  const router = useNextRouter()
  const navigate = useNavigate()
  
  return {
    ...router,
    navigate,
  }
}

// React Router의 useParams를 Next.js router.query로 대체
export const useParams = () => {
  const router = useNextRouter()
  return router.query
}

// React Router의 useLocation을 Next.js router로 대체
export const useLocation = () => {
  const router = useNextRouter()
  
  // Parse state from query params if exists
  let state = null
  if (router.query.state) {
    try {
      state = JSON.parse(decodeURIComponent(router.query.state))
    } catch (e) {
      // Invalid state
    }
  }
  
  return {
    pathname: router.pathname,
    search: router.asPath.includes('?') ? router.asPath.split('?')[1] : '',
    hash: '',
    state,
  }
}

// React Router의 useSearchParams를 Next.js router로 대체
export const useSearchParams = () => {
  const router = useNextRouter()
  const searchParams = new URLSearchParams(router.asPath.includes('?') ? router.asPath.split('?')[1] : '')
  
  const setSearchParams = (newParams) => {
    const params = new URLSearchParams(newParams)
    router.push(\`\${router.pathname}?\${params.toString()}\`)
  }
  
  return [searchParams, setSearchParams]
}

// Link component compatibility
export const Link = ({ to, children, ...props }) => {
  let href = urlMapping[to] || to
  
  // Handle dynamic routes
  if (href === to) {
    href = convertDynamicRoute(to)
  }
  
  return (
    <NextLink href={href} {...props}>
      {children}
    </NextLink>
  )
}

// NavLink component (similar to Link but with active state)
export const NavLink = ({ to, children, className, activeClassName = 'active', ...props }) => {
  const router = useNextRouter()
  let href = urlMapping[to] || to
  
  if (href === to) {
    href = convertDynamicRoute(to)
  }
  
  const isActive = router.pathname === href
  const finalClassName = isActive 
    ? \`\${className || ''} \${activeClassName}\`.trim()
    : className
  
  return (
    <NextLink href={href} className={finalClassName} {...props}>
      {children}
    </NextLink>
  )
}

// Navigate component for redirects
export const Navigate = ({ to, replace = false }) => {
  const router = useNextRouter()
  
  React.useEffect(() => {
    let href = urlMapping[to] || to
    
    if (href === to) {
      href = convertDynamicRoute(to)
    }
    
    if (replace) {
      router.replace(href)
    } else {
      router.push(href)
    }
  }, [to, replace, router])
  
  return null
}
`;

    try {
      // Backup original
      const backupPath = utilPath + '.routing-backup';
      if (!fs.existsSync(backupPath) && fs.existsSync(utilPath)) {
        fs.writeFileSync(backupPath, fs.readFileSync(utilPath, 'utf8'));
      }

      // Write improved version
      fs.writeFileSync(utilPath, improvedContent);
      console.log('✅ Updated nextNavigation.js with enhanced compatibility layer'.green);
    } catch (error) {
      console.error('❌ Failed to update nextNavigation.js:'.red, error.message);
    }
  }

  // Main execution
  async run() {
    console.log('\n╔══════════════════════════════════════════════════════════════════╗'.cyan);
    console.log('║        ROUTING CONFLICT RESOLUTION - FRONTY\'S FIX                ║'.cyan.bold);
    console.log('╚══════════════════════════════════════════════════════════════════╝'.cyan);
    console.log('\n🔧 Starting routing conflict resolution...'.yellow);

    // Step 1: Update navigation utility
    console.log('\n📝 Step 1: Updating navigation utility...'.cyan);
    this.updateNavigationUtil();

    // Step 2: Find all files with React Router imports
    console.log('\n🔍 Step 2: Scanning for React Router imports...'.cyan);
    const patterns = [
      path.join(this.srcDir, '**/*.jsx'),
      path.join(this.srcDir, '**/*.js'),
    ];

    const files = [];
    patterns.forEach(pattern => {
      files.push(...glob.sync(pattern, {
        ignore: [
          '**/node_modules/**',
          '**/build/**',
          '**/dist/**',
          '**/*.test.js',
          '**/*.spec.js',
          '**/tests/**',
          '**/nextNavigation.js'
        ]
      }));
    });

    console.log(`Found ${files.length} files to check`.gray);

    // Step 3: Process each file
    console.log('\n⚡ Step 3: Processing files...'.cyan);
    files.forEach(file => {
      this.processFile(file);
    });

    // Step 4: Report results
    console.log('\n' + '='.repeat(70).green);
    console.log('✨ ROUTING CONFLICT RESOLUTION COMPLETE'.green.bold);
    console.log('='.repeat(70).green);
    console.log(`✅ Files fixed: ${this.filesFixed}`.green);
    
    if (this.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${this.errors.length}`.yellow);
      this.errors.forEach(err => {
        console.log(`  - ${err.file}: ${err.error}`.red);
      });
    }

    console.log('\n📋 Next Steps:'.cyan.bold);
    console.log('1. Restart the development server: npm run dev');
    console.log('2. Clear browser cache');
    console.log('3. Test all pages for proper routing');
    console.log('4. If issues persist, check console for errors\n');

    if (this.filesFixed > 0) {
      console.log('💡 Backup files created with .routing-backup extension'.gray);
      console.log('   You can restore them if needed.\n'.gray);
    }
  }
}

// Check if colors module is available
try {
  require('colors');
} catch (e) {
  // Install colors if not available
  console.log('Installing required dependency: colors');
  require('child_process').execSync('npm install colors', { stdio: 'inherit' });
}

// Run the fixer
const fixer = new RoutingFixer();
fixer.run().catch(error => {
  console.error('❌ Fatal error:'.red, error.message);
  process.exit(1);
});