#!/usr/bin/env node

/**
 * VideoPlanet API Connection Fix Script
 * Ensures proper backend connection configuration
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class APIConnectionFixer {
  constructor() {
    this.configFiles = [];
    this.issues = [];
    this.fixes = [];
  }

  // Check and fix axios configuration
  fixAxiosConfig() {
    console.log('\n🔧 Fixing Axios Configuration...'.cyan);
    
    const axiosConfigPath = path.join(__dirname, '../../src/api/axiosConfig.js');
    
    const properConfig = `import axios from 'axios'

// Determine API URL based on environment
const getApiUrl = () => {
  // Check if we're in browser
  if (typeof window !== 'undefined') {
    // Use environment variable if available
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL
    }
    
    // Default to localhost for development
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:8000'
    }
    
    // Production API
    return 'https://videoplanet.up.railway.app'
  }
  
  // Server-side rendering
  return process.env.API_URL || 'http://localhost:8000'
}

const API_BASE_URL = getApiUrl()

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with cookies
})

// Request interceptor for auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (token) {
        config.headers.Authorization = \`Bearer \${token}\`
      }
    }
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', config.method?.toUpperCase(), config.url)
    }
    
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Try to refresh token
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(\`\${API_BASE_URL}/api/users/token/refresh/\`, {
            refresh: refreshToken
          })
          
          const { access } = response.data
          localStorage.setItem('accessToken', access)
          
          // Retry original request with new token
          originalRequest.headers.Authorization = \`Bearer \${access}\`
          return axiosInstance(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
      }
    }
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error.response?.status, error.response?.data)
    }
    
    return Promise.reject(error)
  }
)

export default axiosInstance
export { API_BASE_URL }
`;

    try {
      // Create api directory if it doesn't exist
      const apiDir = path.dirname(axiosConfigPath);
      if (!fs.existsSync(apiDir)) {
        fs.mkdirSync(apiDir, { recursive: true });
      }

      // Backup existing config if it exists
      if (fs.existsSync(axiosConfigPath)) {
        const backup = axiosConfigPath + '.api-backup';
        if (!fs.existsSync(backup)) {
          fs.writeFileSync(backup, fs.readFileSync(axiosConfigPath, 'utf8'));
        }
      }

      // Write new config
      fs.writeFileSync(axiosConfigPath, properConfig);
      console.log('✅ Axios configuration updated'.green);
      this.fixes.push('Axios configuration fixed');
    } catch (error) {
      console.error('❌ Failed to update axios config:'.red, error.message);
      this.issues.push(`Axios config update failed: ${error.message}`);
    }
  }

  // Create or update .env.local file
  updateEnvFile() {
    console.log('\n📝 Updating environment variables...'.cyan);
    
    const envPath = path.join(__dirname, '../../.env.local');
    const envContent = `# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# Production API (uncomment for production build)
# NEXT_PUBLIC_API_URL=https://videoplanet.up.railway.app
# NEXT_PUBLIC_FRONTEND_URL=https://vlanet.net

# Feature Flags
NEXT_PUBLIC_ENABLE_DEBUG=true
`;

    try {
      if (!fs.existsSync(envPath)) {
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Created .env.local file'.green);
        this.fixes.push('Environment variables configured');
      } else {
        console.log('ℹ️  .env.local already exists, skipping'.gray);
      }
    } catch (error) {
      console.error('❌ Failed to create .env.local:'.red, error.message);
      this.issues.push(`Environment file creation failed: ${error.message}`);
    }
  }

  // Fix API service files
  fixAPIServices() {
    console.log('\n🔧 Fixing API service files...'.cyan);
    
    const apiServicesDir = path.join(__dirname, '../../src/api');
    const servicesToFix = ['auth.js', 'project.js', 'feedback.js'];
    
    servicesToFix.forEach(service => {
      const servicePath = path.join(apiServicesDir, service);
      
      if (fs.existsSync(servicePath)) {
        try {
          let content = fs.readFileSync(servicePath, 'utf8');
          
          // Fix import statements
          if (!content.includes('import axiosInstance')) {
            content = content.replace(
              /import\s+axios\s+from\s+['"]axios['"]/g,
              "import axiosInstance from './axiosConfig'"
            );
            
            // Replace axios with axiosInstance
            content = content.replace(/\baxios\./g, 'axiosInstance.');
            
            // Backup and write
            const backup = servicePath + '.api-backup';
            if (!fs.existsSync(backup)) {
              fs.writeFileSync(backup, fs.readFileSync(servicePath, 'utf8'));
            }
            
            fs.writeFileSync(servicePath, content);
            console.log(`✅ Fixed ${service}`.green);
            this.fixes.push(`API service ${service} fixed`);
          } else {
            console.log(`ℹ️  ${service} already configured correctly`.gray);
          }
        } catch (error) {
          console.error(`❌ Failed to fix ${service}:`.red, error.message);
          this.issues.push(`Failed to fix ${service}: ${error.message}`);
        }
      }
    });
  }

  // Test backend connectivity
  async testBackendConnection() {
    console.log('\n🔌 Testing Backend Connection...'.cyan);
    
    const endpoints = [
      { url: 'http://localhost:8000/api/health/', name: 'Health Check' },
      { url: 'http://localhost:8000/api/users/check/', name: 'User Check' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint.url, { 
          timeout: 5000,
          validateStatus: () => true 
        });
        
        if (response.status < 400) {
          console.log(`✅ ${endpoint.name}: Connected (${response.status})`.green);
        } else if (response.status === 401) {
          console.log(`⚠️  ${endpoint.name}: Auth required (401)`.yellow);
        } else {
          console.log(`❌ ${endpoint.name}: Error (${response.status})`.red);
          this.issues.push(`${endpoint.name} returned ${response.status}`);
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log(`❌ ${endpoint.name}: Backend not running`.red);
          this.issues.push('Backend service not running on port 8000');
        } else {
          console.log(`❌ ${endpoint.name}: ${error.message}`.red);
          this.issues.push(`${endpoint.name}: ${error.message}`);
        }
      }
    }
  }

  // Create CORS test file
  createCORSTest() {
    console.log('\n📋 Creating CORS test file...'.cyan);
    
    const testPath = path.join(__dirname, 'test-cors.html');
    const testContent = `<!DOCTYPE html>
<html>
<head>
    <title>CORS Test - VideoPlanet</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        h1 { color: #1631F8; }
        .test-item { margin: 10px 0; padding: 10px; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .warning { background: #fff3cd; color: #856404; }
        button { background: #1631F8; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0F23C9; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>VideoPlanet CORS Test</h1>
        <p>This page tests CORS configuration between frontend and backend.</p>
        
        <button onclick="runTests()">Run All Tests</button>
        
        <div id="results"></div>
    </div>

    <script>
        const API_URL = 'http://localhost:8000';
        
        async function runTests() {
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '<h2>Test Results:</h2>';
            
            // Test 1: Basic GET request
            await testEndpoint('GET', '/api/health/', 'Health Check');
            
            // Test 2: POST request with JSON
            await testEndpoint('POST', '/api/users/signin/', 'Login Test', {
                email: 'test@example.com',
                password: 'testpass'
            });
            
            // Test 3: OPTIONS preflight
            await testPreflight('/api/projects/', 'Preflight Check');
        }
        
        async function testEndpoint(method, path, testName, data = null) {
            const resultsDiv = document.getElementById('results');
            const testDiv = document.createElement('div');
            testDiv.className = 'test-item';
            
            try {
                const options = {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                };
                
                if (data) {
                    options.body = JSON.stringify(data);
                }
                
                const response = await fetch(API_URL + path, options);
                
                if (response.ok || response.status === 401) {
                    testDiv.className += ' success';
                    testDiv.innerHTML = \`
                        <strong>✅ \${testName}</strong><br>
                        Method: \${method} \${path}<br>
                        Status: \${response.status} \${response.statusText}<br>
                        CORS: Allowed
                    \`;
                } else {
                    testDiv.className += ' warning';
                    testDiv.innerHTML = \`
                        <strong>⚠️ \${testName}</strong><br>
                        Method: \${method} \${path}<br>
                        Status: \${response.status} \${response.statusText}
                    \`;
                }
            } catch (error) {
                testDiv.className += ' error';
                testDiv.innerHTML = \`
                    <strong>❌ \${testName}</strong><br>
                    Method: \${method} \${path}<br>
                    Error: \${error.message}<br>
                    <small>This might indicate CORS is blocked or backend is not running</small>
                \`;
            }
            
            resultsDiv.appendChild(testDiv);
        }
        
        async function testPreflight(path, testName) {
            const resultsDiv = document.getElementById('results');
            const testDiv = document.createElement('div');
            testDiv.className = 'test-item';
            
            try {
                const response = await fetch(API_URL + path, {
                    method: 'OPTIONS',
                    headers: {
                        'Access-Control-Request-Method': 'POST',
                        'Access-Control-Request-Headers': 'Content-Type'
                    }
                });
                
                const corsHeaders = {
                    'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                    'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                    'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                    'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
                };
                
                testDiv.className += ' success';
                testDiv.innerHTML = \`
                    <strong>✅ \${testName}</strong><br>
                    <pre>\${JSON.stringify(corsHeaders, null, 2)}</pre>
                \`;
            } catch (error) {
                testDiv.className += ' error';
                testDiv.innerHTML = \`
                    <strong>❌ \${testName}</strong><br>
                    Error: \${error.message}
                \`;
            }
            
            resultsDiv.appendChild(testDiv);
        }
    </script>
</body>
</html>`;

    try {
      fs.writeFileSync(testPath, testContent);
      console.log('✅ CORS test file created: test-cors.html'.green);
      console.log('   Open this file in your browser to test CORS'.gray);
      this.fixes.push('CORS test file created');
    } catch (error) {
      console.error('❌ Failed to create CORS test:'.red, error.message);
      this.issues.push(`CORS test creation failed: ${error.message}`);
    }
  }

  // Generate report
  generateReport() {
    console.log('\n' + '='.repeat(70).cyan);
    console.log('📊 API CONNECTION FIX REPORT'.cyan.bold);
    console.log('='.repeat(70).cyan);
    
    if (this.fixes.length > 0) {
      console.log('\n✅ Fixes Applied:'.green.bold);
      this.fixes.forEach(fix => {
        console.log(`  - ${fix}`.green);
      });
    }
    
    if (this.issues.length > 0) {
      console.log('\n❌ Issues Found:'.red.bold);
      this.issues.forEach(issue => {
        console.log(`  - ${issue}`.red);
      });
      
      console.log('\n💡 Solutions:'.yellow.bold);
      
      if (this.issues.some(i => i.includes('Backend service not running'))) {
        console.log('  1. Start the backend server:'.yellow);
        console.log('     cd ../vridge_back'.gray);
        console.log('     python3 manage.py runserver'.gray);
      }
      
      if (this.issues.some(i => i.includes('CORS'))) {
        console.log('  2. Check Django CORS settings:'.yellow);
        console.log('     - Ensure CORS_ALLOWED_ORIGINS includes http://localhost:3000'.gray);
        console.log('     - Set CORS_ALLOW_CREDENTIALS = True'.gray);
      }
    }
    
    console.log('\n📋 Next Steps:'.cyan.bold);
    console.log('1. Ensure backend is running on port 8000');
    console.log('2. Restart frontend: npm run dev');
    console.log('3. Open test-cors.html in browser to verify CORS');
    console.log('4. Test login functionality\n');
  }

  async run() {
    console.log('\n╔══════════════════════════════════════════════════════════════════╗'.cyan);
    console.log('║            API CONNECTION FIX - FRONTY\'S SOLUTION                ║'.cyan.bold);
    console.log('╚══════════════════════════════════════════════════════════════════╝'.cyan);

    this.fixAxiosConfig();
    this.updateEnvFile();
    this.fixAPIServices();
    await this.testBackendConnection();
    this.createCORSTest();
    this.generateReport();
  }
}

// Run the fixer
const fixer = new APIConnectionFixer();
fixer.run().catch(error => {
  console.error('❌ Fatal error:'.red, error.message);
  process.exit(1);
});