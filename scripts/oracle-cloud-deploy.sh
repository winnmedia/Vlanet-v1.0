2#!/bin/bash

# Oracle Cloud Free Tier 전용 vridge 배포 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정
PROJECT_DIR="/home/ubuntu/vridge"
DOMAIN=""
EMAIL=""

print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "    Oracle Cloud Free Tier vridge 배포"
    echo "=================================================="
    echo -e "${NC}"
}

check_oracle_cloud() {
    echo -e "${GREEN}☁️  Oracle Cloud 환경 확인${NC}"
    echo "----------------------------------------"
    
    # ARM 프로세서 확인
    ARCH=$(uname -m)
    if [[ "$ARCH" == "aarch64" ]]; then
        echo -e "${GREEN}✅ ARM64 프로세서 감지됨${NC}"
        ARM_DETECTED=true
    else
        echo -e "${YELLOW}⚠️  x86_64 프로세서 감지됨${NC}"
        ARM_DETECTED=false
    fi
    
    # 메모리 확인
    TOTAL_MEM=$(free -h | awk '/^Mem:/{print $2}')
    echo "사용 가능한 메모리: $TOTAL_MEM"
    
    # 디스크 공간 확인
    DISK_SPACE=$(df -h / | awk 'NR==2{print $4}')
    echo "사용 가능한 디스크: $DISK_SPACE"
    
    # Oracle Cloud 특정 설정 확인
    if [ -f "/etc/oci-hostname.conf" ]; then
        echo -e "${GREEN}✅ Oracle Cloud 인스턴스 확인됨${NC}"
    else
        echo -e "${YELLOW}⚠️  Oracle Cloud가 아닐 수 있습니다${NC}"
    fi
    
    echo
}

setup_oracle_firewall() {
    echo -e "${GREEN}🔥 Oracle Cloud 방화벽 설정${NC}"
    echo "----------------------------------------"
    
    # iptables 규칙 추가
    echo "방화벽 규칙 추가 중..."
    
    # HTTP/HTTPS
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
    
    # 개발용 포트
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8000 -j ACCEPT
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
    
    # 규칙 저장
    if command -v netfilter-persistent &> /dev/null; then
        sudo netfilter-persistent save
    else
        # Ubuntu 22.04용 대안
        sudo apt update
        sudo apt install -y iptables-persistent
        sudo iptables-save | sudo tee /etc/iptables/rules.v4
    fi
    
    echo -e "${GREEN}✅ 방화벽 설정 완료${NC}"
    echo -e "${YELLOW}⚠️  Oracle Cloud 콘솔에서도 Security List 설정이 필요합니다${NC}"
    echo
}

install_dependencies() {
    echo -e "${GREEN}📦 시스템 패키지 설치${NC}"
    echo "----------------------------------------"
    
    # 패키지 업데이트
    sudo apt update && sudo apt upgrade -y
    
    # 기본 패키지 설치
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
        build-essential
    
    echo -e "${GREEN}✅ 기본 패키지 설치 완료${NC}"
    echo
}

install_docker() {
    echo -e "${GREEN}🐳 Docker 설치${NC}"
    echo "----------------------------------------"
    
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}✅ Docker가 이미 설치되어 있습니다${NC}"
    else
        # Docker 설치
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker ubuntu
        rm get-docker.sh
        echo -e "${GREEN}✅ Docker 설치 완료${NC}"
    fi
    
    # Docker Compose 설치
    if command -v docker-compose &> /dev/null; then
        echo -e "${GREEN}✅ Docker Compose가 이미 설치되어 있습니다${NC}"
    else
        # ARM/x86에 따른 적절한 버전 설치
        if [[ "$ARM_DETECTED" == true ]]; then
            DOCKER_COMPOSE_ARCH="aarch64"
        else
            DOCKER_COMPOSE_ARCH="x86_64"
        fi
        
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$DOCKER_COMPOSE_ARCH" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        echo -e "${GREEN}✅ Docker Compose 설치 완료${NC}"
    fi
    
    # Docker 서비스 시작
    sudo systemctl enable docker
    sudo systemctl start docker
    
    echo
}

optimize_for_oracle() {
    echo -e "${GREEN}⚡ Oracle Cloud 최적화 설정${NC}"
    echo "----------------------------------------"
    
    # 스왑 파일 생성 (ARM 인스턴스는 충분한 메모리가 있어도 안전장치)
    if [ ! -f /swapfile ]; then
        echo "스왑 파일 생성 중 (2GB)..."
        sudo fallocate -l 2G /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
        echo -e "${GREEN}✅ 스왑 파일 생성 완료${NC}"
    fi
    
    # 시스템 최적화 설정
    echo "시스템 매개변수 최적화..."
    
    # 파일 핸들 제한 증가
    echo 'ubuntu soft nofile 65536' | sudo tee -a /etc/security/limits.conf
    echo 'ubuntu hard nofile 65536' | sudo tee -a /etc/security/limits.conf
    
    # 커널 매개변수 최적화
    sudo tee -a /etc/sysctl.conf << EOF
# Oracle Cloud 최적화
vm.swappiness=10
vm.dirty_ratio=60
vm.dirty_background_ratio=2
net.core.rmem_max=268435456
net.core.wmem_max=268435456
net.ipv4.tcp_rmem=4096 87380 268435456
net.ipv4.tcp_wmem=4096 65536 268435456
EOF
    
    sudo sysctl -p
    
    echo -e "${GREEN}✅ 시스템 최적화 완료${NC}"
    echo
}

