#!/usr/bin/env python
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
django.setup()

from django.db import connection, transaction

def ensure_is_important_column():
    """is_important 컬럼 확인 및 생성"""
    try:
        with connection.cursor() as cursor:
            # 컬럼 존재 확인
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'feedbacks_feedbackcomment' 
                AND column_name = 'is_important'
            """)
            
            if not cursor.fetchone():
                print("🔧 is_important column not found, creating...")
                
                with transaction.atomic():
                    # is_important 컬럼 추가
                    cursor.execute("""
                        ALTER TABLE feedbacks_feedbackcomment 
                        ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT FALSE
                    """)
                    print("✅ is_important column created successfully")
                    
                    # parent 컬럼도 확인하고 추가
                    cursor.execute("""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = 'feedbacks_feedbackcomment' 
                        AND column_name = 'parent_id'
                    """)
                    
                    if not cursor.fetchone():
                        cursor.execute("""
                            ALTER TABLE feedbacks_feedbackcomment 
                            ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES feedbacks_feedbackcomment(id) ON DELETE CASCADE
                        """)
                        print("✅ parent_id column created successfully")
                    
                    # 인덱스 생성
                    cursor.execute("""
                        CREATE INDEX IF NOT EXISTS feedbacks_feedbackcomment_is_important_idx 
                        ON feedbacks_feedbackcomment(is_important)
                    """)
                    cursor.execute("""
                        CREATE INDEX IF NOT EXISTS feedbacks_feedbackcomment_parent_id_idx 
                        ON feedbacks_feedbackcomment(parent_id)
                    """)
                    print("✅ Indexes created successfully")
                    
            else:
                print("✅ is_important column already exists")
                
    except Exception as e:
        print(f"❌ Error ensuring is_important column: {e}")
        return False
    
    return True

if __name__ == "__main__":
    if ensure_is_important_column():
        print("✅ is_important column check completed successfully")
        sys.exit(0)
    else:
        print("❌ Failed to ensure is_important column")
        sys.exit(1)