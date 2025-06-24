# 🚀 GitHub Repository 생성 및 업로드 가이드

## 📋 현재 상태
✅ Git 저장소 초기화 완료  
✅ 첫 커밋 생성 완료 (524개 파일)  
✅ GitHub Actions 워크플로우 준비 완료  

## 🔗 다음 단계: GitHub Repository 생성

### 1단계: GitHub에서 새 Repository 생성
1. **GitHub 접속**: https://github.com
2. **로그인** 후 우상단 **"+"** 버튼 클릭
3. **"New repository"** 선택
4. Repository 설정:
   ```
   Repository name: videoplanet
   Description: AI Video Analysis Platform with Twelve Labs Integration
   ✅ Public (또는 Private 선택)
   ❌ Add a README file (이미 있음)
   ❌ Add .gitignore (이미 있음)
   ❌ Choose a license (나중에 추가)
   ```
5. **"Create repository"** 클릭

### 2단계: 로컬에서 GitHub에 푸시
Repository 생성 후 나오는 명령어를 복사하여 실행:

```bash
# GitHub Repository URL 설정 (본인의 username으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/videoplanet.git

# 메인 브랜치로 푸시
git branch -M main
git push -u origin main
```

**예시**:
```bash
git remote add origin https://github.com/winnmedia/videoplanet.git
git push -u origin main
```

### 3단계: 업로드 확인
- GitHub Repository 페이지에서 파일들이 업로드되었는지 확인
- **Actions** 탭에서 워크플로우가 보이는지 확인

## 🔐 GitHub Secrets 설정

Repository 업로드 후 **Settings** → **Secrets and variables** → **Actions**에서 다음 Secrets 추가:

### 필수 Secrets 목록:

#### 🏠 가비아 호스팅 정보
```
GABIA_HOST=your-domain.com
GABIA_USERNAME=가비아_호스팅_계정명  
GABIA_PASSWORD=가비아_호스팅_비밀번호
GABIA_DOMAIN=your-domain.com
```

#### 🔧 Django 설정
```
DJANGO_SECRET_KEY=django-insecure-your-secret-key-here
```

#### 🗄️ 데이터베이스 정보
```
DB_NAME=videoplanet_db
DB_USER=videoplanet_user
DB_PASSWORD=your_database_password
```

#### 🤖 Twelve Labs API
```
TWELVE_LABS_API_KEY=tlk_your_api_key_here
TWELVE_LABS_INDEX_ID=your_index_id_here
```

### Secrets 설정 방법:
1. GitHub Repository → **Settings** 탭
2. 좌측 메뉴에서 **Secrets and variables** → **Actions**
3. **"New repository secret"** 클릭
4. Name과 Value 입력 후 **"Add secret"**

## 🔑 가비아 SSH 활성화

### My가비아에서 SSH 설정:
1. **My가비아** 로그인: https://my.gabia.com
2. **서비스 관리** → **웹호스팅** 클릭
3. 해당 호스팅 **"호스팅 관리"** 클릭
4. **SSH 접속 관리** 메뉴
5. **SSH 접속 활성화** 체크
6. 접속 정보 확인:
   - 호스트: your-domain.com
   - 포트: 22
   - 사용자: 호스팅계정명
   - 비밀번호: 호스팅비밀번호

## 🎯 Twelve Labs API 설정

### API 키 발급:
1. **Twelve Labs** 접속: https://playground.twelvelabs.io
2. 회원가입/로그인
3. **API Keys** 섹션에서 새 키 생성
4. 생성된 키를 GitHub Secrets에 추가

### 인덱스 생성:
```bash
# SSH로 가비아 서버 접속 후 실행
curl -X POST https://api.twelvelabs.io/v1.2/indexes \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "index_name": "videoplanet_production",
    "engines": [
      {
        "engine_name": "marengo2.6", 
        "engine_options": ["visual", "conversation", "text_in_video"]
      }
    ]
  }'
```

## 🚀 첫 번째 자동 배포 실행

### 자동 배포 (권장):
```bash
# 아무 변경사항 생성 후 푸시
echo "# VideoPlanet Deployment Test" >> README.md
git add README.md
git commit -m "test: Trigger first auto-deployment"
git push origin main
```

### 수동 배포:
1. GitHub Repository → **Actions** 탭
2. **"Deploy to Gabia Hosting"** 워크플로우 선택
3. **"Run workflow"** 버튼 클릭

## 📊 배포 모니터링

### GitHub Actions에서 확인:
- 실시간 로그 확인
- 각 단계별 성공/실패 상태
- 오류 발생 시 상세 로그 제공

### 배포 성공 시 확인사항:
1. **웹사이트 접속**: https://your-domain.com
2. **Django 관리자**: https://your-domain.com/admin/
3. **API 테스트**: https://your-domain.com/api/

## 🛠️ 문제 해결

### 일반적인 오류:

#### Git 인증 오류
```bash
# Personal Access Token 사용 (GitHub에서 생성)
Username: your-github-username
Password: ghp_your_personal_access_token
```

#### SSH 연결 실패
- 가비아 SSH 활성화 상태 확인
- 호스트명과 포트 번호 재확인
- 방화벽 설정 확인

#### 빌드 실패
- package-lock.json 파일 확인
- Python requirements.txt 의존성 확인

## ✅ 체크리스트

- [ ] GitHub Repository 생성
- [ ] 로컬 코드 푸시 완료
- [ ] GitHub Secrets 설정 (8개)
- [ ] 가비아 SSH 활성화
- [ ] Twelve Labs API 키 발급
- [ ] 첫 번째 배포 실행
- [ ] 웹사이트 접속 확인
- [ ] Django 관리자 접속 확인

---

## 🎉 완료 후

성공적으로 설정이 완료되면:
- **git push만으로 자동 배포** 가능
- **실시간 배포 모니터링** 
- **안전한 백업 시스템**
- **프로급 CI/CD 파이프라인** 구축 완료!

다음 단계를 차례대로 진행해주세요! 🚀