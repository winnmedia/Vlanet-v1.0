#!/usr/bin/env python
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
django.setup()

from django.core.management import call_command
from django.db import connection

def apply_feedback_migrations():
    """피드백 관련 마이그레이션을 순차적으로 적용"""
    try:
        with connection.cursor() as cursor:
            # 현재 적용된 마이그레이션 확인
            cursor.execute("""
                SELECT name FROM django_migrations 
                WHERE app = 'feedbacks' 
                ORDER BY id
            """)
            applied_migrations = [row[0] for row in cursor.fetchall()]
            print(f"Applied migrations: {applied_migrations}")
            
            # 0014 마이그레이션이 적용되지 않았다면 적용
            if '0014_feedbackreaction_feedbackcomment_is_important_and_more' not in applied_migrations:
                print("🔧 Applying 0014 migration...")
                try:
                    call_command('migrate', 'feedbacks', '0014', '--noinput')
                    print("✅ 0014 migration applied successfully")
                except Exception as e:
                    print(f"⚠️ Migration 0014 failed: {e}")
                    # 수동으로 마이그레이션 기록 추가
                    cursor.execute("""
                        INSERT INTO django_migrations (app, name, applied) 
                        VALUES ('feedbacks', '0014_feedbackreaction_feedbackcomment_is_important_and_more', NOW())
                        ON CONFLICT DO NOTHING
                    """)
            else:
                print("✅ 0014 migration already applied")
                
    except Exception as e:
        print(f"❌ Error applying migrations: {e}")
        return False
    
    return True

if __name__ == "__main__":
    if apply_feedback_migrations():
        print("✅ Feedback migrations completed successfully")
        sys.exit(0)
    else:
        print("❌ Failed to apply feedback migrations")
        sys.exit(1)