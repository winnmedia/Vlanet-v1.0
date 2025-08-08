# 🚀 VideoPlanet CI/CD Pipeline Documentation

## 📋 개요

VideoPlanet 프론트엔드를 위한 최신 GitHub Actions CI/CD 파이프라인입니다. 2025년 최신 베스트 프랙티스를 적용하여 Next.js 15.4.2 프로젝트의 빌드, 테스트, 보안 검사, 배포를 자동화합니다.

## 🏗️ 파이프라인 구조

### 1. 🚀 메인 CI/CD 파이프라인 (`ci.yml`)
- **트리거**: Push (recovery-20250731, main, develop), PR, 수동 실행
- **주요 기능**:
  - 📊 스마트 변경사항 감지
  - 🔬 병렬 코드 품질 검사 (Lint, Security, Dependencies)
  - 🏗️ 최적화된 Next.js 빌드
  - 🧪 배포 전 테스트
  - 🚀 Vercel 자동 배포
  - 📊 성능 모니터링

### 2. 🛡️ 보안 스캔 파이프라인 (`security.yml`)
- **트리거**: Push, PR, 스케줄 (매주 월요일), 수동 실행
- **주요 기능**:
  - 🔍 의존성 보안 검사 (NPM Audit, Snyk, OWASP)
  - 🔬 코드 보안 분석 (CodeQL, ESLint Security, Semgrep)
  - 🤐 시크릿 스캔 (TruffleHog, GitLeaks)
  - 📊 통합 보안 대시보드

### 3. 📊 성능 모니터링 파이프라인 (`performance.yml`)
- **트리거**: Push, PR, 스케줄 (매일 오전 6시)
- **주요 기능**:
  - 🏗️ 빌드 성능 분석
  - 🌐 Lighthouse 성능 테스트
  - 🔄 성능 회귀 테스트
  - 📈 성능 트렌드 모니터링

### 4. 📢 스마트 알림 시스템 (`notifications.yml`)
- **트리거**: 워크플로우 완료, Push, PR, 배포 상태 변경, 스케줄
- **주요 기능**:
  - 🎯 상황별 맞춤 알림
  - 📊 주간 개발 리포트
  - 🚨 긴급 상황 알림

### 5. 🔍 프리뷰 배포 & 테스트 (`deploy-preview.yml`)
- **트리거**: PR 생성/업데이트
- **주요 기능**:
  - 🔍 변경사항 영향도 분석
  - 🚀 Vercel 프리뷰 배포
  - 🧪 자동화된 프리뷰 테스트
  - 📝 PR 코멘트 업데이트

## 🚀 주요 최적화 기능

### 1. 스마트 캐싱 전략 (2025년 최신)
```yaml
- name: 🚀 Smart Cache Strategy
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
      .next/cache
      .next/static
    key: build-${{ runner.os }}-node${{ env.NODE_VERSION }}-${{ hashFiles('package-lock.json') }}-${{ hashFiles('next.config.js') }}-${{ hashFiles('src/**', 'pages/**') }}
```

### 2. 병렬 작업 실행
```yaml
strategy:
  matrix:
    task: [lint, security, dependencies]
```

### 3. 조건부 실행 (변경사항 기반)
```yaml
if: needs.changes.outputs.frontend == 'true' || needs.changes.outputs.config == 'true'
```

### 4. 성능 예산 관리
- 빌드 시간: 5분 이내
- 메인 JS 번들: 1MB 이내
- Lighthouse 성능 점수: 80점 이상

## 🔧 설정 가이드

### 1. GitHub Secrets 설정

다음 시크릿들을 GitHub 저장소 설정에 추가해야 합니다:

#### Vercel 배포
```
VERCEL_TOKEN=your_vercel_token
ORG_ID=your_vercel_org_id
PROJECT_ID=your_vercel_project_id
```

#### 보안 스캔
```
SNYK_TOKEN=your_snyk_token
SEMGREP_APP_TOKEN=your_semgrep_token
```

#### 성능 모니터링
```
LIGHTHOUSE_CI_TOKEN=your_lighthouse_token
LHCI_GITHUB_APP_TOKEN=your_lhci_token
```

