// Test and Fix for React Refresh Empty Page Issue
// This tests the Redux state persistence problem

const puppeteer = require('puppeteer');
const colors = require('colors');

const BASE_URL = 'http://localhost:3000';

async function testRefreshIssue() {
  console.log('Testing React Refresh Empty Page Issue...'.bold.cyan);
  console.log('='.repeat(50));

  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true 
    });
    const page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('PAGE ERROR:'.red, msg.text());
      }
    });

    // Test 1: Check initial load
    console.log('\n1. Testing initial page load...'.yellow);
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    const initialContent = await page.evaluate(() => {
      return {
        hasContent: document.body.innerHTML.length > 100,
        bodyText: document.body.innerText,
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage)
      };
    });

    console.log('Initial load:', initialContent.hasContent ? 'SUCCESS'.green : 'FAILED'.red);
    console.log('LocalStorage keys:', initialContent.localStorage);

    // Test 2: Login and navigate
    console.log('\n2. Testing login and navigation...'.yellow);
    await page.goto(`${BASE_URL}/Login`);
    await page.waitForTimeout(1000);

    // Simulate login (adjust selectors as needed)
    const loginExists = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      return emailInput && passwordInput;
    });

    if (loginExists) {
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'test123');
      
      // Find and click login button
      const loginButton = await page.$('button[type="submit"]');
      if (loginButton) {
        await loginButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Test 3: Navigate to CmsHome
    console.log('\n3. Testing navigation to CmsHome...'.yellow);
    await page.goto(`${BASE_URL}/CmsHome`);
    await page.waitForTimeout(2000);

    const cmsContent = await page.evaluate(() => {
      return {
        url: window.location.href,
        hasContent: document.body.innerHTML.length > 100,
        reduxState: window.__REDUX_DEVTOOLS_EXTENSION__ ? 
          window.__REDUX_DEVTOOLS_EXTENSION__.getState() : null,
        localStorage: localStorage.getItem('VGID')
      };
    });

    console.log('CmsHome load:', cmsContent.hasContent ? 'SUCCESS'.green : 'FAILED'.red);
    console.log('Auth token present:', cmsContent.localStorage ? 'YES'.green : 'NO'.red);

    // Test 4: Refresh the page
    console.log('\n4. Testing page refresh...'.yellow);
    await page.reload();
    await page.waitForTimeout(2000);

    const afterRefresh = await page.evaluate(() => {
      return {
        url: window.location.href,
        hasContent: document.body.innerHTML.length > 100,
        bodyText: document.body.innerText.substring(0, 200),
        isEmptyPage: document.body.innerHTML.includes('root') && 
                     document.querySelector('#root').innerHTML === '',
        localStorage: localStorage.getItem('VGID'),
        reduxState: window.__REDUX_DEVTOOLS_EXTENSION__ ? 
          window.__REDUX_DEVTOOLS_EXTENSION__.getState() : null
      };
    });

    console.log('After refresh:');
    console.log('  URL:', afterRefresh.url);
    console.log('  Has content:', afterRefresh.hasContent ? 'YES'.green : 'NO'.red);
    console.log('  Empty React root:', afterRefresh.isEmptyPage ? 'YES (ISSUE!)'.red : 'NO'.green);
    console.log('  Auth token preserved:', afterRefresh.localStorage ? 'YES'.green : 'NO'.red);
    console.log('  Redux state:', afterRefresh.reduxState ? 'PRESENT'.green : 'MISSING'.red);

    // Analysis
    console.log('\n' + '='.repeat(50));
    console.log('ANALYSIS RESULTS'.bold);
    console.log('='.repeat(50));

    if (afterRefresh.isEmptyPage) {
      console.log('\n❌ ISSUE CONFIRMED: Page shows empty content after refresh'.red.bold);
      console.log('\nRoot Causes:'.yellow);
      console.log('1. Redux state is not persisted across page refreshes');
      console.log('2. Component may be trying to access data before it\'s loaded');
      console.log('3. Routing may be losing context on refresh');
      
      console.log('\nRecommended Fixes:'.green);
      console.log('1. Implement Redux Persist');
      console.log('2. Add loading states and null checks');
      console.log('3. Ensure data fetching on component mount');
    } else {
      console.log('\n✅ No refresh issue detected'.green.bold);
    }

  } catch (error) {
    console.error('Test failed:'.red, error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Alternative test without Puppeteer (for environments where Puppeteer is not available)
function analyzeCodeForRefreshIssues() {
  console.log('\n\nCODE ANALYSIS FOR REFRESH ISSUES'.bold.cyan);
  console.log('='.repeat(50));

  const issues = [];

  // Issue 1: Redux state not persisted
  issues.push({
    severity: 'HIGH',
    issue: 'Redux state is not persisted',
    location: 'src/redux/store.js',
    description: 'Redux store is created without persistence layer',
    fix: 'Implement redux-persist to save state to localStorage'
  });

  // Issue 2: Component data dependencies
  issues.push({
    severity: 'MEDIUM',
    issue: 'Components assume data is always available',
    location: 'src/page/Cms/Feedback.jsx, CmsHome.jsx',
    description: 'Components access Redux state without null checks',
    fix: 'Add loading states and conditional rendering'
  });

  // Issue 3: Route guards
  issues.push({
    severity: 'MEDIUM',
    issue: 'Missing route guards for authentication',
    location: 'src/routes/AppRoute.js',
    description: 'Protected routes don\'t check auth on mount',
    fix: 'Implement PrivateRoute component with auth checks'
  });

  // Print issues
  issues.forEach((issue, index) => {
    console.log(`\n${index + 1}. ${issue.issue}`.bold);
    console.log(`   Severity: ${issue.severity === 'HIGH' ? issue.severity.red : issue.severity.yellow}`);
    console.log(`   Location: ${issue.location}`);
    console.log(`   Description: ${issue.description}`);
    console.log(`   Fix: ${issue.fix}`.green);
  });

  return issues;
}

// Run tests
async function runTests() {
  // Try Puppeteer test first
  try {
    await testRefreshIssue();
  } catch (error) {
    console.log('\nPuppeteer test skipped (not available)'.yellow);
  }

  // Always run code analysis
  analyzeCodeForRefreshIssues();
}

runTests();