setup_project() {
    echo -e "${GREEN}📁 프로젝트 설정${NC}"
    echo "----------------------------------------"
    
    # 프로젝트 디렉토리 생성
    mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR
    
    # Git 프로젝트 클론 (실제 저장소로 변경 필요)
    if [ ! -d ".git" ]; then
        echo "프로젝트 코드를 수동으로 업로드하거나 git clone을 실행하세요:"
        echo "git clone https://github.com/your-username/vridge.git $PROJECT_DIR"
        read -p "계속하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Oracle Cloud용 Docker Compose 파일 생성
    create_oracle_docker_compose
    
    echo
}

create_oracle_docker_compose() {
    echo "Oracle Cloud 최적화 Docker Compose 파일 생성 중..."
    
    cat > docker-compose.oracle.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: vridge_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME:-vridge}
      POSTGRES_USER: ${DB_USER:-vridge}  
      POSTGRES_PASSWORD: ${DB_PASSWORD:-password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-vridge}"]
      interval: 30s
      timeout: 10s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  redis:
    image: redis:7-alpine
    container_name: vridge_redis
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "127.0.0.1:6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  backend:
    build:
      context: ./vridge_back
      dockerfile: Dockerfile.oracle
    container_name: vridge_backend
    restart: unless-stopped
    environment:
      - DJANGO_ENV=production
      - PYTHONUNBUFFERED=1
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media
      - ./logs:/app/logs
      - ./vridge_back/.env:/app/.env:ro
    ports:
      - "127.0.0.1:8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    build:
      context: ./vridge_front
      dockerfile: Dockerfile.oracle
    container_name: vridge_frontend
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:80"
    depends_on:
      - backend
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  postgres_data:
  redis_data:
  static_volume:
  media_volume:

networks:
  default:
    driver: bridge
EOF

    echo -e "${GREEN}✅ Oracle Cloud 전용 Docker Compose 파일 생성 완료${NC}"
}

