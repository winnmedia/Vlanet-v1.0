// 도메인 체크 및 리다이렉트 방지
export function checkDomain() {
  const currentDomain = typeof window !== 'undefined' && window.location.hostname;
  const preferredDomain = 'vlanet.net'; // 선호하는 도메인

  // 도메인별 처리
   else 

  // 세션 스토리지에 현재 도메인 저장
  sessionStorage.setItem('currentDomain', currentDomain);

  return currentDomain;
}

// 중복 탭/도메인 감지
export function detectDuplicateTabs() {
  const tabId = Date.now() + '_' + Math.random();
  const tabs = JSON.parse(typeof window !== 'undefined' && localStorage.getItem('activeTabs') || '[]');

  // 현재 탭 추가
  tabs.push({
    id: tabId,
    domain: typeof window !== 'undefined' && window.location.hostname,
    timestamp: Date.now()
  });

  // 5초 이상 된 탭 제거
  const activeTabs = tabs.filter((tab) => Date.now() - tab.timestamp < 5000);
  typeof window !== 'undefined' && localStorage.setItem('activeTabs', JSON.stringify(activeTabs));

  // 다른 도메인에서 활성 탭이 있는지 확인
  const otherDomainTabs = activeTabs.filter((tab) =>
  tab.domain !== typeof window !== 'undefined' && window.location.hostname &&
  tab.id !== tabId
  );

  if (otherDomainTabs.length > 0) {
    
    return true;
  }

  return false;
}