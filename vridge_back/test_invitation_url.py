#!/usr/bin/env python3
"""
초대 URL 테스트 스크립트
"""
import os
import sys
import django
from django.conf import settings

# Django 설정 초기화
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
django.setup()

import requests
from projects.models import ProjectInvitation

def test_invitation_url():
    """초대 URL 테스트"""
    print("=== 초대 URL 테스트 ===")
    
    # 생성된 초대 조회 (가장 최근 것)
    invitation = ProjectInvitation.objects.filter(status='pending').order_by('-created').first()
    
    if not invitation:
        print("❌ 테스트할 초대가 없습니다.")
        return
    
    print(f"📋 테스트할 초대:")
    print(f"- ID: {invitation.id}")
    print(f"- 토큰: {invitation.token}")
    print(f"- 프로젝트: {invitation.project.name}")
    print(f"- 초대자: {invitation.inviter.email}")
    print(f"- 상태: {invitation.status}")
    
    # API 엔드포인트 테스트
    api_url = f"https://videoplanet.up.railway.app/api/projects/invitations/token/{invitation.token}/"
    print(f"\n🔗 API URL: {api_url}")
    
    try:
        response = requests.get(api_url)
        print(f"✅ API 응답 상태: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📄 응답 데이터:")
            print(f"- 상태: {data.get('status')}")
            print(f"- 메시지: {data.get('message', 'N/A')}")
            
            if 'invitation' in data:
                inv_data = data['invitation']
                print(f"- 초대 ID: {inv_data.get('id')}")
                print(f"- 프로젝트명: {inv_data.get('project', {}).get('name')}")
                print(f"- 초대자: {inv_data.get('inviter', {}).get('nickname')}")
        else:
            print(f"❌ API 오류: {response.status_code}")
            print(f"응답 내용: {response.text}")
            
    except Exception as e:
        print(f"❌ API 요청 실패: {str(e)}")
    
    # 프론트엔드 URL 테스트
    frontend_url = f"https://vlanet.net/invitation/{invitation.token}"
    print(f"\n🌐 프론트엔드 URL: {frontend_url}")
    
    try:
        response = requests.get(frontend_url)
        print(f"✅ 프론트엔드 응답 상태: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ 프론트엔드 페이지가 정상적으로 로드됩니다.")
        else:
            print(f"❌ 프론트엔드 오류: {response.status_code}")
            
    except Exception as e:
        print(f"❌ 프론트엔드 요청 실패: {str(e)}")

if __name__ == "__main__":
    test_invitation_url()