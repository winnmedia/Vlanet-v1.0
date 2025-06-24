# 가비아 웹호스팅 배포 가이드

## 📋 목차
1. [가비아 호스팅 상품 선택](#가비아-호스팅-상품-선택)
2. [도메인 설정](#도메인-설정)
3. [호스팅 환경 설정](#호스팅-환경-설정)
4. [파일 업로드](#파일-업로드)
5. [데이터베이스 설정](#데이터베이스-설정)
6. [환경 변수 설정](#환경-변수-설정)
7. [Twelve Labs API 연동](#twelve-labs-api-연동)
8. [배포 테스트](#배포-테스트)

## 🏪 가비아 호스팅 상품 선택

### 추천 상품: **웹호스팅 디럭스** 이상

| 구분 | 베이직 | 디럭스 | 프리미엄 |
|------|--------|--------|----------|
| **가격** | 월 6,600원 | **월 13,200원** | 월 26,400원 |
| **디스크** | 10GB | **20GB** | 40GB |
| **트래픽** | 50GB | **100GB** | 200GB |
| **DB** | MySQL 1개 | **MySQL 5개** | MySQL 10개 |
| **Python** | ❌ | **✅ 지원** | ✅ 지원 |
| **Django** | ❌ | **✅ 지원** | ✅ 지원 |

> **💡 중요**: Python/Django 지원을 위해 **디럭스 이상** 필수!

### 구매 링크
1. [가비아 웹호스팅](https://www.gabia.com/service/hosting/webhosting) 접속
2. **디럭스** 상품 선택
3. 결제 및 계정 생성

## 🌐 도메인 설정

### 1. 도메인 구매 (선택사항)
- 가비아에서 도메인 함께 구매 가능
- 기존 도메인 있다면 네임서버 변경

### 2. DNS 설정
```
호스팅 IP: 가비아에서 제공하는 IP 주소
A 레코드: yourdomain.com -> 호스팅 IP
CNAME: www.yourdomain.com -> yourdomain.com
```

## ⚙️ 호스팅 환경 설정

### 1. 가비아 호스팅 관리자 접속
1. [가비아 My가비아](https://my.gabia.com) 로그인
2. **서비스 관리** → **웹호스팅** 클릭
3. **호스팅 관리** 버튼 클릭

### 2. Python/Django 활성화
1. **개발환경 설정** 메뉴
2. **Python 버전 선택**: Python 3.9 이상
3. **Django 프레임워크 활성화**
4. **가상환경 생성** 체크

### 3. SSH 접속 설정
1. **SSH 접속 관리**
2. **SSH 활성화** 체크
3. **접속 정보 확인**
   - 호스트: your-domain.com 또는 IP
   - 포트: 22
   - 사용자: 호스팅 계정명
   - 비밀번호: 호스팅 비밀번호

## 📁 파일 업로드

### 1. FTP로 파일 업로드
```bash
# FTP 접속 정보
호스트: ftp.your-domain.com
사용자: 호스팅계정명
비밀번호: 호스팅비밀번호
포트: 21
```

### 2. 업로드할 파일 준비
```bash
# 로컬에서 배포 파일 생성
cd /home/winnmedia/VideoPlanet
./scripts/gabia-deploy.sh
```

### 3. 업로드 구조
```
/home/호스팅계정/
├── public_html/          # 프론트엔드 파일
│   ├── index.html
│   ├── static/
│   └── media/
├── videoplanet/          # 백엔드 파일
│   ├── vridge_back/
│   ├── requirements.txt
│   └── manage.py
└── logs/                 # 로그 파일
```

## 🗄️ 데이터베이스 설정

### 1. MySQL 데이터베이스 생성
1. **호스팅 관리** → **데이터베이스 관리**
2. **MySQL 생성** 클릭
3. 데이터베이스 정보 입력:
   ```
   DB명: videoplanet_db
   사용자명: videoplanet_user
   비밀번호: secure_password_123
   ```

### 2. 데이터베이스 접속 정보
```python
# Django settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'videoplanet_db',
        'USER': 'videoplanet_user',
        'PASSWORD': 'secure_password_123',
        'HOST': 'localhost',
        'PORT': '3306',
        'OPTIONS': {
            'charset': 'utf8mb4',
        }
    }
}
```

## 🔧 환경 변수 설정

### 1. .env 파일 생성
```bash
# SSH 접속 후
cd /home/호스팅계정/videoplanet
nano .env
```

### 2. 환경 변수 내용
```bash
# Django 기본 설정
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# 데이터베이스
DB_NAME=videoplanet_db
DB_USER=videoplanet_user
DB_PASSWORD=secure_password_123
DB_HOST=localhost
DB_PORT=3306

# Twelve Labs API
TWELVE_LABS_API_KEY=tlk_3VZ3GBY3YH4H3H2408BJG2EEVA7T
TWELVE_LABS_INDEX_ID=your_index_id_here

# 파일 경로
STATIC_ROOT=/home/호스팅계정/public_html/static/
MEDIA_ROOT=/home/호스팅계정/public_html/media/

# 이메일 설정 (선택)
EMAIL_HOST=smtp.gabia.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@your-domain.com
EMAIL_HOST_PASSWORD=your-email-password
```

## 🤖 Twelve Labs API 연동

### 1. Twelve Labs 계정 생성
1. [Twelve Labs](https://www.twelvelabs.io/) 접속
2. 회원가입 및 로그인
3. **API Keys** 섹션에서 키 발급

### 2. 인덱스 생성
```bash
# SSH에서 실행
curl -X POST https://api.twelvelabs.io/v1.2/indexes \
  -H "Content-Type: application/json" \
  -H "x-api-key: tlk_3VZ3GBY3YH4H3H2408BJG2EEVA7T" \
  -d '{
    "index_name": "videoplanet_production",
    "engines": [
      {
        "engine_name": "marengo2.6",
        "engine_options": ["visual", "conversation", "text_in_video"]
      }
    ]
  }'
```

### 3. 환경 변수 업데이트
```bash
# .env 파일에 인덱스 ID 추가
TWELVE_LABS_INDEX_ID=반환된_인덱스_ID
```

## 🚀 Django 배포 설정

### 1. Python 패키지 설치
```bash
# SSH 접속 후
cd /home/호스팅계정/videoplanet
pip install -r requirements.txt
```

### 2. Django 설정
```bash
# 데이터베이스 마이그레이션
python manage.py migrate

# 정적 파일 수집
python manage.py collectstatic --noinput

# 슈퍼유저 생성
python manage.py createsuperuser
```

### 3. WSGI 설정
```python
# /home/호스팅계정/videoplanet/passenger_wsgi.py
import sys
import os

# 프로젝트 경로 추가
sys.path.insert(0, '/home/호스팅계정/videoplanet')
sys.path.insert(0, '/home/호스팅계정/videoplanet/vridge_back')

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

## 🌐 웹서버 설정

### 1. .htaccess 파일 생성
```apache
# /home/호스팅계정/public_html/.htaccess
RewriteEngine On

# API 요청을 Django로 전달
RewriteRule ^api/(.*)$ /cgi-bin/videoplanet.cgi/$1 [QSA,L]
RewriteRule ^admin/(.*)$ /cgi-bin/videoplanet.cgi/admin/$1 [QSA,L]
RewriteRule ^ws/(.*)$ /cgi-bin/videoplanet.cgi/ws/$1 [QSA,L]

# React Router 지원
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# 보안 헤더
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-XSS-Protection "1; mode=block"
Header always set X-Content-Type-Options "nosniff"

# Gzip 압축
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>
```

### 2. CGI 스크립트 생성
```bash
# /home/호스팅계정/public_html/cgi-bin/videoplanet.cgi
#!/home/호스팅계정/.local/bin/python3

import sys
import os

# 프로젝트 경로 설정
sys.path.insert(0, '/home/호스팅계정/videoplanet')
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.production'

# Django WSGI 애플리케이션
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

# CGI 핸들러
from wsgiref.handlers import CGIHandler
CGIHandler().run(application)
```

### 3. 실행 권한 설정
```bash
chmod +x /home/호스팅계정/public_html/cgi-bin/videoplanet.cgi
```

## 🧪 배포 테스트

### 1. 기본 연결 테스트
```bash
# 웹사이트 접속
curl -I https://your-domain.com

# API 테스트
curl https://your-domain.com/api/status/
```

### 2. Django 관리자 접속
```
URL: https://your-domain.com/admin/
계정: 생성한 슈퍼유저 계정
```

### 3. Twelve Labs API 테스트
```bash
# 영상 분석 테스트 (관리자에서)
1. 피드백 업로드
2. AI 분석 실행
3. 결과 확인
```

## 📊 모니터링 및 유지보수

### 1. 로그 확인
```bash
# 에러 로그
tail -f /home/호스팅계정/logs/error.log

# Django 로그
tail -f /home/호스팅계정/logs/django.log
```

### 2. 성능 모니터링
```bash
# 디스크 사용량
df -h

# 데이터베이스 크기
mysql -u root -p -e "SELECT table_schema AS 'Database', 
ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' 
FROM information_schema.tables GROUP BY table_schema;"
```

### 3. 백업 설정
```bash
# 데이터베이스 백업 스크립트
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u videoplanet_user -p videoplanet_db > /home/호스팅계정/backups/db_backup_$DATE.sql

# 크론 설정 (매일 새벽 2시)
0 2 * * * /home/호스팅계정/scripts/backup.sh
```

## 💰 비용 최적화

### 1. 예상 비용
```
가비아 웹호스팅 디럭스: 월 13,200원
도메인 (.com): 연 16,500원
Twelve Labs API: 사용량에 따라 (월 $5-50)

총 예상 비용: 월 15,000-50,000원
```

### 2. 비용 절약 방법
- **트래픽 최적화**: 이미지 압축, CDN 활용
- **DB 최적화**: 인덱스 최적화, 쿼리 개선
- **API 사용량 관리**: 사용자별 제한, 캐싱

## 🚨 문제 해결

### 1. 일반적인 오류

#### Python 모듈 오류
```
Error: No module named 'django'
해결: pip install -r requirements.txt
```

#### 데이터베이스 연결 오류
```
Error: Can't connect to MySQL server
해결: DB 접속 정보 확인, 방화벽 설정
```

#### 정적 파일 404 오류
```
Error: Static files not found
해결: collectstatic 재실행, 경로 확인
```

### 2. 성능 문제
- **느린 로딩**: 정적 파일 압축, CDN 적용
- **DB 성능**: 인덱스 추가, 쿼리 최적화
- **메모리 부족**: 코드 최적화, 캐싱 적용

## 📞 지원 및 문의

### 가비아 고객센터
- **전화**: 1588-7535
- **이메일**: help@gabia.com
- **채팅**: 가비아 홈페이지

### 개발팀 연락처
- **이메일**: dev@videoplanet.com
- **GitHub**: https://github.com/videoplanet/issues

## ✅ 배포 체크리스트

- [ ] 가비아 웹호스팅 구매 (디럭스 이상)
- [ ] 도메인 설정 및 DNS 연결
- [ ] Python/Django 환경 활성화
- [ ] 프로젝트 파일 업로드
- [ ] MySQL 데이터베이스 생성
- [ ] 환경 변수 설정 (.env)
- [ ] Twelve Labs API 키 발급
- [ ] Django 마이그레이션 실행
- [ ] 정적 파일 수집
- [ ] WSGI/CGI 설정
- [ ] .htaccess 설정
- [ ] 웹사이트 접속 테스트
- [ ] API 연동 테스트
- [ ] 관리자 페이지 접속
- [ ] 영상 분석 기능 테스트
- [ ] 백업 설정
- [ ] 모니터링 설정

축하합니다! 🎉 VideoPlanet이 가비아 웹호스팅에서 성공적으로 운영 중입니다!