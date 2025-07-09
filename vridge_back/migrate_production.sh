#!/bin/bash
# Railway 프로덕션 DB 마이그레이션 스크립트

echo "=== Railway Production Database Migration ==="
echo "이 스크립트는 Railway 운영 환경에서 실행되어야 합니다."
echo ""

# 환경 변수 설정
export DJANGO_SETTINGS_MODULE=config.settings.railway

echo "1. 현재 마이그레이션 상태 확인..."
python manage.py showmigrations

echo ""
echo "2. 새로운 마이그레이션 파일 생성..."
python manage.py makemigrations

echo ""
echo "3. 마이그레이션 적용..."
python manage.py migrate --verbosity 2

echo ""
echo "4. 마이그레이션 적용 후 상태 확인..."
python manage.py showmigrations

echo ""
echo "5. 데이터베이스 테이블 확인..."
python manage.py shell << EOF
from django.db import connection
with connection.cursor() as cursor:
    # PostgreSQL 테이블 목록 확인
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    tables = cursor.fetchall()
    print("\n=== 현재 데이터베이스 테이블 목록 ===")
    for table in tables:
        print(f"- {table[0]}")
    
    # video_planning 테이블 확인
    print("\n=== video_planning 테이블 구조 ===")
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'video_planning'
        ORDER BY ordinal_position;
    """)
    columns = cursor.fetchall()
    for col in columns:
        print(f"- {col[0]}: {col[1]}")
    
    # projects_project 테이블 확인
    print("\n=== projects_project 테이블 구조 ===")
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'projects_project'
        ORDER BY ordinal_position;
    """)
    columns = cursor.fetchall()
    for col in columns:
        print(f"- {col[0]}: {col[1]}")
    
    # projects_idempotencyrecord 테이블 확인
    print("\n=== projects_idempotencyrecord 테이블 구조 ===")
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'projects_idempotencyrecord'
        ORDER BY ordinal_position;
    """)
    columns = cursor.fetchall()
    for col in columns:
        print(f"- {col[0]}: {col[1]}")
EOF

echo ""
echo "=== 마이그레이션 완료 ==="
echo "모든 테이블과 컬럼이 정상적으로 생성되었는지 확인하세요."