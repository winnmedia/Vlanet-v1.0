# 🔧 Vercel NPX 오류 해결 가이드

## 문제
```
Error! Unexpected error. Please try again later. ()
The process '/usr/local/bin/npx' failed with exit code 1
```

## 가능한 원인

### 1. ❌ GitHub Secrets 미설정
- `VERCEL_TOKEN`이 없거나 잘못됨
- `VERCEL_ORG_ID` 또는 `VERCEL_PROJECT_ID` 누락

### 2. ❌ Node.js 환경 문제
- Node.js가 설치되지 않음
- 호환되지 않는 버전

### 3. ❌ Vercel Action 내부 오류
- amondnet/vercel-action@v25의 버그

## 해결책

### 1. 새 워크플로우 생성 (3개)
- **vercel-deploy-with-node.yml**: Node.js 설정 포함
- **vercel-cli-direct.yml**: Vercel CLI 직접 사용
- **vercel-debug-verbose.yml**: 상세 디버깅

### 2. GitHub Secrets 확인
1. 저장소 → Settings → Secrets and variables → Actions
2. 다음 3개 모두 있는지 확인:
   - `VERCEL_TOKEN` ✅
   - `VERCEL_ORG_ID` ✅
   - `VERCEL_PROJECT_ID` ✅

### 3. Vercel 토큰 재생성
```bash
# 1. https://vercel.com/account/tokens
# 2. 기존 토큰 삭제
# 3. 새 토큰 생성
# 4. GitHub Secrets 업데이트
```

## 🚀 권장 실행 순서

### Step 1: 디버깅
- GitHub Actions → "Vercel Debug Verbose"
- Run workflow 클릭
- 로그에서 오류 확인

### Step 2: CLI 직접 사용
- "Vercel CLI Direct Deploy" 실행
- 더 명확한 오류 메시지 확인

### Step 3: 웹 대시보드 사용
오류가 계속되면:
1. https://vercel.com/new
2. GitHub 저장소 Import
3. Root Directory: `vridge_front`

## 📝 체크리스트
- [ ] Node.js 18.x 사용
- [ ] GitHub Secrets 3개 모두 설정
- [ ] VERCEL_TOKEN 유효성 확인
- [ ] package-lock.json 존재 확인

---
**즉시 해결**: Vercel 웹 대시보드를 사용하는 것이 가장 확실합니다!