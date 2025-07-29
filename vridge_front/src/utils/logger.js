

const isDevelopment = process.env.NODE_ENV === 'development' ||
typeof window !== 'undefined' && window.location.hostname === 'localhost' ||
typeof window !== 'undefined' && window.location.hostname === '127.0.0.1';

export const logger = {
  log: (...args) => {},
  error: (...args) => {
    // 에러는 프로덕션에서도 표시
    
  },
  warn: (...args) => {},
  debug: (...args) => {},
  info: (...args) => {}
};

// 전역 
  
  
  
  
}

export default logger;