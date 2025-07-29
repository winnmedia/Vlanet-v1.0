import concurrent.futures
import requests
import time
import json

def login_attempt(session_id):
    """단일 로그인 시도"""
    url = "http://localhost:8000/api/users/login/"
    data = {
        "email": "test@example.com",
        "password": "Test123!"
    }
    
    start_time = time.time()
    try:
        response = requests.post(url, json=data, timeout=5)
        end_time = time.time()
        
        return {
            "session_id": session_id,
            "status_code": response.status_code,
            "response_time": end_time - start_time,
            "success": response.status_code == 200,
            "message": response.json().get("message", "")
        }
    except Exception as e:
        end_time = time.time()
        return {
            "session_id": session_id,
            "status_code": 0,
            "response_time": end_time - start_time,
            "success": False,
            "error": str(e)
        }

def test_concurrent_requests(num_requests=10):
    """동시 요청 테스트"""
    print(f"동시 {num_requests}개 로그인 요청 테스트 시작...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_requests) as executor:
        # 동시에 요청 전송
        futures = [executor.submit(login_attempt, i) for i in range(num_requests)]
        
        # 결과 수집
        results = []
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())
    
    # 결과 분석
    successful = sum(1 for r in results if r["success"])
    failed = num_requests - successful
    avg_response_time = sum(r["response_time"] for r in results) / num_requests
    
    print(f"\n=== 동시 요청 테스트 결과 ===")
    print(f"총 요청: {num_requests}")
    print(f"성공: {successful} ({successful/num_requests*100:.1f}%)")
    print(f"실패: {failed} ({failed/num_requests*100:.1f}%)")
    print(f"평균 응답 시간: {avg_response_time:.3f}초")
    
    # 실패한 요청 상세 정보
    if failed > 0:
        print("\n실패한 요청:")
        for r in results:
            if not r["success"]:
                if "error" in r:
                    print(f"  - Session {r['session_id']}: {r.get('error', 'Unknown error')}")
                else:
                    print(f"  - Session {r['session_id']}: Status {r['status_code']}, {r.get('message', '')}")
    
    return results

if __name__ == "__main__":
    # 10개 동시 요청 테스트
    test_concurrent_requests(10)
    
    print("\n5초 대기 후 재시도...")
    time.sleep(5)
    
    # 5개 동시 요청 테스트
    test_concurrent_requests(5)