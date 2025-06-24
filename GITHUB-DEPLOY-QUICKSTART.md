# 🚀 GitHub 자동 배포 빠른 시작 가이드

## ⚡ 5분 설정으로 자동 배포하기

### 1단계: SSH 키 생성 (2분)

```bash
# 로컬 컴퓨터에서 실행
ssh-keygen -t ed25519 -f ~/.ssh/vridge_deploy -C "github-actions@vridge"

# 공개키 출력 (서버에 등록용)
cat ~/.ssh/vridge_deploy.pub

# 개인키 출력 (GitHub에 등록용)
cat ~/.ssh/vridge_deploy
```

### 2단계: 서버에 공개키 등록 (1분)

```bash
# 가비아 서버에 SSH 접속
ssh ubuntu@your-server-ip

# 공개키 등록
mkdir -p ~/.ssh
echo "위에서 출력된 공개키 내용" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 3단계: GitHub Secrets 등록 (2분)

GitHub 저장소 → Settings → Secrets and variables → Actions

| Secret Name | 값 |
|-------------|-----|
| `SERVER_HOST` | 가비아 서버 IP 주소 |
| `SERVER_USER` | `ubuntu` |
| `SSH_PRIVATE_KEY` | 위에서 출력된 개인키 전체 내용 |

## 🎯 배포 방법

### 자동 배포 (추천)
```bash
# 코드 변경 후
git add .
git commit -m "기능 추가: 새로운 기능 구현"
git push origin main  # 자동으로 프로덕션 배포됨!
```

### 수동 배포
1. GitHub 저장소 → Actions 탭
2. "Deploy to Gabia g-Cloud" 선택  
3. "Run workflow" 버튼 클릭
4. 배포 타입 선택:
   - **update**: 빠른 업데이트 (기본값)
   - **full-restart**: 완전 재시작
   - **rollback**: 이전 버전으로 되돌리기

## 📊 배포 상태 확인

### GitHub에서 확인
- GitHub 저장소 → Actions 탭에서 실시간 진행 상황 확인

### 서버에서 확인
```bash
# 서버 접속
ssh ubuntu@your-server-ip

# 배포 상태 확인
cd /var/www/vridge
./scripts/deployment-status.sh

# 실시간 로그 보기
./scripts/deployment-status.sh logs
```

## 🌐 접속 URL

배포 완료 후 다음 URL로 접속 가능:

- **메인 사이트**: https://vlanet.net 또는 http://서버IP
- **관리자**: https://vlanet.net/admin 또는 http://서버IP/admin  
- **API**: https://vlanet.net/api 또는 http://서버IP/api

## 🔧 주요 명령어

```bash
# 배포 상태 확인
./scripts/deployment-status.sh

# 서비스 재시작  
docker-compose -f docker-compose.gabia.yml restart

# 로그 확인
docker-compose -f docker-compose.gabia.yml logs -f

# 시스템 모니터링
./scripts/monitoring.sh
```

## 🚨 문제 해결

### SSH 연결 오류
```bash
# GitHub Secrets 확인:
1. SERVER_HOST가 정확한 IP인지 확인
2. SSH_PRIVATE_KEY가 전체 내용인지 확인 (-----BEGIN부터 -----END까지)
3. 서버에 공개키가 올바르게 등록되었는지 확인
```

### 배포 실패 시
```bash
# 서버에서 수동 확인:
cd /var/www/vridge
git pull origin main
docker-compose -f docker-compose.gabia.yml up --build -d
```

### 서비스 접근 불가
```bash
# 포트 확인:
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# 방화벽 확인:
sudo ufw status

# Nginx 상태 확인:
sudo systemctl status nginx
sudo nginx -t
```

## 🔄 브랜치별 배포 전략

| 브랜치 | 환경 | 자동 배포 | 접속 URL |
|--------|------|-----------|----------|
| `main` | 프로덕션 | ✅ | https://vlanet.net |
| `develop` | 스테이징 | ✅ | http://서버IP:3001 |
| `feature/*` | 개발 | ❌ | 로컬 개발 |

## 📱 모바일에서 배포 상태 확인

### GitHub Mobile 앱
- App Store/Play Store에서 "GitHub" 검색
- 저장소 → Actions 탭에서 배포 상태 확인

### SSH 앱으로 서버 접속
- **iOS**: Termius, Prompt 3
- **Android**: Termux, JuiceSSH

## 🎉 배포 성공!

축하합니다! 이제 다음과 같은 자동화된 개발 워크플로우를 사용할 수 있습니다:

1. **코드 작성** → 로컬에서 개발
2. **커밋 & 푸시** → `git push origin main`  
3. **자동 배포** → GitHub Actions가 자동 실행
4. **배포 완료** → 몇 분 후 웹사이트에 반영

---

**💡 팁**: `develop` 브랜치로 푸시하면 스테이징 환경에서 먼저 테스트할 수 있습니다!