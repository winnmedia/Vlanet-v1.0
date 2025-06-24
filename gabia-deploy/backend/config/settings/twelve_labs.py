"""
Twelve Labs API 설정 파일
환경 변수로 설정하거나 이 파일에서 직접 설정
"""
import os
from django.core.exceptions import ImproperlyConfigured

def get_env_variable(var_name, default=None):
    """환경 변수 가져오기"""
    try:
        return os.environ[var_name]
    except KeyError:
        if default is not None:
            return default
        error_msg = f"환경 변수 {var_name}이 설정되지 않았습니다."
        raise ImproperlyConfigured(error_msg)

# Twelve Labs API 설정
TWELVE_LABS_API_KEY = get_env_variable('TWELVE_LABS_API_KEY', '')
TWELVE_LABS_INDEX_ID = get_env_variable('TWELVE_LABS_INDEX_ID', '')

# AI 분석 기능 활성화 여부
USE_AI_ANALYSIS = bool(TWELVE_LABS_API_KEY and TWELVE_LABS_INDEX_ID)

# 개발 모드에서는 더미 데이터 사용
DEVELOPMENT_MODE = not USE_AI_ANALYSIS

# 비용 관리를 위한 분석 제한
DAILY_ANALYSIS_LIMIT = int(get_env_variable('DAILY_ANALYSIS_LIMIT', '100'))
MONTHLY_ANALYSIS_LIMIT = int(get_env_variable('MONTHLY_ANALYSIS_LIMIT', '1000'))

# 사용자별 분석 제한 (무료 사용자)
USER_DAILY_LIMIT = int(get_env_variable('USER_DAILY_LIMIT', '5'))
USER_MONTHLY_LIMIT = int(get_env_variable('USER_MONTHLY_LIMIT', '50'))

# 프리미엄 사용자 제한
PREMIUM_USER_DAILY_LIMIT = int(get_env_variable('PREMIUM_USER_DAILY_LIMIT', '20'))
PREMIUM_USER_MONTHLY_LIMIT = int(get_env_variable('PREMIUM_USER_MONTHLY_LIMIT', '200'))

# 파일 크기 및 길이 제한
MAX_VIDEO_SIZE_MB = int(get_env_variable('MAX_VIDEO_SIZE_MB', '500'))  # 500MB
MAX_VIDEO_DURATION_MINUTES = int(get_env_variable('MAX_VIDEO_DURATION_MINUTES', '30'))  # 30분

# 무료 사용자 제한
FREE_USER_MAX_SIZE_MB = int(get_env_variable('FREE_USER_MAX_SIZE_MB', '100'))  # 100MB
FREE_USER_MAX_DURATION_MINUTES = int(get_env_variable('FREE_USER_MAX_DURATION_MINUTES', '10'))  # 10분

# 로깅 설정
TWELVE_LABS_LOGGING = {
    'level': get_env_variable('TWELVE_LABS_LOG_LEVEL', 'INFO'),
    'log_api_calls': get_env_variable('LOG_TWELVE_LABS_API', 'False').lower() == 'true',
    'log_analysis_results': get_env_variable('LOG_ANALYSIS_RESULTS', 'True').lower() == 'true'
}