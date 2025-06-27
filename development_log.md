# VideoPlanet 개발 로그

## 2025-06-27 영상 피드백 기능 디버깅

### 문제 상황
- 영상 피드백 기능에서 영상이 재생되지 않는 문제 발생

### 분석 내용
1. **관련 컴포넌트 확인**
   - `/vridge_front/src/components/FeedbackPlayer.jsx` - 커스텀 비디오 플레이어
   - `/vridge_front/src/page/Cms/Feedback.jsx` - 피드백 메인 페이지
   - `/vridge_front/src/api/feedback.js` - API 함수들

2. **문제 원인**
   - `.env` 파일이 없어서 `REACT_APP_BACKEND_URI` 환경 변수가 undefined
   - 비디오 URL 생성 시 백엔드 URI가 없으면 잘못된 URL이 생성됨

3. **서버 구성 확인**
   - **백엔드**: Railway (https://videoplanet.up.railway.app)
   - **프론트엔드**: Vercel (https://vlanet.net)
   - **파일 저장**: 
     - 개발: 로컬 파일시스템
     - 프로덕션: AWS S3

### 해결 방법
1. `.env` 파일 생성 (완료)
   ```
   REACT_APP_BACKEND_URI=https://videoplanet.up.railway.app
   REACT_APP_SOCKET_URI=wss://videoplanet.up.railway.app
   ```

2. `Feedback.jsx` 수정 (완료)
   - 환경 변수가 없을 경우 기본값 사용하도록 수정
   - 387번 줄: `${process.env.REACT_APP_BACKEND_URI || 'https://videoplanet.up.railway.app'}`

### 파일 저장 방식 분석
Railway 배포 설정 (`railway.py`) 확인 결과:
- **MEDIA_ROOT**: `RAILWAY_VOLUME_MOUNT_PATH` 환경변수 또는 로컬 `media/` 디렉토리
- **MEDIA_URL**: `/media/`
- **AWS S3 설정**: 
  - `AWS_STORAGE_BUCKET_NAME`: 'vridge-front'
  - `AWS_S3_REGION_NAME`: 'ap-northeast-2'
  - AWS 자격증명은 환경변수로 관리

### 문제점
1. Railway 서버가 로컬 파일시스템을 사용하고 있음 (S3가 아님)
2. 파일이 서버 재시작 시 사라질 수 있음 (Railway 볼륨이 없으면)
3. 업로드된 파일 URL이 `/media/` 경로로 반환되지만, 실제 서빙이 안 될 수 있음

### 다음 확인 사항
- Django 설정에서 S3 스토리지 백엔드가 활성화되어 있는지 확인 필요
- Railway 볼륨이 제대로 마운트되어 있는지 확인 필요

### 추가 해결 방법 (2025-06-27 추가)
Railway 설정에 S3 스토리지 활성화 코드 추가:
```python
# S3 사용 여부 결정
USE_S3 = AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

if USE_S3:
    # S3 스토리지 설정
    DEFAULT_FILE_STORAGE = 'config.storages.UploadStorage'
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = 'public-read'
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/uploads/'
```

이제 AWS 자격 증명이 환경변수로 설정되어 있으면 자동으로 S3를 사용하고, 없으면 로컬 스토리지를 사용합니다.

### 최종 확인 필요사항
1. Railway 환경변수에 AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY가 설정되어 있는지 확인
2. S3 버킷 권한이 올바르게 설정되어 있는지 확인
3. 프론트엔드에서 영상 URL이 S3 경로로 반환되는지 확인

## 2025-06-27 AWS 제거 및 Railway 볼륨 전환

### 작업 내용
1. **AWS S3 관련 코드 모두 제거**
   - pyproject.toml에서 boto3, django-storages 패키지 제거
   - config/storages.py 파일 삭제
   - settings 파일들에서 S3 스토리지 설정을 로컬 파일 스토리지로 변경
   - .env.example에서 AWS 설정 제거

2. **Railway 볼륨 사용 설정**
   - MEDIA_ROOT: Railway 볼륨 마운트 경로 사용 (`RAILWAY_VOLUME_MOUNT_PATH`)
   - 파일 스토리지: Django 기본 FileSystemStorage
   - 정적 파일: WhiteNoise 사용

3. **변경된 파일들**
   - `/vridge_back/pyproject.toml`
   - `/vridge_back/config/settings/railway.py`
   - `/vridge_back/config/settings_dev.py`
   - `/vridge_back/config/settings_prod.py`
   - `/vridge_back/config/settings_base.py`
   - `/vridge_back/.env.example`
   - `/vridge_front/.env` (생성)
   - `/vridge_front/src/page/Cms/Feedback.jsx` (환경변수 기본값 추가)

### 현재 상태
- 백엔드: Railway 볼륨을 사용한 로컬 파일 스토리지
- 프론트엔드: Vercel 배포
- 파일 업로드: Railway 서버의 영구 볼륨에 저장
- 파일 서빙: Django가 직접 미디어 파일 서빙