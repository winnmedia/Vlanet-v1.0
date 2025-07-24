# 🚀 Vercel 중복 배포 해결 방법

## 문제 상황
- GitHub에서 코드 푸시 시 Vercel에 여러 프로젝트가 동시에 배포됨
- videoplanetready와 videoplanet이 각각 배포됨

## 해결 방법

### 1. Vercel 대시보드에서 하나만 남기기
1. **[Vercel Dashboard](https://vercel.com/dashboard)** 접속
2. 프로젝트 목록 확인
3. **유지할 프로젝트 결정** (예: videoplanetready)
4. **나머지 프로젝트 삭제**:
   - 프로젝트 → Settings → General
   - Delete Project

### 2. GitHub 연동 확인
유지한 프로젝트에서:
1. Settings → Git
2. GitHub Repository 연결 확인
3. **Production Branch**: `main`
4. **Ignored Build Step**: 필요시 설정

### 3. 자동 배포 제어
특정 프로젝트만 자동 배포하려면:

#### vercel.json에 추가:
```json
{
  "github": {
    "enabled": true,
    "autoAlias": ["videoplanetready.vercel.app"]
  }
}
```

#### 또는 Vercel 대시보드에서:
1. Settings → Git
2. **Ignored Build Step** 커스텀 명령어:
```bash
if [ "$VERCEL_GIT_COMMIT_REF" == "main" ]; then exit 1; else exit 0; fi
```

### 4. 배포 전 확인 사항
- 프로젝트 이름 확인
- Root Directory: `vridge_front`
- 환경 변수 설정 완료

## 권장 설정
1. **하나의 프로젝트만 유지**
2. **명확한 프로젝트 이름** (예: videoplanet-production)
3. **자동 배포는 main 브랜치만**

---
**중요**: 삭제 전 환경 변수와 도메인 설정을 백업하세요!