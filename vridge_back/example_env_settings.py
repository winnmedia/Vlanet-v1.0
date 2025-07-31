#!/usr/bin/env python3
"""
Rate Limiting 환경변수 설정 예제
다양한 환경에서 Rate Limiting을 제어하는 방법을 보여줍니다.
"""

# .env 파일 예제 내용들

def show_development_settings():
    """개발 환경 설정 예제"""
    print("=== 개발 환경 (.env.dev) 설정 예제 ===")
    
    env_content = """
# 개발 환경 설정
DEBUG=True
DJANGO_SETTINGS_MODULE=config.settings_dev

# Rate Limiting 완전 비활성화
RATE_LIMITING_ENABLED=False

# 개발용 화이트리스트 (광범위)
RATE_LIMIT_WHITELIST_IPS=127.0.0.1,::1,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12

# 개발용 테스트 계정
RATE_LIMIT_TEST_ACCOUNTS=test@example.com,dev@vlanet.net,admin@vlanet.net,developer@example.com
"""
    print(env_content)

def show_staging_settings():
    """스테이징 환경 설정 예제"""
    print("=== 스테이징 환경 (.env.staging) 설정 예제 ===")
    
    env_content = """
# 스테이징 환경 설정
DEBUG=False
DJANGO_SETTINGS_MODULE=config.settings

# Rate Limiting 활성화하되 관대한 설정
RATE_LIMITING_ENABLED=True

# 스테이징용 화이트리스트 (QA팀 IP 포함)
RATE_LIMIT_WHITELIST_IPS=127.0.0.1,::1,203.0.113.0/24

# 스테이징용 테스트 계정
RATE_LIMIT_TEST_ACCOUNTS=qa@vlanet.net,staging@example.com
"""
    print(env_content)

def show_production_settings():
    """운영 환경 설정 예제"""
    print("=== 운영 환경 (.env.production) 설정 예제 ===")
    
    env_content = """
# 운영 환경 설정
DEBUG=False
DJANGO_SETTINGS_MODULE=config.settings

# Rate Limiting 엄격하게 활성화
RATE_LIMITING_ENABLED=True

# 운영용 화이트리스트 (관리자 사무실 IP만)
RATE_LIMIT_WHITELIST_IPS=203.0.113.100,203.0.113.101

# 운영용 테스트 계정 (최소한)
RATE_LIMIT_TEST_ACCOUNTS=admin@vlanet.net
"""
    print(env_content)

def show_railway_settings():
    """Railway 배포 환경변수 설정 예제"""
    print("=== Railway 환경변수 설정 예제 ===")
    
    railway_vars = {
        'DEBUG': 'False',
        'DJANGO_SETTINGS_MODULE': 'config.settings.railway',
        'RATE_LIMITING_ENABLED': 'True',
        'RATE_LIMIT_WHITELIST_IPS': '127.0.0.1,::1',
        'RATE_LIMIT_TEST_ACCOUNTS': '',
        'SECRET_KEY': 'your-production-secret-key',
        'DATABASE_URL': 'postgresql://user:pass@host:port/db',
    }
    
    print("Railway 대시보드에서 설정할 환경변수:")
    for key, value in railway_vars.items():
        print(f"{key}={value}")

def show_runtime_control_examples():
    """런타임 제어 예제"""
    print("\n=== 런타임 Rate Limiting 제어 예제 ===")
    
    print("1. 긴급 상황 시 Rate Limiting 완전 비활성화:")
    print("   Railway 환경변수: RATE_LIMITING_ENABLED=False")
    print("   재배포 없이 즉시 적용")
    
    print("\n2. 특정 IP 임시 화이트리스트 추가:")
    print("   기존: RATE_LIMIT_WHITELIST_IPS=127.0.0.1,::1")
    print("   추가: RATE_LIMIT_WHITELIST_IPS=127.0.0.1,::1,203.0.113.50")
    
    print("\n3. 이벤트 기간 중 제한 완화:")
    print("   환경변수로 테스트 계정 대량 추가 가능")
    
    print("\n4. 개발팀 전용 우회 설정:")
    print("   RATE_LIMIT_TEST_ACCOUNTS=dev1@vlanet.net,dev2@vlanet.net,qa@vlanet.net")

def show_monitoring_tips():
    """모니터링 팁"""
    print("\n=== Rate Limiting 모니터링 팁 ===")
    
    print("1. 로그 확인:")
    print("   - Django 로그에서 429 상태 코드 확인")
    print("   - security.log에서 차단된 요청 분석")
    
    print("\n2. 메트릭 수집:")
    print("   - Rate limit 적중률")
    print("   - 차단된 IP 목록")
    print("   - 시간대별 요청 패턴")
    
    print("\n3. 알림 설정:")
    print("   - 비정상적인 Rate limit 적중 시 알림")
    print("   - 특정 IP의 반복적인 차단 시 알림")

def main():
    """모든 예제 출력"""
    print("Rate Limiting 환경변수 설정 가이드\n")
    
    show_development_settings()
    print("\n" + "="*60 + "\n")
    
    show_staging_settings()
    print("\n" + "="*60 + "\n")
    
    show_production_settings()
    print("\n" + "="*60 + "\n")
    
    show_railway_settings()
    print("\n" + "="*60 + "\n")
    
    show_runtime_control_examples()
    print("\n" + "="*60 + "\n")
    
    show_monitoring_tips()
    
    print("\n" + "="*60)
    print("📝 참고사항:")
    print("1. 환경변수 변경 후 서버 재시작 필요")
    print("2. Railway에서는 환경변수 변경 시 자동 재배포")
    print("3. 개발 환경에서는 RATE_LIMITING_ENABLED=False 권장")
    print("4. 운영 환경에서는 보안을 위해 엄격한 설정 유지")

if __name__ == '__main__':
    main()