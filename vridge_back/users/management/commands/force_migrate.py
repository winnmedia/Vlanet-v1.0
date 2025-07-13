from django.core.management.base import BaseCommand
from django.db import connection
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Force create missing tables and columns'

    def handle(self, *args, **options):
        self.stdout.write('🔧 강제 마이그레이션 시작...')
        
        with connection.cursor() as cursor:
            # 1. users_notification 테이블 생성
            try:
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users_notification (
                        id SERIAL PRIMARY KEY,
                        created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        recipient_id INTEGER NOT NULL REFERENCES users_user(id),
                        notification_type VARCHAR(50) NOT NULL,
                        title VARCHAR(200) NOT NULL,
                        message TEXT NOT NULL,
                        project_id INTEGER,
                        invitation_id INTEGER,
                        is_read BOOLEAN DEFAULT FALSE,
                        read_at TIMESTAMP WITH TIME ZONE,
                        extra_data JSONB DEFAULT '{}'::jsonb
                    );
                """)
                self.stdout.write(self.style.SUCCESS('✅ users_notification 테이블 생성'))
                
                # 인덱스 추가
                cursor.execute("CREATE INDEX IF NOT EXISTS users_notification_recipient_created ON users_notification(recipient_id, created DESC);")
                cursor.execute("CREATE INDEX IF NOT EXISTS users_notification_recipient_read ON users_notification(recipient_id, is_read);")
                cursor.execute("CREATE INDEX IF NOT EXISTS users_notification_type ON users_notification(notification_type);")
                
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'users_notification 테이블: {e}'))
            
            # 2. email_verified 컬럼 추가
            try:
                cursor.execute("""
                    ALTER TABLE users_user 
                    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
                """)
                self.stdout.write(self.style.SUCCESS('✅ email_verified 컬럼 추가'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'email_verified 컬럼: {e}'))
            
            # 3. email_verified_at 컬럼 추가
            try:
                cursor.execute("""
                    ALTER TABLE users_user 
                    ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;
                """)
                self.stdout.write(self.style.SUCCESS('✅ email_verified_at 컬럼 추가'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'email_verified_at 컬럼: {e}'))
            
            # 4. friend_code 컬럼 추가
            try:
                cursor.execute("""
                    ALTER TABLE users_user 
                    ADD COLUMN IF NOT EXISTS friend_code VARCHAR(20) UNIQUE;
                """)
                self.stdout.write(self.style.SUCCESS('✅ friend_code 컬럼 추가'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'friend_code 컬럼: {e}'))
        
        # 5. 마이그레이션 재실행
        self.stdout.write('\n📋 마이그레이션 재실행...')
        call_command('migrate', '--noinput')
        
        self.stdout.write(self.style.SUCCESS('\n✅ 강제 마이그레이션 완료!'))