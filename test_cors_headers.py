#!/usr/bin/env python3
"""
CORS 헤더 테스트 스크립트
Railway 서버의 CORS 설정을 확인합니다.
"""
import requests

def test_cors_headers():
    base_url = "https://videoplanet.up.railway.app"
    origin = "https://vlanet.net"
    
    print("=" * 60)
    print("CORS 헤더 테스트")
    print("=" * 60)
    print(f"서버: {base_url}")
    print(f"Origin: {origin}")
    print()
    
    # 1. OPTIONS 요청 (Preflight)
    print("1. OPTIONS 요청 (Preflight) 테스트:")
    print("-" * 40)
    
    headers = {
        'Origin': origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,content-type',
    }
    
    try:
        response = requests.options(f"{base_url}/projects/project_list", headers=headers)
        print(f"상태 코드: {response.status_code}")
        print("\n응답 헤더:")
        for header, value in response.headers.items():
            if 'access-control' in header.lower() or 'vary' in header.lower():
                print(f"  {header}: {value}")
        
        if 'access-control-allow-origin' not in response.headers:
            print("\n⚠️  경고: Access-Control-Allow-Origin 헤더가 없습니다!")
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
    
    # 2. 실제 GET 요청
    print("\n\n2. GET 요청 테스트:")
    print("-" * 40)
    
    headers = {
        'Origin': origin,
    }
    
    try:
        response = requests.get(f"{base_url}/projects/project_list", headers=headers)
        print(f"상태 코드: {response.status_code}")
        print("\n응답 헤더:")
        for header, value in response.headers.items():
            if 'access-control' in header.lower():
                print(f"  {header}: {value}")
                
        if response.status_code == 200:
            print("\n✅ GET 요청 성공!")
        else:
            print(f"\n응답 내용: {response.text[:200]}...")
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
    
    # 3. 서버 상태 확인
    print("\n\n3. 서버 상태 확인:")
    print("-" * 40)
    
    try:
        response = requests.get(base_url)
        print(f"루트 경로 상태 코드: {response.status_code}")
        if response.status_code == 200:
            print("✅ 서버가 실행 중입니다.")
        else:
            print("⚠️  서버 응답이 예상과 다릅니다.")
    except Exception as e:
        print(f"❌ 서버 연결 실패: {e}")

if __name__ == "__main__":
    test_cors_headers()