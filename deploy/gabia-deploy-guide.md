# 가비아 g클라우드 배포 가이드

## 1. 가비아 g클라우드 서버 준비

### 서버 사양 권장사항
- **최소**: CPU 2코어, RAM 4GB, SSD 50GB
- **권장**: CPU 4코어, RAM 8GB, SSD 100GB
- **OS**: Ubuntu 20.04 LTS 또는 22.04 LTS

### g클라우드 서버 생성 절차
1. 가비아 접속 → 클라우드 → g클라우드
2. 서버 생성
   - OS: Ubuntu 20.04 LTS
   - 사양: 권장 사양 선택
   - 보안그룹: HTTP(80), HTTPS(443), SSH(22) 포트 오픈
3. SSH 키 또는 비밀번호 설정
4. 서버 생성 완료

## 2. 서버 초기 설정

### SSH 접속
```bash
# SSH 키 사용하는 경우
ssh -i your-key.pem ubuntu@your-server-ip

# 비밀번호 사용하는 경우  
ssh ubuntu@your-server-ip
```

### 기본 패키지 업데이트
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim htop
```

### 방화벽 설정
```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8000  # Django 개발서버 (선택사항)
sudo ufw enable
```

## 3. 필수 소프트웨어 설치

### Docker 및 Docker Compose 설치
```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 재로그인 후 확인
docker --version
docker-compose --version
```

### Node.js 설치 (선택사항 - 로컬 빌드용)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Python 및 Poetry 설치 (선택사항 - 로컬 개발용)
```bash
sudo apt install -y python3 python3-pip
curl -sSL https://install.python-poetry.org | python3 -
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

## 4. 프로젝트 배포

### 코드 다운로드
```bash
# 프로젝트 디렉토리 생성
sudo mkdir -p /var/www/vridge
sudo chown ubuntu:ubuntu /var/www/vridge
cd /var/www/vridge

# Git 클론 (GitHub/GitLab 사용 시)
git clone https://github.com/your-username/vridge.git .

# 또는 파일 업로드 (scp 사용)
# scp -r /local/path/to/VideoPlanet ubuntu@your-server-ip:/var/www/vridge/
```

### 환경 변수 설정
```bash
# 백엔드 환경 변수
cp vridge_back/.env.example vridge_back/.env
vim vridge_back/.env

# 프론트엔드 환경 변수  
cp vridge_front/.env.example vridge_front/.env.production
vim vridge_front/.env.production
```

### Docker Compose로 배포
```bash
# 프로덕션 모드로 실행
chmod +x scripts/deploy.sh
./scripts/deploy.sh production
```

## 5. 환경 변수 설정 예시

### 백엔드 (.env)
```bash
# Django Settings
SECRET_KEY=your-new-secret-key-here
DEBUG=False
DJANGO_ENV=production
ALLOWED_HOSTS=your-domain.com,your-server-ip

# Database
DB_HOST=postgres
DB_NAME=vridge
DB_USER=vridge
DB_PASSWORD=secure-password-here
DB_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# AWS Settings (기존 또는 새로 생성)
AWS_ACCESS_KEY_ID=your-new-aws-key
AWS_SECRET_ACCESS_KEY=your-new-aws-secret
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_S3_REGION_NAME=ap-northeast-2

# Social Login (재발급 필요)
NAVER_CLIENT_ID=your-new-naver-id
NAVER_CLIENT_SECRET=your-new-naver-secret
GOOGLE_CLIENT_ID=your-new-google-id
GOOGLE_CLIENT_SECRET=your-new-google-secret
KAKAO_API_KEY=your-new-kakao-key

# Email
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### 프론트엔드 (.env.production)
```bash
NODE_ENV=production
GENERATE_SOURCEMAP=false

# API URLs
REACT_APP_BACKEND_URI=https://your-domain.com
REACT_APP_SOCKET_URI=wss://your-domain.com

# Social Login (백엔드와 동일)
REACT_APP_KAKAO_API_KEY=your-new-kakao-key
REACT_APP_NAVER_CLIENT_ID=your-new-naver-id
REACT_APP_GOOGLE_CLIENT_ID=your-new-google-id

# Redirect URIs
REACT_APP_NAVER_REDIRECT_URI=https://your-domain.com/login
```

## 6. 도메인 연결

### 가비아 DNS 설정
1. 가비아 → 도메인 관리 → DNS 정보
2. A 레코드 추가:
   - 호스트: @ (또는 www)
   - 값: 서버 IP 주소
   - TTL: 3600

### SSL 인증서 설정 (Let's Encrypt)
```bash
# Certbot 설치
sudo apt install -y certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 자동 갱신 설정
sudo crontab -e
# 다음 라인 추가:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 7. Nginx 설정 (프로덕션용)

### Nginx 설치 및 설정
```bash
sudo apt install -y nginx

# 설정 파일 생성
sudo vim /etc/nginx/sites-available/vridge
```

### Nginx 설정 파일 내용
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /var/www/vridge/vridge_back/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /var/www/vridge/vridge_back/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### Nginx 활성화
```bash
sudo ln -s /etc/nginx/sites-available/vridge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 8. 배포 스크립트 실행

```bash
cd /var/www/vridge
./scripts/deploy.sh production
```

## 9. 배포 확인

### 서비스 상태 확인
```bash
docker-compose ps
docker-compose logs -f
```

### 웹사이트 접속 확인
- https://your-domain.com - 프론트엔드
- https://your-domain.com/admin - Django 관리자
- https://your-domain.com/api/ - API 확인

## 10. 문제 해결

### 일반적인 문제들
1. **포트 충돌**: `sudo netstat -tulpn | grep :80`
2. **권한 문제**: `sudo chown -R ubuntu:ubuntu /var/www/vridge`
3. **방화벽**: `sudo ufw status` 확인
4. **Docker 권한**: 재로그인 후 `docker ps` 실행

### 로그 확인
```bash
# Docker 로그
docker-compose logs backend
docker-compose logs frontend

# Nginx 로그
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# 시스템 로그
sudo journalctl -u nginx
```

## 11. 유지보수

### 정기 업데이트
```bash
# 코드 업데이트
git pull origin main

# 컨테이너 재빌드
docker-compose down
docker-compose up --build -d

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y
```

### 백업 설정
```bash
# 데이터베이스 백업 스크립트
#!/bin/bash
docker-compose exec -T postgres pg_dump -U vridge vridge > backup_$(date +%Y%m%d_%H%M%S).sql

# 크론탭에 등록
0 2 * * * /var/www/vridge/scripts/backup.sh
```