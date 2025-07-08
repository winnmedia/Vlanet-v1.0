"""
기획안 내보내기 관련 커스텀 예외 클래스
"""

class ProposalExportError(Exception):
    """기획안 내보내기 관련 기본 예외"""
    pass


class GeminiAPIError(ProposalExportError):
    """Gemini API 관련 예외"""
    
    def __init__(self, message, error_type=None, quota_exceeded=False):
        super().__init__(message)
        self.error_type = error_type
        self.quota_exceeded = quota_exceeded


class GoogleSlidesAPIError(ProposalExportError):
    """Google Slides API 관련 예외"""
    
    def __init__(self, message, http_status=None):
        super().__init__(message)
        self.http_status = http_status


class TextProcessingError(ProposalExportError):
    """텍스트 처리 관련 예외"""
    pass


class ServiceInitializationError(ProposalExportError):
    """서비스 초기화 관련 예외"""
    pass


class APIQuotaExceededError(ProposalExportError):
    """API 할당량 초과 예외"""
    
    def __init__(self, service_name, daily_limit=None, reset_time=None):
        message = f"{service_name} API 할당량이 초과되었습니다."
        if daily_limit:
            message += f" 일일 한도: {daily_limit}"
        if reset_time:
            message += f" 재설정 시간: {reset_time}"
        
        super().__init__(message)
        self.service_name = service_name
        self.daily_limit = daily_limit
        self.reset_time = reset_time


class InvalidInputError(ProposalExportError):
    """잘못된 입력 데이터 예외"""
    
    def __init__(self, field_name, message):
        super().__init__(f"{field_name}: {message}")
        self.field_name = field_name