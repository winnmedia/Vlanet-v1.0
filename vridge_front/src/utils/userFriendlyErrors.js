// 사용자 친화적인 오류 메시지 변환 유틸리티

const errorMessages = {
  // 네트워크 오류
  'Network Error': '인터넷 연결을 확인해주세요.',
  'ERR_NETWORK': '네트워크 연결이 불안정합니다. 잠시 후 다시 시도해주세요.',
  'ERR_INTERNET_DISCONNECTED': '인터넷 연결이 끊어졌습니다.',
  
  // 서버 오류
  '500': '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
  '503': '서비스가 일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해주세요.',
  '502': '서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.',
  
  // 인증 오류
  '401': '로그인이 필요합니다.',
  '403': '접근 권한이 없습니다.',
  'Token expired': '로그인 시간이 만료되었습니다. 다시 로그인해주세요.',
  'Invalid token': '인증 정보가 올바르지 않습니다. 다시 로그인해주세요.',
  
  // 클라이언트 오류
  '400': '요청 정보를 확인해주세요.',
  '404': '요청하신 페이지를 찾을 수 없습니다.',
  '422': '입력하신 정보가 올바르지 않습니다.',
  
  // 비즈니스 로직 오류
  'Duplicate entry': '이미 존재하는 데이터입니다.',
  'Required field': '필수 항목을 입력해주세요.',
  'Invalid format': '올바른 형식으로 입력해주세요.',
  
  // AI 서비스 오류
  'AI service unavailable': 'AI 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
  'Generation failed': '콘텐츠 생성에 실패했습니다. 다시 시도해주세요.',
  'Timeout': '응답 시간이 초과되었습니다. 더 간단한 요청으로 다시 시도해주세요.',
  
  // 파일 업로드 오류
  'File too large': '파일 크기가 너무 큽니다. 100MB 이하의 파일을 업로드해주세요.',
  'Invalid file type': '지원하지 않는 파일 형식입니다.',
  'Upload failed': '파일 업로드에 실패했습니다. 다시 시도해주세요.'
};

// 오류 코드나 메시지를 사용자 친화적인 메시지로 변환
export const getUserFriendlyError = (error) => {
  // 오류 객체에서 메시지 추출
  let errorMessage = '';
  
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error.response) {
    // axios 오류
    const status = error.response.status?.toString();
    const data = error.response.data;
    
    // 서버에서 제공한 메시지 우선 사용
    if (data?.message) {
      errorMessage = data.message;
    } else if (data?.error) {
      errorMessage = data.error;
    } else if (status && errorMessages[status]) {
      return errorMessages[status];
    }
  } else if (error.message) {
    errorMessage = error.message;
  } else if (error.code) {
    errorMessage = error.code;
  }
  
  // 매핑된 메시지 찾기
  for (const [key, value] of Object.entries(errorMessages)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // 기본 메시지
  return '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
};

// 오류 상황에 따른 해결 방법 제안
export const getErrorSolution = (error) => {
  const solutions = {
    'Network': {
      icon: '🌐',
      solution: '인터넷 연결을 확인하고 페이지를 새로고침해주세요.'
    },
    '401': {
      icon: '🔐',
      solution: '로그인 페이지로 이동합니다.',
      action: () => window.location.href = '/login'
    },
    '500': {
      icon: '🔧',
      solution: '잠시 후 다시 시도하거나 고객센터에 문의해주세요.'
    },
    'File': {
      icon: '📁',
      solution: '파일 크기와 형식을 확인해주세요. (최대 100MB, MP4/MOV/AVI)'
    },
    'AI': {
      icon: '🤖',
      solution: '입력 내용을 조금 더 구체적으로 작성해보세요.'
    }
  };
  
  // 오류 타입 감지
  const errorStr = JSON.stringify(error).toLowerCase();
  for (const [key, value] of Object.entries(solutions)) {
    if (errorStr.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return {
    icon: '❓',
    solution: '문제가 지속되면 고객센터에 문의해주세요.'
  };
};

// 오류 심각도 판단
export const getErrorSeverity = (error) => {
  const errorStr = JSON.stringify(error).toLowerCase();
  
  if (errorStr.includes('network') || errorStr.includes('500')) {
    return 'critical';
  } else if (errorStr.includes('401') || errorStr.includes('403')) {
    return 'warning';
  } else if (errorStr.includes('validation') || errorStr.includes('422')) {
    return 'info';
  }
  
  return 'error';
};