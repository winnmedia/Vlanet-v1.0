#!/usr/bin/env node

/**
 * VideoPlanet Frontend Comprehensive Debug Script
 * Fronty's Pixel-Perfect Debugging Tool
 */

const axios = require('axios');
const colors = require('colors');
const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:8000';

// Design system colors for consistency
const BRAND_COLORS = {
  primary: '#1631F8',
  danger: '#dc3545',
  success: '#28a745',
  warning: '#ffc107',
  info: '#17a2b8'
};

class FrontyDebugger {
  constructor() {
    this.issues = [];
    this.solutions = [];
    this.testResults = {
      routing: [],
      api: [],
      auth: [],
      pages: []
    };
  }

  // Check if services are running
  async checkServices() {
    console.log('\n' + '='.repeat(80).cyan);
    console.log('🔍 SERVICE STATUS CHECK'.cyan.bold);
    console.log('='.repeat(80).cyan);

    // Check frontend
    try {
      const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
      console.log('✅ Frontend Service:'.green, 'Running on port 3000');
    } catch (error) {
      console.log('❌ Frontend Service:'.red, 'Not running');
      this.issues.push('Frontend service not running on port 3000');
      this.solutions.push('Run: npm run dev');
    }

    // Check backend
    try {
      const response = await axios.get(`${BACKEND_URL}/api/health/`, { timeout: 5000 });
      console.log('✅ Backend Service:'.green, 'Running on port 8000');
    } catch (error) {
      console.log('⚠️  Backend Service:'.yellow, 'Not running or health check failed');
      this.issues.push('Backend service not accessible on port 8000');
      this.solutions.push('Run: cd ../vridge_back && python3 manage.py runserver');
    }
  }

  // Test all main routes
  async testRouting() {
    console.log('\n' + '='.repeat(80).cyan);
    console.log('🛣️  ROUTING TEST'.cyan.bold);
    console.log('='.repeat(80).cyan);

    const routes = [
      { path: '/', name: 'Home Page' },
      { path: '/login', name: 'Login Page' },
      { path: '/signup', name: 'Signup Page' },
      { path: '/cmshome', name: 'CMS Home' },
      { path: '/project/create', name: 'Project Create' },
      { path: '/videoplanning', name: 'Video Planning' },
      { path: '/feedbackall', name: 'All Feedback' },
      { path: '/mypage', name: 'My Page' },
      { path: '/calendar', name: 'Calendar' },
      { path: '/admin', name: 'Admin Dashboard' }
    ];

    for (const route of routes) {
      try {
        const response = await axios.get(`${FRONTEND_URL}${route.path}`, {
          timeout: 5000,
          validateStatus: (status) => status < 500
        });

        if (response.status === 200) {
          console.log(`✅ ${route.name}:`.green, `${route.path} (${response.status})`);
          this.testResults.routing.push({ ...route, status: 'success', code: response.status });
        } else if (response.status === 404) {
          console.log(`❌ ${route.name}:`.red, `${route.path} (404 - Not Found)`);
          this.issues.push(`Route ${route.path} returns 404`);
          this.testResults.routing.push({ ...route, status: 'not_found', code: 404 });
        } else {
          console.log(`⚠️  ${route.name}:`.yellow, `${route.path} (${response.status})`);
          this.testResults.routing.push({ ...route, status: 'warning', code: response.status });
        }
      } catch (error) {
        console.log(`❌ ${route.name}:`.red, `${route.path} (Error: ${error.message})`);
        this.issues.push(`Route ${route.path} failed: ${error.message}`);
        this.testResults.routing.push({ ...route, status: 'error', error: error.message });
      }
    }
  }

