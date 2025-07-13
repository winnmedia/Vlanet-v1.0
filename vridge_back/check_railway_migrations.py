#!/usr/bin/env python3
"""
Railway 데이터베이스 마이그레이션 상태 확인 스크립트
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway_safe')
django.setup()

from django.db import connection
from django.core.management import call_command

def check_table_exists(table_name):
    """테이블 존재 여부 확인"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = %s
            );
        """, [table_name])
        return cursor.fetchone()[0]

def main():
    print("🔍 Railway 데이터베이스 마이그레이션 상태 확인...")
    print(f"DATABASE: {os.environ.get('DATABASE_URL', 'Not set')[:50]}...")
    
    # 주요 테이블 확인
    tables_to_check = [
        'projects_project',
        'projects_projectinvitation',
        'projects_projectinvite',
        'projects_members',
        'users_user',
        'users_userprofile',
        'django_migrations'
    ]
    
    print("\n📊 테이블 존재 여부:")
    for table in tables_to_check:
        exists = check_table_exists(table)
        status = "✅ 존재" if exists else "❌ 없음"
        print(f"   {table}: {status}")
    
    # 적용된 마이그레이션 확인
    print("\n📋 최근 적용된 마이그레이션:")
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT app, name, applied 
            FROM django_migrations 
            WHERE app IN ('projects', 'users')
            ORDER BY applied DESC 
            LIMIT 10
        """)
        for row in cursor.fetchall():
            app, name, applied = row
            print(f"   [{app}] {name} - {applied}")
    
    # ProjectInvitation 테이블이 없으면 마이그레이션 실행 권장
    if not check_table_exists('projects_projectinvitation'):
        print("\n⚠️  ProjectInvitation 테이블이 없습니다!")
        print("다음 명령어를 실행하세요:")
        print("python manage.py migrate projects")
    else:
        print("\n✅ 모든 필수 테이블이 존재합니다.")

if __name__ == "__main__":
    main()