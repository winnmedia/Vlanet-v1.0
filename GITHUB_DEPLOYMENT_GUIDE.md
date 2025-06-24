# 🚀 GitHub Actions를 통한 가비아 자동 배포 가이드

## 🎯 개요
FileZilla 대신 GitHub Actions를 사용하여 **한 번의 push로 자동 배포**하는 방법입니다.

## ✅ 장점
- 🚀 **완전 자동화**: 코드 푸시만 하면 자동 배포
- 🔒 **안전함**: 서버 정보가 GitHub Secrets에 암호화 저장
- 📊 **투명성**: 배포 과정과 결과를 실시간으로 확인
- 🔄 **롤백 지원**: 문제 시 이전 버전으로 쉽게 되돌리기
- 🧪 **테스트 포함**: 배포 후 자동으로 동작 확인

## 📋 설정 단계

### 1단계: GitHub Repository 생성
```bash
# 현재 프로젝트를 GitHub에 업로드
git init
git add .
git commit -m "Initial commit: VideoPlanet with Twelve Labs integration"
git branch -M main
git remote add origin https://github.com/your-username/videoplanet.git
git push -u origin main
```

### 2단계: GitHub Secrets 설정
GitHub Repository → Settings → Secrets and variables → Actions에서 다음 secrets 추가:

#### 🔐 필수 Secrets
```
GABIA_HOST=your-domain.com (또는 가비아 서버 IP)
GABIA_USERNAME=가비아_호스팅_계정명
GABIA_PASSWORD=가비아_호스팅_비밀번호
GABIA_DOMAIN=your-domain.com

# Django 설정
DJANGO_SECRET_KEY=your-django-secret-key

# 데이터베이스 정보
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

# Twelve Labs API
TWELVE_LABS_API_KEY=tlk_your_api_key
TWELVE_LABS_INDEX_ID=your_index_id
```

### 3단계: 가비아 SSH 활성화
1. **My가비아** 로그인 → **서비스관리** → **웹호스팅**
2. **호스팅관리** → **SSH 접속관리**
3. **SSH 활성화** 체크
4. 접속 정보 확인 (포트는 보통 22)

## 🚀 배포 방법

### 자동 배포 (권장)
```bash
# 코드 수정 후 푸시하면 자동 배포
git add .
git commit -m "Update: 새로운 기능 추가"
git push origin main
```

### 수동 배포
1. GitHub Repository → **Actions** 탭
2. **Deploy to Gabia Hosting** 워크플로우 선택
3. **Run workflow** 버튼 클릭

## 📊 배포 과정 모니터링

### GitHub Actions에서 실시간 확인:
1. **🚀 Checkout Repository** - 코드 다운로드
2. **🔧 Setup Node.js** - Node.js 환경 구성
3. **🐍 Setup Python** - Python 환경 구성
4. **🏗️ Build React Frontend** - React 앱 빌드
5. **📦 Prepare Django Backend** - Django 준비
6. **🚀 Deploy to Gabia via SSH** - 서버 준비
7. **📤 Upload Backend Files** - 백엔드 파일 업로드
8. **🌐 Upload Frontend Files** - 프론트엔드 파일 업로드
9. **⚙️ Configure Gabia Server** - Django 설정
10. **🌐 Setup Web Server Configuration** - 웹서버 설정
11. **🧪 Test Deployment** - 배포 테스트
12. **📊 Deployment Summary** - 결과 요약

## 🗂️ 자동 생성되는 파일 구조

```
가비아 서버:
/home/호스팅계정/
├── htdocs/                   # 웹 루트 (프론트엔드)
│   ├── index.html
│   ├── static/
│   ├── .htaccess
│   └── cgi-bin/
│       └── videoplanet.cgi   # Django CGI 스크립트
├── videoplanet/              # 백엔드
│   ├── config/
│   ├── video_analysis/
│   ├── manage.py
│   ├── requirements.txt
│   └── .env                  # 자동 생성된 환경 변수
└── videoplanet_backup_*/     # 자동 백업
```

## 🔧 문제 해결

### 배포 실패 시
1. **Actions 탭에서 오류 로그 확인**
2. **Secrets 설정 재확인**
3. **가비아 SSH 접속 상태 확인**

### 일반적인 오류

#### SSH 연결 실패
```
Error: ssh: connect to host example.com port 22: Connection refused
해결: 가비아 호스팅 관리에서 SSH 활성화 확인
```

#### 권한 오류
```
Error: Permission denied
해결: GABIA_USERNAME과 GABIA_PASSWORD 재확인
```

#### 빌드 실패
```
Error: npm ci failed
해결: package-lock.json 파일 확인 또는 node_modules 삭제 후 재시도
```

## 💡 고급 기능

### 브랜치별 배포 환경
```yaml
# develop 브랜치 → 테스트 서버
# main 브랜치 → 프로덕션 서버
```

### 슬랙 알림 연동
```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 데이터베이스 백업
```yaml
- name: Backup Database
  run: |
    mysqldump -u ${{ secrets.DB_USER }} -p${{ secrets.DB_PASSWORD }} ${{ secrets.DB_NAME }} > backup.sql
```

## 🎉 완료 후 확인사항

### 1. 웹사이트 접속
- `https://your-domain.com` 
- React 앱이 정상 로드되는지 확인

### 2. Django 관리자 접속
- `https://your-domain.com/admin/`
- 슈퍼유저 생성 필요

### 3. API 동작 확인
- `https://your-domain.com/api/status/`
- Twelve Labs API 연동 테스트

## 📞 지원

### GitHub Actions 관련
- [GitHub Actions 문서](https://docs.github.com/actions)
- [appleboy/ssh-action](https://github.com/appleboy/ssh-action)

### 가비아 관련
- 고객센터: 1588-7535
- 이메일: help@gabia.com

---

## 🚀 다음 단계

1. **GitHub Repository 생성 및 코드 업로드**
2. **GitHub Secrets 설정**
3. **가비아 SSH 활성화**
4. **코드 푸시로 자동 배포 실행**

이제 복잡한 FileZilla 설정 없이 **git push 한 번으로 전체 배포**가 완료됩니다! 🎉