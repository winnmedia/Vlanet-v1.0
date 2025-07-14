import requests
import json

# API 기본 URL
API_BASE_URL = "http://localhost:8000"

# 테스트용 로그인 정보
test_credentials = {
    "email": "test@example.com",
    "password": "testpass123"
}

def test_video_planning():
    print("🎬 VideoPlanet 영상 기획 AI 테스트")
    print("=" * 50)
    
    # 1. 로그인
    print("\n1. 로그인 시도...")
    login_response = requests.post(
        f"{API_BASE_URL}/users/login",
        json=test_credentials
    )
    
    if login_response.status_code != 200:
        print(f"❌ 로그인 실패: {login_response.status_code}")
        print(login_response.text)
        return
    
    login_data = login_response.json()
    access_token = login_data.get('vridge_session')  # vridge_session이 액세스 토큰
    print("✅ 로그인 성공")
    
    # 헤더 설정
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # 2. 구성안 생성 테스트
    print("\n2. AI 구성안 생성 테스트...")
    planning_input = """
    20대 직장인을 위한 스마트 워치 프로모션 영상을 제작하려고 합니다.
    제품의 핵심 기능은 건강 관리와 업무 생산성 향상입니다.
    영상 길이는 1분 30초 정도로 계획하고 있습니다.
    """
    
    structure_response = requests.post(
        f"{API_BASE_URL}/api/video-planning/generate/structure/",
        json={"planning_input": planning_input},
        headers=headers
    )
    
    if structure_response.status_code != 200:
        print(f"❌ 구성안 생성 실패: {structure_response.status_code}")
        print(structure_response.text)
        return
    
    structure_data = structure_response.json()
    print("✅ 구성안 생성 성공")
    print(f"   제목: {structure_data['data'].get('title', 'N/A')}")
    print(f"   섹션 수: {len(structure_data['data'].get('sections', []))}")
    
    # 3. 스토리 생성 테스트
    print("\n3. AI 스토리 생성 테스트...")
    story_response = requests.post(
        f"{API_BASE_URL}/api/video-planning/generate/story/",
        json={"structure_data": structure_data['data']},
        headers=headers
    )
    
    if story_response.status_code != 200:
        print(f"❌ 스토리 생성 실패: {story_response.status_code}")
        print(story_response.text)
        return
    
    story_data = story_response.json()
    print("✅ 스토리 생성 성공")
    print(f"   장르: {story_data['data'].get('genre', 'N/A')}")
    print(f"   톤: {story_data['data'].get('tone', 'N/A')}")
    
    # 4. 쇼트 생성 테스트
    print("\n4. AI 쇼트 리스트 생성 테스트...")
    shots_response = requests.post(
        f"{API_BASE_URL}/api/video-planning/generate/shots/",
        json={"story_data": story_data['data']},
        headers=headers
    )
    
    if shots_response.status_code != 200:
        print(f"❌ 쇼트 생성 실패: {shots_response.status_code}")
        print(shots_response.text)
        return
    
    shots_data = shots_response.json()
    print("✅ 쇼트 생성 성공")
    print(f"   총 쇼트 수: {len(shots_data['data'].get('shots', []))}")
    print(f"   예상 시간: {shots_data['data'].get('estimated_duration', 'N/A')}")
    
    print("\n" + "=" * 50)
    print("🎉 모든 테스트 통과!")
    
    # 결과 상세 출력
    print("\n📋 생성된 내용 요약:")
    print("\n[구성안]")
    for i, section in enumerate(structure_data['data'].get('sections', [])[:3]):
        print(f"   {i+1}. {section.get('title', 'N/A')}")
    
    print("\n[스토리]")
    story_text = story_data['data'].get('story', '')
    if story_text:
        print(f"   {story_text[:100]}...")
    
    print("\n[쇼트 리스트]")
    for i, shot in enumerate(shots_data['data'].get('shots', [])[:3]):
        print(f"   Shot {i+1}: {shot.get('type', 'N/A')} - {shot.get('description', 'N/A')[:50]}...")

if __name__ == "__main__":
    test_video_planning()