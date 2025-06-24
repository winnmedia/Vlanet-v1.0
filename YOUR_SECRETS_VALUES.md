# 🔑 GitHub Secrets 설정값

## 📋 설정할 Secrets (10개)

### 🏠 가비아 호스팅 정보
```
Name: GABIA_HOST
Value: winnmedia

Name: GABIA_USERNAME  
Value: sukkeun17

Name: GABIA_PASSWORD
Value: dnlsdos123$

Name: GABIA_DOMAIN
Value: vlanet.net
```

### 🔧 Django 설정
```
Name: DJANGO_SECRET_KEY
Value: django-insecure-temp-key-for-testing-123456789
```

### 🗄️ 데이터베이스 정보
```
Name: DB_NAME
Value: videoplanet_db

Name: DB_USER  
Value: videoplanet_user

Name: DB_PASSWORD
Value: secure_password_123
```

### 🤖 Twelve Labs API
```
Name: TWELVE_LABS_API_KEY
Value: tlk_009RNGA2QVWHTX2G3DT4S15YCDHF

Name: TWELVE_LABS_INDEX_ID  
Value: VideoPlanet
```

## 🎯 설정 방법

1. **GitHub Repository 접속**: https://github.com/winnmedia/Vlanet-v1.0
2. **Settings** 탭 클릭
3. **Secrets and variables** → **Actions** 클릭
4. **New repository secret** 버튼 클릭
5. 위의 Name과 Value를 하나씩 입력

## ✅ 완료 후 확인

모든 Secrets 설정 후:
- Repository → **Actions** 탭
- **"Deploy to Gabia Hosting"** 워크플로우 실행
- **"Run workflow"** 클릭

## 🚀 첫 번째 자동 배포 준비 완료!

Secrets 설정이 완료되면 코드를 푸시하기만 하면 자동으로 vlanet.net에 배포됩니다!