from django.core.management.base import BaseCommand
from django.db import connection
from projects.models import Project, Members, ProjectInvitation
from users.models import User
import traceback


class Command(BaseCommand):
    help = '데이터베이스 상태와 모델 관계를 확인합니다'

    def handle(self, *args, **options):
        try:
            # 데이터베이스 연결 확인
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                self.stdout.write(self.style.SUCCESS("✓ 데이터베이스 연결 성공"))
            
            # 모델별 레코드 수 확인
            self.stdout.write("\n=== 모델별 레코드 수 ===")
            self.stdout.write(f"User: {User.objects.count()}개")
            self.stdout.write(f"Project: {Project.objects.count()}개")
            self.stdout.write(f"Members: {Members.objects.count()}개")
            
            # ProjectInvitation 모델 확인
            try:
                count = ProjectInvitation.objects.count()
                self.stdout.write(f"ProjectInvitation: {count}개")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"ProjectInvitation 오류: {str(e)}"))
            
            # 테이블 존재 여부 확인
            self.stdout.write("\n=== 테이블 존재 여부 ===")
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name LIKE '%project%'
                    ORDER BY table_name
                """)
                tables = cursor.fetchall()
                for table in tables:
                    self.stdout.write(f"✓ {table[0]}")
            
            # 마이그레이션 상태 확인
            self.stdout.write("\n=== 마이그레이션 상태 ===")
            from django.db.migrations.recorder import MigrationRecorder
            recorder = MigrationRecorder(connection)
            applied = recorder.applied_migrations()
            
            project_migrations = [m for m in applied if m[0] == 'projects']
            self.stdout.write(f"projects 앱 마이그레이션: {len(project_migrations)}개 적용됨")
            
            if project_migrations:
                latest = max(project_migrations, key=lambda x: x[1])
                self.stdout.write(f"최신 마이그레이션: {latest[1]}")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n오류 발생:"))
            self.stdout.write(self.style.ERROR(traceback.format_exc()))