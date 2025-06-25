# Railway PostgreSQL 설정 방법

## 방법 1: PostgreSQL 서비스가 이미 있는 경우

1. **PostgreSQL 서비스 클릭**
2. **"Connect" 탭 클릭**
3. **"Available Variables" 섹션에서 연결 정보 확인**
4. **"Connect to Service" 버튼 클릭**
5. **"videoplanet" (또는 앱 이름) 선택**
6. **"Add Connection" 클릭**

이렇게 하면 자동으로 DATABASE_URL이 추가됩니다!

## 방법 2: PostgreSQL 서비스가 없는 경우

1. **프로젝트에서 "New Service" 클릭**
2. **"Database" 선택**
3. **"Add PostgreSQL" 클릭**
4. **PostgreSQL이 생성되면 위의 방법 1 따라하기**

## 방법 3: 수동으로 DATABASE_URL 추가

1. **PostgreSQL 서비스 → "Connect" 탭**
2. **"Postgres Connection URL" 복사** (postgresql://... 로 시작하는 긴 문자열)
3. **VideoPlanet 서비스 → "Variables" 탭**
4. **"New Variable" 클릭**
5. **입력:**
   - Key: `DATABASE_URL`
   - Value: 복사한 PostgreSQL URL 붙여넣기
6. **"Add" 클릭**

## 확인 방법
1. VideoPlanet 서비스 → "Variables" 탭
2. DATABASE_URL이 추가되었는지 확인
3. 서비스가 자동으로 재시작됨
4. 2-3분 후 https://videoplanet.up.railway.app/db/ 다시 테스트

## 주의사항
- DATABASE_URL은 보안상 숨겨져 있습니다 (●●●●로 표시)
- 연결 후 서비스가 자동으로 재배포됩니다
- 재배포에 2-3분 소요됩니다