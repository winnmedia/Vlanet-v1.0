# 🚨 배포 오류 해결 가이드

## 일반적인 오류와 해결 방법

### 1. ❌ "VERCEL_TOKEN is not set"
**원인**: GitHub Secrets에 Vercel 토큰이 없음

**해결**:
1. https://vercel.com/account/tokens 접속
2. "Create Token" 클릭
3. 토큰 복사
4. GitHub 저장소 → Settings → Secrets → Actions
5. "New repository secret" 클릭
6. Name: `VERCEL_TOKEN`, Value: 복사한 토큰

### 2. ❌ "Project not found"
**원인**: Vercel 프로젝트가 생성되지 않음

**해결 방법 A (웹)**:
1. https://vercel.com/new 접속
2. GitHub 저장소 Import
3. Root Directory: `vridge_front`
4. 프로젝트 생성 후 ID 확인

**해결 방법 B (CLI)**:
```bash
cd vridge_front
npx vercel link
# 프롬프트 따라 진행
cat .vercel/project.json
# orgId와 projectId 확인
```

### 3. ❌ "Build failed"
**원인**: 빌드 오류 또는 환경 변수 누락

**해결**:
1. Vercel 대시보드 → Settings → Environment Variables
2. 추가:
   - `NEXT_PUBLIC_API_URL`: https://videoplanet.up.railway.app
   - `NEXT_PUBLIC_VERSION`: 1.0.0

### 4. ❌ "ENOENT: no such file or directory"
**원인**: 잘못된 경로 설정

**확인사항**:
- Root Directory: `vridge_front` (중복 없이!)
- Working Directory: `./vridge_front`

## 🔧 디버깅 워크플로우

### 1. Debug 워크플로우 실행
```yaml
name: Vercel Debug Deployment
```
- GitHub Actions → "Vercel Debug Deployment"
- "Run workflow" 클릭
- 상세한 환경 정보 확인

### 2. Alternative 워크플로우 실행
```yaml
name: Simple Vercel Deploy (Alternative)
```
- 가장 간단한 배포 방법
- 수동 실행 가능

## 🚀 빠른 해결책

### Option 1: Vercel 웹 대시보드
1. https://vercel.com/new
2. Import: `winnmedia/Vlanet-v1.0`
3. Root Directory: `vridge_front`
4. Deploy

### Option 2: Import URL
[클릭하여 바로 배포](https://vercel.com/new/clone?repository-url=https://github.com/winnmedia/Vlanet-v1.0&root-directory=vridge_front)

## 📋 체크리스트

- [ ] GitHub Secrets 3개 모두 설정
  - [ ] VERCEL_TOKEN
  - [ ] VERCEL_ORG_ID  
  - [ ] VERCEL_PROJECT_ID
- [ ] Vercel 프로젝트 생성됨
- [ ] 환경 변수 설정됨
- [ ] Root Directory: `vridge_front`

---
**도움이 필요하면**: 구체적인 에러 메시지를 공유해주세요!