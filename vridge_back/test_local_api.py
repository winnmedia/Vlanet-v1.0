#!/usr/bin/env python3
"""
로컬 API 서버 테스트
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
from django.test import Client

def test_local_api():
    """로컬 API 클라이언트 테스트"""
    print("=== 로컬 API 클라이언트 테스트 ===")
    
    # 생성된 초대 조회
    invitation = ProjectInvitation.objects.filter(status='pending').order_by('-created').first()
    
    if not invitation:
        print("❌ 테스트할 초대가 없습니다.")
        return
    
    print(f"📋 테스트할 초대:")
    print(f"- ID: {invitation.id}")
    print(f"- 토큰: {invitation.token}")
    print(f"- 프로젝트: {invitation.project.name}")
    print(f"- 상태: {invitation.status}")
    
    # Django 테스트 클라이언트 사용
    client = Client()
    
    # 토큰 조회 API 테스트
    api_path = f"/api/projects/invitations/token/{invitation.token}/"
    print(f"\n🔗 API 경로: {api_path}")
    
    try:
        response = client.get(api_path)
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
                
                # 실제 프론트엔드 URL
                frontend_url = f"https://vlanet.net/invitation/{invitation.token}"
                print(f"\n🌐 프론트엔드 URL: {frontend_url}")
                print("✅ 로컬 API 테스트 성공 - 프론트엔드에서 사용 가능")
                
        else:
            print(f"❌ API 오류: {response.status_code}")
            print(f"응답 내용: {response.content.decode()}")
            
    except Exception as e:
        print(f"❌ API 테스트 실패: {str(e)}")

if __name__ == "__main__":
    test_local_api()