#### 알림
```
SLACK_WEBHOOK_URL=your_slack_webhook
DISCORD_WEBHOOK_URL=your_discord_webhook (선택사항)
```

### 2. 환경 변수 설정

프로젝트 루트에 다음 파일들을 확인하세요:

#### `.env.example`
```env
NEXT_PUBLIC_API_URL=https://videoplanet.up.railway.app
NEXT_PUBLIC_SITE_NAME=VideoPlanet
NEXT_PUBLIC_VERSION=1.0.16
```

### 3. Lighthouse 설정

`lighthouse.config.js` 파일에서 성능 임계값을 조정할 수 있습니다:

```javascript
assertions: {
  'categories:performance': ['error', { minScore: 0.8 }],
  'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
  'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
}
```

## 📊 성능 메트릭

### Core Web Vitals 목표
- **FCP (First Contentful Paint)**: < 1.8초
- **LCP (Largest Contentful Paint)**: < 2.5초
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TBT (Total Blocking Time)**: < 300ms

### 빌드 성능 목표
- **빌드 시간**: < 5분
- **메인 JS 번들**: < 1MB
- **CSS 번들**: < 200KB
- **캐시 적중률**: > 80%

## 🔍 워크플로우 트리거 매트릭스

| 이벤트 | CI/CD | Security | Performance | Notifications | Preview |
|--------|-------|----------|-------------|---------------|---------|
| Push (main) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Push (develop) | ✅ | ❌ | ❌ | ✅ | ❌ |
| Pull Request | ✅ | ✅ | ✅ | ✅ | ✅ |
| Schedule | ❌ | ✅ | ✅ | ✅ | ❌ |
| Manual | ✅ | ✅ | ✅ | ❌ | ❌ |
| Deployment | ❌ | ❌ | ❌ | ✅ | ❌ |

## 🧪 테스트 전략

### 1. 단위 테스트 (Unit Tests)
- Jest를 사용한 컴포넌트 테스트
- 유틸리티 함수 테스트

### 2. 통합 테스트 (Integration Tests)
- API 연동 테스트
- 사용자 플로우 테스트

### 3. E2E 테스트 (End-to-End Tests)
- Playwright를 사용한 중요 경로 테스트
- PR에 `e2e-test` 라벨이 있을 때만 실행

### 4. 시각적 회귀 테스트
- 스크린샷 비교
- UI 컴포넌트 변경 감지

## 🚨 알림 및 모니터링

### Slack 알림 조건
- ✅ 배포 성공/실패
- 🐛 보안 취약점 발견 (심각도: High 이상)
- 📊 성능 저하 (빌드 시간 5분 초과)
- 🚨 프로덕션 오류

### 주간 리포트 (매주 월요일 오전 9시)
- 📊 개발 활동 통계
- 🚀 CI/CD 성공률
- 🔍 보안 스캔 결과
- 📈 성능 트렌드

## 🔧 트러블슈팅

### 1. 빌드 실패 시
```bash
# 로컬에서 확인
npm run build:vercel
npm run lint
npm audit --audit-level=high
```

### 2. 캐시 문제 시
- GitHub Actions 캐시 삭제
- 새로운 캐시 키 사용

### 3. 배포 실패 시
- Vercel 토큰 유효성 확인
- 환경 변수 설정 확인
- 빌드 로그 분석

## 📈 최적화 팁

### 1. 빌드 시간 단축
- 불필요한 의존성 제거
- 코드 스플리팅 활용
- 캐시 전략 최적화

### 2. 번들 크기 최적화
- Tree shaking 활용
- Dynamic import 사용
- 이미지 최적화

### 3. 성능 최적화
- Next.js Image 컴포넌트 사용
- 폰트 최적화
- 서비스 워커 활용

## 📚 추가 리소스

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Vercel 문서](https://vercel.com/docs)
- [Lighthouse CI 가이드](https://github.com/GoogleChrome/lighthouse-ci)

---

**📧 문의사항이나 개선 제안이 있으시면 이슈를 생성해 주세요!** 🙋‍♂️