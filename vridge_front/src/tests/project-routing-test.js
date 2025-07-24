// 프로젝트 라우팅 및 데이터 로딩 분석 스크립트

// 분석 결과:
console.log('=== 프로젝트 관리 페이지 무한 리퀘스트 근본 원인 분석 ===\n');

console.log('🔍 문제 발생 흐름:');
console.log('1. ProjectView에서 "프로젝트 관리" 버튼 클릭');
console.log('   - 버튼 위치: ProjectView.jsx 라인 389-397');
console.log('   - navigate(`/ProjectEdit/${current_project.id}`)');
console.log('   - Next.js 라우터가 /project/${id}/edit로 변환\n');

console.log('2. ProjectEdit 페이지 로드');
console.log('   - pages/project/[id]/edit.js가 ProjectEdit 컴포넌트 로드');
console.log('   - ProjectEdit.jsx의 useEffect (라인 48-60)에서 GetProject API 호출\n');

console.log('3. 무한 리퀘스트의 근본 원인:');
console.log('   ❌ ProjectView.jsx (라인 51): useProjectData() 훅 사용');
console.log('   ❌ useProjectData 훅이 Redux store의 project_list를 체크하고 없으면 로드');
console.log('   ❌ 하지만 이 훅의 의존성 배열이 잘못 설정되어 있음\n');

console.log('🔴 핵심 문제:');
console.log('1. useProjectData 훅의 문제점:');
console.log('   - 라인 12: useEffect의 의존성 배열에 dispatch만 포함');
console.log('   - 라인 20-24: project_list가 있으면 스킵하는 로직이 있지만');
console.log('   - ProjectView가 리렌더링될 때마다 훅이 재실행됨\n');

console.log('2. 순환 참조 문제:');
console.log('   - ProjectView에서 useProjectData() 호출');
console.log('   - GetProject API도 별도로 호출 (라인 158)');
console.log('   - 두 개의 API 호출이 충돌하며 무한 루프 발생 가능\n');

console.log('3. 라우팅 전환 시 문제:');
console.log('   - ProjectView → ProjectEdit로 전환 시');
console.log('   - 두 컴포넌트 모두 프로젝트 데이터를 로드');
console.log('   - Redux store 업데이트가 연쇄적으로 발생\n');

console.log('📊 추가 분석 필요 사항:');
console.log('- Redux DevTools로 store 업데이트 패턴 확인');
console.log('- Network 탭에서 실제 API 호출 패턴 확인');
console.log('- React DevTools로 컴포넌트 리렌더링 확인\n');

console.log('✅ 해결 방향:');
console.log('1. useProjectData 훅 개선');
console.log('2. ProjectView의 중복 API 호출 제거');
console.log('3. 라우팅 전환 시 데이터 로딩 최적화');
console.log('4. Redux store 업데이트 로직 개선');