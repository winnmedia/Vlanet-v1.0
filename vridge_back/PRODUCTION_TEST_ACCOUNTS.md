# VideoPlanet 프로덕션 테스트 계정 가이드

## 테스트 계정 생성 방법

### Railway Console에서 실행

1. Railway 대시보드에 로그인
2. `vridge-back` 서비스 선택
3. 상단 메뉴에서 `Console` 탭 클릭
4. 다음 명령어 실행:

```bash
python manage.py create_production_demo_accounts
```

### 생성되는 테스트 계정

| 이메일 | 비밀번호 | 설명 |
|--------|----------|------|
| test1@videoplanet.com | Test1234!@#$ | 비디오 편집 테스트 계정 |
| test2@videoplanet.com | Test1234!@#$ | 프로젝트 관리 테스트 계정 |
| test3@videoplanet.com | Test1234!@#$ | 콘텐츠 제작 테스트 계정 |

### 생성되는 테스트 데이터

- **테스트 프로젝트 1**: test1@videoplanet.com 계정에 연결
- **테스트 프로젝트 2**: test2@videoplanet.com 계정에 연결
- 각 프로젝트에는 테스트 피드백이 포함됨

## 로그인 방법

1. https://vridge-front-production.up.railway.app 접속
2. 로그인 페이지에서 **이메일** 필드에 위 계정 정보 입력
3. 비밀번호 입력 후 로그인

## 주의사항

- 이 계정들은 테스트 목적으로만 사용하세요
- 프로덕션 환경에서는 정기적으로 비밀번호를 변경하세요
- 실제 사용자 데이터와 혼동되지 않도록 주의하세요

## 문제 해결

### 계정이 이미 존재하는 경우
- 명령어 실행 시 "이미 존재함" 메시지가 표시됩니다
- 기존 계정을 그대로 사용하거나 Django Admin에서 삭제 후 재생성

### 로그인이 안 되는 경우
1. 이메일 필드에 정확한 이메일 주소 입력 확인
2. 비밀번호 대소문자 구분 확인
3. 프론트엔드가 올바른 백엔드 URL을 가리키는지 확인

### 프로젝트가 보이지 않는 경우
1. 올바른 계정으로 로그인했는지 확인
2. 프로젝트 생성이 성공했는지 콘솔 로그 확인