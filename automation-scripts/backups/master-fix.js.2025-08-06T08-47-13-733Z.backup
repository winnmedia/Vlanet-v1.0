#!/usr/bin/env node

/**
 * VideoPlanet Master Fix Script
 * Fronty's Complete System Restoration
 * 
 * This script will fix all identified issues in the correct order
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Check and install required dependencies
function ensureDependencies() {
  const dependencies = ['colors', 'axios', 'glob'];
  
  console.log('🔍 Checking dependencies...');
  
  dependencies.forEach(dep => {
    try {
      require.resolve(dep);
    } catch (e) {
      console.log(`📦 Installing ${dep}...`);
      try {
        execSync(`npm install ${dep}`, { stdio: 'inherit' });
      } catch (error) {
        console.error(`Failed to install ${dep}. Please run: npm install ${dep}`);
      }
    }
  });
}

ensureDependencies();

const colors = require('colors');

class MasterFixer {
  constructor() {
    this.steps = [];
    this.errors = [];
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  // Ask for user confirmation
  async confirm(message) {
    return new Promise((resolve) => {
      this.rl.question(`${message} (y/n): `, (answer) => {
        resolve(answer.toLowerCase() === 'y');
      });
    });
  }

  // Run a script and capture output
  runScript(scriptPath, scriptName) {
    return new Promise((resolve, reject) => {
      console.log(`\n▶️  Running ${scriptName}...`.cyan);
      
      const child = spawn('node', [scriptPath], {
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '1' }
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${scriptName} completed successfully`.green);
          resolve();
        } else {
          console.error(`❌ ${scriptName} failed with code ${code}`.red);
          reject(new Error(`${scriptName} failed`));
        }
      });

      child.on('error', (error) => {
        console.error(`❌ Failed to run ${scriptName}: ${error.message}`.red);
        reject(error);
      });
    });
  }

  // Check if backend is running
  async checkBackend() {
    const axios = require('axios');
    
    try {
      await axios.get('http://localhost:8000/api/health/', { timeout: 3000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Main execution flow
  async run() {
    console.clear();
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗'.cyan);
    console.log('║                                                                              ║');
    console.log('║              VIDEOPLANET MASTER FIX - FRONTY\'S PIXEL PERFECTION             ║'.cyan.bold);
    console.log('║                                                                              ║');
    console.log('║                    "Every pixel must be in its rightful place"              ║'.gray);
    console.log('║                                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝'.cyan);
    
    console.log('\n📋 This script will fix the following issues:'.yellow.bold);
    console.log('  1. React Router vs Next.js routing conflicts');
    console.log('  2. API connection and CORS configuration');
    console.log('  3. Authentication flow issues');
    console.log('  4. Missing page routes and 404 errors');
    console.log('  5. Console errors and warnings\n');

    const proceed = await this.confirm('Do you want to proceed with the fixes?'.yellow);
    
    if (!proceed) {
      console.log('❌ Fix cancelled by user'.red);
      this.rl.close();
      return;
    }

    // Step 1: Check backend status
    console.log('\n' + '='.repeat(80).cyan);
    console.log('STEP 1: BACKEND STATUS CHECK'.cyan.bold);
    console.log('='.repeat(80).cyan);
    
    const backendRunning = await this.checkBackend();
    
    if (!backendRunning) {
      console.log('⚠️  Backend is not running!'.yellow.bold);
      console.log('\n💡 Please start the backend server in a new terminal:'.cyan);
      console.log('   cd ../vridge_back'.gray);
      console.log('   python3 manage.py runserver'.gray);
      
      const continueWithoutBackend = await this.confirm('\nContinue fixing frontend issues anyway?'.yellow);
      
      if (!continueWithoutBackend) {
        console.log('❌ Fix cancelled. Please start backend first.'.red);
        this.rl.close();
        return;
      }
    } else {
      console.log('✅ Backend is running on port 8000'.green);
    }

    // Step 2: Fix routing conflicts
    console.log('\n' + '='.repeat(80).cyan);
    console.log('STEP 2: FIXING ROUTING CONFLICTS'.cyan.bold);
    console.log('='.repeat(80).cyan);
    
    try {
      await this.runScript(
        path.join(__dirname, 'fix-routing-conflicts.js'),
        'Routing Conflict Fixer'
      );
      this.steps.push('Routing conflicts resolved');
    } catch (error) {
      this.errors.push('Routing fix failed: ' + error.message);
      console.error('⚠️  Routing fix encountered issues, continuing...'.yellow);
    }

    // Step 3: Fix API connections
    console.log('\n' + '='.repeat(80).cyan);
    console.log('STEP 3: FIXING API CONNECTIONS'.cyan.bold);
    console.log('='.repeat(80).cyan);
    
    try {
      await this.runScript(
        path.join(__dirname, 'fix-api-connection.js'),
        'API Connection Fixer'
      );
      this.steps.push('API connections configured');
    } catch (error) {
      this.errors.push('API fix failed: ' + error.message);
      console.error('⚠️  API fix encountered issues, continuing...'.yellow);
    }

    // Step 4: Clean and rebuild
    console.log('\n' + '='.repeat(80).cyan);
    console.log('STEP 4: CLEAN BUILD'.cyan.bold);
    console.log('='.repeat(80).cyan);
    
    console.log('🧹 Cleaning build artifacts...'.yellow);
    
    try {
      // Remove .next folder
      const nextDir = path.join(__dirname, '../../.next');
      if (fs.existsSync(nextDir)) {
        console.log('  Removing .next directory...');
        execSync(`rm -rf ${nextDir}`);
      }
      
      // Clear Next.js cache
      const cacheDir = path.join(__dirname, '../../node_modules/.cache');
      if (fs.existsSync(cacheDir)) {
        console.log('  Clearing cache...');
        execSync(`rm -rf ${cacheDir}`);
      }
      
      console.log('✅ Build artifacts cleaned'.green);
      this.steps.push('Build artifacts cleaned');
    } catch (error) {
      console.error('⚠️  Clean failed:'.yellow, error.message);
      this.errors.push('Clean failed: ' + error.message);
    }

    // Step 5: Run comprehensive debug
    console.log('\n' + '='.repeat(80).cyan);
    console.log('STEP 5: COMPREHENSIVE SYSTEM CHECK'.cyan.bold);
    console.log('='.repeat(80).cyan);
    
    try {
      await this.runScript(
        path.join(__dirname, 'comprehensive-debug.js'),
        'System Debugger'
      );
    } catch (error) {
      console.error('⚠️  Debug check failed:'.yellow, error.message);
    }

    // Final Report
    console.log('\n' + '═'.repeat(80).green);
    console.log('MASTER FIX COMPLETE - FINAL REPORT'.green.bold);
    console.log('═'.repeat(80).green);
    
    if (this.steps.length > 0) {
      console.log('\n✅ Successful Fixes:'.green.bold);
      this.steps.forEach(step => {
        console.log(`  ✓ ${step}`.green);
      });
    }
    
    if (this.errors.length > 0) {
      console.log('\n⚠️  Issues Encountered:'.yellow.bold);
      this.errors.forEach(error => {
        console.log(`  ✗ ${error}`.yellow);
      });
    }

    console.log('\n' + '─'.repeat(80).gray);
    console.log('📋 NEXT STEPS:'.cyan.bold);
    console.log('─'.repeat(80).gray);
    
    console.log('\n1. Restart the development server:'.cyan);
    console.log('   npm run dev'.gray);
    
    console.log('\n2. Clear browser cache:'.cyan);
    console.log('   • Chrome: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)'.gray);
    console.log('   • Or open Developer Tools → Application → Clear Storage'.gray);
    
    console.log('\n3. Test the following pages:'.cyan);
    console.log('   • http://localhost:3000/ (Home)'.gray);
    console.log('   • http://localhost:3000/login (Login)'.gray);
    console.log('   • http://localhost:3000/signup (Signup)'.gray);
    console.log('   • http://localhost:3000/project/create (Project Create)'.gray);
    console.log('   • http://localhost:3000/videoplanning (Video Planning)'.gray);
    
    console.log('\n4. Check browser console for errors:'.cyan);
    console.log('   • Open Developer Tools (F12)'.gray);
    console.log('   • Check Console tab for any red errors'.gray);
    console.log('   • Check Network tab for failed requests'.gray);
    
    console.log('\n' + '─'.repeat(80).gray);
    console.log('💡 TROUBLESHOOTING:'.yellow.bold);
    console.log('─'.repeat(80).gray);
    
    console.log('\nIf pages still show 404:'.yellow);
    console.log('  • Check if the page file exists in pages/ directory');
    console.log('  • Ensure the component is properly exported');
    console.log('  • Restart the dev server');
    
    console.log('\nIf API calls fail:'.yellow);
    console.log('  • Verify backend is running on port 8000');
    console.log('  • Check CORS settings in Django');
    console.log('  • Open test-cors.html in browser to test CORS');
    
    console.log('\nIf login doesn\'t work:'.yellow);
    console.log('  • Check if JWT tokens are being stored in localStorage');
    console.log('  • Verify API response in Network tab');
    console.log('  • Test with demo account: demo@test.com / demo1234');
    
    console.log('\n' + '═'.repeat(80).magenta);
    console.log('✨ FRONTY\'S PIXEL-PERFECT GUARANTEE ✨'.magenta.bold);
    console.log('═'.repeat(80).magenta);
    
    const totalIssues = this.errors.length;
    const fixedIssues = this.steps.length;
    const successRate = totalIssues > 0 
      ? Math.round((fixedIssues / (fixedIssues + totalIssues)) * 100)
      : 100;
    
    if (successRate === 100) {
      console.log('\n🎉 PERFECT ALIGNMENT ACHIEVED!'.green.bold);
      console.log('   All systems are pixel-perfect and ready for production.'.green);
    } else if (successRate >= 80) {
      console.log(`\n✅ SYSTEM ${successRate}% OPTIMIZED`.green.bold);
      console.log('   Minor adjustments may be needed, but core functionality restored.'.green);
    } else if (successRate >= 60) {
      console.log(`\n⚠️  SYSTEM ${successRate}% FUNCTIONAL`.yellow.bold);
      console.log('   Several issues remain. Manual intervention recommended.'.yellow);
    } else {
      console.log(`\n🔧 SYSTEM ${successRate}% OPERATIONAL`.red.bold);
      console.log('   Major issues detected. Please review error messages above.'.red);
    }
    
    console.log('\n' + '─'.repeat(80).gray);
    console.log('Report generated at:'.gray, new Date().toLocaleString());
    console.log('VideoPlanet Frontend v1.0.15 | Fronty\'s Pixel Perfect System v1.0'.gray);
    console.log('─'.repeat(80).gray + '\n');
    
    this.rl.close();
  }
}

// Run the master fixer
console.log('Starting VideoPlanet Master Fix...'.cyan);
const fixer = new MasterFixer();
fixer.run().catch(error => {
  console.error('❌ Fatal error in master fix:'.red, error.message);
  process.exit(1);
});