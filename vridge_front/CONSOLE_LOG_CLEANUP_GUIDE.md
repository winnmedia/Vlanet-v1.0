# 콘솔 로그 정리 가이드

## 📊 현재 상황 분석 결과

### 전체 통계
- **총 파일 수**: 82개
- **총 콘솔 로그**: 691개
- **안전하게 제거 가능**: 458개 (66.3%)
- **검토 필요**: 233개 (33.7%)

### 타입별 분포
| 타입 | 개수 | 비율 | 처리 방안 |
|------|------|------|----------|
| console.log | 424 | 61.4% | 대부분 제거 가능 |
| console.error | 231 | 33.4% | 신중한 검토 필요 |
| console.warn | 32 | 4.6% | 일부 유지 필요 |
| console.info | 2 | 0.3% | 환경별 처리 |
| console.debug | 2 | 0.3% | 모두 제거 |

## 🎯 권장 처리 순서

### 1단계: 분석 및 백업 (필수)
```bash
# 전체 상황 분석
npm run console:analyze

# 백업 생성
git add .
git commit -m "chore: console log cleanup 시작 전 백업"
```

### 2단계: 안전한 로그 제거 (458개)
```bash
# Dry run으로 미리 확인
npm run console:safe-analyze

# 개발 전용 로그 제거
npm run console:safe-remove
```

제거되는 패턴:
- `console.log('debug:', ...)`
- `console.log('test', ...)`
- `console.log('here')`
- `console.log(변수명)`
- 렌더링/마운트 관련 로그

### 3단계: 조건부 처리 (필요시)
```bash
# 개발 환경에서만 실행되도록 래핑
npm run console:safe-wrap
```

변환 예시:
```javascript
// Before
console.log('API Response:', data);

// After
process.env.NODE_ENV !== 'production' && console.log('API Response:', data);
```

### 4단계: 수동 검토 필요 항목 (233개)

#### 반드시 유지해야 하는 로그
1. **에러 핸들링**
   - catch 블록의 console.error
   - 크리티컬 에러 로깅
   - 보안 관련 경고

2. **모니터링/분석**
   - 성능 측정 로그
   - 사용자 행동 추적
   - 트랜잭션 로깅

3. **설정/초기화**
   - 환경 설정 확인
   - 버전 정보 출력
   - 서비스 연결 상태

#### 검토가 필요한 주요 파일
- `/src/config/axios.js` - API 에러 핸들링
- `/src/utils/errorHandler.js` - 중앙 에러 처리
- `/src/utils/logger.js` - 로깅 유틸리티
- `/src/api/*.js` - API 호출 관련

## 🛠️ 자동화 도구 사용법

### console-log-analyzer.js
기본 분석 도구로 전체 현황을 파악합니다.

```bash
# 분석만 실행
npm run console:analyze

# 디버그 로그만 제거
npm run console:remove-debug

# 모든 불필요한 로그 제거 (주의!)
npm run console:remove-all
```

### safe-console-remover.js
AST 기반의 정교한 처리 도구입니다.

```bash
# 상세 분석
npm run console:safe-analyze

# 안전한 제거
npm run console:safe-remove

# 환경 체크 래핑
npm run console:safe-wrap

# 대화형 단계별 처리
npm run console:cleanup
```

## 📋 체크리스트

### 제거 전
- [ ] Git 백업 완료
- [ ] 현재 브랜치가 올바른지 확인
- [ ] 테스트 코드 실행하여 정상 동작 확인

### 제거 중
- [ ] Dry run으로 변경사항 미리 확인
- [ ] 단계별로 진행하며 중간 테스트
- [ ] 에러 로그는 신중히 검토

### 제거 후
- [ ] 전체 테스트 스위트 실행
- [ ] 개발 서버에서 주요 기능 테스트
- [ ] 콘솔에 불필요한 출력이 없는지 확인
- [ ] 에러 처리가 제대로 동작하는지 확인

## 🚀 장기 개선 방안

### 1. 중앙화된 로거 시스템 구현
```javascript
// utils/logger.js
const logger = {
  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args) => {
    console.info('[INFO]', ...args);
  },
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args) => {
    console.error('[ERROR]', ...args);
    // Sentry나 다른 에러 추적 서비스로 전송
  }
};
```

### 2. ESLint 규칙 추가
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-console': ['error', {
      allow: ['warn', 'error']
    }]
  }
};
```

### 3. Pre-commit Hook 설정
```bash
# .husky/pre-commit
npm run lint
npm run console:analyze
```

## 📈 예상 효과

1. **성능 개선**
   - 프로덕션 빌드 크기 감소
   - 런타임 성능 향상
   - 메모리 사용량 감소

2. **보안 강화**
   - 민감한 정보 노출 방지
   - 디버깅 정보 숨김

3. **유지보수성 향상**
   - 깔끔한 콘솔 출력
   - 의미 있는 로그만 유지
   - 디버깅 효율성 증가

## ⚠️ 주의사항

1. **절대 삭제하면 안 되는 로그**
   - 결제 관련 로그
   - 보안 경고
   - 크리티컬 에러
   - 법적 요구사항 관련 로그

2. **백업 필수**
   - 작업 전 반드시 Git 커밋
   - 백업 파일 생성 옵션 사용
   - 단계별로 커밋하여 롤백 가능하도록

3. **테스트 철저히**
   - 각 단계마다 테스트
   - 에러 시나리오 확인
   - 프로덕션 배포 전 스테이징 환경 테스트

## 📞 지원

문제 발생 시:
1. Git으로 이전 상태로 롤백
2. `.backup-console` 파일에서 복구
3. 팀 리더에게 문의

---

마지막 업데이트: 2025-01-29
작성자: Anna (Data Analyst)