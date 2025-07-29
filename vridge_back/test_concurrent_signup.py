#!/usr/bin/env python3
"""동시 회원가입 테스트"""
import requests
import threading
import time
import json
import random

def signup_request(thread_id):
    """회원가입 요청"""
    email = f"concurrent_test_{thread_id}_{random.randint(1000, 9999)}@example.com"
    data = {
        "email": email,
        "nickname": f"ConcurrentUser{thread_id}",
        "password": "TestPass123!"
    }
    
    start = time.time()
    try:
        response = requests.post(
            "http://localhost:8000/api/users/signup/",
            json=data,
            timeout=10
        )
        elapsed = time.time() - start
        
        return {
            "thread_id": thread_id,
            "status": response.status_code,
            "response": response.json(),
            "elapsed": elapsed,
            "email": email
        }
    except Exception as e:
        elapsed = time.time() - start
        return {
            "thread_id": thread_id,
            "status": 500,
            "error": str(e),
            "elapsed": elapsed,
            "email": email
        }

def test_concurrent_signups(num_threads=5):
    """동시 회원가입 테스트 실행"""
    print(f"Starting concurrent signup test with {num_threads} threads...")
    
    results = []
    threads = []
    
    def worker(thread_id):
        result = signup_request(thread_id)
        results.append(result)
    
    # 모든 스레드 시작
    for i in range(num_threads):
        t = threading.Thread(target=worker, args=(i,))
        threads.append(t)
        t.start()
    
    # 모든 스레드 완료 대기
    for t in threads:
        t.join()
    
    # 결과 분석
    print(f"\nTest completed. Results:")
    print("-" * 80)
    
    success_count = 0
    error_count = 0
    
    for result in sorted(results, key=lambda x: x['thread_id']):
        status = result['status']
        elapsed = result['elapsed']
        email = result['email']
        
        if status == 201:
            success_count += 1
            print(f"Thread {result['thread_id']}: SUCCESS - {email} ({elapsed:.2f}s)")
        else:
            error_count += 1
            error_msg = result.get('error', result.get('response', {}).get('message', 'Unknown error'))
            print(f"Thread {result['thread_id']}: ERROR {status} - {error_msg} ({elapsed:.2f}s)")
    
    print("-" * 80)
    print(f"Summary: {success_count} successful, {error_count} failed")
    print(f"Success rate: {success_count/num_threads*100:.1f}%")

if __name__ == "__main__":
    test_concurrent_signups(5)