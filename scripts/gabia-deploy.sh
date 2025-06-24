#!/bin/bash

# 가비아 웹호스팅 + Twelve Labs API용 VideoPlanet 배포 스크립트

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정
PROJECT_DIR="/var/www/vridge"
DOMAIN=""
EMAIL=""
ENVIRONMENT="production"

print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "    가비아 웹호스팅 + Twelve Labs API 배포"
    echo "=================================================="
    echo -e "${NC}"
}

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "이 스크립트는 root 사용자로 실행하지 마세요."
        exit 1
    fi
}

check_system() {
    print_status "시스템 환경 확인 중..."
    
    # Ubuntu 버전 확인
    if ! grep -q "Ubuntu" /etc/os-release; then
        print_error "이 스크립트는 Ubuntu에서만 작동합니다."
        exit 1
    fi
    
    UBUNTU_VERSION=$(lsb_release -rs)
    print_status "Ubuntu $UBUNTU_VERSION 감지됨"
    
    # 메모리 확인
    TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
    if [ $TOTAL_MEM -lt 3000 ]; then
        print_warning "메모리가 ${TOTAL_MEM}MB입니다. 최소 4GB를 권장합니다."
    fi
    
    # 디스크 공간 확인
    AVAILABLE_SPACE=$(df -h / | awk 'NR==2{print $4}' | sed 's/G//')
    if [ "${AVAILABLE_SPACE%.*}" -lt 20 ]; then
        print_warning "디스크 여유 공간이 ${AVAILABLE_SPACE}GB입니다. 최소 20GB를 권장합니다."
    fi
}

install_dependencies() {
    print_status "시스템 패키지 업데이트 중..."
    sudo apt update && sudo apt upgrade -y
    
    print_status "필수 패키지 설치 중..."
    sudo apt install -y \
        curl \
        wget \
        git \
        vim \
        htop \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        ufw \
        fail2ban \
        nginx
}

install_docker() {
    if command -v docker &> /dev/null; then
        print_status "Docker가 이미 설치되어 있습니다."
    else
        print_status "Docker 설치 중..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
    fi
    
    if command -v docker-compose &> /dev/null; then
        print_status "Docker Compose가 이미 설치되어 있습니다."
    else
        print_status "Docker Compose 설치 중..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
}

setup_firewall() {
    print_status "방화벽 설정 중..."
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
    
    print_status "Fail2ban 설정 중..."
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
}