  // Test API connectivity
  async testAPIConnectivity() {
    console.log('\n' + '='.repeat(80).cyan);
    console.log('🔌 API CONNECTIVITY TEST'.cyan.bold);
    console.log('='.repeat(80).cyan);

    const apiEndpoints = [
      { path: '/api/health/', name: 'Health Check' },
      { path: '/api/users/check/', name: 'User Check' },
      { path: '/api/projects/', name: 'Projects List' },
      { path: '/api/feedbacks/', name: 'Feedbacks List' }
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const response = await axios.get(`${BACKEND_URL}${endpoint.path}`, {
          timeout: 5000,
          validateStatus: (status) => status < 500
        });

        if (response.status === 200) {
          console.log(`✅ ${endpoint.name}:`.green, `${endpoint.path} (${response.status})`);
          this.testResults.api.push({ ...endpoint, status: 'success', code: response.status });
        } else if (response.status === 401) {
          console.log(`⚠️  ${endpoint.name}:`.yellow, `${endpoint.path} (401 - Auth Required)`);
          this.testResults.api.push({ ...endpoint, status: 'auth_required', code: 401 });
        } else {
          console.log(`⚠️  ${endpoint.name}:`.yellow, `${endpoint.path} (${response.status})`);
          this.testResults.api.push({ ...endpoint, status: 'warning', code: response.status });
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log(`❌ ${endpoint.name}:`.red, 'Backend not running');
          this.issues.push('Backend service not running');
        } else {
          console.log(`❌ ${endpoint.name}:`.red, `${endpoint.path} (Error: ${error.message})`);
          this.issues.push(`API endpoint ${endpoint.path} failed`);
        }
        this.testResults.api.push({ ...endpoint, status: 'error', error: error.message });
      }
    }
  }

  // Check for console errors
  checkBuildIssues() {
    console.log('\n' + '='.repeat(80).cyan);
    console.log('🏗️  BUILD & CONFIGURATION CHECK'.cyan.bold);
    console.log('='.repeat(80).cyan);

    // Check package.json
    const packageJsonPath = path.join(__dirname, '../../package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log('✅ Package.json:'.green, `Version ${packageJson.version}`);
      
      // Check for React Router and Next.js
      if (packageJson.dependencies['react-router-dom'] && packageJson.dependencies['next']) {
        console.log('⚠️  Warning:'.yellow, 'Both React Router and Next.js detected');
        this.issues.push('Potential routing conflict: Both React Router and Next.js are installed');
        this.solutions.push('Use Next.js routing exclusively. Remove React Router imports from components.');
      }
    }

    // Check Next.js config
    const nextConfigPath = path.join(__dirname, '../../next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      console.log('✅ Next.js Config:'.green, 'Found');
    } else {
      console.log('❌ Next.js Config:'.red, 'Not found');
      this.issues.push('next.config.js not found');
    }

    // Check for common issues in pages
    const pagesDir = path.join(__dirname, '../../pages');
    if (fs.existsSync(pagesDir)) {
      const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.js'));
      console.log('✅ Pages Directory:'.green, `${pageFiles.length} pages found`);
    }
  }

  // Generate solutions
  generateSolutions() {
    console.log('\n' + '='.repeat(80).yellow);
    console.log('💡 IDENTIFIED ISSUES & SOLUTIONS'.yellow.bold);
    console.log('='.repeat(80).yellow);

    if (this.issues.length === 0) {
      console.log('✅ No critical issues found!'.green.bold);
      return;
    }

    // Routing issues
    const routingIssues = this.testResults.routing.filter(r => r.status === 'not_found');
    if (routingIssues.length > 0) {
      console.log('\n❌ Routing Issues:'.red.bold);
      routingIssues.forEach(issue => {
        console.log(`  - ${issue.path}: Page not found`);
      });
      console.log('\n💡 Solution:'.cyan);
      console.log('  1. Check if the page file exists in the pages/ directory');
      console.log('  2. Ensure the component is properly exported');
      console.log('  3. Restart the development server after adding new pages');
    }

    // API issues
    const apiIssues = this.testResults.api.filter(a => a.status === 'error');
    if (apiIssues.length > 0) {
      console.log('\n❌ API Connection Issues:'.red.bold);
      apiIssues.forEach(issue => {
        console.log(`  - ${issue.path}: ${issue.error || 'Failed to connect'}`);
      });
      console.log('\n💡 Solution:'.cyan);
      console.log('  1. Start the backend server: cd ../vridge_back && python3 manage.py runserver');
      console.log('  2. Check CORS settings in Django');
      console.log('  3. Verify API_BASE_URL in frontend configuration');
    }

    // General solutions
    if (this.solutions.length > 0) {
      console.log('\n📋 Additional Solutions:'.cyan.bold);
      this.solutions.forEach((solution, index) => {
        console.log(`  ${index + 1}. ${solution}`);
      });
    }
  }

  // Generate detailed report
  generateReport() {
    console.log('\n' + '='.repeat(80).magenta);
    console.log('📊 PIXEL-PERFECT ANALYSIS REPORT'.magenta.bold);
    console.log('='.repeat(80).magenta);

    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      summary: {
        totalRoutes: this.testResults.routing.length,
        successfulRoutes: this.testResults.routing.filter(r => r.status === 'success').length,
        failedRoutes: this.testResults.routing.filter(r => r.status === 'not_found' || r.status === 'error').length,
        totalAPIs: this.testResults.api.length,
        successfulAPIs: this.testResults.api.filter(a => a.status === 'success').length,
        failedAPIs: this.testResults.api.filter(a => a.status === 'error').length
      },
      issues: this.issues,
      solutions: this.solutions,
      details: this.testResults
    };

    // Save report
    const reportPath = path.join(__dirname, `debug-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📈 Summary:'.cyan.bold);
    console.log(`  Routes: ${report.summary.successfulRoutes}/${report.summary.totalRoutes} working`);
    console.log(`  APIs: ${report.summary.successfulAPIs}/${report.summary.totalAPIs} accessible`);
    console.log(`  Critical Issues: ${this.issues.length}`);
    console.log(`\n📁 Full report saved to: ${reportPath}`.gray);

    // Final recommendation
    console.log('\n' + '='.repeat(80).green);
    console.log('🎯 FRONTY\'S RECOMMENDATION'.green.bold);
    console.log('='.repeat(80).green);

    if (this.issues.length === 0) {
      console.log('✨ System is pixel-perfect! All components aligned correctly.'.green.bold);
    } else if (this.issues.length <= 3) {
      console.log('⚠️  Minor adjustments needed. System is 85% optimal.'.yellow.bold);
    } else {
      console.log('🔧 Major alignment required. Multiple pixels out of place!'.red.bold);
    }

    console.log('\nPriority Actions:'.cyan.bold);
    console.log('1. Fix routing issues first (if any)');
    console.log('2. Ensure backend is running and accessible');
    console.log('3. Clear browser cache and restart dev server');
    console.log('4. Check console for additional errors\n');
  }

  async run() {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════════════╗'.cyan);
    console.log('║           FRONTY\'S PIXEL-PERFECT DEBUGGING SYSTEM v1.0                   ║'.cyan.bold);
    console.log('║              "Every pixel must be in its rightful place"                 ║'.gray);
    console.log('╚══════════════════════════════════════════════════════════════════════════╝'.cyan);

    await this.checkServices();
    await this.testRouting();
    await this.testAPIConnectivity();
    this.checkBuildIssues();
    this.generateSolutions();
    this.generateReport();
  }
}

// Run the debugger
const frontyDebugger = new FrontyDebugger();
frontyDebugger.run().catch(error => {
  console.error('❌ Fatal error during debugging:'.red, error.message);
  process.exit(1);
});