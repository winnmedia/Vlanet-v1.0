#!/usr/bin/env python3
"""
Railway 데이터베이스에 ProjectInvitation 테이블 강제 생성
"""
import os
import sys
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway_safe')
django.setup()

from django.db import connection

def create_projectinvitation_table():
    """ProjectInvitation 테이블을 수동으로 생성"""
    with connection.cursor() as cursor:
        # 테이블이 이미 존재하는지 확인
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'projects_projectinvitation'
            );
        """)
        
        if cursor.fetchone()[0]:
            print("✅ projects_projectinvitation 테이블이 이미 존재합니다.")
            return
        
        print("🔨 projects_projectinvitation 테이블 생성 중...")
        
        # 테이블 생성 SQL
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects_projectinvitation (
                id BIGSERIAL PRIMARY KEY,
                created TIMESTAMP WITH TIME ZONE NOT NULL,
                updated TIMESTAMP WITH TIME ZONE NOT NULL,
                invitee_email VARCHAR(254) NOT NULL,
                message TEXT,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                token VARCHAR(100) UNIQUE NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                accepted_at TIMESTAMP WITH TIME ZONE,
                declined_at TIMESTAMP WITH TIME ZONE,
                project_id BIGINT NOT NULL REFERENCES projects_project(id) ON DELETE CASCADE,
                inviter_id BIGINT NOT NULL REFERENCES users_user(id) ON DELETE CASCADE,
                invitee_id BIGINT REFERENCES users_user(id) ON DELETE CASCADE
            );
        """)
        
        # 인덱스 생성
        cursor.execute("CREATE INDEX IF NOT EXISTS projects_projectinvitation_project_id ON projects_projectinvitation(project_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS projects_projectinvitation_invitee_email ON projects_projectinvitation(invitee_email);")
        cursor.execute("CREATE INDEX IF NOT EXISTS projects_projectinvitation_invitee_id ON projects_projectinvitation(invitee_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS projects_projectinvitation_status ON projects_projectinvitation(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS projects_projectinvitation_token ON projects_projectinvitation(token);")
        
        # UNIQUE 제약조건 추가
        cursor.execute("""
            ALTER TABLE projects_projectinvitation 
            ADD CONSTRAINT projects_projectinvitation_unique_project_email 
            UNIQUE (project_id, invitee_email);
        """)
        
        # 마이그레이션 기록 추가
        cursor.execute("""
            INSERT INTO django_migrations (app, name, applied)
            VALUES ('projects', '0023_create_projectinvitation', NOW())
            ON CONFLICT DO NOTHING;
        """)
        
        print("✅ projects_projectinvitation 테이블이 성공적으로 생성되었습니다!")

def main():
    try:
        create_projectinvitation_table()
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()