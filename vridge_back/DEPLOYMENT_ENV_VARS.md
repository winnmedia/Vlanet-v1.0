# Railway 배포 환경변수 설정 가이드

## 필수 환경변수 체크리스트

### 1. 기존 환경변수 (이미 설정되어 있어야 함)
- [ ] `SECRET_KEY`
- [ ] `DATABASE_URL`
- [ ] `REDIS_URL`
- [ ] `JWT_SECRET_KEY`
- [ ] `ALLOWED_HOSTS`
- [ ] `CORS_ALLOWED_ORIGINS`

### 2. AI 기능을 위한 새로운 환경변수

#### Twelve Labs API (필수)
```
TWELVE_LABS_API_KEY=your_twelve_labs_api_key_here
```
- [Twelve Labs](https://twelvelabs.io/) 에서 API 키 발급
- 무료 플랜도 제공하므로 테스트 가능

#### Google Gemini API (필수)
```
GOOGLE_API_KEY=your_google_api_key_here
```
- [Google AI Studio](https://makersuite.google.com/app/apikey) 에서 API 키 발급
- Gemini 1.5 Flash 모델 사용

## Railway에서 환경변수 설정하기

1. Railway 대시보드에서 프로젝트 선택
2. Settings → Variables 탭으로 이동
3. "New Variable" 클릭
4. 아래 환경변수들을 추가:

```bash
# AI 기능 환경변수
TWELVE_LABS_API_KEY=tl_xxxxxxxxxxxx
GOOGLE_API_KEY=AIzaxxxxxxxxxx
```

## 환경변수 없이 배포할 경우

API 키가 없어도 기본적인 기능은 작동하지만, AI 분석 기능은 다음과 같이 동작합니다:

1. **Twelve Labs API 키 없을 때**: 
   - 비디오 분석 시작 시 "API 키가 설정되지 않았습니다" 오류
   - 기존 피드백 기능은 정상 작동

2. **Google API 키 없을 때**:
   - AI 선생님 피드백이 기본 템플릿으로 제공됨
   - 개인화된 피드백 대신 미리 정의된 메시지 표시

## 확인 사항

- 환경변수는 Railway에서 자동으로 Django 설정에 주입됩니다
- 배포 후 약 5-10분 정도 소요될 수 있습니다
- 환경변수 변경 시 Railway가 자동으로 재배포합니다

## 문제 해결

환경변수 관련 문제 발생 시:
1. Railway 로그에서 오류 메시지 확인
2. Django Admin에서 `/api/video-analysis/teachers/` 엔드포인트 테스트
3. 브라우저 개발자 도구에서 네트워크 오류 확인