// 프로젝트 관리 페이지 무한 리퀘스트 문제의 근본 원인 상세 분석

console.log('=== 무한 리퀘스트 문제 근본 원인 분석 보고서 ===\n');

console.log('🔴 핵심 문제: 프로젝트 관리 버튼 클릭 시 발생하는 무한 API 호출\n');

console.log('📊 문제 발생 시나리오:');
console.log('1. 사용자가 ProjectView 페이지에서 "프로젝트 관리" 버튼 클릭');
console.log('2. 라우터가 /project/${id}/edit로 이동');
console.log('3. ProjectEdit 컴포넌트 로드');
console.log('4. 무한 API 호출 발생\n');

console.log('🔍 근본 원인 분석:\n');

console.log('1️⃣ useProjectData 훅의 문제점:');
console.log('   위치: /src/hooks/useProjectData.js');
console.log('   - 라인 12: useEffect의 의존성 배열에 [dispatch]만 포함');
console.log('   - 라인 20-24: project_list 체크 로직이 있지만 효과적이지 않음');
console.log('   - 문제: 컴포넌트가 리렌더링될 때마다 훅이 재실행될 가능성\n');

console.log('2️⃣ ProjectView의 중복 API 호출:');
console.log('   위치: /src/page/Cms/ProjectView.jsx');
console.log('   - 라인 51: useProjectData() 훅 호출 → ProjectList API 호출');
console.log('   - 라인 158: GetProject API 직접 호출');
console.log('   - 문제: 두 개의 API가 독립적으로 호출되어 충돌 가능\n');

console.log('3️⃣ Redux Store 업데이트 연쇄 반응:');
console.log('   - refetchProject (util/util.js:128) 호출 시');
console.log('   - ProjectList API 호출 (api/project.js:5)');
console.log('   - Redux store 업데이트 (redux/project.js:18)');
console.log('   - 컴포넌트 리렌더링 → useProjectData 재실행 가능\n');

console.log('4️⃣ 라우팅 전환 시 문제:');
console.log('   - ProjectView → ProjectEdit 전환 시');
console.log('   - 두 컴포넌트 모두 프로젝트 데이터를 독립적으로 로드');
console.log('   - 네비게이션 중에도 이전 컴포넌트의 API 호출이 계속될 수 있음\n');

console.log('5️⃣ SafeRoute 컴포넌트의 영향:');
console.log('   위치: ProjectView.jsx 라인 274');
console.log('   - SafeRoute가 추가적인 리소스 체크를 수행');
console.log('   - 이로 인한 추가적인 리렌더링 가능성\n');

console.log('💡 추가 발견사항:');
console.log('   - api/project.js의 ProjectList 함수에 console.trace() 추가됨 (라인 6)');
console.log('   - 이를 통해 실제 호출 스택을 확인 가능');
console.log('   - 브라우저 콘솔에서 호출 패턴 분석 필요\n');

console.log('✅ 해결 방안:');
console.log('1. useProjectData 훅 개선:');
console.log('   - 의존성 배열 최적화');
console.log('   - 중복 호출 방지 로직 강화');
console.log('   - 로딩 상태 관리 추가\n');

console.log('2. ProjectView 컴포넌트 최적화:');
console.log('   - useProjectData와 GetProject 중 하나만 사용');
console.log('   - 또는 두 API의 역할을 명확히 분리\n');

console.log('3. 라우팅 전환 최적화:');
console.log('   - 컴포넌트 언마운트 시 API 호출 취소');
console.log('   - AbortController 사용 고려\n');

console.log('4. Redux 상태 관리 개선:');
console.log('   - 불필요한 store 업데이트 방지');
console.log('   - 선택적 리렌더링 구현\n');

console.log('🚨 즉시 확인 필요 사항:');
console.log('1. 브라우저 Network 탭에서 실제 API 호출 패턴 확인');
console.log('2. 브라우저 Console에서 console.trace() 출력 확인');
console.log('3. React DevTools에서 컴포넌트 리렌더링 패턴 확인');
console.log('4. Redux DevTools에서 store 업데이트 패턴 확인');