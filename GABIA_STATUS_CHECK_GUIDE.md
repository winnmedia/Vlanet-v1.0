# 📋 가비아 호스팅 상태 확인 가이드

## 1️⃣ My가비아에서 기본 정보 확인

### 접속 방법:
1. **My가비아 로그인**: https://my.gabia.com
   - ID: winnmedia
   - PW: dnlsdos123$

2. **서비스 관리** → **웹호스팅** 클릭

3. **vlanet.net 호스팅** 찾아서 **"관리"** 버튼 클릭

### 확인할 항목들:

## 2️⃣ SSH 접속 상태 확인

### 호스팅 관리 페이지에서:
1. **SSH 접속 관리** 메뉴 클릭
2. 확인사항:
   - ✅ SSH 접속: **활성화** 상태인지
   - 📍 접속 정보:
     - 호스트: winnmedia 또는 vlanet.net
     - 포트: 22
     - 사용자: sukkeun17

### SSH 접속 테스트 (Windows):
1. **명령 프롬프트** 또는 **PowerShell** 열기
2. 다음 명령어 입력:
```bash
ssh sukkeun17@winnmedia
# 또는
ssh sukkeun17@vlanet.net
```
3. 비밀번호: dnlsdos123$

## 3️⃣ FTP/파일관리자로 파일 확인

### 방법 1: 가비아 웹 파일관리자
1. **호스팅 관리** → **파일 관리자** 클릭
2. 웹에서 바로 파일 확인 가능
3. 확인할 디렉토리:
   ```
   /htdocs/ (또는 /public_html/ 또는 /www/)
   └── index.html이 있는지 확인
   
   /videoplanet/
   └── Django 파일들이 있는지 확인
   ```

### 방법 2: FileZilla로 확인
1. **FileZilla** 실행
2. 연결 정보:
   - 호스트: winnmedia
   - 사용자명: sukkeun17
   - 비밀번호: dnlsdos123$
   - 포트: 21

## 4️⃣ 웹 루트 디렉토리 위치 확인

### 가비아 호스팅 관리에서:
1. **기본 정보** 또는 **호스팅 정보** 메뉴
2. **Document Root** 또는 **웹 루트** 확인
3. 일반적으로:
   - `/htdocs/`
   - `/public_html/`
   - `/www/`
   - `/home/sukkeun17/www/`

## 5️⃣ 데이터베이스 상태 확인

### MySQL 관리:
1. **데이터베이스 관리** → **MySQL 관리**
2. 확인사항:
   - DB명: dbwinnmedia
   - 사용자: winnmedia
   - 호스트: db.winnmedia.co.kr

## 6️⃣ 로그 확인

### 에러 로그 위치:
1. **호스팅 관리** → **로그 관리**
2. 또는 FTP로 접속해서:
   - `/logs/error.log`
   - `/logs/access.log`

## 7️⃣ 도메인 연결 상태

### DNS 설정 확인:
1. **도메인 관리** 메뉴
2. vlanet.net의 네임서버가 가비아로 설정되어 있는지 확인

## 🚨 체크리스트

- [ ] SSH 접속 활성화 여부
- [ ] 웹 루트 디렉토리 위치 (htdocs? public_html? www?)
- [ ] 파일이 업로드되어 있는지
- [ ] 데이터베이스 연결 정보
- [ ] 에러 로그 확인

## 💡 빠른 테스트

### 간단한 HTML 파일 업로드 테스트:
1. 가비아 파일관리자에서 웹 루트에 `test.html` 생성:
```html
<!DOCTYPE html>
<html>
<head>
    <title>테스트</title>
</head>
<body>
    <h1>가비아 호스팅 작동 확인!</h1>
</body>
</html>
```

2. 브라우저에서 확인:
   - http://vlanet.net/test.html

## 📞 가비아 지원

확인이 어려우면:
- **전화**: 1588-7535
- **채팅**: My가비아 내 실시간 채팅
- **이메일**: help@gabia.com