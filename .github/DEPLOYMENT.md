# 🚀 GitHub Actions 자동 배포 설정 가이드

## 1. GitHub Secrets 설정

### 필수 Secrets 등록
GitHub 저장소 → Settings → Secrets and variables → Actions에서 다음 값들을 등록하세요:

| Secret Name | 설명 | 예시 값 |
|-------------|------|---------|
| `SERVER_HOST` | 가비아 서버 IP 주소 | `123.456.78.90` |
| `SERVER_USER` | 서버 사용자명 | `ubuntu` |
| `SSH_PRIVATE_KEY` | SSH 개인 키 전체 내용 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `STAGING_SERVER_HOST` | 스테이징 서버 IP (선택사항) | `123.456.78.91` |

### SSH 키 생성 및 설정

#### 1단계: 로컬에서 SSH 키 생성
```bash
# SSH 키 페어 생성
ssh-keygen -t ed25519 -f ~/.ssh/vridge_deploy -C "github-actions@vridge"

# 공개키 내용 확인 (서버에 등록용)
cat ~/.ssh/vridge_deploy.pub

# 개인키 내용 확인 (GitHub Secrets 등록용)
cat ~/.ssh/vridge_deploy
```

#### 2단계: 서버에 공개키 등록
```bash
# 서버에 SSH 접속
ssh ubuntu@your-server-ip

# authorized_keys에 공개키 추가
mkdir -p ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... github-actions@vridge" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

#### 3단계: GitHub Secrets에 개인키 등록
1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. "New repository secret" 클릭
3. Name: `SSH_PRIVATE_KEY`
4. Secret: SSH 개인키 전체 내용 복사 붙여넣기 (-----BEGIN부터 -----END까지)

## 2. 서버 사전 설정

### Docker 및 Docker Compose 설치 확인
```bash
# 서버에 SSH 접속 후 확인
ssh ubuntu@your-server-ip

# Docker 버전 확인
docker --version
docker-compose --version

# Docker 서비스 상태 확인
sudo systemctl status docker
```

### 프로젝트 디렉토리 준비
```bash
# 프로젝트 디렉토리 생성
sudo mkdir -p /var/www/vridge
sudo chown ubuntu:ubuntu /var/www/vridge

# Git 설정 (롤백 기능용)
cd /var/www/vridge
git config --global user.email "deploy@vridge.kr"
git config --global user.name "GitHub Actions"
```

### Nginx 설정 (프로덕션용)
```bash
# Nginx 설치 확인
sudo nginx -v

# 설정 파일 백업
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# 설정 파일 테스트
sudo nginx -t
```

## 3. 배포 워크플로우 이해

### 자동 배포 트리거
- **프로덕션 배포**: `main` 또는 `master` 브랜치에 푸시
- **스테이징 배포**: `develop` 또는 `staging` 브랜치에 푸시
- **수동 배포**: Actions 탭에서 "Run workflow" 버튼 클릭

### 배포 프로세스
1. **코드 체크아웃**: 최신 커밋 가져오기
2. **SSH 연결 설정**: 안전한 서버 접속
3. **코드 동기화**: rsync로 변경된 파일만 전송
4. **Docker 빌드**: 최신 이미지 빌드 (캐시 활용)
5. **서비스 시작**: 컨테이너 실행
6. **헬스체크**: 서비스 정상 동작 확인
7. **Nginx 리로드**: 웹서버 설정 적용
8. **정리작업**: 불필요한 이미지 삭제

### 배포 타입
- **update** (기본): 빠른 업데이트, 서비스 중단 최소화
- **full-restart**: 완전 재시작, 설정 변경 시 사용
- **rollback**: 이전 버전으로 되돌리기

## 4. 배포 모니터링

### GitHub Actions에서 확인
1. GitHub 저장소 → Actions 탭
2. 최근 워크플로우 실행 결과 확인
3. 실패 시 로그 상세 내용 확인

### 서버에서 직접 확인
```bash
# 서버 접속
ssh ubuntu@your-server-ip

# 배포 로그 확인
tail -f /var/www/vridge/deployment.log

# 서비스 상태 확인
cd /var/www/vridge
./scripts/monitoring.sh

# Docker 로그 확인
docker-compose -f docker-compose.gabia.yml logs -f
```

## 5. 환경별 설정

### 프로덕션 환경
- **브랜치**: `main`
- **도메인**: `vlanet.net`
- **포트**: 80, 443 (Nginx를 통해)
- **디버그**: `DEBUG=False`

### 스테이징 환경  
- **브랜치**: `develop`
- **도메인**: `staging.vlanet.net`
- **포트**: 3001 (프론트엔드), 8001 (백엔드)
- **디버그**: `DEBUG=True`

## 6. 일반적인 문제 해결

### 문제 1: SSH 연결 실패
```bash
# 해결방법:
1. SERVER_HOST와 SSH_PRIVATE_KEY 값 확인
2. 서버 방화벽에서 SSH 포트(22) 허용 확인
3. SSH 키 형식 확인 (-----BEGIN부터 -----END까지 전체)
```

### 문제 2: Docker 빌드 실패
```bash
# 서버에서 수동 확인:
cd /var/www/vridge
docker-compose -f docker-compose.gabia.yml build
docker-compose -f docker-compose.gabia.yml logs
```

### 문제 3: 헬스체크 실패
```bash
# 서비스 상태 확인:
docker-compose -f docker-compose.gabia.yml ps
curl http://localhost:8000/admin/
curl http://localhost:3000/
```

### 문제 4: 포트 충돌
```bash
# 사용 중인 포트 확인:
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# 기존 서비스 중지:
sudo systemctl stop apache2  # Apache가 설치된 경우
```

## 7. 고급 배포 설정

### 무중단 배포 (Blue-Green)
```yaml
# .github/workflows/blue-green-deploy.yml
# (별도 파일로 생성 가능)
```

### 데이터베이스 마이그레이션 자동화
```bash
# 마이그레이션이 필요한 경우:
ssh ubuntu@server "cd /var/www/vridge && docker-compose exec backend python manage.py migrate"
```

### 환경별 설정 파일 관리
```bash
# 환경별 Docker Compose 파일:
docker-compose.production.yml
docker-compose.staging.yml
docker-compose.development.yml
```

## 8. 배포 성공 후 체크리스트

- [ ] 웹사이트 접속 확인 (https://vlanet.net)
- [ ] API 엔드포인트 확인 (/api/)
- [ ] 관리자 페이지 확인 (/admin/)
- [ ] SSL 인증서 정상 동작 확인
- [ ] 로그 에러 없는지 확인
- [ ] 성능 테스트 (응답 시간, 로드)

## 9. 보안 고려사항

### SSH 키 관리
- 정기적인 SSH 키 교체 (3-6개월)
- 키별 용도 분리 (배포용, 관리용 등)
- 불필요한 키 제거

### Secrets 관리
- 최소 권한 원칙 적용
- 정기적인 시크릿 교체
- 감사 로그 모니터링

### 네트워크 보안
- 방화벽 규칙 최적화
- SSH 포트 변경 고려
- VPN 사용 고려

---

이 가이드를 따라하시면 GitHub를 통한 완전 자동화된 배포 시스템을 구축할 수 있습니다!