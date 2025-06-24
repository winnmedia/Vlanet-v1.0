# 🚀 가비아 g클라우드 vridge 배포 빠른 시작

## 📋 배포 전 체크리스트

### ✅ 가비아 계정 준비
- [ ] 가비아 회원가입 완료
- [ ] 신용카드/계좌 등록 완료
- [ ] g클라우드 서버 생성 (권장: 4코어 8GB)
- [ ] 도메인 구매 (선택사항, 나중에도 가능)

### ✅ 로컬 환경 준비
- [ ] 프로젝트 코드 준비
- [ ] SSH 클라이언트 설치 (Windows: PuTTY, macOS/Linux: 기본 터미널)
- [ ] FTP/SFTP 클라이언트 설치 (FileZilla 등, 선택사항)

### ✅ API 키 재발급 (보안상 필수)
- [ ] AWS 계정 새 IAM 사용자 생성
- [ ] Google Developer Console에서 새 프로젝트 생성
- [ ] 네이버 개발자센터에서 새 애플리케이션 등록
- [ ] 카카오 개발자센터에서 새 앱 생성

## 🚀 30분 빠른 배포

### 1단계: 서버 접속 (5분)
```bash
# SSH 키 사용하는 경우
ssh -i your-key.pem ubuntu@your-server-ip

# 비밀번호 사용하는 경우
ssh ubuntu@your-server-ip
```

### 2단계: 프로젝트 업로드 (5분)
```bash
# 방법 1: Git 사용 (권장)
sudo mkdir -p /var/www/vridge
sudo chown ubuntu:ubuntu /var/www/vridge
cd /var/www/vridge
git clone https://github.com/your-username/vridge.git .

# 방법 2: 파일 업로드 (로컬에서 실행)
scp -r /path/to/VideoPlanet ubuntu@your-server-ip:/home/ubuntu/
ssh ubuntu@your-server-ip "sudo mv /home/ubuntu/VideoPlanet /var/www/vridge"
```

### 3단계: 자동 배포 실행 (15분)
```bash
cd /var/www/vridge
chmod +x scripts/gabia-deploy.sh

# 도메인이 있는 경우
./scripts/gabia-deploy.sh --domain yourdomain.co.kr --email your-email@gmail.com

# 도메인이 없는 경우 (IP로 접속)
./scripts/gabia-deploy.sh
```

### 4단계: 환경 변수 설정 (5분)
```bash
# 백엔드 환경 변수 편집
vim /var/www/vridge/vridge_back/.env

# 최소 필수 설정:
SECRET_KEY=your-new-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-server-ip

# 프론트엔드 환경 변수 편집  
vim /var/www/vridge/vridge_front/.env.production

# API URL 설정:
REACT_APP_BACKEND_URI=http://your-server-ip
REACT_APP_SOCKET_URI=ws://your-server-ip
```

### 5단계: 서비스 시작
```bash
cd /var/www/vridge
docker-compose up -d
```

## 🌐 접속 확인

- **프론트엔드**: `http://your-server-ip` 또는 `https://yourdomain.co.kr`
- **관리자**: `http://your-server-ip/admin` 또는 `https://yourdomain.co.kr/admin`
- **API**: `http://your-server-ip/api` 또는 `https://yourdomain.co.kr/api`

## 💡 주요 명령어

### 서비스 관리
```bash
cd /var/www/vridge

# 전체 서비스 시작
docker-compose up -d

# 전체 서비스 중지
docker-compose down

# 특정 서비스 재시작
docker-compose restart backend
docker-compose restart frontend

# 로그 확인
docker-compose logs -f
docker-compose logs backend
```

### 서버 관리
```bash
# 시스템 상태 확인
htop                    # CPU, 메모리 사용량
df -h                   # 디스크 사용량
docker stats            # Docker 컨테이너 리소스

# Nginx 관리
sudo systemctl status nginx
sudo systemctl reload nginx
sudo nginx -t          # 설정 파일 검증
```

## 🔧 일반적인 문제 해결

### ❌ "포트가 이미 사용 중" 오류
```bash
# 사용 중인 포트 확인
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# 기존 서비스 중지
sudo systemctl stop apache2    # Apache가 설치된 경우
sudo systemctl stop nginx      # Nginx 중지 후 재시작
```

### ❌ Docker 권한 오류
```bash
# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker ubuntu

# 재로그인 필요
exit
ssh ubuntu@your-server-ip
```

### ❌ 메모리 부족 오류
```bash
# 스왑 파일 생성
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### ❌ 데이터베이스 연결 오류
```bash
# PostgreSQL 컨테이너 상태 확인
docker-compose ps
docker-compose logs postgres

# 데이터베이스 재시작
docker-compose restart postgres
```

## 📱 모바일에서도 관리

### Termux (Android)
```bash
# Termux 설치 후
pkg install openssh
ssh ubuntu@your-server-ip
```

### SSH 앱 (iOS)
- **Termius**: 유료이지만 사용하기 쉬움
- **Prompt 3**: iOS 전용, 직관적 인터페이스

## 🔒 보안 강화 (선택사항)

### SSH 키 기반 인증 (권장)
```bash
# 로컬에서 SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 공개키를 서버에 복사
ssh-copy-id ubuntu@your-server-ip

# 비밀번호 인증 비활성화
sudo vim /etc/ssh/sshd_config
# PasswordAuthentication no 로 변경
sudo systemctl restart ssh
```

### 방화벽 강화
```bash
# 특정 IP만 SSH 접속 허용
sudo ufw delete allow ssh
sudo ufw allow from YOUR_IP_ADDRESS to any port 22

# 기본 포트 변경
sudo vim /etc/ssh/sshd_config
# Port 22를 Port 2222로 변경
sudo systemctl restart ssh
sudo ufw allow 2222
```

## 📞 도움이 필요하면

### 가비아 고객센터
- **전화**: 1588-3622
- **채팅**: 가비아 웹사이트 우하단 채팅 버튼
- **이메일**: help@gabia.com

### 유용한 리소스
- [가비아 g클라우드 가이드](https://guide.gabia.com/g-cloud)
- [Docker 공식 문서](https://docs.docker.com/)
- [Django 배포 가이드](https://docs.djangoproject.com/en/4.2/howto/deployment/)

## 🎉 배포 완료 후 할 일

1. **관리자 계정 생성**:
   - `/admin`에서 슈퍼유저 로그인
   - 필요한 사용자 및 권한 설정

2. **소셜 로그인 설정**:
   - 각 플랫폼에서 리다이렉트 URI 설정
   - API 키 테스트

3. **파일 업로드 테스트**:
   - AWS S3 버킷 연결 확인
   - 대용량 파일 업로드 테스트

4. **백업 설정**:
   - 데이터베이스 자동 백업 설정
   - 미디어 파일 백업 설정

5. **모니터링 설정**:
   - Sentry 오류 추적 설정
   - 서버 리소스 모니터링

---

**축하합니다! 🎉 vridge가 성공적으로 배포되었습니다.**

문제가 발생하면 `/var/www/vridge/deploy/gabia-setup-guide.md`의 상세 가이드를 참조하세요.