create_oracle_dockerfiles() {
    echo -e "${GREEN}🏗️  Oracle Cloud 최적화 Dockerfile 생성${NC}"
    echo "----------------------------------------"
    
    # 백엔드 Dockerfile
    mkdir -p vridge_back
    cat > vridge_back/Dockerfile.oracle << 'EOF'
# Oracle Cloud ARM64 최적화 Django Dockerfile
FROM python:3.9-slim

# 환경 변수 설정
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_ENV=production

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# Poetry 설치
RUN pip install poetry

# Poetry 설정
ENV POETRY_NO_INTERACTION=1 \
    POETRY_VENV_IN_PROJECT=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

# 의존성 파일 복사
COPY pyproject.toml poetry.lock* ./

# 의존성 설치 (Oracle Cloud 메모리 최적화)
RUN poetry install --no-dev --no-interaction --no-ansi && rm -rf $POETRY_CACHE_DIR

# 프로젝트 파일 복사
COPY . .

# 앱 사용자 생성
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN mkdir -p /app/staticfiles /app/media /app/logs && chown -R appuser:appuser /app
USER appuser

# 포트 노출
EXPOSE 8000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/admin/ || exit 1

# 시작 스크립트
CMD ["poetry", "run", "daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
EOF

    # 프론트엔드 Dockerfile
    mkdir -p vridge_front
    cat > vridge_front/Dockerfile.oracle << 'EOF'
# Oracle Cloud ARM64 최적화 React Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --silent
COPY . .
RUN npm run build

# 프로덕션 스테이지
FROM nginx:alpine
RUN apk add --no-cache curl
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.oracle.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
EOF

    # Nginx 설정
    cat > vridge_front/nginx.oracle.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Oracle Cloud 최적화
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/css text/javascript text/xml text/plain application/javascript application/json;
    
    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # React Router 지원
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 헬스체크
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

    echo -e "${GREEN}✅ Oracle Cloud 최적화 Dockerfile 생성 완료${NC}"
    echo
}

setup_environment() {
    echo -e "${GREEN}🔧 환경 변수 설정${NC}"
    echo "----------------------------------------"
    
    # 백엔드 환경 변수
    if [ ! -f "vridge_back/.env" ]; then
        cp vridge_back/.env.example vridge_back/.env 2>/dev/null || {
            echo "환경 변수 예제 파일 생성 중..."
            cat > vridge_back/.env << EOF
# Django 설정
SECRET_KEY=oracle-cloud-vridge-secret-key-$(date +%s)
DEBUG=False
DJANGO_ENV=production
ALLOWED_HOSTS=localhost,127.0.0.1

# 데이터베이스
DB_HOST=postgres
DB_NAME=vridge
DB_USER=vridge
DB_PASSWORD=vridge-secure-password-123
DB_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Oracle Cloud 최적화
ORACLE_CLOUD=true
EOF
        }
        echo -e "${YELLOW}⚠️  vridge_back/.env 파일을 확인하고 설정을 완료하세요${NC}"
    fi
    
    # 프론트엔드 환경 변수
    if [ ! -f "vridge_front/.env.production" ]; then
        cat > vridge_front/.env.production << EOF
NODE_ENV=production
GENERATE_SOURCEMAP=false

# Oracle Cloud 설정
REACT_APP_BACKEND_URI=http://localhost:8000
REACT_APP_SOCKET_URI=ws://localhost:8000

# 성능 최적화
DISABLE_ESLINT_PLUGIN=true
FAST_REFRESH=false
EOF
        echo -e "${YELLOW}⚠️  vridge_front/.env.production 파일을 확인하고 설정을 완료하세요${NC}"
    fi
    
    echo
}

deploy_application() {
    echo -e "${GREEN}🚀 애플리케이션 배포${NC}"
    echo "----------------------------------------"
    
    cd $PROJECT_DIR
    
    # Docker 그룹 권한 확인
    if ! groups ubuntu | grep -q docker; then
        echo -e "${YELLOW}⚠️  Docker 그룹 권한 적용을 위해 재로그인이 필요합니다${NC}"
        echo "다음 명령어로 배포를 계속하세요:"
        echo "cd $PROJECT_DIR && docker-compose -f docker-compose.oracle.yml up --build -d"
        return 0
    fi
    
    # 애플리케이션 빌드 및 시작
    echo "Docker 이미지 빌드 중..."
    docker-compose -f docker-compose.oracle.yml build
    
    echo "서비스 시작 중..."
    docker-compose -f docker-compose.oracle.yml up -d
    
    # 헬스체크 대기
    echo "서비스 시작 대기 중..."
    sleep 30
    
    # 서비스 상태 확인
    docker-compose -f docker-compose.oracle.yml ps
    
    echo -e "${GREEN}✅ 배포 완료${NC}"
    echo
}

setup_monitoring() {
    echo -e "${GREEN}📊 모니터링 설정${NC}"
    echo "----------------------------------------"
    
    # 시스템 모니터링 스크립트 생성
    cat > oracle-monitor.sh << 'EOF'
#!/bin/bash
echo "=== Oracle Cloud vridge 상태 ===" 
echo "시간: $(date)"
echo "업타임: $(uptime)"
echo "메모리 사용량:"
free -h
echo "디스크 사용량:"
df -h /
echo "Docker 컨테이너 상태:"
docker-compose -f docker-compose.oracle.yml ps
echo "================================"
EOF
    
    chmod +x oracle-monitor.sh
    
    # 크론 작업 설정 (매시간 로그 생성)
    (crontab -l 2>/dev/null; echo "0 * * * * cd $PROJECT_DIR && ./oracle-monitor.sh >> oracle-status.log") | crontab -
    
    echo -e "${GREEN}✅ 모니터링 설정 완료${NC}"
    echo
}

show_final_info() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "    Oracle Cloud vridge 배포 완료!"
    echo "=================================================="
    echo -e "${NC}"
    
    # 인스턴스 정보
    INSTANCE_IP=$(curl -s http://169.254.169.254/opc/v1/instance/networkInterfaces/0/publicIp || echo "공인 IP 확인 실패")
    
    echo "🌐 접속 정보:"
    echo "  웹사이트: http://$INSTANCE_IP"
    echo "  관리자: http://$INSTANCE_IP:8000/admin"
    echo "  프로젝트 경로: $PROJECT_DIR"
    echo
    echo "🔧 유용한 명령어:"
    echo "  상태 확인: cd $PROJECT_DIR && docker-compose -f docker-compose.oracle.yml ps"
    echo "  로그 확인: cd $PROJECT_DIR && docker-compose -f docker-compose.oracle.yml logs -f"
    echo "  서비스 재시작: cd $PROJECT_DIR && docker-compose -f docker-compose.oracle.yml restart"
    echo "  모니터링: cd $PROJECT_DIR && ./oracle-monitor.sh"
    echo
    echo "💡 다음 단계:"
    echo "  1. Oracle Cloud 콘솔에서 Security List 포트 개방 확인"
    echo "  2. 도메인 연결 시 DNS A 레코드를 $INSTANCE_IP로 설정"
    echo "  3. SSL 인증서 설치: sudo certbot --nginx -d yourdomain.com"
    echo "  4. GitHub Actions 설정으로 자동 배포 구성"
    echo
    echo -e "${GREEN}🎉 Oracle Cloud Free Tier에서 vridge가 성공적으로 실행 중입니다!${NC}"
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
                echo "알 수 없는 옵션: $1"
                exit 1
                ;;
        esac
    done
    
    check_oracle_cloud
    setup_oracle_firewall
    install_dependencies
    install_docker
    optimize_for_oracle
    setup_project
    create_oracle_dockerfiles
    setup_environment
    deploy_application
    setup_monitoring
    show_final_info
}

# 스크립트 실행
main "$@"