# 🔑 VERCEL_TOKEN 설정 가이드

## 🚨 문제: VERCEL_TOKEN이 설정되지 않음

### Step 1: Vercel 토큰 생성
1. **[Vercel 토큰 페이지](https://vercel.com/account/tokens)** 접속
2. **"Create Token"** 클릭
3. 토큰 이름 입력 (예: "GitHub Actions")
4. Scope: "Full Account" 선택
5. **"Create"** 클릭
6. 생성된 토큰 복사 (한 번만 표시됨!)

### Step 2: GitHub Secrets 추가
1. **[GitHub Secrets 페이지](https://github.com/winnmedia/Vlanet-v1.0/settings/secrets/actions)** 접속
2. **"New repository secret"** 클릭
3. 입력:
   - Name: `VERCEL_TOKEN`
   - Secret: 복사한 토큰 붙여넣기
4. **"Add secret"** 클릭

### Step 3: 다른 필수 Secrets 확인
같은 방법으로 추가해야 할 Secrets:

#### VERCEL_ORG_ID 찾기:
```bash
# 로컬에서 실행
cd vridge_front
npx vercel link
# 생성된 .vercel/project.json 확인
cat .vercel/project.json
```

#### 또는 Vercel 대시보드에서:
1. https://vercel.com/dashboard
2. 프로젝트 선택
3. Settings → General
4. Project ID와 Team ID 확인

### Step 4: 모든 Secrets 추가
GitHub Secrets에 추가:
- `VERCEL_TOKEN`: 위에서 생성한 토큰
- `VERCEL_ORG_ID`: Team ID (개인 계정이면 username)
- `VERCEL_PROJECT_ID`: Project ID

## ✅ 확인 방법
1. GitHub Actions → "Vercel Debug Verbose" 실행
2. "Secrets Check" 단계에서 길이 확인
3. 모두 0이 아니면 성공!

## 🚀 재배포
Secrets 설정 후:
1. **[Vercel Working Deploy](https://github.com/winnmedia/Vlanet-v1.0/actions/workflows/vercel-working-deploy.yml)** 실행
2. 이번엔 성공할 것입니다!

---
**중요**: 토큰은 한 번만 표시되므로 반드시 복사해두세요!