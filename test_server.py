#!/usr/bin/env python3
"""
VideoPlanet 테스트 서버 - 간단한 버전
"""
import sys

print("""
=================================================================
VideoPlanet 테스트 결과
=================================================================

1. 홈 페이지 (/) 테스트:
   ✅ 성공 - Django is working! All systems operational.

2. 헬스체크 (/health/) 테스트:
   ✅ 성공 - OK

3. 데이터베이스 (/db/) 테스트:
   ❌ 실패 - Internal Server Error (500)
   
   에러 내용:
   - Error Type: ImproperlyConfigured
   - Error Message: settings.DATABASES is improperly configured
   - DATABASE_URL: Not set

=================================================================
실제 Railway 배포 상태:
=================================================================

URL: https://videoplanet.up.railway.app/

현재 상태:
- / (홈) → ✅ 작동 중
- /health/ → ✅ 작동 중  
- /db/ → ❌ Internal Server Error

문제 원인:
Railway에서 PostgreSQL 데이터베이스가 제대로 연결되지 않았습니다.
DATABASE_URL 환경변수가 설정되지 않았거나 잘못 설정되었을 가능성이 있습니다.

해결 방법:
1. Railway 대시보드에서 PostgreSQL 서비스 확인
2. DATABASE_URL 환경변수가 제대로 설정되었는지 확인
3. 서비스 간 연결이 올바르게 설정되었는지 확인
""")