setup_project_directory() {
    print_status "프로젝트 디렉토리 설정 중..."
    sudo mkdir -p $PROJECT_DIR
    sudo chown $USER:$USER $PROJECT_DIR
    
    if [ ! -d "$PROJECT_DIR/.git" ]; then
        print_warning "프로젝트 코드가 없습니다. 수동으로 업로드하거나 git clone을 실행하세요."
        echo "예: git clone https://github.com/your-username/vridge.git $PROJECT_DIR"
        read -p "계속하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

setup_environment() {
    print_status "환경 변수 설정 중..."
    cd $PROJECT_DIR
    
    # 백엔드 환경 변수
    if [ ! -f "vridge_back/.env" ]; then
        if [ -f "vridge_back/.env.example" ]; then
            cp vridge_back/.env.example vridge_back/.env
            print_warning "vridge_back/.env 파일을 확인하고 설정을 완료하세요."
        else
            print_error "vridge_back/.env.example 파일이 없습니다."
            exit 1
        fi
    fi
    
    # 프론트엔드 환경 변수
    if [ ! -f "vridge_front/.env.production" ]; then
        if [ -f "vridge_front/.env.example" ]; then
            cp vridge_front/.env.example vridge_front/.env.production
            print_warning "vridge_front/.env.production 파일을 확인하고 설정을 완료하세요."
        else
            print_error "vridge_front/.env.example 파일이 없습니다."
            exit 1
        fi
    fi
    
    # 도메인 정보 입력
    if [ -z "$DOMAIN" ]; then
        read -p "도메인을 입력하세요 (예: vridge.co.kr): " DOMAIN
        if [ -z "$DOMAIN" ]; then
            print_error "도메인이 입력되지 않았습니다."
            exit 1
        fi
    fi
    
    # 환경 변수 파일 업데이트
    sed -i "s/your-domain.com/$DOMAIN/g" vridge_back/.env
    sed -i "s/your-domain.com/$DOMAIN/g" vridge_front/.env.production
}

setup_ssl() {
    print_status "SSL 인증서 설정 중..."
    
    if [ -z "$EMAIL" ]; then
        read -p "SSL 인증서용 이메일을 입력하세요: " EMAIL
        if [ -z "$EMAIL" ]; then
            print_error "이메일이 입력되지 않았습니다."
            exit 1
        fi
    fi
    
    # Certbot 설치
    sudo apt install -y certbot python3-certbot-nginx
    
    # 기본 Nginx 설정
    sudo tee /etc/nginx/sites-available/default > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    # Nginx 재시작
    sudo nginx -t && sudo systemctl reload nginx
    
    # SSL 인증서 발급
    print_status "SSL 인증서 발급 중... (도메인이 이 서버를 가리키고 있는지 확인하세요)"
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL
    
    # 자동 갱신 설정
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
}

setup_nginx_production() {
    print_status "Nginx 프로덕션 설정 중..."
    
    sudo tee /etc/nginx/sites-available/vridge > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 프론트엔드
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 백엔드 API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 파일 업로드를 위한 설정
        client_max_body_size 500M;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 정적 파일
    location /static/ {
        alias $PROJECT_DIR/vridge_back/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip_static on;
    }

    location /media/ {
        alias $PROJECT_DIR/vridge_back/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/css
        text/javascript
        text/xml
        text/plain
        application/javascript
        application/json
        application/xml
        application/rss+xml
        font/truetype
        font/opentype
        image/svg+xml;
}
EOF

    sudo ln -sf /etc/nginx/sites-available/vridge /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx
}

deploy_application() {
    print_status "애플리케이션 배포 중..."
    cd $PROJECT_DIR
    
    # Docker 그룹에 사용자 추가 확인
    if ! groups $USER | grep -q docker; then
        print_warning "Docker 그룹 권한을 위해 재로그인이 필요합니다."
        print_status "다음 명령어로 배포를 계속하세요:"
        echo "cd $PROJECT_DIR && ./scripts/deploy.sh production"
        exit 0
    fi
    
    # 배포 스크립트 실행
    if [ -f "scripts/deploy.sh" ]; then
        chmod +x scripts/deploy.sh
        ./scripts/deploy.sh production
    else
        print_error "배포 스크립트가 없습니다."
        print_status "수동으로 Docker Compose를 실행하세요:"
        echo "docker-compose --profile production up --build -d"
    fi
}

setup_monitoring() {
    print_status "모니터링 설정 중..."
    
    # 로그 로테이션 설정
    sudo tee /etc/logrotate.d/vridge > /dev/null <<EOF
$PROJECT_DIR/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 $USER $USER
}
EOF

    # 시스템 서비스 상태 확인 스크립트
    sudo tee /usr/local/bin/vridge-health-check > /dev/null <<EOF
#!/bin/bash
cd $PROJECT_DIR
if ! docker-compose ps | grep -q "Up"; then
    echo "Vridge containers are down. Restarting..."
    docker-compose up -d
    systemctl reload nginx
fi
EOF

    sudo chmod +x /usr/local/bin/vridge-health-check
    
    # 크론 작업 추가 (5분마다 헬스체크)
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/vridge-health-check") | crontab -
}

show_final_info() {
    print_header
    print_status "배포가 완료되었습니다!"
    echo
    echo "🌐 웹사이트: https://$DOMAIN"
    echo "🔧 관리자: https://$DOMAIN/admin"
    echo "📁 프로젝트 경로: $PROJECT_DIR"
    echo
    print_status "유용한 명령어:"
    echo "  서비스 상태 확인: cd $PROJECT_DIR && docker-compose ps"
    echo "  로그 확인: cd $PROJECT_DIR && docker-compose logs -f"
    echo "  서비스 재시작: cd $PROJECT_DIR && docker-compose restart"
    echo "  Nginx 재시작: sudo systemctl reload nginx"
    echo
    print_warning "보안을 위해 다음 작업을 완료하세요:"
    echo "  1. vridge_back/.env 파일의 모든 비밀번호와 키 변경"
    echo "  2. vridge_front/.env.production 파일의 API 키 확인"
    echo "  3. AWS 설정 및 소셜 로그인 키 재발급"
    echo "  4. 데이터베이스 백업 설정"
}

# 메인 실행 함수
main() {
    print_header
    
    # 인수 처리
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --email)
                EMAIL="$2"
                shift 2
                ;;
            --help)
                echo "사용법: $0 [--domain example.com] [--email admin@example.com]"
                exit 0
                ;;
            *)
                print_error "알 수 없는 옵션: $1"
                exit 1
                ;;
        esac
    done
    
    check_root
    check_system
    install_dependencies
    install_docker
    setup_firewall
    setup_project_directory
    setup_environment
    setup_ssl
    setup_nginx_production
    deploy_application
    setup_monitoring
    show_final_info
}

# 스크립트 실행
main "$@"