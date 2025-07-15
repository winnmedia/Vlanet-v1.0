#!/usr/bin/env python3
"""
Railway 환경에서 테스트용 초대 생성 스크립트
"""
import requests
import json

def create_invitation_via_api():
    """API를 통한 초대 생성"""
    print("=== Railway API를 통한 초대 생성 ===")
    
    # 로그인 API 테스트 (테스트 사용자)
    login_url = "https://videoplanet.up.railway.app/api/users/login/"
    login_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    try:
        # 로그인 시도
        session = requests.Session()
        
        print("🔐 로그인 시도...")
        login_response = session.post(login_url, json=login_data)
        print(f"로그인 응답 상태: {login_response.status_code}")
        
        if login_response.status_code != 200:
            print(f"❌ 로그인 실패: {login_response.text}")
            return
        
        login_result = login_response.json()
        print(f"✅ 로그인 성공: {login_result.get('message')}")
        
        # 프로젝트 목록 조회
        print("\n📋 프로젝트 목록 조회...")
        projects_url = "https://videoplanet.up.railway.app/api/projects/"
        projects_response = session.get(projects_url)
        print(f"프로젝트 목록 응답 상태: {projects_response.status_code}")
        
        if projects_response.status_code != 200:
            print(f"❌ 프로젝트 목록 조회 실패: {projects_response.text}")
            return
        
        projects_data = projects_response.json()
        projects = projects_data.get('projects', [])
        
        if not projects:
            print("📝 프로젝트가 없습니다. 프로젝트 생성 중...")
            
            # 프로젝트 생성
            create_url = "https://videoplanet.up.railway.app/api/projects/create/"
            create_data = {
                "name": "테스트 프로젝트",
                "manager": "테스트 관리자",
                "consumer": "테스트 고객사",
                "description": "API 테스트용 프로젝트입니다."
            }
            
            create_response = session.post(create_url, json=create_data)
            print(f"프로젝트 생성 응답 상태: {create_response.status_code}")
            
            if create_response.status_code != 201:
                print(f"❌ 프로젝트 생성 실패: {create_response.text}")
                return
            
            project_result = create_response.json()
            project_id = project_result.get('project_id')
            print(f"✅ 프로젝트 생성 성공: ID {project_id}")
            
        else:
            project_id = projects[0]['id']
            print(f"✅ 기존 프로젝트 사용: ID {project_id}")
        
        # 초대 생성
        print(f"\n📨 초대 생성 중... (프로젝트 ID: {project_id})")
        invite_url = f"https://videoplanet.up.railway.app/api/projects/{project_id}/invitations/"
        invite_data = {
            "invitee_email": "invite_test@example.com",
            "message": "API 테스트용 초대입니다."
        }
        
        invite_response = session.post(invite_url, json=invite_data)
        print(f"초대 생성 응답 상태: {invite_response.status_code}")
        
        if invite_response.status_code not in [200, 201]:
            print(f"❌ 초대 생성 실패: {invite_response.text}")
            return
        
        invite_result = invite_response.json()
        invitation_id = invite_result.get('invitation_id')
        print(f"✅ 초대 생성 성공: ID {invitation_id}")
        
        # 생성된 초대 정보 조회
        print(f"\n🔍 생성된 초대 정보 조회...")
        invitations_url = f"https://videoplanet.up.railway.app/api/projects/{project_id}/invitations/"
        invitations_response = session.get(invitations_url)
        
        if invitations_response.status_code == 200:
            invitations_data = invitations_response.json()
            invitations = invitations_data.get('invitations', [])
            
            if invitations:
                invitation = invitations[0]  # 첫 번째 초대
                token = invitation.get('token')
                
                print(f"📋 초대 정보:")
                print(f"- ID: {invitation.get('id')}")
                print(f"- 토큰: {token}")
                print(f"- 상태: {invitation.get('status')}")
                print(f"- 초대 이메일: {invitation.get('invitee_email')}")
                print(f"- 만료일: {invitation.get('expires_at')}")
                
                # 토큰 조회 API 테스트
                if token:
                    print(f"\n🔗 토큰 조회 API 테스트...")
                    token_url = f"https://videoplanet.up.railway.app/api/projects/invitations/token/{token}/"
                    token_response = requests.get(token_url)  # 로그인 불필요
                    print(f"토큰 조회 응답 상태: {token_response.status_code}")
                    
                    if token_response.status_code == 200:
                        token_data = token_response.json()
                        print(f"✅ 토큰 조회 성공:")
                        print(f"- 상태: {token_data.get('status')}")
                        if 'invitation' in token_data:
                            inv_data = token_data['invitation']
                            print(f"- 프로젝트: {inv_data.get('project', {}).get('name')}")
                            print(f"- 초대자: {inv_data.get('inviter', {}).get('nickname')}")
                        
                        # 프론트엔드 URL 생성
                        frontend_url = f"https://vlanet.net/invitation/{token}"
                        print(f"\n🌐 프론트엔드 URL: {frontend_url}")
                        
                    else:
                        print(f"❌ 토큰 조회 실패: {token_response.text}")
                
            else:
                print("❌ 초대 목록이 비어있습니다.")
        else:
            print(f"❌ 초대 목록 조회 실패: {invitations_response.text}")
    
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")

if __name__ == "__main__":
    create_invitation_via_api()