# 🚀 Railway 배포 가이드 - VideoPlanet

## 1️⃣ **Railway 계정 생성**

1. **Railway 접속**: https://railway.app
2. **"Start a New Project" 클릭**
3. **GitHub로 로그인** (권장)
4. **GitHub 계정 연동**

---

## 2️⃣ **프로젝트 생성**

### GitHub 레포지토리 연결:
1. **"Deploy from GitHub repo" 클릭**
2. **winnmedia/Vlanet-v1.0 레포지토리 선택**
3. **"Deploy Now" 클릭**

### 또는 수동 연결:
1. **"Empty Project" 클릭**
2. **"GitHub Repo" 서비스 추가**
3. **Vlanet-v1.0 레포지토리 선택**

---

## 3️⃣ **PostgreSQL 데이터베이스 추가**

1. **프로젝트 대시보드에서 "New" 클릭**
2. **"Database" → "Add PostgreSQL" 선택**
3. **자동으로 DATABASE_URL 환경변수 생성됨**

---

## 4️⃣ **환경변수 설정** ⭐

### 웹 서비스 클릭 → Variables 탭에서 추가:

```bash
# Django 설정
SECRET_KEY=django-insecure-DcuaI3zQmYubdwPqXgkCQgJkfZJCeiJ5NM7-HqsgEQRUADnZeb
DJANGO_SETTINGS_MODULE=config.settings.railway

# Twelve Labs API
TWELVE_LABS_API_KEY=tlk_009RNGA2QVWHTX2G3DT4S15YCDHF
TWELVE_LABS_INDEX_ID=VideoPlanet

# 기타 설정 (자동 생성됨)
DATABASE_URL=[PostgreSQL 연결 정보 - 자동 생성]
PORT=8000
```

---

## 5️⃣ **도메인 연결** (선택사항)

### Railway 도메인 (무료):
- 자동 할당: `your-app-name.railway.app`

### 커스텀 도메인 (vlanet.net):
1. **Settings** → **Domains**
2. **"Custom Domain" 클릭**
3. **vlanet.net 입력**
4. **DNS 설정**:
   ```
   CNAME www railway-app-domain
   A @ railway-ip-address
   ```

---

## 6️⃣ **배포 과정**

### 자동 배포:
1. **GitHub에 코드 푸시**
2. **Railway가 자동으로 감지**
3. **빌드 및 배포 시작**
4. **배포 완료까지 5-10분**

### 수동 배포:
1. **Railway 대시보드에서 "Deploy" 클릭**
2. **빌드 로그 확인**

---

## 7️⃣ **배포 확인**

### 성공 시:
- **Status: Active** 표시
- **웹사이트 접속 가능**: https://your-app.railway.app
- **로그에서 "Running on port" 메시지 확인**

### 실패 시:
- **Logs 탭에서 오류 확인**
- **환경변수 재확인**
- **settings.py 경로 확인**

---

## 8️⃣ **비용 및 제한**

### 무료 플랜:
- **실행 시간**: 500시간/월
- **메모리**: 512MB
- **스토리지**: 1GB
- **대역폭**: 100GB

### 유료 플랜 ($5/월):
- **무제한 실행 시간**
- **메모리**: 8GB
- **스토리지**: 100GB
- **더 많은 대역폭**

---

## 🎯 **다음 단계**

1. **Railway 계정 생성**
2. **GitHub 레포지토리 연결**
3. **PostgreSQL 추가**
4. **환경변수 설정**
5. **배포 확인**
6. **도메인 연결**

---

## 🔧 **설정된 파일들**

- ✅ `Procfile`: Railway 배포 명령어
- ✅ `nixpacks.toml`: 빌드 설정
- ✅ `railway.json`: Railway 구성
- ✅ `config/settings/railway.py`: Railway용 Django 설정
- ✅ `requirements.txt`: PostgreSQL 및 Railway 의존성 추가

---

## 🆘 **문제 해결**

### 일반적인 오류:
1. **빌드 실패**: `nixpacks.toml` 경로 확인
2. **데이터베이스 연결 실패**: `DATABASE_URL` 환경변수 확인
3. **정적 파일 404**: `STATIC_ROOT` 설정 확인
4. **Twelve Labs API 오류**: API 키 환경변수 확인

### 로그 확인:
- **Railway 대시보드** → **Logs 탭**
- **Build Logs**: 빌드 과정 확인
- **Deploy Logs**: 배포 과정 확인

---

## 📞 **지원**

- **Railway 문서**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **GitHub Issues**: 코드 관련 문제

**Railway는 정말 간단합니다! GitHub 연결 후 환경변수만 설정하면 끝!** 🚀