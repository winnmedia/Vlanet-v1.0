import { showAlert } from '../components/CustomAlert';

// 에러 타입 정의
export const ErrorTypes = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN'
};

// 에러 메시지 매핑
const errorMessages = {
  [ErrorTypes.NETWORK]: {
    title: '네트워크 오류',
    message: '인터넷 연결을 확인해주세요.',
    type: 'error'
  },
  [ErrorTypes.VALIDATION]: {
    title: '입력 오류',
    message: '입력하신 정보를 다시 확인해주세요.',
    type: 'warning'
  },
  [ErrorTypes.AUTHENTICATION]: {
    title: '인증 오류',
    message: '로그인이 필요합니다.',
    type: 'error'
  },
  [ErrorTypes.AUTHORIZATION]: {
    title: '권한 오류',
    message: '해당 작업을 수행할 권한이 없습니다.',
    type: 'error'
  },
  [ErrorTypes.NOT_FOUND]: {
    title: '찾을 수 없음',
    message: '요청하신 내용을 찾을 수 없습니다.',
    type: 'warning'
  },
  [ErrorTypes.SERVER]: {
    title: '서버 오류',
    message: '잠시 후 다시 시도해주세요.',
    type: 'error'
  },
  [ErrorTypes.UNKNOWN]: {
    title: '오류 발생',
    message: '예기치 않은 오류가 발생했습니다.',
    type: 'error'
  }
};

// HTTP 상태 코드를 에러 타입으로 매핑
const statusToErrorType = {
  400: ErrorTypes.VALIDATION,
  401: ErrorTypes.AUTHENTICATION,
  403: ErrorTypes.AUTHORIZATION,
  404: ErrorTypes.NOT_FOUND,
  500: ErrorTypes.SERVER,
  502: ErrorTypes.SERVER,
  503: ErrorTypes.SERVER,
  504: ErrorTypes.SERVER
};

// API 에러 분석 함수
export const analyzeError = (error) => {
  // 네트워크 오류
  if (!error.response && error.code === 'ERR_NETWORK') {
    return ErrorTypes.NETWORK;
  }
  
  // HTTP 상태 코드 기반 분류
  if (error.response) {
    const status = error.response.status;
    return statusToErrorType[status] || ErrorTypes.UNKNOWN;
  }
  
  return ErrorTypes.UNKNOWN;
};

// 에러 메시지 추출 함수
export const extractErrorMessage = (error) => {
  // 백엔드에서 제공한 메시지가 있으면 우선 사용
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  // 검증 오류의 경우 필드별 메시지 조합
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    const messages = Object.entries(errors)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join('\n');
    return messages;
  }
  
  return error.message || '알 수 없는 오류가 발생했습니다.';
};

// 전역 에러 핸들러
export const handleError = (error, options = {}) => {
  const {
    showNotification = true,
    logError = true,
    defaultMessage = null,
    duration = 5000,
    onRetry = null
  } = options;
  
  // 에러 로깅
  if (logError) {
    .toISOString(),
      url: window.location.href,
      userAgent: window.navigator.userAgent
    });
  }
  
  // 에러 타입 분석
  const errorType = analyzeError(error);
  const errorConfig = errorMessages[errorType];
  const message = defaultMessage || extractErrorMessage(error);
  
  // 사용자에게 알림 표시
  if (showNotification) {
    const actions = [];
    
    // 재시도 버튼 추가
    if (onRetry) {
      actions.push({
        text: '다시 시도',
        primary: true,
        onClick: onRetry
      });
    }
    
    // 인증 오류의 경우 로그인 버튼 추가
    if (errorType === ErrorTypes.AUTHENTICATION) {
      actions.push({
        text: '로그인하기',
        primary: true,
        onClick: () => {
          window.location.href = '/login';
        }
      });
    }
    
    showAlert(
      `${errorConfig.title}: ${message}`,
      errorConfig.type,
      actions.length > 0 ? 0 : duration,
      actions.length > 0 ? actions : undefined
    );
  }
  
  return {
    type: errorType,
    message,
    originalError: error
  };
};

// Promise rejection 핸들러
export const handlePromiseRejection = (promise, options = {}) => {
  return promise.catch(error => {
    handleError(error, options);
    throw error; // 에러를 다시 throw하여 호출자가 처리할 수 있도록 함
  });
};

// 전역 에러 이벤트 리스너 설정
export const setupGlobalErrorHandlers = () => {
  // unhandled promise rejection 처리
  window.addEventListener('unhandledrejection', (event) => {
    
    handleError(event.reason, {
      defaultMessage: '처리되지 않은 오류가 발생했습니다.'
    });
  });
  
  // 전역 에러 처리
  window.addEventListener('error', (event) => {
    
    // React ErrorBoundary가 처리하지 못하는 에러들을 처리
    if (event.error && !event.error.isHandled) {
      handleError(event.error, {
        defaultMessage: '예기치 않은 오류가 발생했습니다.'
      });
    }
  });
};

// API 요청 래퍼 함수
export const apiRequest = async (requestFn, options = {}) => {
  try {
    const response = await requestFn();
    return response;
  } catch (error) {
    const handledError = handleError(error, options);
    
    // 에러를 처리한 후에도 호출자가 추가 처리를 할 수 있도록 throw
    throw handledError;
  }
};

// 폼 검증 에러 처리
export const handleFormValidationError = (errors, formRef) => {
  // 첫 번째 에러 필드에 포커스
  const firstErrorField = Object.keys(errors)[0];
  if (formRef && formRef.current && firstErrorField) {
    const field = formRef.current.querySelector(`[name="${firstErrorField}"]`);
    if (field) {
      field.focus();
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  
  // 에러 메시지 표시
  const errorMessage = Object.entries(errors)
    .map(([field, message]) => `${field}: ${message}`)
    .join('\n');
    
  showAlert(errorMessage, 'warning', 5000);
};

// 에러 로그 관리
export const ErrorLogger = {
  // 에러 로그 저장
  log: (error, context = {}) => {
    try {
      const errorLog = {
        id: `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        error: {
          message: error.message || error.toString(),
          stack: error.stack,
          type: error.name || 'Unknown'
        },
        context: {
          url: window.location.href,
          userAgent: window.navigator.userAgent,
          ...context
        }
      };
      
      const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      logs.push(errorLog);
      
      // 최대 50개의 로그만 유지
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      localStorage.setItem('errorLogs', JSON.stringify(logs));
    } catch (e) {}
  },
  
  // 에러 로그 조회
  getLogs: () => {
    try {
      return JSON.parse(localStorage.getItem('errorLogs') || '[]');
    } catch (e) {
      return [];
    }
  },
  
  // 에러 로그 삭제
  clearLogs: () => {
    try {
      localStorage.removeItem('errorLogs');
    } catch (e) {}
  }
};

export default {
  ErrorTypes,
  handleError,
  handlePromiseRejection,
  setupGlobalErrorHandlers,
  apiRequest,
  handleFormValidationError,
  ErrorLogger
};