// 도메인 체크 및 리다이렉트 방지
export function checkDomain() {
  const currentDomain = window.location.hostname;
  const preferredDomain = 'vlanet.net'; // 선호하는 도메인
  
  console.log('[DomainCheck] Current domain:', currentDomain);
  console.log('[DomainCheck] Preferred domain:', preferredDomain);
  
  // 도메인별 처리
  if (currentDomain === 'vlanet-v1-0.vercel.app') {
    console.log('[DomainCheck] Running on Vercel domain');
  } else if (currentDomain === 'vlanet.net' || currentDomain === 'www.vlanet.net') {
    console.log('[DomainCheck] Running on production domain');
  }
  
  // 세션 스토리지에 현재 도메인 저장
  sessionStorage.setItem('currentDomain', currentDomain);
  
  return currentDomain;
}

// 중복 탭/도메인 감지
export function detectDuplicateTabs() {
  const tabId = Date.now() + '_' + Math.random();
  const tabs = JSON.parse(localStorage.getItem('activeTabs') || '[]');
  
  // 현재 탭 추가
  tabs.push({
    id: tabId,
    domain: window.location.hostname,
    timestamp: Date.now()
  });
  
  // 5초 이상 된 탭 제거
  const activeTabs = tabs.filter(tab => Date.now() - tab.timestamp < 5000);
  localStorage.setItem('activeTabs', JSON.stringify(activeTabs));
  
  // 다른 도메인에서 활성 탭이 있는지 확인
  const otherDomainTabs = activeTabs.filter(tab => 
    tab.domain !== window.location.hostname && 
    tab.id !== tabId
  );
  
  if (otherDomainTabs.length > 0) {
    console.warn('[DomainCheck] Active tabs on other domains detected:', otherDomainTabs);
    return true;
  }
  
  return false;
}