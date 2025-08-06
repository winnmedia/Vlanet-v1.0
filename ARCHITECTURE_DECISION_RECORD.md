# Architecture Decision Records (ADR) - VideoPlanet

## ADR-001: 마이크로서비스 전환 전략
**Status**: Proposed
**Date**: 2025-08-06
**Author**: Arthur (Chief Architect)

### Context
VideoPlanet은 현재 모놀리식 Django 애플리케이션으로 운영 중이며, 사용자 증가에 따른 확장성 문제가 예상됨.

### Decision Drivers
- 독립적인 스케일링 필요성
- 팀별 독립적 배포 요구
- 기술 스택 다양화 필요
- 장애 격리 요구사항

### Considered Options
1. **현재 모놀리식 유지**: 최소 비용, 단순한 운영
2. **모듈러 모놀리스**: 중간 단계, 점진적 전환
3. **완전한 마이크로서비스**: 최대 확장성, 복잡한 운영

### Decision Outcome
**Option 2: 모듈러 모놀리스**를 1차 목표로 설정 후, 단계적으로 마이크로서비스로 전환

### Implementation Strategy
```
Phase 1 (현재-3개월): 모듈 경계 정의
- users, projects, feedbacks, video_planning 모듈 분리
- 내부 API 계약 정의
- 데이터베이스 스키마 분리 준비

Phase 2 (3-6개월): 서비스 추출
- video_planning을 첫 번째 독립 서비스로 분리
- API Gateway 도입 (Kong 또는 Traefik)
- 서비스 간 통신 프로토콜 확립

Phase 3 (6-12개월): 완전한 전환
- 나머지 모듈 순차적 분리
- 서비스 메시 구축
- 모니터링 및 추적 시스템 구축
```

### Consequences
**Positive**
- 점진적 전환으로 리스크 최소화
- 팀별 독립성 확보
- 기술 부채 단계적 해결

**Negative**
- 전환 기간 중 복잡도 증가
- 초기 인프라 비용 상승
- 팀 학습 곡선

---

## ADR-002: 비동기 작업 처리 시스템
**Status**: Accepted
**Date**: 2025-08-06
**Author**: Arthur (Chief Architect)

### Context
대용량 비디오 처리, AI 이미지 생성 등 시간이 오래 걸리는 작업이 동기식으로 처리되어 사용자 경험 저하.

### Decision
**Celery + Redis**를 비동기 작업 큐로 도입

### Implementation
```python
# 즉시 구현 필요한 작업들
ASYNC_TASKS = [
    'video_upload_processing',
    'storyboard_image_generation',
    'pdf_export',
    'email_sending',
    'video_analysis'
]
```

### Migration Path
1. Celery 설정 및 Redis 연동 (1주)
2. 비디오 업로드 비동기화 (1주)
3. AI 이미지 생성 비동기화 (1주)
4. 나머지 작업 순차 마이그레이션 (2주)

---

## ADR-003: 프론트엔드 상태 관리 통합
**Status**: Accepted
**Date**: 2025-08-06
**Author**: Arthur (Chief Architect)

### Context
Redux, Zustand, Context API가 혼재되어 상태 관리 복잡도 증가 및 디버깅 어려움.

### Decision
**Zustand**를 주 상태 관리 라이브러리로 채택

### Rationale
- 번들 크기: Zustand (8KB) < Redux (60KB)
- 학습 곡선: Zustand가 더 단순
- TypeScript 지원: 우수
- 성능: 선택적 구독으로 불필요한 리렌더링 방지

### Migration Strategy
```javascript
// Phase 1: 새 기능은 Zustand로 구현
// Phase 2: 기존 Context API를 Zustand로 전환
// Phase 3: Redux 코드를 점진적으로 마이그레이션
// 예상 기간: 2-3개월
```

---

## ADR-004: 데이터베이스 성능 최적화
**Status**: Accepted
**Date**: 2025-08-06
**Author**: Arthur (Chief Architect)

### Context
N+1 쿼리 문제와 인덱스 부재로 인한 성능 저하 발견.

