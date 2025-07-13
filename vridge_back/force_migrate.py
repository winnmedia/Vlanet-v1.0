#!/usr/bin/env python3
"""
Railway 환경에서 마이그레이션 강제 실행
"""
import os
import django
from django.core.management import execute_from_command_line

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')

def main():
    """메인 함수"""
    try:
        django.setup()
        
        print("🚀 Starting migration process...")
        
        # 마이그레이션 실행
        print("📋 Running migrations...")
        execute_from_command_line(['manage.py', 'migrate'])
        
        print("✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()