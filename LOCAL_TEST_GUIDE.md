# VideoPlanet 로컬 테스트 가이드

## 🚀 서버 상태
✅ **백엔드 서버**: 실행 중 (포트 8000)
✅ **프론트엔드 서버**: 실행 중 (포트 3000)

## 📍 접속 URL
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8000/api/

## 👤 테스트 계정 정보

### 기존 테스트 계정
```
이메일: test@test.com
비밀번호: test123
```

### 관리자 계정 (있는 경우)
```
이메일: admin@test.com
비밀번호: (비밀번호 재설정 필요)
```

## 🧪 주요 테스트 시나리오

### 1. 회원가입 테스트
1. http://localhost:3000/signup 접속
2. 필수 정보 입력:
   - 이메일: 유효한 이메일 형식
   - 닉네임: 2자 이상
   - 비밀번호: 8자 이상, 대소문자+숫자+특수문자 포함
3. 회원가입 완료 후 이메일 인증 메일 발송 확인

### 2. 로그인 테스트
1. http://localhost:3000/login 접속
2. 테스트 계정으로 로그인:
   - 이메일: test@test.com
   - 비밀번호: test123

### 3. 프로젝트 관리
1. 로그인 후 CMS 대시보드 접속: http://localhost:3000/cms
2. 프로젝트 생성: http://localhost:3000/cms/project-create
   - 프로젝트명, 매니저, 고객사, 설명 입력
   - 프로세스에 최소 1개 단계 추가 필요
3. 프로젝트 목록에서 생성된 프로젝트 확인

### 4. 피드백 시스템
1. 프로젝트 상세 페이지에서 피드백 섹션 확인
2. 피드백 코멘트 작성:
   - 텍스트 입력
   - 타임스탬프(선택사항): 00:10 형식
3. 파일 업로드 기능 테스트

### 5. 마이페이지
1. http://localhost:3000/mypage 접속
2. 프로필 정보 확인 및 수정

## ⚠️ 주의사항
1. **Rate Limiting**: 로그인을 너무 많이 시도하면 5분간 차단됩니다
2. **프로젝트 생성**: process 필드가 필수입니다 (최소 1개 단계)
3. **파일 업로드**: 피드백이 먼저 생성되어 있어야 파일 업로드 가능

## 🛠️ 문제 해결

### 서버가 중단된 경우
```bash
# 백엔드 재시작
cd /home/winnmedia/VideoPlanet/vridge_back
python3 manage.py runserver 8000

# 프론트엔드 재시작 (새 터미널에서)
cd /home/winnmedia/VideoPlanet/vridge_front
npx serve -s build -l 3000
```

### 로그인이 안 되는 경우
1. Rate limit 확인 (429 에러)
2. 5분 대기 후 재시도
3. 또는 새 계정으로 회원가입

### 데이터베이스 초기화가 필요한 경우
```bash
cd /home/winnmedia/VideoPlanet/vridge_back
python3 manage.py migrate
python3 manage.py createcachetable
```

## 📝 테스트 완료 후
- 발견한 문제나 개선사항을 기록해주세요
- 특정 기능에 대한 추가 테스트가 필요하면 알려주세요