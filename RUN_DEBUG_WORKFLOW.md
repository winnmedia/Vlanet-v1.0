# 🔍 디버그 워크플로우 실행 가이드

## 실행 방법

### 1. GitHub Actions 페이지 접속
1. https://github.com/winnmedia/Vlanet-v1.0/actions 접속
2. 왼쪽 사이드바에서 "Vercel Debug Verbose" 찾기

### 2. 워크플로우 실행
1. "Vercel Debug Verbose" 클릭
2. 오른쪽 "Run workflow" 버튼 클릭
3. Branch: `main` 선택
4. "Run workflow" 녹색 버튼 클릭

### 3. 로그 확인
1. 실행 중인 워크플로우 클릭
2. "debug" 작업 클릭
3. 각 단계별 로그 확인:
   - **Debug Environment**: GitHub 환경 정보
   - **Secrets Check**: 시크릿 설정 여부
   - **Project Structure**: 파일 구조
   - **Test Vercel CLI**: Vercel 인증 테스트
   - **Manual Build Test**: 빌드 테스트

## 확인할 주요 정보

### 1. Secrets Check 단계
```
VERCEL_TOKEN length: [숫자]
VERCEL_ORG_ID length: [숫자]
VERCEL_PROJECT_ID length: [숫자]
```
- 0이면 해당 시크릿이 설정되지 않음

### 2. Test Vercel CLI 단계
```
Testing Vercel with token...
[사용자명] 또는 "Vercel auth failed"
```
- 실패하면 토큰이 잘못됨

### 3. Manual Build Test 단계
- 빌드 성공 여부 확인
- .next 디렉토리 생성 확인

## 🚨 일반적인 오류와 해결

### "VERCEL_TOKEN length: 0"
**해결**: GitHub Secrets에 VERCEL_TOKEN 추가
1. Settings → Secrets → Actions
2. New repository secret
3. Name: `VERCEL_TOKEN`
4. Value: Vercel 토큰

### "Vercel auth failed"
**해결**: 새 토큰 생성
1. https://vercel.com/account/tokens
2. Create Token
3. GitHub Secrets 업데이트

### Build 실패
**해결**: 로컬에서 빌드 테스트
```bash
cd vridge_front
npm install --legacy-peer-deps
npm run build
```

---
**실행 링크**: [GitHub Actions 페이지](https://github.com/winnmedia/Vlanet-v1.0/actions/workflows/vercel-debug-verbose.yml)