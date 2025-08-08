# VideoPlanet 개발지침 - 1000% 성과 달성 가이드

## 🚀 핵심 원칙: 결과 중심, 초고속 실행

**"복잡한 프로세스를 더하는 것이 아니라, 불필요한 것을 빼는 것"**

## ⚡ 초고속 작업 프로세스 (즉시 적용)

### 1️⃣ 작업 규모별 실행 전략

```javascript
// 작업 시간에 따른 자동 프로세스 선택
if (작업시간 <= 5분) {
  // 즉시 실행: 에이전트 없이 직접 수정
  직접수정() → 배포()
  
} else if (작업시간 <= 30분) {
  // 단일 실행: 전문 에이전트 1명
  Task(전문에이전트, "작업 내용") → 배포()
  
} else if (작업시간 <= 2시간) {
  // 병렬 실행: 관련 에이전트 동시 투입
  Promise.all([에이전트들]) → 통합() → 배포()
  
} else {
  // 대규모 작업: 계획 수립 후 병렬 실행
  간단계획() → Promise.all([다수에이전트]) → 배포()
}
```

### 2️⃣ 병렬 처리 극대화 (가장 중요!)

```javascript
// ✅ 올바른 방법: 병렬 실행 (30분)
const results = await Promise.all([
  Task("api-developer-noah", "API 구현"),
  Task("component-developer-lucas", "UI 구현"),
  Task("automation-engineer-henry", "테스트 작성")
]);
// 3명이 동시 작업 = 3배 빠른 완료

// ❌ 잘못된 방법: 순차 실행 (90분)
await Task("A", "작업1");  // 30분 대기
await Task("B", "작업2");  // 30분 대기
await Task("C", "작업3");  // 30분 대기
```

## 🎯 에이전트 스마트 활용법

### 즉시 실행 에이전트 (코드 바로 생성)

| 에이전트 | 활용 상황 | 예상 시간 |
|---------|-----------|----------|
| `component-developer-lucas` | UI 컴포넌트 생성/수정 | 5-10분 |
| `api-developer-noah` | API 엔드포인트 구현 | 10-15분 |
| `automation-engineer-henry` | 테스트 코드 작성 | 5-10분 |
| `styling-layout-specialist-ava` | CSS/레이아웃 수정 | 5분 |
| `business-logic-developer-ethan` | 비즈니스 로직 구현 | 10-20분 |

### 통합/최적화 에이전트

| 에이전트 | 활용 상황 | 예상 시간 |
|---------|-----------|----------|
| `integration-engineer-chloe` | API-UI 연결, 서비스 통합 | 10-15분 |
| `performance-interaction-engineer` | 성능 최적화, 애니메이션 | 10-15분 |
| `cicd-engineer-emily` | 배포 자동화 | 5-10분 |

### 분석/설계 에이전트 (복잡한 문제만)

| 에이전트 | 활용 상황 | 언제 사용? |
|---------|-----------|------------|
| `system-architect-arthur` | 아키텍처 변경 | 시스템 재설계 시 |
| `backend-lead-benjamin` | 복잡한 백엔드 설계 | 새로운 서비스 구축 시 |
| `ui-lead-sophia` | 디자인 시스템 변경 | UI 전면 개편 시 |

## 💡 실전 패턴: 30분 안에 기능 구현

### 패턴 1: 간단한 버그 수정 (5분)
```javascript
// 병렬 실행으로 5분 내 완료
Promise.all([
  Task("api-developer-noah", "로그인 500 에러 수정"),
  Task("automation-engineer-henry", "에러 테스트 추가")
]);
```

### 패턴 2: 새 기능 개발 (30분)
```javascript
// Phase 1: 병렬 구현 (15분)
const [api, ui, test] = await Promise.all([
  Task("api-developer-noah", "댓글 CRUD API"),
  Task("component-developer-lucas", "댓글 컴포넌트"),
  Task("automation-engineer-henry", "댓글 테스트")
]);

// Phase 2: 통합 및 배포 (15분)
await Promise.all([
  Task("integration-engineer-chloe", "API-UI 통합"),
  Task("cicd-engineer-emily", "배포 준비")
]);
```

### 패턴 3: 성능 최적화 (20분)
```javascript
// 3명의 전문가 동시 투입
Promise.all([
  Task("performance-interaction-engineer", "렌더링 최적화"),
  Task("scalability-engineer", "API 캐싱"),
  Task("database-reliability-engineer-victoria", "쿼리 최적화")
]);
```

