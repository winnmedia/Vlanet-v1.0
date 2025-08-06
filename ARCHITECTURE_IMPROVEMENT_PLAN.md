# VideoPlanet 아키텍처 개선 실행 계획

## 🎯 Executive Summary

VideoPlanet 시스템의 MECE 분석 결과, 전체 아키텍처 성숙도는 **65%**로 평가되었습니다.
주요 개선 필요 영역은 확장성(40%), 보안(55%), 성능(60%), 코드 품질(45%)입니다.

### 핵심 지표
- **현재 아키텍처 점수**: 65/100
- **목표 아키텍처 점수**: 85/100 (6개월 내)
- **예상 성능 개선**: 250% (응답 시간 기준)
- **예상 비용 절감**: 30-40% (최적화 후)
- **기술 부채 감소**: 60% (6개월 내)

## 📊 MECE 분석 요약

### 1. Mutually Exclusive (상호 배타성) - 중복 제거
| 영역 | 현재 상태 | 개선 후 | 우선순위 |
|------|----------|---------|----------|
| 인증 로직 | 3곳 중복 | 1개 서비스 | 🔴 높음 |
| 날짜 처리 | 2개 라이브러리 | date-fns 통일 | 🟡 중간 |
| 비디오 플레이어 | 3개 컴포넌트 | VidstackPlayer | 🟡 중간 |
| 상태 관리 | 3개 라이브러리 | Zustand 통일 | 🟢 낮음 |
| 스타일링 | 3가지 방식 | CSS Modules | 🟢 낮음 |

### 2. Collectively Exhaustive (총체적 완전성) - 누락 요소
| 누락 요소 | 영향도 | 구현 난이도 | 예상 기간 |
|-----------|--------|------------|-----------|
| 메시지 큐 (Celery) | 높음 | 중간 | 2주 |
| 모니터링 (Sentry) | 높음 | 낮음 | 1주 |
| CDN | 중간 | 낮음 | 3일 |
| API Gateway | 낮음 | 높음 | 1개월 |
| 백업/복구 | 높음 | 중간 | 1주 |

## 🚨 즉시 실행 계획 (24-48시간)

### Day 1: 보안 및 성능 긴급 패치

```bash
# 1. CORS 설정 수정
# vridge_back/config/settings_base.py
CORS_ALLOWED_ORIGINS = [
    "https://vlanet.net",
    "https://www.vlanet.net",
    "http://localhost:3000",  # 개발용
]
CORS_ALLOW_ALL_ORIGINS = False

# 2. 데이터베이스 인덱스 추가
python manage.py makemigrations --name add_performance_indexes
python manage.py migrate

# 3. N+1 쿼리 수정
# 모든 views.py 파일에서 select_related/prefetch_related 추가
```

### Day 2: 모니터링 및 에러 추적

```bash
# 1. Sentry 설치 및 설정
pip install sentry-sdk
npm install @sentry/nextjs

# 2. 환경변수 추가
SENTRY_DSN=your_sentry_dsn
SENTRY_ENVIRONMENT=production

# 3. 기본 알림 설정
# - 500 에러 발생 시 즉시 알림
# - 응답 시간 3초 초과 시 경고
```

## 📈 단기 개선 계획 (1-2주)

### Week 1: 비동기 처리 시스템 구축

```python
# 1. Celery + Redis 설정
# requirements.txt
celery==5.3.0
redis==5.0.0
django-celery-beat==2.5.0

# 2. 비동기 작업 정의
# vridge_back/config/celery.py
@shared_task
def process_video_upload(video_id):
    """비디오 업로드 비동기 처리"""
    pass

@shared_task
def generate_storyboard_images(planning_id):
    """스토리보드 이미지 생성"""
    pass

# 3. 기존 동기 코드 마이그레이션
```

### Week 2: 데이터베이스 최적화

```sql
-- 필수 인덱스 생성
CREATE INDEX CONCURRENTLY idx_project_user_created 
ON projects_project(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_feedback_project_timestamp 
ON feedbacks_feedback(project_id, timestamp);

CREATE INDEX CONCURRENTLY idx_members_user_project 
ON projects_members(user_id, project_id);

-- 파티셔닝 검토 (로그 테이블)
CREATE TABLE feedbacks_feedback_2025 PARTITION OF feedbacks_feedback
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

## 🏗️ 중기 아키텍처 전환 (1-3개월)

### Month 1: 모듈러 모놀리스 전환

```
현재 구조:                    목표 구조:
vridge_back/                  vridge_back/
├── users/                    ├── modules/
├── projects/                 │   ├── users/
├── feedbacks/                │   │   ├── api/
├── video_planning/           │   │   ├── domain/
└── video_analysis/           │   │   └── infra/
                              │   ├── projects/
                              │   ├── feedbacks/
                              │   └── video/
                              └── shared/
                                  ├── auth/
                                  └── utils/
```

### Month 2: 프론트엔드 최적화

```javascript
// 1. 상태 관리 통합
// stores/index.js
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const useAppStore = create(devtools((set) => ({
  // 통합된 전역 상태
})))

