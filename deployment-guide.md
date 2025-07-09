# VideoPlanet 배포 가이드

## 현재 문제
vlanet.net이 React 앱 대신 백엔드 API 응답을 보여주고 있습니다.

## 올바른 아키텍처

### 1. 백엔드 (Railway)
- URL: https://videoplanet.up.railway.app
- 역할: Django REST API 서버
- 기능: API 엔드포인트 제공

### 2. 프론트엔드 (Vercel)
- URL: https://vlanet.net
- 역할: React SPA
- 기능: 사용자 인터페이스

## 배포 단계

### 1단계: Railway 백엔드 수정
```bash
git add -A
git commit -m "Django API 서버로 복원"
git push
```

### 2단계: Vercel에 프론트엔드 배포
1. [Vercel](https://vercel.com) 접속
2. "Import Project" 클릭
3. GitHub 저장소 선택
4. 설정:
   - Framework Preset: Create React App
   - Root Directory: vridge_front
   - Build Command: npm run build
   - Output Directory: build
5. 환경변수 추가:
   - REACT_APP_API_URL=https://videoplanet.up.railway.app

### 3단계: 도메인 연결
1. Vercel 프로젝트 설정에서 "Domains" 탭
2. vlanet.net 추가
3. DNS 설정:
   - Type: A
   - Name: @
   - Value: 76.76.21.21 (Vercel IP)
   - Type: CNAME
   - Name: www
   - Value: cname.vercel-dns.com

## 확인사항
- Railway: API 응답 확인 (https://videoplanet.up.railway.app/api/health)
- Vercel: React 앱 확인 (https://vlanet.net)

## 주의사항
- Railway는 백엔드 API만 담당
- Vercel은 프론트엔드만 담당
- 두 서비스는 독립적으로 배포됨