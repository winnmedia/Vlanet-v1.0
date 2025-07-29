#!/usr/bin/env python3
"""
마이페이지 사용자 여정 테스트
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_mypage_journey():
    """마이페이지 전체 사용자 여정 테스트"""
    session = requests.Session()
    
    print("="*60)
    print("VideoPlanet 마이페이지 사용자 여정 테스트")
    print("="*60)
    
    # 1. 로그인
    print("\n[1단계] 사용자 로그인")
    login_data = {
        "email": "test@example.com",
        "password": "Test123!"
    }
    
    login_response = session.post(f"{BASE_URL}/api/users/login/", json=login_data)
    
    if login_response.status_code == 200:
        print("✅ 로그인 성공")
        auth_data = login_response.json()
        token = auth_data.get('vridge_session') or auth_data.get('access') or auth_data.get('token')
        
        if token:
            session.headers.update({'Authorization': f'Bearer {token}'})
            print(f"  - 토큰 설정 완료")
        else:
            print("⚠️  토큰을 찾을 수 없습니다")
            print(f"  - 응답 데이터: {auth_data}")
    else:
        print(f"❌ 로그인 실패: {login_response.status_code}")
        print(f"응답: {login_response.text}")
        return
    
    # 2. 마이페이지 정보 조회
    print("\n[2단계] 마이페이지 정보 조회")
    mypage_response = session.get(f"{BASE_URL}/api/users/mypage/")
    
    if mypage_response.status_code == 200:
        print("✅ 마이페이지 정보 조회 성공")
        mypage_data = mypage_response.json()
        
        # 데이터 검증
        if 'data' in mypage_data:
            user_info = mypage_data['data'].get('user', {})
            profile_info = mypage_data['data'].get('profile', {})
            stats_info = mypage_data['data'].get('stats', {})
            
            print(f"  - 사용자명: {user_info.get('nickname', 'N/A')}")
            print(f"  - 이메일: {user_info.get('email', 'N/A')}")
            print(f"  - 가입일: {user_info.get('date_joined', 'N/A')}")
            print(f"  - 전체 프로젝트: {stats_info.get('total_projects', 0)}개")
            print(f"  - 최근 피드백: {stats_info.get('recent_feedbacks', 0)}개")
    else:
        print(f"❌ 마이페이지 조회 실패: {mypage_response.status_code}")
        print(f"응답: {mypage_response.text}")
    
    # 3. 활동 내역 조회
    print("\n[3단계] 사용자 활동 내역 조회")
    activity_response = session.get(f"{BASE_URL}/api/users/mypage/activity/?days=30")
    
    if activity_response.status_code == 200:
        print("✅ 활동 내역 조회 성공")
        activity_data = activity_response.json()
        
        if 'data' in activity_data:
            recent_projects = activity_data['data'].get('recent_projects', [])
            recent_feedbacks = activity_data['data'].get('recent_feedbacks', [])
            
            print(f"  - 최근 프로젝트 활동: {len(recent_projects)}개")
            print(f"  - 최근 피드백 활동: {len(recent_feedbacks)}개")
    else:
        print(f"❌ 활동 내역 조회 실패: {activity_response.status_code}")
    
    # 4. 사용자 설정 조회
    print("\n[4단계] 사용자 설정 조회")
    preferences_response = session.get(f"{BASE_URL}/api/users/mypage/preferences/")
    
    if preferences_response.status_code == 200:
        print("✅ 사용자 설정 조회 성공")
        preferences_data = preferences_response.json()
        
        if 'data' in preferences_data:
            prefs = preferences_data['data']
            print(f"  - 이메일 알림: {prefs.get('email_notifications', False)}")
            print(f"  - 프로젝트 업데이트: {prefs.get('project_updates', False)}")
            print(f"  - 언어 설정: {prefs.get('language', 'ko')}")
    else:
        print(f"❌ 사용자 설정 조회 실패: {preferences_response.status_code}")
    
    # 5. 설정 업데이트 테스트
    print("\n[5단계] 사용자 설정 업데이트")
    update_data = {
        "email_notifications": False,
        "weekly_summary": True
    }
    
    update_response = session.post(f"{BASE_URL}/api/users/mypage/preferences/", json=update_data)
    
    if update_response.status_code == 200:
        print("✅ 사용자 설정 업데이트 성공")
    else:
        print(f"❌ 사용자 설정 업데이트 실패: {update_response.status_code}")
    
    # 6. 프로필 업데이트 테스트
    print("\n[6단계] 프로필 정보 업데이트")
    profile_update_data = {
        "nickname": "테스트 사용자",
        "bio": "VideoPlanet 테스트 사용자입니다.",
        "company": "테스트 회사",
        "position": "QA 엔지니어"
    }
    
    profile_response = session.patch(f"{BASE_URL}/api/users/mypage/", json=profile_update_data)
    
    if profile_response.status_code in [200, 405]:  # 405는 메서드가 구현되지 않은 경우
        if profile_response.status_code == 200:
            print("✅ 프로필 업데이트 성공")
        else:
            print("⚠️  프로필 업데이트 API 미구현")
    else:
        print(f"❌ 프로필 업데이트 실패: {profile_response.status_code}")
    
    # 7. 프로필 사진 업로드 테스트
    print("\n[7단계] 프로필 사진 업로드")
    
    # 테스트용 이미지 데이터 (1x1 픽셀 PNG)
    import io
    
    # 최소 PNG 이미지 (1x1 빨간색 픽셀)
    png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x01\xe2!\xbc3\x00\x00\x00\x00IEND\xaeB`\x82'
    
    files = {
        'profile_image': ('test_profile.png', io.BytesIO(png_data), 'image/png')
    }
    
    # multipart/form-data로 전송 (Bearer 토큰은 이미 헤더에 설정됨)
    upload_response = session.post(
        f"{BASE_URL}/api/users/profile/upload-image/",
        files=files
    )
    
    if upload_response.status_code == 200:
        print("✅ 프로필 사진 업로드 성공")
        upload_data = upload_response.json()
        if 'profile_image_url' in upload_data:
            print(f"  - 업로드된 이미지 URL: {upload_data['profile_image_url']}")
    else:
        print(f"❌ 프로필 사진 업로드 실패: {upload_response.status_code}")
        print(f"  - 응답: {upload_response.text[:200]}")
    
    # 8. 프로필 사진 삭제 테스트
    print("\n[8단계] 프로필 사진 삭제")
    
    delete_response = session.delete(f"{BASE_URL}/api/users/profile/upload-image/")
    
    if delete_response.status_code == 200:
        print("✅ 프로필 사진 삭제 성공")
    else:
        print(f"❌ 프로필 사진 삭제 실패: {delete_response.status_code}")
    
    # 9. 대용량 파일 업로드 테스트 (보안)
    print("\n[9단계] 대용량 파일 업로드 차단 테스트")
    
    # 6MB 크기의 더미 데이터 생성 (제한: 5MB)
    large_data = b'x' * (6 * 1024 * 1024)  # 6MB
    
    large_files = {
        'profile_image': ('large_test.png', io.BytesIO(large_data), 'image/png')
    }
    
    large_upload_response = session.post(
        f"{BASE_URL}/api/users/profile/upload-image/",
        files=large_files
    )
    
    if large_upload_response.status_code in [400, 413]:
        print("✅ 대용량 파일 업로드 차단 성공")
    else:
        print(f"❌ 보안 취약점: 대용량 파일이 차단되지 않음 (상태 코드: {large_upload_response.status_code})")
    
    # 10. 잘못된 파일 형식 업로드 테스트
    print("\n[10단계] 잘못된 파일 형식 차단 테스트")
    
    malicious_files = {
        'profile_image': ('test.exe', b'MZ\x90\x00\x03', 'application/x-msdownload')
    }
    
    malicious_response = session.post(
        f"{BASE_URL}/api/users/profile/upload-image/",
        files=malicious_files
    )
    
    if malicious_response.status_code == 400:
        print("✅ 악성 파일 업로드 차단 성공")
    else:
        print(f"❌ 보안 취약점: 악성 파일이 차단되지 않음 (상태 코드: {malicious_response.status_code})")
    
    # 11. 보안 테스트
    print("\n[11단계] 보안 테스트")
    
    # 미인증 접근 테스트
    unauth_session = requests.Session()
    unauth_response = unauth_session.get(f"{BASE_URL}/api/users/mypage/")
    
    if unauth_response.status_code == 401:
        print("✅ 미인증 접근 차단 성공")
    else:
        print(f"❌ 보안 취약점: 미인증 접근이 차단되지 않음 (상태 코드: {unauth_response.status_code})")
    
    # 12. 성능 테스트
    print("\n[12단계] 성능 테스트")
    import time
    
    start_time = time.time()
    perf_response = session.get(f"{BASE_URL}/api/users/mypage/")
    end_time = time.time()
    
    response_time = end_time - start_time
    print(f"  - 마이페이지 응답 시간: {response_time:.3f}초")
    
    if response_time < 1.0:
        print("✅ 성능 기준 충족 (1초 이내)")
    else:
        print("⚠️  성능 개선 필요 (1초 초과)")
    
    print("\n" + "="*60)
    print("마이페이지 사용자 여정 테스트 완료")
    print("="*60)

if __name__ == "__main__":
    test_mypage_journey()