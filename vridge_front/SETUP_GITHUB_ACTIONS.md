# GitHub Actions 설정 가이드

## 필수 GitHub Secrets 설정

GitHub 리포지토리의 Settings → Secrets and variables → Actions에서 다음 시크릿을 추가해야 합니다.

### 1. Vercel 배포 (필수)
```
VERCEL_TOKEN        # Vercel 계정 설정에서 생성
VERCEL_ORG_ID       # Vercel 프로젝트 설정에서 확인
VERCEL_PROJECT_ID   # Vercel 프로젝트 설정에서 확인
```

#### Vercel Token 생성 방법:
1. https://vercel.com/account/tokens 접속
2. "Create Token" 클릭
3. 토큰 이름 입력 (예: "GitHub Actions")
4. Scope는 "Full Access" 선택
5. 생성된 토큰을 복사하여 GitHub Secrets에 저장

#### Vercel Project ID 확인 방법:
1. Vercel 대시보드에서 프로젝트 선택
2. Settings → General
3. "Project ID"와 "Team ID" (Organization ID) 복사

### 2. 알림 설정 (선택사항)
```
SLACK_WEBHOOK_URL   # Slack 알림용 Webhook URL
DISCORD_WEBHOOK_URL # Discord 알림용 Webhook URL
```

### 3. 보안 스캔 (선택사항)
```
SNYK_TOKEN          # Snyk 보안 스캔용 토큰
```

### 4. 성능 모니터링 (선택사항)
```
LIGHTHOUSE_CI_TOKEN # Lighthouse CI 토큰
```

## 워크플로우 수동 실행

### CI/CD 파이프라인 테스트
```bash
# GitHub CLI를 사용한 수동 실행
gh workflow run ci.yml --ref recovery-20250731

# 또는 GitHub 웹에서:
# Actions 탭 → CI/CD Pipeline → Run workflow
```

### 보안 스캔 실행
```bash
gh workflow run security.yml --ref recovery-20250731
```

## 워크플로우 상태 확인

### CLI로 확인
```bash
# 최근 실행 목록
gh run list --workflow=ci.yml

# 특정 실행 상세 보기
gh run view [RUN_ID]

# 실시간 로그 보기
gh run watch [RUN_ID]
```

### 웹에서 확인
1. GitHub 리포지토리 → Actions 탭
2. 왼쪽 사이드바에서 워크플로우 선택
3. 실행 중인 워크플로우 클릭하여 상세 로그 확인

## 트러블슈팅

### 1. Vercel 배포 실패
- VERCEL_TOKEN이 올바른지 확인
- Vercel 프로젝트가 이미 연결되어 있는지 확인
- `vercel.json` 설정이 올바른지 확인

### 2. npm install 실패
- `package-lock.json`이 최신인지 확인
- `--legacy-peer-deps` 플래그 필요 여부 확인

### 3. 빌드 실패
- 로컬에서 `npm run build:vercel` 실행하여 테스트
- 환경변수가 모두 설정되었는지 확인

## 모니터링 대시보드

### GitHub Actions 인사이트
- https://github.com/winnmedia/Vlanet-v1.0/actions/workflows/ci.yml
- https://github.com/winnmedia/Vlanet-v1.0/actions/workflows/security.yml

### 빌드 시간 추적
Actions → Workflow → Timing에서 각 단계별 소요 시간 확인

### 캐시 효율성
Settings → Actions → Caches에서 캐시 적중률 확인

## 권장 설정

### 브랜치 보호 규칙
1. Settings → Branches
2. "Add rule" 클릭
3. Branch name pattern: `main` 또는 `recovery-20250731`
4. 다음 옵션 활성화:
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Include administrators

### 자동 머지
1. Pull Request에 "auto-merge" 레이블 추가
2. 모든 체크 통과 시 자동 머지

## 성능 목표

- **빌드 시간**: 5분 이내
- **테스트 실행**: 2분 이내
- **전체 파이프라인**: 10분 이내
- **캐시 적중률**: 80% 이상

## 문의사항

문제 발생 시 다음 정보와 함께 이슈 생성:
- 워크플로우 실행 ID
- 에러 메시지
- 재현 단계