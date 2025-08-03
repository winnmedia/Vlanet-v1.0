#!/usr/bin/env python3
import requests
import json

# 로그인
login_response = requests.post('http://localhost:8000/api/users/login/', 
    json={
        'email': 'ceo@winnmedia.co.kr',
        'password': 'Qwerasdf!234'
    },
    headers={'Content-Type': 'application/json'}
)

if login_response.status_code == 200:
    token = login_response.json().get('vridge_session')
    print(f"로그인 성공! 토큰: {token[:20]}...")
    
    # PDF 내보내기 테스트 데이터
    planning_data = {
        'title': 'VideoPlanet 홍보 영상',
        'project_type': 'promotional',
        'duration': '3분',
        'target_audience': '스타트업 및 중소기업',
        'genre': '홍보/마케팅',
        'concept': '혁신적인 영상 제작 플랫폼',
        'tone_manner': '전문적이고 신뢰감 있는',
        'key_message': 'AI로 영상 제작 시간을 10배 단축',
        'desired_mood': '혁신적이고 미래지향적',
        'planning_text': 'VideoPlanet은 AI 기술을 활용하여 영상 제작 과정을 혁신적으로 개선하는 플랫폼입니다. 기존 수작업으로 3-5시간 걸리던 기획 작업을 5분 만에 완성할 수 있습니다.',
        'stories': [
            {
                'phase': '기',
                'content': '영상 제작의 고민 - 시간이 너무 오래 걸리고 비용이 많이 든다',
                'key_point': '문제 제기'
            },
            {
                'phase': '승',
                'content': 'VideoPlanet의 등장 - AI가 기획부터 스토리보드까지 자동화',
                'key_point': '솔루션 소개'
            },
            {
                'phase': '전',
                'content': '실제 사용 사례 - 다양한 기업들이 제작 시간을 90% 단축',
                'key_point': '성공 사례'
            },
            {
                'phase': '결',
                'content': '지금 바로 시작하세요 - 무료 체험으로 혁신을 경험하세요',
                'key_point': 'CTA'
            }
        ],
        'scenes': [
            {
                'title': '문제 상황',
                'description': '영상 제작자가 밤늦게까지 기획서를 작성하는 모습',
                'location': '사무실',
                'storyboards': []
            },
            {
                'title': 'VideoPlanet 소개',
                'description': 'AI가 자동으로 기획안을 생성하는 화면',
                'location': '디지털 인터페이스',
                'storyboards': []
            }
        ],
        'planning_options': {
            'colorTone': 'cinematic',
            'aspectRatio': '16:9',
            'cameraType': 'cinema',
            'lensType': '35mm',
            'cameraMovement': 'dolly'
        }
    }
    
    # PDF 내보내기 요청
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    pdf_response = requests.post(
        'http://localhost:8000/api/video-planning/export/pdf/',
        headers=headers,
        json={
            'planning_data': planning_data,
            'use_enhanced_layout': True
        }
    )
    
    print(f"PDF 내보내기 응답: {pdf_response.status_code}")
    
    if pdf_response.status_code == 200:
        # PDF 파일 저장
        with open('test_export.pdf', 'wb') as f:
            f.write(pdf_response.content)
        print("PDF 파일이 test_export.pdf로 저장되었습니다.")
    else:
        print(f"오류: {pdf_response.text}")
else:
    print(f"로그인 실패: {login_response.text}")