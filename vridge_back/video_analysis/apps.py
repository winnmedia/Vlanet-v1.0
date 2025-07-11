from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class VideoAnalysisConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'video_analysis'
    verbose_name = 'AI 영상 분석'

    def ready(self):
        """앱이 준비되었을 때 실행"""
        try:
            # 지연 로딩을 사용하므로 여기서는 초기화하지 않음
            # 실제 사용 시점에 초기화됨
            logger.info("Video analysis app ready (using lazy loading)")
        except Exception as e:
            logger.error(f"Error in video_analysis app initialization: {e}")
            # 초기화 오류가 있어도 앱 로딩은 계속 진행