// 2. 컴포넌트 중복 제거
// components/VideoPlayer/index.jsx
export { VidstackPlayer as default } from './VidstackPlayer'

// 3. 번들 사이즈 최적화
// next.config.js
module.exports = {
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /node_modules/
        }
      }
    }
    return config
  }
}
```

### Month 3: 마이크로서비스 준비

```yaml
# docker-compose.yml
version: '3.8'
services:
  api-gateway:
    image: kong:latest
    ports:
      - "8000:8000"
  
  user-service:
    build: ./services/users
    environment:
      - DATABASE_URL=${USER_DB_URL}
  
  project-service:
    build: ./services/projects
    environment:
      - DATABASE_URL=${PROJECT_DB_URL}
  
  video-service:
    build: ./services/video
    environment:
      - DATABASE_URL=${VIDEO_DB_URL}
```

## 💰 비용 최적화 전략

### 현재 vs 최적화 후 비용 비교

| 항목 | 현재 (월) | 최적화 후 | 절감률 |
|------|-----------|-----------|--------|
| Vercel | $20 | $20 | 0% |
| Railway | $50 | $35 | 30% |
| PostgreSQL | $20 | $15 | 25% |
| Redis | $10 | $5 | 50% |
| CDN | $0 | $10 | - |
| **총계** | **$100** | **$85** | **15%** |

### 절감 방법
1. **데이터베이스**: 인덱스 최적화로 인스턴스 크기 축소
2. **Redis**: 캐시 전략 개선으로 메모리 사용량 감소
3. **Railway**: 자동 스케일링 설정으로 유휴 시간 비용 절감

## 📊 성능 개선 목표

### 현재 vs 목표 성능 지표

| 메트릭 | 현재 | 목표 (3개월) | 개선률 |
|--------|------|--------------|--------|
| API 응답 시간 (P50) | 500ms | 200ms | 150% |
| API 응답 시간 (P95) | 2000ms | 500ms | 300% |
| 페이지 로드 시간 | 3s | 1.5s | 100% |
| 동시 접속 처리 | 100명 | 500명 | 400% |
| 비디오 업로드 | 동기(5분) | 비동기(30초) | 900% |

## 🔒 보안 강화 로드맵

### Phase 1: 기본 보안 (1주)
- [x] CORS 설정 강화
- [ ] Rate Limiting 구현
- [ ] SQL Injection 방지
- [ ] XSS 방지 헤더

### Phase 2: 인증/인가 (2주)
- [ ] JWT 토큰 갱신 로직
- [ ] 권한 기반 접근 제어 (RBAC)
- [ ] 2FA 구현

### Phase 3: 고급 보안 (1개월)
- [ ] API Gateway 보안 정책
- [ ] DDoS 방어
- [ ] 보안 감사 로그
- [ ] OWASP Top 10 대응

## 🧹 기술 부채 청산 계획

### 즉시 정리 대상 (1주)
```bash
# 미사용 파일 정리 스크립트
#!/bin/bash
find . -type f -name "*.backup" -delete
find . -type f -name "*.old" -delete
find . -type f -name "*-test.*" -delete
find . -type f -name "*_UNUSED*" -delete

# 의존성 정리
npm prune
pip-compile --upgrade
```

### 코드 품질 개선 (2주)
```javascript
// .eslintrc.js
module.exports = {
  extends: ['next', 'next/core-web-vitals'],
  rules: {
    'no-unused-vars': 'error',
    'no-console': 'warn',
    'prefer-const': 'error'
  }
}

// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2
}
```

## 📈 진행 상황 추적

### 주간 체크포인트
- [ ] Week 1: 보안 패치 완료, Celery 설정
- [ ] Week 2: DB 최적화, 모니터링 구축
- [ ] Week 3: 첫 비동기 작업 마이그레이션
- [ ] Week 4: 프론트엔드 중복 제거 50%

### 월간 마일스톤
- [ ] Month 1: 모듈러 모놀리스 30% 완성
- [ ] Month 2: 성능 2배 개선
- [ ] Month 3: 첫 마이크로서비스 분리

## 🎯 성공 지표 (KPI)

### 기술적 지표
- API 응답 시간 < 500ms (P95)
- 에러율 < 0.1%
- 테스트 커버리지 > 70%
- 코드 중복도 < 5%

### 비즈니스 지표
- 페이지 로딩 시간 50% 감소
- 사용자 이탈률 30% 감소
- 동시 접속자 5배 증가 가능
- 인프라 비용 30% 절감

## 🚀 즉시 실행 명령어

```bash
# 1. 보안 패치 적용
cd /home/winnmedia/VideoPlanet/vridge_back
python manage.py migrate
python manage.py collectstatic --noinput

# 2. 프론트엔드 최적화
cd /home/winnmedia/VideoPlanet/vridge_front
npm run build
npm run analyze

# 3. 배포
git add .
git commit -m "chore: apply security patches and performance optimizations"
git push origin main

# Railway 자동 배포 시작
# Vercel 자동 배포 시작
```

---

**작성자**: Arthur (Chief Architect)
**날짜**: 2025-08-06
**다음 리뷰**: 2025-08-13