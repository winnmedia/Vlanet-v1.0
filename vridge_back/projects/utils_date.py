"""날짜 파싱 유틸리티 함수"""
from datetime import datetime
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


def parse_date_flexible(date_value):
    """
    다양한 형식의 날짜 문자열을 파싱하여 timezone-aware datetime 객체로 변환
    
    지원하는 형식:
    - YYYY-MM-DD HH:mm
    - YYYY-MM-DD HH:MM
    - YYYY-MM-DD
    - YYYY-MM-DDTHH:mm:ss
    - YYYY-MM-DDTHH:mm:ssZ
    - YYYY-MM-DDTHH:mm:ss.fffZ
    - ISO 8601 형식
    """
    if not date_value:
        return None
        
    # 이미 datetime 객체인 경우
    if isinstance(date_value, datetime):
        return timezone.make_aware(date_value) if timezone.is_naive(date_value) else date_value
    
    # 문자열이 아닌 경우
    if not isinstance(date_value, str):
        logger.warning(f"Unexpected date type: {type(date_value)}, value: {date_value}")
        return None
    
    # 빈 문자열 처리
    date_str = date_value.strip()
    if not date_str or date_str.lower() == 'null':
        return None
    
    # 시도할 날짜 형식들 (가장 흔한 형식부터)
    date_formats = [
        "%Y-%m-%d %H:%M",      # 2025-07-01 14:30
        "%Y-%m-%d %H:%M:%S",   # 2025-07-01 14:30:00
        "%Y-%m-%d",            # 2025-07-01
        "%Y-%m-%dT%H:%M",      # 2025-07-01T14:30
        "%Y-%m-%dT%H:%M:%S",   # 2025-07-01T14:30:00
        "%Y-%m-%dT%H:%M:%SZ",  # 2025-07-01T14:30:00Z
        "%Y-%m-%dT%H:%M:%S.%fZ",  # 2025-07-01T14:30:00.000Z
    ]
    
    # 각 형식으로 파싱 시도
    for fmt in date_formats:
        try:
            parsed_date = datetime.strptime(date_str, fmt)
            # timezone aware로 변환
            return timezone.make_aware(parsed_date) if timezone.is_naive(parsed_date) else parsed_date
        except ValueError:
            continue
    
    # ISO format 시도
    try:
        # Z를 +00:00으로 변경하여 Python이 이해할 수 있는 형식으로
        iso_str = date_str.replace('Z', '+00:00')
        parsed_date = datetime.fromisoformat(iso_str)
        return timezone.make_aware(parsed_date) if timezone.is_naive(parsed_date) else parsed_date
    except ValueError:
        pass
    
    # JavaScript의 Date.toISOString() 형식 처리
    try:
        if 'T' in date_str and date_str.endswith('Z'):
            # 2025-07-01T05:30:00.000Z 형식
            parsed_date = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S.%fZ")
            # UTC로 해석
            return timezone.make_aware(parsed_date, timezone=timezone.utc)
    except ValueError:
        pass
    
    # 모든 시도가 실패한 경우
    logger.error(f"Unable to parse date: '{date_str}'")
    raise ValueError(f"날짜 형식을 인식할 수 없습니다: {date_str}")