## 🚫 절대 하지 말아야 할 것들

```javascript
// ❌ 1. 간단한 작업에 과도한 프로세스
Task("system-architect-arthur", "버튼 색상 변경")  // 절대 금지!

// ❌ 2. 모든 작업에 라이브러리 조사
Task("ui-lead-sophia", "최신 버튼 라이브러리 조사")  // 불필요!

// ❌ 3. 순차적 대기
await Task("A", "작업1");
await Task("B", "작업2");  // 병렬로 처리하세요!

// ❌ 4. 역할 고정 (리더는 분석만, 팀원은 실행만)
// 삭제! 누구나 필요한 작업을 할 수 있습니다.

// ❌ 5. 8단계 프로세스 강요
// 삭제! 작업에 맞는 최소 프로세스만 사용
```

## 🎯 성과 측정 기준

| 작업 유형 | 목표 시간 | 측정 지표 |
|----------|----------|-----------|
| 버그 수정 | 5분 이내 | 발견→수정→배포 시간 |
| UI 변경 | 10분 이내 | 요청→완료 시간 |
| 새 기능 | 30분 이내 | 기획→구현→배포 시간 |
| API 추가 | 15분 이내 | 설계→구현→테스트 시간 |
| 배포 | 3분 이내 | 커밋→프로덕션 시간 |

## 🔥 즉시 실행 명령어

### 빠른 수정 (직접 실행)
```bash
# 5분 이내 작업은 에이전트 없이 직접 수정
Edit 파일명 → 수정 → 테스트 → 배포
```

### 기능 구현 (병렬 실행)
```javascript
// implement-feature.js - 30분 내 전체 기능 구현
async function implement(feature) {
  // 모든 작업 동시 실행
  await Promise.all([
    Task("api-developer-noah", `${feature} API`),
    Task("component-developer-lucas", `${feature} UI`),
    Task("automation-engineer-henry", `${feature} 테스트`)
  ]);
  
  // 통합 및 배포
  await Task("integration-engineer-chloe", "통합");
  await Task("cicd-engineer-emily", "배포");
  
  return "✅ 30분 내 완료!";
}
```

## 📋 작업 전 체크리스트 (3초 판단)

```javascript
function checkWorkflow(task) {
  // 1. 5분 안에 끝나는가? → 직접 수정
  if (task.estimatedTime < 5) return "DIRECT";
  
  // 2. 단순 구현인가? → 에이전트 1명
  if (task.complexity === "simple") return "SINGLE_AGENT";
  
  // 3. 여러 영역인가? → 병렬 실행
  if (task.areas.length > 1) return "PARALLEL";
  
  // 4. 복잡한 설계인가? → 최소 계획 후 실행
  return "PLAN_AND_EXECUTE";
}
```

## 🚀 1000% 성과 달성 공식

```
성과 = (결과 품질 × 실행 속도) ÷ 프로세스 복잡도

목표: 
- 결과 품질: 100%
- 실행 속도: 10배 향상
- 프로세스 복잡도: 1/10로 감소
= 1000% 성과
```

## 필수 명령어 및 도구

### 개발 환경
- **프론트엔드**: `cd vridge_front_hybrid && npm run dev` (포트 3000)
- **백엔드**: `cd vridge_back && python manage.py runserver` (포트 8000)
- **테스트**: `npm test` / `python manage.py test`

### 배포
- **프론트엔드**: Vercel 자동 배포 (push to main)
- **백엔드**: Railway 자동 배포 (push to main)

### 주요 URL
- **프로덕션**: https://vlanet.net
- **API**: https://videoplanet.up.railway.app
- **스테이징**: https://videoplanet-seven.vercel.app

## AI 어시스턴트 가이드
- 모든 설명은 **한국어**로 작성
- 코드 주석은 **불필요** (명시적 요청 시에만)
- 결과 중심으로 **간결하게** 응답

## 프로젝트 정보
- **프론트엔드**: React + Next.js
- **백엔드**: Django + PostgreSQL
- **인증**: JWT (SimpleJWT)
- **캐시**: Redis

---
*이 문서는 VideoPlanet의 1000% 성과 달성을 위한 실전 가이드입니다.*
**핵심: 적게 생각하고, 빠르게 실행하라!**