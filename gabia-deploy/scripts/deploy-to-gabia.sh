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
