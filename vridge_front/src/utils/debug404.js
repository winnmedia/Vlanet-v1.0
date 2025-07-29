// 404 에러 디버깅 유틸리티

export const debug404 = {
  // 현재 환경 정보 로깅
  logEnvironment: () => {},

  // API 요청 디버깅
  logApiRequest: (url, options = {}) => {},

  // 라우팅 디버깅
  logRouting: (from, to) => {},

  // 에러 응답 상세 분석
  analyzeError: (error) => {},

  // 초대 링크 디버깅
  debugInvitation: (token, uid = null) => {






    // API 엔드포인트 확인
    const apiUrl = uid ?
    `/api/projects/invite/accept/` :
    `/api/projects/invitations/token/${token}/`;




  }
};

// 전역 객체로 노출 (브라우저 콘솔에서 직접 사용 가능)
if (typeof window !== 'undefined') {
  window.debug404 = debug404;
}