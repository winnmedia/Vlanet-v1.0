#!/usr/bin/env python3
"""서버 연결 테스트 스크립트"""
import requests
import json

print("VideoPlanet 서버 연결 테스트")
print("=" * 50)

# 테스트할 URL들
urls = [
    "https://videoplanet.up.railway.app/",
    "https://videoplanet.up.railway.app/health/",
    "https://videoplanet.up.railway.app/cors-test/",
    "https://videoplanet.up.railway.app/public/projects/",
    "https://videoplanet.up.railway.app/users/check_email",
]

headers = {
    'Origin': 'https://vlanet.net',
    'Content-Type': 'application/json',
}

for url in urls:
    print(f"\n테스트: {url}")
    try:
        if 'check_email' in url:
            # POST 요청
            response = requests.post(url, 
                json={'email': 'test@example.com'}, 
                headers=headers,
                timeout=10
            )
        else:
            # GET 요청
            response = requests.get(url, headers=headers, timeout=10)
        
        print(f"  상태 코드: {response.status_code}")
        print(f"  응답 시간: {response.elapsed.total_seconds()}초")
        
        # CORS 헤더 확인
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin', 'Not set'),
            'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials', 'Not set'),
        }
        print("  CORS 헤더:")
        for header, value in cors_headers.items():
            print(f"    {header}: {value}")
        
        # 응답 내용 (짧게)
        try:
            content = response.json()
            print(f"  응답: {json.dumps(content, ensure_ascii=False)[:100]}...")
        except:
            print(f"  응답: {response.text[:100]}...")
            
    except requests.exceptions.ConnectionError:
        print("  ❌ 연결 실패: 서버에 연결할 수 없습니다")
    except requests.exceptions.Timeout:
        print("  ❌ 시간 초과: 서버가 응답하지 않습니다")
    except Exception as e:
        print(f"  ❌ 오류: {type(e).__name__}: {str(e)}")

print("\n" + "=" * 50)
print("테스트 완료")