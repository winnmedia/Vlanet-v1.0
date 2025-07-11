# AI 영상 분석 모듈

# Lazy loading to prevent initialization errors
from .analyzer_lazy import video_analyzer, get_video_analyzer

__all__ = ['video_analyzer', 'get_video_analyzer']