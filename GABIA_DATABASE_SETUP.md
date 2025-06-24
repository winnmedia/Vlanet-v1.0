# 🗄️ 가비아 데이터베이스 설정 가이드

## 1. 가비아 MySQL 데이터베이스 생성

### 단계별 설정:

#### 1단계: My가비아 접속
1. **My가비아** 로그인: https://my.gabia.com
2. **서비스 관리** → **웹호스팅** 클릭
3. 해당 호스팅 **"호스팅 관리"** 클릭

#### 2단계: MySQL 데이터베이스 생성
1. **데이터베이스 관리** 메뉴 클릭
2. **MySQL 생성** 버튼 클릭
3. 다음 정보로 생성:

```
데이터베이스명: videoplanet_db
사용자명: videoplanet_user
비밀번호: secure_password_123
```

#### 3단계: 생성 완료 후 정보 확인
- 호스트: localhost (기본값)
- 포트: 3306 (기본값)
- 데이터베이스명: videoplanet_db
- 사용자명: videoplanet_user
- 비밀번호: secure_password_123

## 2. GitHub Secrets 설정값

### Django Secret Key:
```
Name: DJANGO_SECRET_KEY
Value: django-insecure-/=mpPQ]{7dr6+Y<W4CT 2fSe9V>i-v?Xuh.(2/>=P+y&j,f)3_
```

### 데이터베이스 정보:
```
Name: DB_NAME
Value: videoplanet_db

Name: DB_USER
Value: videoplanet_user

Name: DB_PASSWORD
Value: secure_password_123
```

## 3. 대안: 임시값으로 시작

**아직 데이터베이스를 생성하지 않았다면** 임시값으로 설정하고 나중에 업데이트:

```
Name: DB_NAME
Value: temp_db

Name: DB_USER
Value: temp_user

Name: DB_PASSWORD
Value: temp_password
```

## 4. 설정 순서 권장사항

### 지금 당장 설정 가능한 것들:
✅ GABIA_HOST=winnmedia
✅ GABIA_USERNAME=sukkeun17
✅ GABIA_PASSWORD=dnlsdos123$
✅ GABIA_DOMAIN=vlanet.net
✅ DJANGO_SECRET_KEY=django-insecure-/=mpPQ]{7dr6+Y<W4CT 2fSe9V>i-v?Xuh.(2/>=P+y&j,f)3_
✅ TWELVE_LABS_API_KEY=tlk_009RNGA2QVWHTX2G3DT4S15YCDHF
✅ TWELVE_LABS_INDEX_ID=VideoPlanet

### 가비아에서 생성 후 설정할 것들:
⏳ DB_NAME=videoplanet_db
⏳ DB_USER=videoplanet_user
⏳ DB_PASSWORD=secure_password_123

## 5. 빠른 시작 방법

1. **위의 7개 Secrets 먼저 설정**
2. **DB 관련 3개는 임시값으로 설정**
3. **첫 배포 테스트**
4. **가비아에서 DB 생성 후 값 업데이트**

이렇게 하면 단계적으로 진행할 수 있습니다!