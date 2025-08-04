#!/usr/bin/env python3
"""
Railway 서버의 마이그레이션 문제를 해결하기 위한 스크립트
"""
import os
import sys
import django

# Django 설정
sys.path.insert(0, '/home/winnmedia/VideoPlanet/vridge_back')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
django.setup()

from django.core.management import execute_from_command_line
from django.db import connection

print("🔧 Railway 마이그레이션 문제 해결 스크립트")
print("="*50)

# 현재 테이블 구조 확인
with connection.cursor() as cursor:
    # 테이블 존재 확인
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'video_planning'
        ORDER BY ordinal_position;
    """)
    columns = cursor.fetchall()
    
    print("\n현재 video_planning 테이블 컬럼:")
    for col in columns:
        print(f"  - {col[0]}")
    
    # color_tone 컬럼 존재 여부 확인
    color_tone_exists = any('color_tone' in col for col in columns)
    print(f"\ncolor_tone 컬럼 존재: {color_tone_exists}")

# 마이그레이션 상태 확인
print("\n현재 마이그레이션 상태:")
execute_from_command_line(['manage.py', 'showmigrations', 'video_planning'])

# 마이그레이션 실행 옵션 제공
print("\n옵션:")
print("1. 마이그레이션 적용")
print("2. 마이그레이션 fake 적용 (이미 수동으로 변경된 경우)")
print("3. 특정 마이그레이션으로 롤백")
print("4. 종료")

# Railway에서는 자동으로 옵션 1 실행
if os.environ.get('RAILWAY_ENVIRONMENT'):
    print("\nRailway 환경 감지. 자동으로 마이그레이션 적용...")
    execute_from_command_line(['manage.py', 'migrate', 'video_planning'])
    print("✅ 마이그레이션 완료!")