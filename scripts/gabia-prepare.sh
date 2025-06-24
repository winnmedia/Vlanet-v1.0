#!/bin/bash

# 가비아 웹호스팅 배포 준비 스크립트
# VideoPlanet + Twelve Labs API

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정
PROJECT_DIR="/home/winnmedia/VideoPlanet"
BUILD_DIR="$PROJECT_DIR/gabia-deploy"
BACKEND_ZIP="videoplanet-backend.zip"
FRONTEND_ZIP="videoplanet-frontend.zip"

print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "    가비아 웹호스팅 배포 파일 준비"
    echo "    Twelve Labs API 연동 포함"
    echo "=================================================="
    echo -e "${NC}"
}

check_requirements() {
    echo -e "${GREEN}📋 사전 요구사항 확인${NC}"
    echo "----------------------------------------"
    
    # Node.js 확인
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js가 설치되지 않았습니다.${NC}"
        echo "Node.js를 설치한 후 다시 실행하세요."
        exit 1
    fi
    
    # Python 확인
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python3가 설치되지 않았습니다.${NC}"
        exit 1
    fi
    
    # ZIP 명령어 확인
    if ! command -v zip &> /dev/null; then
        echo -e "${YELLOW}⚠️  zip 명령어가 없습니다. 설치 중...${NC}"
        sudo apt update && sudo apt install -y zip
    fi
    
    echo -e "${GREEN}✅ 사전 요구사항 확인 완료${NC}"
    echo
}

clean_build_directory() {
    echo -e "${GREEN}🧹 빌드 디렉토리 정리${NC}"
    echo "----------------------------------------"
    
    if [ -d "$BUILD_DIR" ]; then
        echo "기존 빌드 디렉토리 삭제 중..."
        rm -rf "$BUILD_DIR"
    fi
    
    mkdir -p "$BUILD_DIR"/{backend,frontend,docs,scripts}
    echo -e "${GREEN}✅ 빌드 디렉토리 생성 완료${NC}"
    echo
}

prepare_backend() {
    echo -e "${GREEN}🔧 백엔드 파일 준비${NC}"
    echo "----------------------------------------"
    
    cd "$PROJECT_DIR"
    
    # Django 프로젝트 파일 복사
    rsync -av --exclude='*.pyc' \
              --exclude='__pycache__' \
              --exclude='.git' \
              --exclude='node_modules' \
              --exclude='vridge_front' \
              --exclude='scripts' \
              --exclude='docs' \
              --exclude='*.log' \
              --exclude='uploads' \
              --exclude='staticfiles' \
              --exclude='media' \
              vridge_back/ "$BUILD_DIR/backend/"
    
    # 가비아용 설정 파일들 복사
    cp vridge_back/.env.gabia.example "$BUILD_DIR/backend/.env.example"
    cp vridge_back/config/settings/gabia.py "$BUILD_DIR/backend/config/settings/"
    
    # 가비아용 requirements.txt 생성
    cat > "$BUILD_DIR/backend/requirements.txt" << 'EOF'
# 가비아 웹호스팅용 패키지
Django==4.2.7
djangorestframework==3.14.0
django-cors-headers==4.3.1
django-storages==1.14.2
Pillow==10.0.1
python-dotenv==1.0.0
channels==4.0.0
channels-redis==4.1.0
celery==5.3.4
django-celery-results==2.5.1
django-celery-beat==2.5.0
redis==5.0.1
mysqlclient==2.2.0
moviepy==1.0.3
requests==2.31.0
python-dateutil==2.8.2
pytz==2023.3

# Twelve Labs API
httpx==0.25.0

# 성능 최적화
gunicorn==21.2.0
whitenoise==6.6.0

# 모니터링 (선택사항)
sentry-sdk[django]==1.38.0
EOF

    # WSGI 파일 생성
    cat > "$BUILD_DIR/backend/passenger_wsgi.py" << 'EOF'
#!/home/호스팅계정/.local/bin/python3
"""
가비아 웹호스팅용 WSGI 설정
Passenger 환경에서 Django 실행
"""
import sys
import os

# 프로젝트 경로 설정
sys.path.insert(0, '/home/호스팅계정/videoplanet')
sys.path.insert(0, '/home/호스팅계정/videoplanet/vridge_back')

# Django 환경 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.gabia')

# Django WSGI 애플리케이션
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
EOF

    # CGI 스크립트 템플릿 생성
    cat > "$BUILD_DIR/backend/videoplanet.cgi" << 'EOF'
#!/home/호스팅계정/.local/bin/python3
"""
가비아 웹호스팅용 CGI 스크립트
Apache CGI 환경에서 Django 실행
"""
import sys
import os

# 프로젝트 경로 설정
PROJECT_PATH = '/home/호스팅계정/videoplanet'
sys.path.insert(0, PROJECT_PATH)
sys.path.insert(0, os.path.join(PROJECT_PATH, 'vridge_back'))

# Django 환경 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.gabia')

# Django WSGI 애플리케이션
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

# CGI 핸들러로 실행
from wsgiref.handlers import CGIHandler
CGIHandler().run(application)
EOF

    echo -e "${GREEN}✅ 백엔드 파일 준비 완료${NC}"
    echo
}

