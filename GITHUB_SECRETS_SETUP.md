# 🔐 GitHub Secrets 설정 가이드

## 📋 설정해야 할 Secrets (8개)

### 🏠 가비아 호스팅 정보
```
Name: GABIA_HOST
Value: your-domain.com (또는 가비아에서 제공한 호스트명)

Name: GABIA_USERNAME  
Value: 가비아_호스팅_계정명

Name: GABIA_PASSWORD
Value: 가비아_호스팅_비밀번호

Name: GABIA_DOMAIN
Value: your-domain.com (실제 도메인명)
```

### 🔧 Django 설정
```
Name: DJANGO_SECRET_KEY
Value: django-insecure-your-very-long-secret-key-here-make-it-complex
```

### 🗄️ 데이터베이스 정보
```
Name: DB_NAME
Value: videoplanet_db (또는 생성할 DB명)

Name: DB_USER  
Value: videoplanet_user (또는 생성할 DB 사용자명)

Name: DB_PASSWORD
Value: your_secure_database_password_123
```

### 🤖 Twelve Labs API (나중에 설정 가능)
```
Name: TWELVE_LABS_API_KEY
Value: tlk_your_api_key_here (일단 임시값: temp_api_key)

Name: TWELVE_LABS_INDEX_ID  
Value: your_index_id_here (일단 임시값: temp_index_id)
```

## 🔑 각 Secret 설정 방법

### 1. "New repository secret" 클릭
### 2. Name과 Value 입력
### 3. "Add secret" 클릭
### 4. 다음 Secret으로 반복

## 📝 실제 값 예시

### GABIA_HOST 확인 방법:
- My가비아 → 서비스관리 → 웹호스팅 → 호스팅관리
- SSH 접속 정보에서 "호스트" 확인

### GABIA_USERNAME/PASSWORD:
- 가비아 웹호스팅 계정 정보
- FTP 접속 정보와 동일

### DJANGO_SECRET_KEY 생성:
```python
# Python에서 실행
import secrets
print('django-insecure-' + secrets.token_urlsafe(50))
```

### DB 정보:
- 가비아 MySQL 생성 시 설정한 정보
- 아직 미생성 시 원하는 이름으로 설정

## ✅ 설정 완료 체크리스트

- [ ] GABIA_HOST
- [ ] GABIA_USERNAME  
- [ ] GABIA_PASSWORD
- [ ] GABIA_DOMAIN
- [ ] DJANGO_SECRET_KEY
- [ ] DB_NAME
- [ ] DB_USER
- [ ] DB_PASSWORD
- [ ] TWELVE_LABS_API_KEY (임시)
- [ ] TWELVE_LABS_INDEX_ID (임시)

## 🔍 설정 확인 방법

설정 완료 후:
1. Repository → Actions 탭
2. "Deploy to Gabia Hosting" 워크플로우 확인
3. "Run workflow" 클릭하여 테스트

## ⚠️ 주의사항

- **절대 실제 비밀번호를 코드에 포함하지 마세요**
- **Secrets는 암호화되어 저장됩니다**
- **설정 후 수정 가능하지만 값은 보이지 않습니다**

## 🔄 임시값으로 시작

일부 정보를 모르더라도 임시값으로 설정 후 나중에 업데이트 가능합니다:

```
GABIA_HOST=temp-host.com
GABIA_USERNAME=temp_user
GABIA_PASSWORD=temp_password
GABIA_DOMAIN=temp-domain.com
DJANGO_SECRET_KEY=django-insecure-temp-key-123
DB_NAME=temp_db
DB_USER=temp_user
DB_PASSWORD=temp_password
TWELVE_LABS_API_KEY=temp_api_key
TWELVE_LABS_INDEX_ID=temp_index_id
```

## 📞 도움이 필요하면

특정 값을 모르겠다면 알려주세요:
- 가비아 호스팅 정보 확인 방법
- Django Secret Key 생성 방법
- 데이터베이스 설정 방법