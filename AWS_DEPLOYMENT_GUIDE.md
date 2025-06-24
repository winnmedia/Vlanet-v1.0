# 🚀 AWS 배포 가이드 - VideoPlanet

## 1️⃣ AWS 계정 설정

### AWS 계정 생성
1. **AWS 가입**: https://aws.amazon.com/ko/
2. **신용카드 등록** (필수)
3. **서울 리전 선택** (ap-northeast-2)

### AWS CLI 설치 & 설정
```bash
# AWS CLI 설치
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# AWS 설정
aws configure
# Access Key ID: [IAM에서 생성]
# Secret Access Key: [IAM에서 생성]
# Default region: ap-northeast-2
# Default output format: json
```

## 2️⃣ EC2 인스턴스 설정

### 권장 스펙
- **인스턴스 타입**: t3.medium
- **운영체제**: Ubuntu 22.04 LTS
- **스토리지**: 20GB gp3 SSD
- **보안그룹**: HTTP(80), HTTPS(443), SSH(22)

### 생성 단계
1. **EC2 Console** → **Launch Instance**
2. **이름**: `videoplanet-server`
3. **AMI**: Ubuntu Server 22.04 LTS
4. **인스턴스 타입**: t3.medium
5. **키 페어**: 새로 생성 (videoplanet-key.pem)
6. **보안 그룹**: 
   - SSH (22): My IP
   - HTTP (80): Anywhere
   - HTTPS (443): Anywhere
   - Custom (8000): Anywhere (Django 개발용)

## 3️⃣ RDS MySQL 설정

### 데이터베이스 생성
1. **RDS Console** → **Create Database**
2. **엔진**: MySQL 8.0
3. **템플릿**: Free tier (또는 Production)
4. **DB 식별자**: `videoplanet-db`
5. **마스터 사용자명**: `admin`
6. **마스터 암호**: 강력한 비밀번호 설정
7. **인스턴스 클래스**: db.t3.micro (Free tier)
8. **스토리지**: 20GB gp2
9. **VPC 보안 그룹**: EC2에서 접근 허용

## 4️⃣ 도메인 & SSL 설정

### Route 53 설정
1. **Route 53** → **Hosted Zone 생성**
2. **도메인**: vlanet.net
3. **A 레코드**: EC2 퍼블릭 IP
4. **CNAME**: www → vlanet.net

### Let's Encrypt SSL
```bash
# Certbot 설치
sudo apt update
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d vlanet.net -d www.vlanet.net
```

## 5️⃣ EC2 서버 설정

### 필수 패키지 설치
```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Python & Node.js
sudo apt install python3-pip python3-venv nodejs npm nginx git -y

# Docker (선택사항)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
```

### VideoPlanet 배포
```bash
# 프로젝트 클론
git clone https://github.com/winnmedia/Vlanet-v1.0.git
cd Vlanet-v1.0

# 백엔드 설정
cd vridge_back
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 프론트엔드 빌드
cd ../vridge_front
npm install
npm run build

# Nginx 설정
sudo cp /path/to/nginx.conf /etc/nginx/sites-available/vlanet.net
sudo ln -s /etc/nginx/sites-available/vlanet.net /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

## 6️⃣ GitHub Actions 수정

### AWS Secrets 설정
```bash
# GitHub Secrets에 추가
AWS_ACCESS_KEY_ID: [IAM 키]
AWS_SECRET_ACCESS_KEY: [IAM 시크릿]
AWS_REGION: ap-northeast-2
EC2_HOST: [EC2 퍼블릭 IP]
EC2_USER: ubuntu
EC2_KEY: [private key 내용]

# 데이터베이스
DB_HOST: [RDS 엔드포인트]
DB_NAME: videoplanet
DB_USER: admin
DB_PASSWORD: [RDS 비밀번호]
```

## 7️⃣ 예상 비용

### 월 예상 비용 (USD)
- **EC2 t3.medium**: ~$30
- **RDS db.t3.micro**: ~$15
- **EBS 스토리지**: ~$3
- **데이터 전송**: ~$5
- **Route 53**: ~$1
- **총합**: ~$54/월 (~70,000원)

## 8️⃣ 성능 최적화

### CloudFront CDN
- 정적 파일 캐싱
- 전세계 배포
- 추가 비용: ~$5/월

### Auto Scaling (선택)
- 트래픽 증가시 자동 확장
- Load Balancer 연동

## 🎯 다음 단계

1. **AWS 계정 생성**
2. **EC2 + RDS 생성**
3. **도메인 연결**
4. **GitHub Actions 수정**
5. **SSL 설정**

## 📞 지원

- **AWS 지원**: AWS Support Center
- **문서**: https://docs.aws.amazon.com/ko/
- **가격 계산기**: https://calculator.aws/

---

**⚠️ 주의사항**
- 무료 티어는 12개월 제한
- 리소스 모니터링 필수
- 백업 설정 권장