#!/usr/bin/env python3
"""
테스트용 프로젝트 초대 생성 및 URL 검증 스크립트
"""
import os
import sys
import django
from django.conf import settings

# Django 설정 초기화 - Railway 설정 사용
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
django.setup()

from projects.models import Project, ProjectInvitation
from users.models import User
from django.utils import timezone
from datetime import timedelta
import secrets

def test_invitation_creation():
    """테스트용 초대 생성"""
    print("=== 테스트용 프로젝트 초대 생성 ===")
    
    # 테스트용 사용자와 프로젝트 조회
    users = User.objects.all()[:3]  # 최대 3명의 사용자 조회
    projects = Project.objects.all()[:3]  # 최대 3개의 프로젝트 조회
    
    print(f"📋 등록된 사용자 목록 ({users.count()}명):")
    for i, user in enumerate(users, 1):
        print(f"  {i}. {user.username} ({user.email}) - 가입일: {user.date_joined}")
    
    print(f"\n📋 등록된 프로젝트 목록 ({projects.count()}개):")
    for i, project in enumerate(projects, 1):
        print(f"  {i}. {project.name} (소유자: {project.user.username}) - 생성일: {project.created}")
    
    # 첫 번째 사용자와 프로젝트 선택
    user = users[0] if users else None
    project = projects[0] if projects else None
    
    print(f"\n선택된 사용자: {user}")
    print(f"선택된 프로젝트: {project}")
    
    # 프로젝트가 없으면 생성
    if not project and user:
        print("📝 테스트용 프로젝트 생성 중...")
        project = Project.objects.create(
            user=user,
            name="테스트 프로젝트",
            manager="테스트 관리자",
            consumer="테스트 고객사",
            description="테스트용 프로젝트입니다."
        )
        print(f"✅ 프로젝트 생성 완료: {project}")
    
    if not user or not project:
        print("❌ 테스트용 사용자나 프로젝트가 없습니다.")
        return None
    
    # 현재 ProjectInvitation 모델 필드 확인
    print("\n📋 ProjectInvitation 모델 필드:")
    for field in ProjectInvitation._meta.fields:
        print(f"- {field.name}: {field.__class__.__name__}")
    
    # 테스트용 초대 생성
    test_email = 'test@example.com'
    
    # 기존 초대 삭제 (테스트용)
    ProjectInvitation.objects.filter(
        project=project,
        invitee_email=test_email
    ).delete()
    
    # 토큰 생성
    token = secrets.token_urlsafe(32)
    
    # 초대 생성
    invitation = ProjectInvitation.objects.create(
        project=project,
        inviter=user,
        invitee_email=test_email,
        message='테스트용 초대 메시지입니다.',
        token=token,
        expires_at=timezone.now() + timedelta(days=7)
    )
    
    print(f"\n✅ 초대 생성 완료:")
    print(f"- ID: {invitation.id}")
    print(f"- 토큰: {invitation.token}")
    print(f"- 상태: {invitation.status}")
    print(f"- 만료일: {invitation.expires_at}")
    print(f"- 초대 이메일: {invitation.invitee_email}")
    print(f"- 프로젝트: {invitation.project.name}")
    print(f"- 초대자: {invitation.inviter.email}")
    
    # 초대 URL 생성
    base_url = 'https://vlanet.net'
    invitation_url = f'{base_url}/invitation/{invitation.token}'
    print(f"\n🔗 초대 URL: {invitation_url}")
    
    return invitation

def test_invitation_verification():
    """초대 토큰 검증 테스트"""
    print("\n=== 초대 토큰 검증 테스트 ===")
    
    # 최신 초대 조회
    invitation = ProjectInvitation.objects.filter(
        status='pending'
    ).first()
    
    if not invitation:
        print("❌ 테스트할 초대가 없습니다.")
        return
    
    print(f"📋 초대 정보:")
    print(f"- 토큰: {invitation.token}")
    print(f"- 프로젝트: {invitation.project.name}")
    print(f"- 초대자: {invitation.inviter.email}")
    print(f"- 초대 받는 사람: {invitation.invitee_email}")
    print(f"- 상태: {invitation.status}")
    print(f"- 만료일: {invitation.expires_at}")
    
    # 토큰으로 초대 조회 테스트
    try:
        found_invitation = ProjectInvitation.objects.get(
            token=invitation.token,
            status='pending'
        )
        print(f"\n✅ 토큰으로 초대 조회 성공: {found_invitation}")
    except ProjectInvitation.DoesNotExist:
        print(f"\n❌ 토큰으로 초대 조회 실패")
    
    # 만료 확인
    if invitation.expires_at > timezone.now():
        print(f"✅ 초대가 유효합니다 (만료까지 {invitation.expires_at - timezone.now()})")
    else:
        print(f"❌ 초대가 만료되었습니다")

def show_all_invitations():
    """모든 초대 조회"""
    print("\n=== 모든 초대 조회 ===")
    
    invitations = ProjectInvitation.objects.all().order_by('-created')
    
    if not invitations.exists():
        print("❌ 초대가 없습니다.")
        return
    
    for invitation in invitations:
        print(f"\n📋 초대 #{invitation.id}:")
        print(f"- 토큰: {invitation.token}")
        print(f"- 프로젝트: {invitation.project.name}")
        print(f"- 초대자: {invitation.inviter.email}")
        print(f"- 초대 받는 사람: {invitation.invitee_email}")
        print(f"- 상태: {invitation.status}")
        print(f"- 생성일: {invitation.created}")
        print(f"- 만료일: {invitation.expires_at}")
        print(f"- URL: https://vlanet.net/invitation/{invitation.token}")

if __name__ == "__main__":
    # 테스트 실행
    invitation = test_invitation_creation()
    if invitation:
        test_invitation_verification()
    show_all_invitations()