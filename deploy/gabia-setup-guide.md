# 가비아 g클라우드 완전 설정 가이드

## 1. 가비아 g클라우드 서버 생성

### 단계별 서버 생성
1. **가비아 로그인** → My가비아 → 클라우드 → g클라우드
2. **서버 생성 클릭**
3. **운영체제 선택**: Ubuntu 20.04 LTS (권장)
4. **서버 사양 선택**:
   - **기본형**: vCPU 2개, 메모리 4GB, SSD 50GB (월 약 2만원)
   - **표준형**: vCPU 4개, 메모리 8GB, SSD 100GB (월 약 4만원) - **권장**
   - **고성능형**: vCPU 8개, 메모리 16GB, SSD 200GB (월 약 8만원)

5. **네트워크 설정**:
   - 공인 IP: 자동 할당
   - 방화벽: 기본 설정 (HTTP, HTTPS, SSH 포트 오픈)

6. **인증 방식 선택**:
   - SSH 키 페어 (권장) 또는 비밀번호
   - SSH 키 다운로드 후 안전한 곳에 보관

7. **서버 생성 완료**

## 2. 도메인 구매 및 DNS 설정

### 가비아에서 도메인 구매
1. **가비아 메인** → 도메인 → 도메인 등록
2. **원하는 도메인 검색** (예: yourvridge.co.kr)
3. **도메인 등록** (연간 약 1-3만원)

### DNS 설정
1. **My가비아** → 서비스 관리 → 도메인 관리
2. **DNS 관리** 클릭
3. **레코드 추가**:
   ```
   타입: A
   호스트: @
   값: [g클라우드 서버 공인 IP]
   TTL: 3600
   
   타입: A  
   호스트: www
   값: [g클라우드 서버 공인 IP]
   TTL: 3600
   ```

## 3. 서버 접속 및 초기 설정

### SSH 접속
```bash
# SSH 키를 사용하는 경우
chmod 600 your-key.pem
ssh -i your-key.pem ubuntu@your-server-ip

# 비밀번호를 사용하는 경우
ssh ubuntu@your-server-ip
```

### 서버 초기 설정
```bash
# 패키지 업데이트
sudo apt update && sudo apt upgrade -y

# 한국 시간대 설정
sudo timedatectl set-timezone Asia/Seoul

# 한글 로케일 설정
sudo locale-gen ko_KR.UTF-8
sudo update-locale LANG=ko_KR.UTF-8

# 기본 패키지 설치
sudo apt install -y curl wget git vim htop unzip tree
```

## 4. 프로젝트 배포

### 자동 배포 (권장)
```bash
# 프로젝트 다운로드
cd /tmp
wget https://github.com/your-repo/vridge/archive/main.zip
unzip main.zip
sudo mv vridge-main /var/www/vridge
sudo chown -R ubuntu:ubuntu /var/www/vridge

# 배포 스크립트 실행
cd /var/www/vridge
chmod +x scripts/gabia-deploy.sh
./scripts/gabia-deploy.sh --domain yourdomain.co.kr --email your-email@gmail.com
```

### 수동 배포
1. **프로젝트 업로드**:
```bash
# scp를 사용한 파일 업로드
scp -r /local/path/to/VideoPlanet ubuntu@your-server-ip:/home/ubuntu/
```

2. **환경 변수 설정**:
```bash
cd /var/www/vridge

# 백엔드 환경 변수
cp vridge_back/.env.example vridge_back/.env
vim vridge_back/.env

# 프론트엔드 환경 변수
cp vridge_front/.env.example vridge_front/.env.production
vim vridge_front/.env.production
```

## 5. 환경 변수 설정 상세

### 백엔드 환경 변수 (vridge_back/.env)
```bash
# Django 기본 설정
SECRET_KEY=your-very-long-secret-key-here
DEBUG=False
DJANGO_ENV=production
ALLOWED_HOSTS=yourdomain.co.kr,www.yourdomain.co.kr

# 데이터베이스 설정 (Docker 내부)
DB_HOST=postgres
DB_NAME=vridge
DB_USER=vridge
DB_PASSWORD=very-secure-password-123
DB_PORT=5432

# Redis 설정 (Docker 내부)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis-secure-password

# AWS S3 설정 (새로 생성 권장)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_STORAGE_BUCKET_NAME=your-new-bucket
AWS_S3_REGION_NAME=ap-northeast-2

# 소셜 로그인 (모두 재발급 필요)
NAVER_CLIENT_ID=your-new-naver-id
NAVER_CLIENT_SECRET=your-new-naver-secret
GOOGLE_CLIENT_ID=your-new-google-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-new-google-secret
KAKAO_API_KEY=your-new-kakao-key

# 이메일 설정
EMAIL_HOST_USER=yourapp@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# 모니터링 (선택사항)
SENTRY_DSN=https://...@sentry.io/...

# 슈퍼유저 자동 생성 (선택사항)
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@yourdomain.co.kr
DJANGO_SUPERUSER_PASSWORD=admin-secure-password
```

