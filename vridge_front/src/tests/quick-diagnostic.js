#!/usr/bin/env node

/**
 * Quick Diagnostic Script
 * Fronty's Rapid System Check
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_PORT = process.env.PORT || 3002; // Updated to actual port
const BACKEND_PORT = 8000;

console.log('\n╔══════════════════════════════════════════════════════════════════╗');
console.log('║           FRONTY\'S QUICK DIAGNOSTIC v1.0                        ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

// Test frontend routes
const testRoutes = [
  '/',
  '/login',
  '/signup',
  '/cmshome',
  '/project/create',
  '/videoplanning',
  '/mypage'
];

// Test backend endpoints
const testAPIs = [
  '/api/health/',
  '/api/users/check/'
];

function testUrl(url, name) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, { timeout: 3000 }, (res) => {
      if (res.statusCode < 400) {
        console.log(`✅ ${name}: ${url} (${res.statusCode})`);
        resolve({ name, url, status: res.statusCode, success: true });
      } else if (res.statusCode === 404) {
        console.log(`❌ ${name}: ${url} (404 - Not Found)`);
        resolve({ name, url, status: 404, success: false });
      } else {
        console.log(`⚠️  ${name}: ${url} (${res.statusCode})`);
        resolve({ name, url, status: res.statusCode, warning: true });
      }
    }).on('error', (err) => {
      console.log(`❌ ${name}: ${err.message}`);
      resolve({ name, url, error: err.message, success: false });
    });
  });
}

async function runDiagnostic() {
  const results = {
    frontend: [],
    backend: [],
    issues: [],
    fixes: []
  };

  // Test Frontend Routes
  console.log('🌐 FRONTEND ROUTES (Port ' + FRONTEND_PORT + '):\n');
  for (const route of testRoutes) {
    const result = await testUrl(`http://localhost:${FRONTEND_PORT}${route}`, route);
    results.frontend.push(result);
    if (!result.success && result.status === 404) {
      results.issues.push(`Route ${route} not found`);
    }
  }

  // Test Backend APIs
  console.log('\n🔌 BACKEND APIs (Port ' + BACKEND_PORT + '):\n');
  for (const api of testAPIs) {
    const result = await testUrl(`http://localhost:${BACKEND_PORT}${api}`, api);
    results.backend.push(result);
    if (!result.success && result.error && result.error.includes('ECONNREFUSED')) {
      results.issues.push('Backend not running');
      break;
    }
  }

  // Check for routing conflicts
  console.log('\n🔍 CHECKING FOR ROUTING CONFLICTS:\n');
  
  const srcDir = path.join(__dirname, '..');
  const hasReactRouter = fs.existsSync(path.join(srcDir, '..', 'node_modules', 'react-router-dom'));
  const hasNextJs = fs.existsSync(path.join(srcDir, '..', 'node_modules', 'next'));
  
  if (hasReactRouter && hasNextJs) {
    console.log('⚠️  Both React Router and Next.js detected - potential conflict');
    results.issues.push('Routing library conflict detected');
    results.fixes.push('Use Next.js routing exclusively, remove React Router imports');
  } else if (hasNextJs) {
    console.log('✅ Using Next.js routing (correct)');
  }

  // Generate Summary
  console.log('\n' + '═'.repeat(70));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('═'.repeat(70));

  const frontendSuccess = results.frontend.filter(r => r.success).length;
  const backendSuccess = results.backend.filter(r => r.success).length;

  console.log(`\nFrontend: ${frontendSuccess}/${results.frontend.length} routes working`);
  console.log(`Backend: ${backendSuccess}/${results.backend.length} endpoints accessible`);

  if (results.issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    results.issues.forEach(issue => console.log(`  - ${issue}`));
    
    console.log('\n💡 RECOMMENDED FIXES:');
    if (results.issues.includes('Backend not running')) {
      console.log('  1. Start backend: cd ../vridge_back && python3 manage.py runserver');
    }
    if (results.issues.some(i => i.includes('not found'))) {
      console.log('  2. Check pages/ directory for missing page files');
      console.log('  3. Restart dev server after adding new pages');
    }
    if (results.issues.includes('Routing library conflict detected')) {
      console.log('  4. Run: node fix-routing-conflicts.js');
    }
  } else {
    console.log('\n✨ ALL SYSTEMS OPERATIONAL - PIXEL PERFECT! ✨');
  }

  // Save detailed report
  const reportPath = path.join(__dirname, `diagnostic-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📁 Detailed report saved to: ${reportPath}\n`);
}

// Run diagnostic
runDiagnostic().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});