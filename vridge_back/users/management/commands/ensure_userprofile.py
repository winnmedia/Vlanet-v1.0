from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Ensure UserProfile table exists'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # UserProfile 테이블 확인
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'users_userprofile'
                );
            """)
            exists = cursor.fetchone()[0]
            
            if exists:
                self.stdout.write(self.style.SUCCESS('✅ UserProfile table exists'))
            else:
                self.stdout.write(self.style.ERROR('❌ UserProfile table does not exist'))
                
                # 테이블 생성 시도
                try:
                    cursor.execute("""
                        CREATE TABLE IF NOT EXISTS users_userprofile (
                            id SERIAL PRIMARY KEY,
                            created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            user_id INT UNIQUE REFERENCES users_user(id) ON DELETE CASCADE,
                            profile_image VARCHAR(100),
                            bio TEXT,
                            phone VARCHAR(20),
                            company VARCHAR(100),
                            position VARCHAR(100)
                        );
                    """)
                    self.stdout.write(self.style.SUCCESS('✅ UserProfile table created'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Failed to create table: {e}'))