### 프론트엔드 환경 변수 (vridge_front/.env.production)
```bash
NODE_ENV=production
GENERATE_SOURCEMAP=false

# API 엔드포인트
REACT_APP_BACKEND_URI=https://yourdomain.co.kr
REACT_APP_SOCKET_URI=wss://yourdomain.co.kr

# 소셜 로그인 (백엔드와 동일한 키 사용)
REACT_APP_KAKAO_API_KEY=your-new-kakao-key
REACT_APP_NAVER_CLIENT_ID=your-new-naver-id
REACT_APP_GOOGLE_CLIENT_ID=your-new-google-id.apps.googleusercontent.com

# 리다이렉트 URI
REACT_APP_NAVER_REDIRECT_URI=https://yourdomain.co.kr/login
```

## 6. 데이터베이스 설정

### PostgreSQL 초기 설정
```bash
# 컨테이너 접속
docker-compose exec postgres psql -U vridge -d vridge

# 데이터베이스 정보 확인
\l
\dt
\q
```

### 데이터베이스 백업 설정
```bash
# 백업 스크립트 생성
sudo tee /usr/local/bin/vridge-backup > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/vridge"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 데이터베이스 백업
cd /var/www/vridge
docker-compose exec -T postgres pg_dump -U vridge vridge > $BACKUP_DIR/db_backup_$DATE.sql

# 미디어 파일 백업
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz vridge_back/media/

# 오래된 백업 파일 삭제 (7일 이상)
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

sudo chmod +x /usr/local/bin/vridge-backup

# 크론탭에 등록 (매일 새벽 2시)
echo "0 2 * * * /usr/local/bin/vridge-backup" | sudo crontab -
```

## 7. Redis 설정

### Redis 메모리 최적화
```bash
# Redis 설정 확인
docker-compose exec redis redis-cli info memory

# Redis 설정 조정 (필요시)
docker-compose exec redis redis-cli config set maxmemory 512mb
docker-compose exec redis redis-cli config set maxmemory-policy allkeys-lru
```

## 8. SSL 인증서 설정

### Let's Encrypt 무료 SSL
```bash
# Certbot 설치
sudo apt install -y certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d yourdomain.co.kr -d www.yourdomain.co.kr

# 자동 갱신 설정
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 9. 성능 최적화

### 시스템 튜닝
```bash
# 스왑 파일 생성 (메모리 부족 시)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 파일 핸들 제한 증가
echo 'ubuntu soft nofile 65536' | sudo tee -a /etc/security/limits.conf
echo 'ubuntu hard nofile 65536' | sudo tee -a /etc/security/limits.conf
```

### Nginx 최적화
```bash
# Nginx 워커 프로세스 최적화
sudo vim /etc/nginx/nginx.conf

# 다음 설정 추가/수정:
# worker_processes auto;
# worker_connections 1024;
# keepalive_timeout 65;
# client_max_body_size 500M;
```

## 10. 모니터링 설정

### 시스템 모니터링
```bash
# htop 설치 (이미 설치됨)
htop

# 디스크 사용량 확인
df -h

# 메모리 사용량 확인
free -h

# Docker 리소스 사용량
docker stats
```

### 로그 모니터링
```bash
# 애플리케이션 로그
docker-compose logs -f

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 시스템 로그
sudo journalctl -f
```

## 11. 보안 강화

### 방화벽 설정
```bash
# UFW 방화벽 설정
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 방화벽 상태 확인
sudo ufw status
```

### Fail2ban 설정
```bash
# Fail2ban 설치 및 설정
sudo apt install -y fail2ban

# SSH 보호 설정
sudo tee /etc/fail2ban/jail.local > /dev/null <<'EOF'
[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5
bantime = 3600
EOF

sudo systemctl restart fail2ban
```

## 12. 문제 해결

### 일반적인 문제들

#### 1. 서비스가 시작되지 않는 경우
```bash
# Docker 서비스 상태 확인
sudo systemctl status docker
sudo systemctl start docker

# 컨테이너 로그 확인
docker-compose logs backend
docker-compose logs frontend
```

#### 2. 데이터베이스 연결 오류
```bash
# PostgreSQL 컨테이너 확인
docker-compose exec postgres pg_isready -U vridge

# 네트워크 확인
docker network ls
docker network inspect vridge_vridge_network
```

#### 3. 정적 파일이 로드되지 않는 경우
```bash
# 정적 파일 다시 수집
docker-compose exec backend python manage.py collectstatic --noinput

# Nginx 설정 확인
sudo nginx -t
sudo systemctl reload nginx
```

#### 4. SSL 인증서 문제
```bash
# SSL 인증서 상태 확인
sudo certbot certificates

# SSL 인증서 갱신
sudo certbot renew --dry-run
```

### 로그 위치
- **애플리케이션 로그**: `/var/www/vridge/logs/`
- **Nginx 로그**: `/var/log/nginx/`
- **시스템 로그**: `/var/log/syslog`
- **Docker 로그**: `docker-compose logs [서비스명]`

## 13. 유지보수

### 정기 점검 (주간)
```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 디스크 공간 확인
df -h

# 백업 확인
ls -la /var/backups/vridge/

# SSL 인증서 만료일 확인
sudo certbot certificates
```

### 정기 점검 (월간)
```bash
# 도커 이미지 정리
docker system prune -f

# 로그 파일 정리
sudo find /var/log -name "*.log" -type f -mtime +30 -delete

# 보안 업데이트 확인
sudo apt list --upgradable
```

이 가이드를 따라하시면 가비아 g클라우드에 vridge 프로젝트를 성공적으로 배포할 수 있습니다.