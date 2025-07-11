"""
Lazy loading wrapper for video analyzer
전역 인스턴스 생성 시 초기화 오류 방지
"""
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)


class LazyVideoAnalyzer:
    """
    지연 로딩을 지원하는 비디오 분석기 래퍼
    실제 사용 시점에 인스턴스를 생성
    """
    
    def __init__(self):
        self._analyzer = None
        self._initialization_error = None
    
    @property
    def analyzer(self):
        """실제 분석기 인스턴스를 반환 (필요시 생성)"""
        if self._analyzer is None and self._initialization_error is None:
            try:
                from .analyzer import TwelveLabsVideoAnalyzer
                self._analyzer = TwelveLabsVideoAnalyzer()
                logger.info("Video analyzer initialized successfully")
            except Exception as e:
                self._initialization_error = e
                logger.error(f"Failed to initialize video analyzer: {e}")
                # 개발 환경에서는 Mock 분석기 사용
                if self._is_development():
                    from .mock_analyzer import MockVideoAnalyzer
                    self._analyzer = MockVideoAnalyzer()
                    logger.info("Using mock analyzer for development")
        
        if self._initialization_error and not self._analyzer:
            raise self._initialization_error
        
        return self._analyzer
    
    def _is_development(self):
        """개발 환경인지 확인"""
        from django.conf import settings
        return settings.DEBUG or not hasattr(settings, 'TWELVELABS_API_KEY')
    
    def __getattr__(self, name):
        """분석기의 메서드를 프록시"""
        return getattr(self.analyzer, name)
    
    def is_available(self):
        """분석기 사용 가능 여부 확인"""
        try:
            return self.analyzer is not None
        except:
            return False


# 전역 지연 로딩 분석기 인스턴스
video_analyzer = LazyVideoAnalyzer()


@lru_cache(maxsize=1)
def get_video_analyzer():
    """
    싱글톤 패턴으로 분석기 인스턴스 반환
    Django 앱 준비 후에만 호출되도록 보장
    """
    return video_analyzer