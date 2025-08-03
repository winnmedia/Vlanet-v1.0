// 브라우저 개발자 도구에서 실행할 테스트 코드
// http://localhost:3000/ProjectCreate 페이지에서 F12를 누르고 Console 탭에서 실행

console.log('🚀 프로젝트 생성 버튼 테스트 시작');

// 1. 현재 버튼 상태 확인
function checkButtonState() {
  const button = document.querySelector('button.submit');
  const inputs = {
    name: document.querySelector('input[name="name"]')?.value || '',
    manager: document.querySelector('input[name="manager"]')?.value || '',
    consumer: document.querySelector('input[name="consumer"]')?.value || '',
    description: document.querySelector('textarea[name="description"]')?.value || ''
  };
  
  console.log('📋 현재 입력값:', inputs);
  console.log('🔘 버튼 상태:', {
    disabled: button?.disabled,
    text: button?.textContent,
    className: button?.className,
    backgroundColor: button?.style?.backgroundColor
  });
  
  // ValidForm 로직 시뮬레이션
  const ValidForm = Boolean(
    inputs.name.trim() && 
    inputs.description.trim() && 
    inputs.manager.trim() && 
    inputs.consumer.trim()
  );
  
  console.log('✨ ValidForm 계산 결과:', ValidForm);
  
  return { button, inputs, ValidForm };
}

// 2. 테스트 입력 함수
function fillTestData() {
  console.log('📝 테스트 데이터 입력 중...');
  
  const nameInput = document.querySelector('input[name="name"]');
  const managerInput = document.querySelector('input[name="manager"]');
  const consumerInput = document.querySelector('input[name="consumer"]');
  const descriptionInput = document.querySelector('textarea[name="description"]');
  
  if (nameInput) {
    nameInput.value = '테스트 프로젝트';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    nameInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  setTimeout(() => {
    if (managerInput) {
      managerInput.value = '테스트 담당자';
      managerInput.dispatchEvent(new Event('input', { bubbles: true }));
      managerInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, 200);
  
  setTimeout(() => {
    if (consumerInput) {
      consumerInput.value = '테스트 고객사';
      consumerInput.dispatchEvent(new Event('input', { bubbles: true }));
      consumerInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, 400);
  
  setTimeout(() => {
    if (descriptionInput) {
      descriptionInput.value = '테스트 프로젝트 설명입니다.';
      descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));
      descriptionInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, 600);
  
  setTimeout(() => {
    console.log('✅ 테스트 데이터 입력 완료');
    checkButtonState();
  }, 1000);
}

// 3. 실행
console.log('📊 초기 상태 확인:');
checkButtonState();

console.log('\n📝 테스트 데이터를 입력하려면 다음 명령을 실행하세요:');
console.log('fillTestData()');

// 전역에 함수 등록
window.checkButtonState = checkButtonState;
window.fillTestData = fillTestData;