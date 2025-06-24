# 🔑 최종 GitHub Secrets 설정값

## 📋 완성된 GitHub Secrets (11개)

### 🏠 가비아 호스팅 정보
```
Name: GABIA_HOST
Value: winnmedia.co.kr

Name: GABIA_USERNAME
Value: winnmedia

Name: GABIA_PASSWORD
Value: dnlsdos123

Name: GABIA_DOMAIN
Value: vlanet.net
```

### 🔧 Django 설정
```
Name: DJANGO_SECRET_KEY
Value: django-insecure-DcuaI3zQmYubdwPqXgkCQgJkfZJCeiJ5NM7-HqsgEQRUADnZeb

### 🗄️ 가비아 데이터베이스 정보
```
Name: DB_HOST
Value: db.winnmedia.co.kr

Name: DB_NAME
Value: winnmedia

Name: DB_USER
Value: dbwinnmedia

Name: DB_PASSWORD
Value: dnlsdos123!
```

### 🤖 Twelve Labs API
```
Name: TWELVE_LABS_API_KEY
Value: tlk_009RNGA2QVWHTX2G3DT4S15YCDHF

Name: TWELVE_LABS_INDEX_ID
Value: VideoPlanet
```

## 🎯 GitHub에서 설정 방법

1. **Repository 접속**: https://github.com/winnmedia/Vlanet-v1.0
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** 클릭
4. 위의 Name과 Value를 하나씩 입력 (총 10개)

## ⚠️ DB_PASSWORD 확인 필요

데이터베이스 비밀번호가 확실하지 않습니다. 다음 중 하나일 가능성:
- `dnlsdos123!` (가비아 계정 비밀번호와 동일)
- 별도로 설정한 데이터베이스 전용 비밀번호

My가비아에서 데이터베이스 정보를 확인해주세요!

## 🚀 설정 완료 후

모든 Secrets 설정 후:
1. **Actions** 탭으로 이동
2. **"Run workflow"** 클릭
3. **vlanet.net**에 자동 배포 시작!

## 💡 추가 정보

- **DB 호스트**: `db.winnmedia.co.kr` 또는 `db.winnmedia.gabia.io` (둘 다 동일)
- **포트**: 3306 (MySQL 기본포트, 자동 설정됨)
- **데이터베이스명**: `dbwinnmedia`
- **사용자명**: `winnmedia`