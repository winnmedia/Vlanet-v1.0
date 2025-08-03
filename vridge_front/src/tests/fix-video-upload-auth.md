# 비디오 업로드 404 에러 해결 가이드

## 문제 분석
사용자가 "영상 업로드시 404 에러"를 보고했으나, 실제로는 다음과 같은 문제들이 발생하고 있습니다:

1. **401 Unauthorized 에러**: 인증 토큰이 없거나 유효하지 않음
2. API 경로는 올바름: `/api/projects/{project_id}/feedback/upload/`
3. 백엔드 View는 정상적으로 구현되어 있음

## 해결 방법

### 1. 백엔드 서버 실행 확인
```bash
cd /home/winnmedia/VideoPlanet/vridge_back
python3 manage.py runserver
```

### 2. 프론트엔드 서버 실행
```bash
cd /home/winnmedia/VideoPlanet/vridge_front
npm run dev
```

### 3. 로그인 필수
1. http://localhost:3000 접속
2. 로그인 페이지로 이동
3. 테스트 계정으로 로그인:
   - Username: `admin`
   - Password: `admin1234`

### 4. 피드백 페이지에서 파일 업로드
1. 프로젝트 목록에서 프로젝트 선택
2. 피드백 탭 클릭
3. 파일 선택 후 업로드

## 기술적 세부사항

### API 경로 구조
- 프론트엔드: `FeedbackFile()` 함수가 `/api/projects/${projectId}/feedback/upload/` 호출
- 백엔드: `ProjectFeedbackUpload` 클래스가 해당 경로 처리

### 인증 요구사항
- JWT 토큰이 Authorization 헤더에 포함되어야 함
- 토큰은 로그인 시 localStorage의 `VGID` 키에 저장됨
- axios 인터셉터가 자동으로 토큰을 헤더에 추가함

### 파일 크기 제한
- 최대 600MB까지 업로드 가능
- 프론트엔드에서 사전 검증 실시

## 디버깅 팁

### 1. 브라우저 개발자 도구에서 확인
- Network 탭에서 upload 요청 확인
- Request Headers에 Authorization 토큰이 있는지 확인
- Response 탭에서 정확한 오류 메시지 확인

### 2. 토큰 확인
```javascript
// 브라우저 콘솔에서 실행
localStorage.getItem('VGID')
```

### 3. API 직접 테스트
```bash
# 토큰을 얻은 후 실행
curl -X POST http://localhost:8000/api/projects/1/feedback/upload/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@test.mp4"
```

## 결론
404 에러가 아닌 401 인증 에러이므로, 로그인 후 다시 시도하면 정상 작동할 것입니다.