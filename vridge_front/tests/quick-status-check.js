#!/usr/bin/env node

const http = require('http');

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

// Service checks
const services = [
  { name: 'Backend API', url: 'http://localhost:8000/api/health/', expectedStatus: 200 },
  { name: 'Frontend', url: 'http://localhost:3000/', expectedStatus: 200 }
];

async function checkService(service) {
  return new Promise((resolve) => {
    const req = http.get(service.url, { timeout: 5000 }, (res) => {
      const status = res.statusCode === service.expectedStatus ? 'UP' : `DOWN (${res.statusCode})`;
      const color = res.statusCode === service.expectedStatus ? colors.green : colors.red;
      console.log(`${color}[${status}]${colors.reset} ${service.name} - ${service.url}`);
      resolve(res.statusCode === service.expectedStatus);
    });
    
    req.on('error', (err) => {
      console.log(`${colors.red}[DOWN]${colors.reset} ${service.name} - ${service.url} (${err.message})`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`${colors.yellow}[TIMEOUT]${colors.reset} ${service.name} - ${service.url}`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('🔍 VideoPlanet Service Status Check\n');
  
  let allUp = true;
  for (const service of services) {
    const isUp = await checkService(service);
    if (!isUp) allUp = false;
  }
  
  console.log('\n' + '='.repeat(50));
  if (allUp) {
    console.log(`${colors.green}✅ All services are running!${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Some services are down. Please check:${colors.reset}`);
    console.log('   - Backend: cd vridge_back && python3 manage.py runserver');
    console.log('   - Frontend: cd vridge_front && npm start');
  }
}

main();