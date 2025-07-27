// 쿠키 관련 유틸리티 함수들
export const getCookie = (name) => {
  const value = `; ${(typeof window !== 'undefined' && document.cookie) || ''}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
};

export const deleteCookie = (name) => {
  if (typeof window !== 'undefined') {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};

// 토큰 관리 함수들
export const getAccessToken = () => {
  // 먼저 쿠키에서 확인
  const cookieToken = getCookie('vridge_session');
  if (cookieToken) {
    return cookieToken;
  }
  
  // 하위 호환성을 위해 localStorage도 확인
  try {
    const storageToken = typeof window !== 'undefined' && window.localStorage.getItem('VGID');
    if (storageToken) {
      try {
        const parsed = JSON.parse(storageToken);
        return parsed;
      } catch {
        // 파싱 실패 시 문자열로 반환
        return storageToken.replace(/^"|"$/g, '');
      }
    }
  } catch (e) {
    // localStorage 접근 실패
  }
  
  return null;
};

export const clearAuth = () => {
  // 쿠키 삭제
  deleteCookie('vridge_session');
  deleteCookie('refresh_token');
  
  // localStorage 삭제 (하위 호환성)
  try {
    typeof window !== 'undefined' && window.localStorage.removeItem('VGID');
    typeof window !== 'undefined' && window.localStorage.removeItem('userInfo');
  } catch (e) {
    // localStorage 접근 실패 시 무시
  }
};

// 인증 상태 확인
export const isAuthenticated = () => {
  return !!getAccessToken();
};

// 리프레시 토큰 가져오기
export const getRefreshToken = () => {
  return getCookie('refresh_token');
};