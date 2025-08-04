from django.core.management.base import BaseCommand
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Force apply video_planning migrations'

    def handle(self, *args, **options):
        self.stdout.write('🔧 video_planning 마이그레이션 강제 적용 시작...')
        
        try:
            # 마이그레이션 상태 확인
            self.stdout.write('\n현재 마이그레이션 상태:')
            call_command('showmigrations', 'video_planning')
            
            # 마이그레이션 적용
            self.stdout.write('\n마이그레이션 적용 중...')
            call_command('migrate', 'video_planning', verbosity=2)
            
            self.stdout.write(self.style.SUCCESS('\n✅ 마이그레이션 완료!'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n❌ 마이그레이션 실패: {e}'))
            logger.error(f"Force migration failed: {e}", exc_info=True)