### Decision
즉각적인 데이터베이스 최적화 실행

### Implementation Checklist
```sql
-- 필수 인덱스 추가
CREATE INDEX idx_project_user ON projects_project(user_id);
CREATE INDEX idx_feedback_project ON feedbacks_feedback(project_id);
CREATE INDEX idx_feedback_timestamp ON feedbacks_feedback(timestamp);
CREATE INDEX idx_members_user_project ON projects_members(user_id, project_id);

-- 복합 인덱스
CREATE INDEX idx_project_created_user ON projects_project(created_at, user_id);
```

### ORM 최적화
```python
# Before
projects = Project.objects.filter(user=user)
for project in projects:
    members = project.members.all()  # N+1 문제

# After
projects = Project.objects.filter(user=user)\
    .select_related('user')\
    .prefetch_related('members__user', 'feedbacks')
```

---

## ADR-005: 보안 강화 전략
**Status**: Accepted
**Date**: 2025-08-06
**Author**: Arthur (Chief Architect)

### Context
CORS 과도한 개방, Rate Limiting 부재 등 보안 취약점 발견.

### Decision
다층 보안 전략 즉시 적용

### Implementation Priority
1. **즉시 (오늘)**
   - CORS 설정 제한
   - 환경변수 검증 강화
   
2. **1주 내**
   - Rate Limiting 구현
   - SQL Injection 방지 검토
   
3. **1개월 내**
   - Security Headers 강화
   - OWASP Top 10 대응

### Security Headers
```python
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
CSP_DEFAULT_SRC = ("'self'",)
```

---

## ADR-006: 모니터링 및 관찰성
**Status**: Proposed
**Date**: 2025-08-06
**Author**: Arthur (Chief Architect)

### Context
프로덕션 환경의 문제를 사전에 감지하고 디버깅할 수 있는 도구 부재.

### Decision
**Sentry + Grafana + Prometheus** 스택 도입

### Implementation Roadmap
1. Sentry 에러 추적 (1주)
2. Prometheus 메트릭 수집 (2주)
3. Grafana 대시보드 구축 (1주)
4. 알림 규칙 설정 (1주)

### Key Metrics
- API 응답 시간 (P50, P95, P99)
- 에러율
- 동시 사용자 수
- 데이터베이스 쿼리 시간
- 메모리/CPU 사용률

---

## ADR-007: 기술 부채 관리 프로세스
**Status**: Accepted
**Date**: 2025-08-06
**Author**: Arthur (Chief Architect)

### Context
100개 이상의 미사용 파일과 중복 코드로 인한 유지보수 어려움.

### Decision
분기별 기술 부채 청산 스프린트 도입

### Process
1. **매 스프린트**: 20% 시간을 기술 부채 해결에 할당
2. **분기별**: 1주간 전체 기술 부채 청산 스프린트
3. **자동화**: ESLint, Prettier, Pre-commit hooks 도입

### Immediate Actions
```bash
# 미사용 파일 정리
find . -name "*.backup" -delete
find . -name "*.old" -delete

# 의존성 업데이트
npm audit fix
pip-audit --fix

# 코드 품질 도구 설정
npm install --save-dev eslint prettier husky
```

---

## 다음 단계 Action Items

### 🔴 긴급 (24시간 내)
1. CORS 설정 수정 및 배포
2. 데이터베이스 인덱스 추가
3. 환경변수 검증 스크립트 작성

### 🟡 단기 (1주 내)
1. Celery + Redis 설정
2. Rate Limiting 미들웨어 구현
3. Sentry 통합

### 🟢 중기 (1개월 내)
1. 모듈 경계 정의 문서화
2. 비동기 작업 마이그레이션
3. 프론트엔드 상태 관리 통합 시작

### 🔵 장기 (3개월 내)
1. 첫 번째 마이크로서비스 분리
2. 모니터링 대시보드 구축
3. 기술 부채 50% 감소

---

*이 문서는 살아있는 문서로, 새로운 아키텍처 결정이 있을 때마다 업데이트됩니다.*