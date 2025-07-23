# GitHub Secrets 설정 가이드

## 🔐 Vercel 자동 배포를 위한 GitHub Secrets 설정

### 1. Vercel Token 생성
1. https://vercel.com/account/tokens 접속
2. "Create" 버튼 클릭
3. Token 이름 입력 (예: "GitHub Actions")
4. "Create Token" 클릭
5. 생성된 토큰 복사 (한 번만 표시됨!)

### 2. Vercel Project 정보 확인
1. Vercel 대시보드에서 프로젝트 생성 후
2. Project Settings 접속
3. General 탭에서:
   - **Project ID** 복사
   - **Team ID** (또는 Org ID) 복사

### 3. GitHub Secrets 추가
1. GitHub 저장소 페이지에서
2. Settings → Secrets and variables → Actions
3. "New repository secret" 클릭
4. 다음 시크릿 추가:

#### VERCEL_TOKEN
- Name: `VERCEL_TOKEN`
- Value: (Vercel에서 생성한 토큰)

#### VERCEL_ORG_ID
- Name: `VERCEL_ORG_ID`
- Value: (Vercel Team/Org ID)

#### VERCEL_PROJECT_ID
- Name: `VERCEL_PROJECT_ID`
- Value: (Vercel Project ID)

## 🚀 자동 배포 활성화
1. 위 시크릿 설정 완료 후
2. main 브랜치에 푸시하면 자동으로 배포 시작
3. Actions 탭에서 배포 진행 상황 확인

## 📋 체크리스트
- [ ] Vercel 토큰 생성
- [ ] Vercel 프로젝트 생성
- [ ] GitHub Secrets 3개 추가
- [ ] GitHub Actions 워크플로우 파일 푸시

---
**완료!** 이제 main 브랜치에 푸시할 때마다 자동으로 Vercel에 배포됩니다! 🎉