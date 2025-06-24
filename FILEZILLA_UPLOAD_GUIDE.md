# 📁 FileZilla를 통한 가비아 업로드 가이드

## 🔧 FileZilla 설정

### 1. FileZilla 연결 정보
```
프로토콜: FTP
호스트: ftp.your-domain.com (또는 가비아에서 제공한 FTP 주소)
포트: 21
로그온 유형: 일반
사용자: 가비아 호스팅 계정명
비밀번호: 가비아 호스팅 비밀번호
```

### 2. 가비아 FTP 접속 정보 확인 방법
1. [My가비아](https://my.gabia.com) 로그인
2. **서비스 관리** → **웹호스팅** 클릭
3. **호스팅 관리** → **FTP 정보** 확인

## 📦 업로드할 파일들

### 현재 준비된 압축 파일:
- `gabia-backend.tar.gz` (10.4MB) - Django 백엔드
- `gabia-frontend.tar.gz` (21MB) - React 프론트엔드  
- `gabia-scripts.tar.gz` (1.7KB) - 배포 스크립트

## 🚀 업로드 과정

### 1단계: FileZilla로 파일 업로드
```
로컬 경로: /home/winnmedia/VideoPlanet/
업로드 파일:
├── gabia-backend.tar.gz → /tmp/
├── gabia-frontend.tar.gz → /tmp/
└── gabia-scripts.tar.gz → /tmp/
```

### 2단계: SSH로 압축 해제
가비아 호스팅에 SSH 접속 후:
```bash
# 임시 디렉토리로 이동
cd /tmp

# 백엔드 파일 압축 해제
mkdir -p /home/호스팅계정/videoplanet
tar -xzf gabia-backend.tar.gz -C /home/호스팅계정/videoplanet/

# 프론트엔드 파일 압축 해제  
tar -xzf gabia-frontend.tar.gz -C /home/호스팅계정/public_html/

# 스크립트 파일 압축 해제
mkdir -p /home/호스팅계정/scripts
tar -xzf gabia-scripts.tar.gz -C /home/호스팅계정/scripts/

# 실행 권한 부여
chmod +x /home/호스팅계정/scripts/*.sh
```

## 🗂️ 최종 디렉토리 구조

```
/home/호스팅계정/
├── public_html/              # 프론트엔드 (웹 루트)
│   ├── index.html
│   ├── static/
│   │   ├── css/
│   │   ├── js/
│   │   └── media/
│   └── .htaccess
├── videoplanet/              # 백엔드 Django
│   ├── config/
│   ├── video_analysis/
│   ├── manage.py
│   ├── requirements.txt
│   ├── passenger_wsgi.py
│   └── .env
└── scripts/                  # 배포 스크립트
    ├── deploy-to-gabia.sh
    └── upload-to-gabia.sh
```

## ⚙️ 배포 후 설정

### 1. Python 패키지 설치
```bash
cd /home/호스팅계정/videoplanet
pip install -r requirements.txt
```

### 2. 환경 변수 설정
```bash
# .env 파일 편집
nano /home/호스팅계정/videoplanet/.env

# 필수 설정:
SECRET_KEY=your-django-secret-key
TWELVE_LABS_API_KEY=your-api-key
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

### 3. Django 초기 설정
```bash
# 데이터베이스 마이그레이션
python manage.py migrate

# 정적 파일 수집
python manage.py collectstatic --noinput

# 슈퍼유저 생성
python manage.py createsuperuser
```

## 🔍 문제 해결

### FTP 연결 실패
- 호스트 주소 재확인 (ftp.도메인.com 또는 IP)
- 포트 21 대신 22 (SFTP) 시도
- 패시브 모드 활성화

### 업로드 속도 개선
- 압축 파일로 업로드 후 서버에서 압축 해제
- 동시 연결 수 조절
- FTP 대신 SFTP 사용

### 권한 오류
```bash
# 파일 권한 설정
chmod 644 /home/호스팅계정/videoplanet/*.py
chmod 755 /home/호스팅계정/videoplanet/
chmod 644 /home/호스팅계정/public_html/*
```

## 📞 지원
- 가비아 고객센터: 1588-7535
- FTP 설정 문의: help@gabia.com

---
🎬 **다음 단계**: Twelve Labs API 키 설정 및 배포 테스트