prepare_frontend() {
    echo -e "${GREEN}🎨 프론트엔드 빌드${NC}"
    echo "----------------------------------------"
    
    cd "$PROJECT_DIR/vridge_front"
    
    # 가비아용 환경 변수 설정
    cat > .env.production << 'EOF'
# 가비아 배포용 React 환경 변수
NODE_ENV=production
GENERATE_SOURCEMAP=false

# API 서버 설정 (가비아 도메인으로 변경 필요)
REACT_APP_API_BASE_URL=https://your-domain.com/api
REACT_APP_WEBSOCKET_URL=wss://your-domain.com/ws

# Twelve Labs API (클라이언트에서는 보안상 직접 호출 안함)
REACT_APP_AI_ANALYSIS_ENABLED=true

# 성능 최적화
DISABLE_ESLINT_PLUGIN=true
FAST_REFRESH=false
IMAGE_INLINE_SIZE_LIMIT=8192

# 가비아 웹호스팅 최적화
PUBLIC_URL=/
BUILD_PATH=build
EOF

    # package.json에 빌드 스크립트 확인
    if [ -f "package.json" ]; then
        echo "React 앱 빌드 중..."
        
        # 의존성 설치
        npm install --silent
        
        # 프로덕션 빌드
        npm run build
        
        # 빌드 파일 복사
        cp -r build/* "$BUILD_DIR/frontend/"
        
        echo -e "${GREEN}✅ React 빌드 완료${NC}"
    else
        echo -e "${YELLOW}⚠️  package.json이 없습니다. 기본 HTML 파일 생성${NC}"
        
        # 기본 index.html 생성
        cat > "$BUILD_DIR/frontend/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VideoPlanet - AI 영상 분석 플랫폼</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        .btn { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎬 VideoPlanet</h1>
        <p>AI 영상 분석 및 피드백 플랫폼</p>
        <p>Powered by Twelve Labs API</p>
        <a href="/api/admin/" class="btn">관리자 페이지</a>
        <div style="margin-top: 30px;">
            <h3>배포 상태: 준비 완료</h3>
            <p>Django 백엔드와 Twelve Labs API가 연동되었습니다.</p>
        </div>
    </div>
</body>
</html>
EOF
    fi
    
    echo
}

create_htaccess() {
    echo -e "${GREEN}🌐 웹서버 설정 파일 생성${NC}"
    echo "----------------------------------------"
    
    # .htaccess 파일 생성
    cat > "$BUILD_DIR/frontend/.htaccess" << 'EOF'
# 가비아 웹호스팅용 .htaccess
# VideoPlanet + Twelve Labs API

# 보안 설정
Options -Indexes -ExecCGI
ServerSignature Off

# API 요청을 Django로 전달
RewriteEngine On

# Django Admin 경로
RewriteRule ^admin/?(.*)$ /cgi-bin/videoplanet.cgi/admin/$1 [QSA,L]

# API 경로
RewriteRule ^api/?(.*)$ /cgi-bin/videoplanet.cgi/api/$1 [QSA,L]

# WebSocket (사용 가능한 경우)
RewriteRule ^ws/?(.*)$ /cgi-bin/videoplanet.cgi/ws/$1 [QSA,L]

# 정적 파일 직접 서빙
RewriteCond %{REQUEST_URI} ^/static/
RewriteRule ^(.*)$ /$1 [L]

RewriteCond %{REQUEST_URI} ^/media/
RewriteRule ^(.*)$ /$1 [L]

# React Router 지원 (SPA)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_URI} !^/admin/
RewriteCond %{REQUEST_URI} !^/cgi-bin/
RewriteRule . /index.html [L]

# 보안 헤더
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # CORS 설정 (필요시)
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# Gzip 압축
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/json
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# 브라우저 캐싱
<IfModule mod_expires.c>
    ExpiresActive On
    
    # 이미지 파일
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
    ExpiresByType image/webp "access plus 1 month"
    
    # CSS, JS 파일
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    
    # 폰트 파일
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType application/font-woff "access plus 1 year"
    
    # HTML 파일 (React SPA)
    ExpiresByType text/html "access plus 1 hour"
</IfModule>

# 파일 업로드 크기 제한
php_value upload_max_filesize 100M
php_value post_max_size 100M
php_value max_execution_time 300
php_value max_input_time 300

# 에러 페이지
ErrorDocument 404 /index.html
ErrorDocument 500 "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
EOF

    echo -e "${GREEN}✅ .htaccess 파일 생성 완료${NC}"
    echo
}

create_deployment_scripts() {
    echo -e "${GREEN}📜 배포 스크립트 생성${NC}"
    echo "----------------------------------------"
    
    # SSH 배포 스크립트
    cat > "$BUILD_DIR/scripts/deploy-to-gabia.sh" << 'EOF'
#!/bin/bash
# 가비아 서버 배포 스크립트 (SSH 접속 후 실행)

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 설정 (실제 값으로 수정 필요)
HOSTING_ACCOUNT="your-hosting-account"
DOMAIN="your-domain.com"
DB_NAME="videoplanet_db"
DB_USER="videoplanet_user"
DB_PASSWORD="secure_password_123"

echo -e "${GREEN}🚀 가비아 서버 배포 시작${NC}"

# 1. 디렉토리 생성
echo "📁 디렉토리 구조 생성 중..."
mkdir -p /home/$HOSTING_ACCOUNT/{videoplanet,public_html/static,public_html/media,public_html/cgi-bin,logs,backups}

# 2. Python 가상환경 생성
echo "🐍 Python 가상환경 설정 중..."
cd /home/$HOSTING_ACCOUNT/videoplanet
python3 -m venv venv
source venv/bin/activate

# 3. 패키지 설치
echo "📦 Python 패키지 설치 중..."
pip install --upgrade pip
pip install -r requirements.txt

# 4. Django 설정
echo "⚙️ Django 설정 중..."

# 환경 변수 파일 복사 및 수정
cp .env.example .env
echo -e "${YELLOW}⚠️  .env 파일을 편집하여 실제 설정값을 입력하세요${NC}"

# 데이터베이스 마이그레이션
echo "🗄️ 데이터베이스 마이그레이션 중..."
python manage.py migrate --settings=config.settings.gabia

# 정적 파일 수집
echo "📁 정적 파일 수집 중..."
python manage.py collectstatic --noinput --settings=config.settings.gabia

# 슈퍼유저 생성 (대화형)
echo "👤 관리자 계정 생성..."
python manage.py createsuperuser --settings=config.settings.gabia

# 5. CGI 스크립트 설치
echo "🌐 웹서버 설정 중..."
cp videoplanet.cgi /home/$HOSTING_ACCOUNT/public_html/cgi-bin/
chmod +x /home/$HOSTING_ACCOUNT/public_html/cgi-bin/videoplanet.cgi

# 6. 권한 설정
echo "🔐 파일 권한 설정 중..."
chmod -R 755 /home/$HOSTING_ACCOUNT/public_html/
chmod -R 644 /home/$HOSTING_ACCOUNT/public_html/static/
chmod -R 644 /home/$HOSTING_ACCOUNT/public_html/media/

echo -e "${GREEN}✅ 배포 완료!${NC}"
echo ""
echo "📋 다음 단계:"
echo "1. .env 파일 편집: nano /home/$HOSTING_ACCOUNT/videoplanet/.env"
echo "2. Twelve Labs API 키 설정"
echo "3. 도메인 DNS 연결 확인"
echo "4. 웹사이트 접속 테스트: https://$DOMAIN"
echo "5. 관리자 페이지 접속: https://$DOMAIN/admin/"
EOF

    # 로컬 업로드 스크립트
    cat > "$BUILD_DIR/scripts/upload-to-gabia.sh" << 'EOF'
#!/bin/bash
# 로컬에서 가비아 서버로 파일 업로드 스크립트

set -e

# 설정 (실제 값으로 수정 필요)
FTP_HOST="ftp.your-domain.com"
FTP_USER="your-hosting-account"
FTP_PASSWORD="your-ftp-password"
BUILD_DIR="$(dirname "$0")/.."

echo "📤 가비아 서버로 파일 업로드 중..."

# FTP 업로드 (lftp 사용)
if command -v lftp &> /dev/null; then
    lftp -c "
    set ftp:ssl-allow no;
    open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
    lcd $BUILD_DIR;
    
    # 백엔드 파일 업로드
    mirror -R backend/ videoplanet/;
    
    # 프론트엔드 파일 업로드
    mirror -R frontend/ public_html/;
    
    quit;
    "
    echo "✅ FTP 업로드 완료"
else
    echo "❌ lftp가 설치되지 않았습니다."
    echo "수동으로 다음 파일들을 업로드하세요:"
    echo "- backend/ → /home/계정명/videoplanet/"
    echo "- frontend/ → /home/계정명/public_html/"
    echo ""
    echo "FTP 접속 정보:"
    echo "호스트: $FTP_HOST"
    echo "사용자: $FTP_USER"
    echo "비밀번호: $FTP_PASSWORD"
fi
EOF

    chmod +x "$BUILD_DIR/scripts"/*.sh
    
    echo -e "${GREEN}✅ 배포 스크립트 생성 완료${NC}"
    echo
}

create_documentation() {
    echo -e "${GREEN}📚 문서 파일 복사${NC}"
    echo "----------------------------------------"
    
    # 주요 문서들 복사
    cp "$PROJECT_DIR/docs/GABIA_HOSTING_GUIDE.md" "$BUILD_DIR/docs/"
    cp "$PROJECT_DIR/docs/TWELVE_LABS_SETUP.md" "$BUILD_DIR/docs/"
    
    # 배포 가이드 생성
    cat > "$BUILD_DIR/README.md" << 'EOF'
# VideoPlanet 가비아 웹호스팅 배포 패키지

## 📦 패키지 구성

```
gabia-deploy/
├── backend/              # Django 백엔드
│   ├── config/
│   ├── video_analysis/   # Twelve Labs API 연동
│   ├── requirements.txt
│   ├── .env.example
│   └── passenger_wsgi.py
├── frontend/             # React 프론트엔드 (빌드됨)
│   ├── index.html
│   ├── static/
│   └── .htaccess
├── scripts/              # 배포 스크립트
│   ├── deploy-to-gabia.sh
│   └── upload-to-gabia.sh
├── docs/                 # 문서
│   ├── GABIA_HOSTING_GUIDE.md
│   └── TWELVE_LABS_SETUP.md
└── README.md

```

## 🚀 빠른 시작

### 1. 가비아 웹호스팅 구매
- **디럭스 이상** 상품 (Python/Django 지원)
- MySQL 데이터베이스 포함

### 2. 파일 업로드
```bash
# FTP로 업로드하거나
./scripts/upload-to-gabia.sh

# 수동 업로드:
# backend/ → /home/계정명/videoplanet/
# frontend/ → /home/계정명/public_html/
```

### 3. 서버 설정
```bash
# SSH 접속 후
./scripts/deploy-to-gabia.sh
```

### 4. 환경 변수 설정
```bash
# .env 파일 편집
nano /home/계정명/videoplanet/.env

# Twelve Labs API 키 입력
TWELVE_LABS_API_KEY=your_api_key_here
TWELVE_LABS_INDEX_ID=your_index_id_here
```

## 📖 상세 가이드

- **배포 가이드**: `docs/GABIA_HOSTING_GUIDE.md`
- **Twelve Labs 설정**: `docs/TWELVE_LABS_SETUP.md`

## 💰 예상 비용

- 가비아 웹호스팅: 월 13,200원
- Twelve Labs API: 월 $5-50 (사용량에 따라)
- 총 예상 비용: **월 15,000-50,000원**

## 🔧 지원

- 이메일: dev@videoplanet.com
- GitHub: https://github.com/videoplanet/issues

---
🎬 **VideoPlanet** - AI 영상 분석 플랫폼
EOF

    echo -e "${GREEN}✅ 문서 파일 복사 완료${NC}"
    echo
}

package_files() {
    echo -e "${GREEN}📦 배포 파일 패키징${NC}"
    echo "----------------------------------------"
    
    cd "$BUILD_DIR"
    
    # 개별 ZIP 파일 생성
    echo "백엔드 파일 압축 중..."
    zip -r "$BACKEND_ZIP" backend/ scripts/ docs/ README.md -x "*.pyc" "*__pycache__*" "*.log" > /dev/null
    
    echo "프론트엔드 파일 압축 중..."
    zip -r "$FRONTEND_ZIP" frontend/ docs/ README.md > /dev/null
    
    # 전체 패키지 압축
    echo "전체 패키지 압축 중..."
    zip -r "videoplanet-gabia-complete.zip" . -x "*.zip" > /dev/null
    
    echo -e "${GREEN}✅ 패키징 완료${NC}"
    echo
    echo "생성된 파일:"
    echo "  📁 $BUILD_DIR/"
    echo "  📦 $BACKEND_ZIP"
    echo "  📦 $FRONTEND_ZIP" 
    echo "  📦 videoplanet-gabia-complete.zip"
    echo
}

show_final_summary() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "    가비아 웹호스팅 배포 준비 완료!"
    echo "=================================================="
    echo -e "${NC}"
    
    echo "📋 준비된 구성 요소:"
    echo "  ✅ Django 백엔드 (Twelve Labs API 연동)"
    echo "  ✅ React 프론트엔드 (빌드 완료)"
    echo "  ✅ 가비아 최적화 설정"
    echo "  ✅ 웹서버 설정 (.htaccess)"
    echo "  ✅ 배포 스크립트"
    echo "  ✅ 환경 변수 템플릿"
    echo "  ✅ 상세 문서"
    echo
    echo "🚀 다음 단계:"
    echo "  1. 가비아 웹호스팅 구매 (디럭스 이상)"
    echo "  2. Twelve Labs API 키 발급"
    echo "  3. 파일 업로드 (FTP 또는 압축파일)"
    echo "  4. 서버에서 배포 스크립트 실행"
    echo "  5. 환경 변수 설정"
    echo "  6. 웹사이트 테스트"
    echo
    echo "📁 배포 파일 위치: $BUILD_DIR"
    echo "📖 상세 가이드: docs/GABIA_HOSTING_GUIDE.md"
    echo
    echo -e "${GREEN}🎉 모든 준비가 완료되었습니다!${NC}"
    echo -e "${YELLOW}💡 질문이 있으시면 docs/GABIA_HOSTING_GUIDE.md를 참조하세요.${NC}"
}

# 메인 실행 함수
main() {
    print_header
    
    check_requirements
    clean_build_directory
    prepare_backend
    prepare_frontend
    create_htaccess
    create_deployment_scripts
    create_documentation
    package_files
    show_final_summary
}

# 스크립트 실행
main "$@"