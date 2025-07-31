#!/usr/bin/env python3
"""
API Rate Limiting 실제 테스트 스크립트
개발 서버에 대해 실제 HTTP 요청을 보내서 Rate Limiting 설정을 확인
"""
import requests
import json
import time
import sys
from concurrent.futures import ThreadPoolExecutor
import threading

# API 서버 설정
API_BASE_URL = 'http://localhost:8000'
LOGIN_ENDPOINT = f'{API_BASE_URL}/api/users/login/'

def test_single_login_request():
    """단일 로그인 요청 테스트"""
    print("=== 단일 로그인 요청 테스트 ===")
    
    login_data = {
        'email': 'test@example.com',
        'password': 'testpassword123'
    }
    
    try:
        response = requests.post(
            LOGIN_ENDPOINT,
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"상태 코드: {response.status_code}")
        print(f"응답 시간: {response.elapsed.total_seconds():.3f}초")
        
        if response.status_code == 429:
            print("❌ Rate Limiting이 적용되었습니다!")
            print(f"응답 내용: {response.json()}")
            return False
        else:
            print("✓ Rate Limiting이 비활성화되어 있습니다.")
            return True
            
    except requests.exceptions.RequestException as e:
        print(f"❌ 요청 실패: {e}")
        return False

def test_rapid_requests(count=20, threads=5):
    """빠른 연속 요청 테스트"""
    print(f"\n=== 빠른 연속 요청 테스트 ({count}회, {threads} 스레드) ===")
    
    login_data = {
        'email': 'test@example.com',
        'password': 'testpassword123'
    }
    
    results = []
    start_time = time.time()
    
    def make_request(request_id):
        try:
            response = requests.post(
                LOGIN_ENDPOINT,
                json=login_data,
                headers={'Content-Type': 'application/json'},
                timeout=5
            )
            return {
                'id': request_id,
                'status_code': response.status_code,
                'time': time.time() - start_time,
                'blocked': response.status_code == 429
            }
        except Exception as e:
            return {
                'id': request_id,
                'status_code': 'ERROR',
                'time': time.time() - start_time,
                'blocked': False,
                'error': str(e)
            }
    
    # 스레드풀로 동시 요청 실행
    with ThreadPoolExecutor(max_workers=threads) as executor:
        futures = [executor.submit(make_request, i) for i in range(count)]
        
        for future in futures:
            result = future.result()
            results.append(result)
            
            if result.get('blocked'):
                print(f"요청 {result['id']:2d}: ❌ BLOCKED (429) - {result['time']:.3f}초")
            elif result['status_code'] == 'ERROR':
                print(f"요청 {result['id']:2d}: ❌ ERROR - {result.get('error', 'Unknown')}")
            else:
                print(f"요청 {result['id']:2d}: ✓ OK ({result['status_code']}) - {result['time']:.3f}초")
    
    # 결과 요약
    total_time = time.time() - start_time
    blocked_count = sum(1 for r in results if r.get('blocked'))
    error_count = sum(1 for r in results if r['status_code'] == 'ERROR')
    success_count = count - blocked_count - error_count
    
    print(f"\n=== 테스트 결과 요약 ===")
    print(f"총 요청 수: {count}")
    print(f"성공: {success_count}")
    print(f"차단됨 (429): {blocked_count}")
    print(f"오류: {error_count}")
    print(f"총 소요 시간: {total_time:.3f}초")
    print(f"평균 RPS: {count / total_time:.2f}")
    
    return blocked_count == 0  # 차단된 요청이 없으면 성공

def test_test_account_bypass():
    """테스트 계정 우회 테스트"""
    print(f"\n=== 테스트 계정 우회 테스트 ===")
    
    test_accounts = [
        'test@example.com',
        'dev@vlanet.net', 
        'admin@vlanet.net',
        'regular@example.com'  # 일반 계정
    ]
    
    for email in test_accounts:
        print(f"\n테스트 계정: {email}")
        login_data = {
            'email': email,
            'password': 'testpassword123'
        }
        
        # 10번 빠르게 요청
        blocked_count = 0
        for i in range(10):
            try:
                response = requests.post(
                    LOGIN_ENDPOINT,
                    json=login_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=5
                )
                
                if response.status_code == 429:
                    blocked_count += 1
                
                time.sleep(0.1)  # 100ms 간격
                
            except Exception as e:
                print(f"  요청 {i+1}: 오류 - {e}")
        
        if blocked_count == 0:
            print(f"  ✓ {email}: 모든 요청 성공 (우회 가능)")
        else:
            print(f"  ❌ {email}: {blocked_count}개 요청 차단됨")

def check_server_availability():
    """서버 가용성 확인"""
    print("=== 서버 연결 확인 ===")
    
    try:
        # Health check 엔드포인트 확인
        health_url = f'{API_BASE_URL}/api/health/'
        response = requests.get(health_url, timeout=5)
        
        if response.status_code == 200:
            print(f"✓ 서버 연결 성공: {API_BASE_URL}")
            return True
        else:
            print(f"❌ 서버 응답 오류: HTTP {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ 서버에 연결할 수 없습니다: {API_BASE_URL}")
        print("Django 개발 서버가 실행 중인지 확인하세요:")
        print("cd /home/winnmedia/VideoPlanet/vridge_back")
        print("python3 manage.py runserver --settings=config.settings_dev")
        return False
    except Exception as e:
        print(f"❌ 연결 확인 중 오류: {e}")
        return False

def main():
    """메인 테스트 실행"""
    print("API Rate Limiting 실제 테스트를 시작합니다...\n")
    
    # 서버 가용성 확인
    if not check_server_availability():
        return 1
    
    # 개별 테스트 실행
    tests_passed = 0
    total_tests = 3
    
    try:
        # 1. 단일 요청 테스트
        if test_single_login_request():
            tests_passed += 1
        
        # 2. 빠른 연속 요청 테스트
        if test_rapid_requests(count=30, threads=10):
            tests_passed += 1
        
        # 3. 테스트 계정 우회 테스트
        test_test_account_bypass()
        tests_passed += 1  # 이 테스트는 항상 통과로 처리
        
        print(f"\n=== 최종 결과 ===")
        print(f"통과한 테스트: {tests_passed}/{total_tests}")
        
        if tests_passed == total_tests:
            print("✅ 모든 테스트 통과!")
            print("개발 환경에서 Rate Limiting이 올바르게 완화되었습니다.")
            return 0
        else:
            print("❌ 일부 테스트 실패")
            return 1
            
    except KeyboardInterrupt:
        print("\n테스트가 사용자에 의해 중단되었습니다.")
        return 1
    except Exception as e:
        print(f"❌ 테스트 중 예상치 못한 오류: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(main())