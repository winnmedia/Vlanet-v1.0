# VideoPlanet 에러 핸들링 가이드

## 개요
VideoPlanet의 에러 핸들링 시스템은 React Error Boundary와 전역 에러 핸들러를 통합하여 일관된 사용자 경험을 제공합니다.

## 주요 구성 요소

### 1. Error Boundary
- **위치**: `/src/components/ErrorBoundary.jsx`
- **역할**: React 컴포넌트 트리 내의 JavaScript 에러를 포착
- **특징**:
  - 고유 에러 ID 생성
  - 개발/프로덕션 모드별 다른 UI
  - 에러 리포팅 기능

### 2. 전역 에러 핸들러
- **위치**: `/src/utils/errorHandler.js`
- **역할**: API 에러, Promise rejection 등 모든 에러 처리
- **특징**:
  - 에러 타입 자동 분류
  - 사용자 친화적 메시지 표시
  - 자동 재시도 옵션

### 3. Axios 인터셉터
- **위치**: `/src/config/axios.js`
- **역할**: API 요청/응답 에러 자동 처리
- **특징**:
  - 401 에러시 자동 로그인 리다이렉트
  - CSRF 토큰 에러 자동 재시도
  - 전역 에러 핸들러 통합

## 사용 방법

### 1. 기본 API 요청
```javascript
import { apiGet, apiPost } from '@/utils/apiHelpers';

// GET 요청
const fetchData = async () => {
  try {
    const response = await apiGet('/api/projects');
    setProjects(response.data);
  } catch (error) {
    // 에러는 자동으로 처리됨
    console.log('추가 처리 필요 시 여기서');
  }
};

// POST 요청
const createProject = async (projectData) => {
  const response = await apiPost('/api/projects', projectData);
  // 성공 시 처리
};
```

### 2. 커스텀 에러 처리
```javascript
import { handleError } from '@/utils/errorHandler';

const customFunction = async () => {
  try {
    // 위험한 작업
  } catch (error) {
    handleError(error, {
      defaultMessage: '프로젝트 생성 중 오류가 발생했습니다.',
      onRetry: () => customFunction(),
      duration: 5000
    });
  }
};
```

### 3. 폼 검증 에러
```javascript
import { apiSubmitForm } from '@/utils/apiHelpers';

const formRef = useRef();

const handleSubmit = async (formData) => {
  try {
    const response = await apiSubmitForm(
      '/api/users/signup',
      formData,
      formRef
    );
    // 성공 처리
  } catch (error) {
    // 검증 에러는 자동으로 필드에 포커스됨
  }
};
```

### 4. 에러 무시하기
```javascript
// 전역 에러 핸들러를 건너뛰고 싶을 때
const response = await axios.get('/api/data', {
  skipGlobalErrorHandler: true
});
```

### 5. 파일 업로드 with 진행률
```javascript
import { apiUpload } from '@/utils/apiHelpers';

const uploadFile = async (file) => {
  const response = await apiUpload(
    '/api/upload',
    file,
    (progress) => {
      console.log(`업로드 진행률: ${progress}%`);
    }
  );
};
```

## 에러 타입

### ErrorTypes
- `NETWORK`: 네트워크 연결 오류
- `VALIDATION`: 입력 검증 오류 (400)
- `AUTHENTICATION`: 인증 필요 (401)
- `AUTHORIZATION`: 권한 없음 (403)
- `NOT_FOUND`: 리소스 없음 (404)
- `SERVER`: 서버 오류 (500+)
- `UNKNOWN`: 알 수 없는 오류

## 사용자 정의 알림

### showAlert 사용
```javascript
import { showAlert } from '@/components/CustomAlert';

// 기본 알림
showAlert('작업이 완료되었습니다.', 'success');

// 액션 버튼이 있는 알림
showAlert('정말 삭제하시겠습니까?', 'warning', 0, [
  { text: '취소', onClick: () => {} },
  { text: '삭제', primary: true, onClick: handleDelete }
]);
```

## 에러 로깅

### 에러 로그 관리
```javascript
import { ErrorLogger } from '@/utils/errorHandler';

// 에러 로그 저장
ErrorLogger.log(error, {
  component: 'ProjectList',
  action: 'fetchProjects'
});

// 에러 로그 조회
const logs = ErrorLogger.getLogs();

// 에러 로그 삭제
ErrorLogger.clearLogs();
```

## 모범 사례

### 1. 항상 try-catch 사용
```javascript
const riskyOperation = async () => {
  try {
    // 위험한 작업
  } catch (error) {
    // 에러 처리
  }
};
```

### 2. 의미있는 에러 메시지 제공
```javascript
handleError(error, {
  defaultMessage: '프로젝트를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
});
```

### 3. 재시도 옵션 제공
```javascript
handleError(error, {
  onRetry: () => fetchData()
});
```

### 4. 로딩 상태 관리
```javascript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const data = await apiGet('/api/data');
    // 성공 처리
  } finally {
    setLoading(false);
  }
};
```

## 디버깅

### 개발 모드
- Error Boundary에서 상세 에러 정보 표시
- console.error로 모든 에러 로깅
- 컴포넌트 스택 트레이스 표시

### 프로덕션 모드
- 간단한 에러 메시지만 표시
- 에러 ID로 추적 가능
- localStorage에 에러 로그 저장

## 주의사항

1. **무한 루프 방지**: 에러 핸들러 내에서 같은 에러를 다시 발생시키지 않도록 주의
2. **민감한 정보 숨김**: 프로덕션에서는 상세 에러 정보를 노출하지 않음
3. **메모리 관리**: 에러 로그는 최대 50개까지만 저장
4. **SSR 고려**: 클라이언트 전용 코드는 `typeof window !== 'undefined'` 체크

## 향후 계획

1. Sentry 통합
2. 에러 분석 대시보드
3. 사용자 피드백 수집
4. A/B 테스트를 통한 에러 메시지 최적화