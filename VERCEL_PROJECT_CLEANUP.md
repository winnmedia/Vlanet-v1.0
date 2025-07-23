# 🧹 Vercel 프로젝트 정리 가이드

## 🚨 현재 상황
Vercel에 동일한 프로젝트가 2개 배포됨:
1. **videoplanetready** (기존)
2. 다른 프로젝트 (중복)

## ✅ 해결 방법

### Option 1: Vercel 대시보드에서 직접 정리 (권장)

1. **[Vercel Dashboard](https://vercel.com/dashboard)** 접속
2. 프로젝트 목록 확인
3. 중복된 프로젝트 찾기:
   - 같은 GitHub 저장소 연결
   - 비슷한 이름
   - 동일한 도메인

4. **삭제할 프로젝트 선택**:
   - 최신 배포가 없는 것
   - 커스텀 도메인이 연결되지 않은 것
   - 테스트용으로 만든 것

5. **프로젝트 삭제**:
   - 프로젝트 클릭
   - Settings → General
   - 맨 아래 "Delete Project"
   - 프로젝트 이름 입력 후 확인

### Option 2: 메인 프로젝트 통합

1. **메인 프로젝트 결정**:
   - `videoplanetready` 유지 (이미 설정됨)

2. **도메인 이전** (필요시):
   - 삭제할 프로젝트의 Settings → Domains
   - 도메인 제거
   - 메인 프로젝트에 추가

3. **환경 변수 확인**:
   - 삭제 전 환경 변수 백업
   - 메인 프로젝트에 누락된 것 추가

### Option 3: 새로 시작 (깔끔한 방법)

1. **모든 프로젝트 삭제**
2. **새로 Import**:
   ```
   https://vercel.com/new/clone?repository-url=https://github.com/winnmedia/Vlanet-v1.0&root-directory=vridge_front
   ```
3. **하나의 프로젝트만 생성**

## 📋 삭제 전 체크리스트

- [ ] 커스텀 도메인 확인
- [ ] 환경 변수 백업
- [ ] 배포 히스토리 필요 여부
- [ ] Analytics 데이터 필요 여부

## 🎯 권장 설정 (하나로 통합 후)

### 프로젝트 이름
- `videoplanet` 또는 `vlanet`

### Root Directory
- `vridge_front`

### 환경 변수
```
NEXT_PUBLIC_API_URL=https://videoplanet.up.railway.app
NEXT_PUBLIC_VERSION=1.0.0
```

### 도메인
- Production: `vlanet.net`
- Preview: `*.vercel.app`

## 🚀 정리 후 장점
- 배포 관리 단순화
- 비용 절감 (무료 플랜 제한)
- 도메인 관리 용이
- Analytics 통합

---
**중요**: 삭제 전 반드시 환경 변수와 도메인 설정을 백업하세요!