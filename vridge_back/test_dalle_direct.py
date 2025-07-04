import os
import sys
import requests
import json
import time
from datetime import datetime

# Django 환경 설정
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_base')

import django
django.setup()

# API 기본 URL
API_BASE_URL = "https://videoplanet.up.railway.app"

# 테스트용 로그인 정보
test_credentials = {
    "email": "test@example.com",
    "password": "testpass123"
}

def print_colored(text, color):
    colors = {
        'green': '\x1b[32m',
        'red': '\x1b[31m',
        'yellow': '\x1b[33m',
        'blue': '\x1b[34m',
        'magenta': '\x1b[35m',
        'cyan': '\x1b[36m',
        'reset': '\x1b[0m'
    }
    print(f"{colors.get(color, '')}{text}{colors['reset']}")

def test_server_health():
    """서버 상태 확인"""
    print_colored("\n1. 서버 헬스 체크", "yellow")
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=10)
        if response.status_code in [200, 404]:
            print_colored("✓ 서버가 정상적으로 실행 중입니다.", "green")
            return True
        else:
            print_colored(f"✗ 서버 응답 코드: {response.status_code}", "red")
            return False
    except Exception as e:
        print_colored(f"✗ 서버 연결 실패: {str(e)}", "red")
        return False

def test_dalle_image_generation():
    """DALL-E 이미지 생성 테스트"""
    print_colored("\n🎨 DALL-E 이미지 생성 직접 테스트", "blue")
    print("=" * 70)
    
    # 1. 서버 상태 확인
    if not test_server_health():
        return
    
    # 2. 로그인
    print_colored("\n2. 로그인 시도...", "yellow")
    login_response = requests.post(
        f"{API_BASE_URL}/users/login",
        json=test_credentials
    )
    
    if login_response.status_code != 200:
        # 회원가입 시도
        print_colored("로그인 실패, 회원가입 시도...", "yellow")
        signup_data = {
            "email": test_credentials["email"],
            "password": test_credentials["password"],
            "password_confirm": test_credentials["password"],
            "name": "Test User",
            "company": "Test Company"
        }
        signup_response = requests.post(
            f"{API_BASE_URL}/users/signup",
            json=signup_data
        )
        if signup_response.status_code == 201:
            print_colored("✓ 회원가입 성공", "green")
            # 다시 로그인
            login_response = requests.post(
                f"{API_BASE_URL}/users/login",
                json=test_credentials
            )
        else:
            print_colored(f"✗ 회원가입 실패: {signup_response.text}", "red")
            return
    
    if login_response.status_code != 200:
        print_colored(f"✗ 로그인 실패: {login_response.status_code}", "red")
        return
    
    login_data = login_response.json()
    access_token = login_data.get('vridge_session')
    print_colored("✓ 로그인 성공", "green")
    
    # 헤더 설정
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # 3. 테스트 시나리오
    print_colored("\n3. 영상 기획 생성 및 DALL-E 이미지 생성 테스트", "yellow")
    
    # 기획안 입력
    planning_input = """
    청년이 스마트 워치를 착용하고 도심 공원에서 조깅하는 장면.
    배경은 아침 햇살이 비치는 공원이며, 건강한 라이프스타일을 강조합니다.
    """
    
    print_colored(f"\n기획안: {planning_input.strip()}", "cyan")
    
    # 4. 스토리 생성
    print_colored("\n4. 스토리 생성 중...", "yellow")
    story_response = requests.post(
        f"{API_BASE_URL}/api/video-planning/generate/story/",
        json={"planning_text": planning_input},
        headers=headers
    )
    
    if story_response.status_code != 200:
        print_colored(f"✗ 스토리 생성 실패: {story_response.text}", "red")
        return
    
    story_data = story_response.json()['data']
    print_colored("✓ 스토리 생성 성공", "green")
    
    # 5. 씬 생성
    print_colored("\n5. 씬 생성 중...", "yellow")
    scenes_response = requests.post(
        f"{API_BASE_URL}/api/video-planning/generate/scenes/",
        json={"story_data": story_data['stories'][0]},
        headers=headers
    )
    
    if scenes_response.status_code != 200:
        print_colored(f"✗ 씬 생성 실패: {scenes_response.text}", "red")
        return
    
    scenes_data = scenes_response.json()['data']
    print_colored("✓ 씬 생성 성공", "green")
    
    # 6. 샷 생성
    print_colored("\n6. 샷 생성 중...", "yellow")
    shots_response = requests.post(
        f"{API_BASE_URL}/api/video-planning/generate/shots/",
        json={"scene_data": scenes_data['scenes'][0]},
        headers=headers
    )
    
    if shots_response.status_code != 200:
        print_colored(f"✗ 샷 생성 실패: {shots_response.text}", "red")
        return
    
    shots_data = shots_response.json()['data']
    print_colored("✓ 샷 생성 성공", "green")
    
    # 7. 스토리보드 생성 (DALL-E 이미지 포함)
    print_colored("\n7. 스토리보드 및 DALL-E 이미지 생성 중...", "yellow")
    storyboard_response = requests.post(
        f"{API_BASE_URL}/api/video-planning/generate/storyboards/",
        json={"shot_data": shots_data['shots'][0]},
        headers=headers
    )
    
    if storyboard_response.status_code != 200:
        print_colored(f"✗ 스토리보드 생성 실패: {storyboard_response.text}", "red")
        return
    
    storyboard_data = storyboard_response.json()['data']
    print_colored("✓ 스토리보드 생성 성공", "green")
    
    # 8. 생성된 이미지 분석
    print_colored("\n8. 생성된 이미지 분석", "yellow")
    print("=" * 70)
    
    storyboards = storyboard_data.get('storyboards', [])
    for i, frame in enumerate(storyboards):
        print_colored(f"\n프레임 {i+1}: {frame.get('title', 'N/A')}", "magenta")
        print(f"  설명: {frame.get('visual_description', 'N/A')}")
        
        image_url = frame.get('image_url')
        if image_url:
            print_colored(f"  ✓ 이미지 URL 존재", "green")
            
            # 이미지 타입 확인
            if image_url.startswith('data:image'):
                print_colored("  → 타입: Base64 인코딩된 이미지", "cyan")
                # Base64 크기 확인
                image_size = len(image_url.split(',')[1]) if ',' in image_url else 0
                print(f"  → 크기: {image_size:,} bytes")
            elif image_url.startswith('http'):
                print_colored("  → 타입: 외부 URL", "cyan")
                print(f"  → URL: {image_url[:100]}...")
            
            # 모델 정보
            model_used = frame.get('model_used', 'unknown')
            print(f"  → 모델: {model_used}")
            
            # 프롬프트 정보
            prompt_used = frame.get('prompt_used', '')
            if prompt_used:
                print(f"  → 프롬프트: {prompt_used[:100]}...")
            
            # 플레이스홀더 여부
            if frame.get('is_placeholder'):
                print_colored("  ⚠️  플레이스홀더 이미지입니다", "yellow")
            
            # 이미지 다운로드 및 분석 시도
            if image_url.startswith('http'):
                try:
                    img_response = requests.get(image_url, timeout=10)
                    if img_response.status_code == 200:
                        content_type = img_response.headers.get('content-type', '')
                        print(f"  → Content-Type: {content_type}")
                        print(f"  → 실제 크기: {len(img_response.content):,} bytes")
                        
                        # 이미지 파일로 저장해서 확인
                        test_filename = f"test_frame_{i+1}_{int(time.time())}.png"
                        with open(test_filename, 'wb') as f:
                            f.write(img_response.content)
                        print_colored(f"  → 테스트 이미지 저장됨: {test_filename}", "green")
                except Exception as e:
                    print_colored(f"  ✗ 이미지 다운로드 실패: {str(e)}", "red")
        else:
            print_colored("  ✗ 이미지 URL 없음", "red")
            if frame.get('image_error'):
                print(f"  → 에러: {frame['image_error']}")
    
    # 9. 이미지 재생성 테스트
    if storyboards and storyboards[0].get('image_url'):
        print_colored("\n9. 이미지 재생성 테스트", "yellow")
        frame_data = {
            "frame_number": 1,
            "title": "테스트 재생성",
            "visual_description": "공원에서 조깅하는 청년의 클로즈업 샷",
            "composition": "클로즈업",
            "lighting": "자연광"
        }
        
        regen_response = requests.post(
            f"{API_BASE_URL}/api/video-planning/regenerate-storyboard-image/",
            json={"frame_data": frame_data},
            headers=headers
        )
        
        if regen_response.status_code == 200:
            regen_data = regen_response.json()['data']
            print_colored("✓ 이미지 재생성 성공", "green")
            new_image_url = regen_data.get('image_url')
            if new_image_url and new_image_url.startswith('data:image'):
                print("  → 새 이미지가 Base64로 생성됨")
        else:
            print_colored(f"✗ 이미지 재생성 실패: {regen_response.text}", "red")
    
    print_colored("\n\n🎉 테스트 완료!", "blue")
    print("=" * 70)
    
    # 요약
    print_colored("\n📊 테스트 결과 요약:", "yellow")
    total_frames = len(storyboards)
    frames_with_images = sum(1 for f in storyboards if f.get('image_url'))
    dalle_images = sum(1 for f in storyboards if f.get('model_used') == 'dall-e-3')
    placeholder_images = sum(1 for f in storyboards if f.get('is_placeholder'))
    
    print(f"  - 총 프레임 수: {total_frames}")
    print(f"  - 이미지가 있는 프레임: {frames_with_images}")
    print(f"  - DALL-E 3 이미지: {dalle_images}")
    print(f"  - 플레이스홀더 이미지: {placeholder_images}")
    
    if dalle_images > 0:
        print_colored("\n✅ DALL-E 이미지 생성이 정상적으로 작동하고 있습니다!", "green")
        print("   생성된 이미지는 실제 일러스트레이션입니다.")
    else:
        print_colored("\n⚠️  DALL-E 이미지 생성에 문제가 있을 수 있습니다.", "yellow")
        print("   플레이스홀더나 대체 이미지가 사용되고 있습니다.")

if __name__ == "__main__":
    test_dalle_image_generation()