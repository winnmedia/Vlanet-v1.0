# Railway PostgreSQL 연결 확인 가이드

## 1. Railway 대시보드 접속
1. https://railway.app 로그인
2. VideoPlanet 프로젝트 클릭

## 2. PostgreSQL 서비스 확인
1. 프로젝트에 PostgreSQL 서비스가 있는지 확인
   - 없다면: "New Service" → "Database" → "Add PostgreSQL" 클릭
   - 있다면: PostgreSQL 서비스 클릭

## 3. 환경변수 확인 (중요!)
1. VideoPlanet 서비스 클릭
2. "Variables" 탭 클릭
3. 다음 변수들이 있는지 확인:
   - `DATABASE_URL` (자동으로 추가되어야 함)
   - `PGDATABASE`
   - `PGHOST`
   - `PGPASSWORD`
   - `PGPORT`
   - `PGUSER`

## 4. 서비스 연결 확인
1. VideoPlanet 서비스에서 "Settings" 탭
2. "Connected Services" 섹션 확인
3. PostgreSQL이 연결되어 있는지 확인

## 5. 만약 DATABASE_URL이 없다면:
1. PostgreSQL 서비스 클릭
2. "Connect" 탭 클릭
3. "Connect to Service" 버튼 클릭
4. VideoPlanet 서비스 선택
5. "Add Connection" 클릭

## 6. 로그 확인
1. VideoPlanet 서비스에서 "Logs" 탭 클릭
2. 최근 에러 메시지 확인
3. 특히 "DATABASE_URL" 관련 에러 찾기

## 7. 수동으로 DATABASE_URL 추가 (필요시)
1. "Variables" 탭에서 "New Variable" 클릭
2. Key: `DATABASE_URL`
3. Value: PostgreSQL 서비스의 연결 문자열 복사
   (PostgreSQL → Connect → Connection String)

## 확인할 사항들:
- [ ] PostgreSQL 서비스가 생성되었는가?
- [ ] PostgreSQL 서비스가 실행 중인가? (초록색 상태)
- [ ] VideoPlanet 서비스에 DATABASE_URL이 있는가?
- [ ] 두 서비스가 연결되어 있는가?

이 단계들을 따라 확인해주세요!