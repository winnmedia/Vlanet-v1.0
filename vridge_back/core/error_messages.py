# 통일된 에러 메시지 관리
"""
VideoPlanet 에러 메시지 통일화
모든 에러 메시지를 중앙에서 관리하여 일관성 확보
"""

class ErrorMessages:
    """표준화된 에러 메시지"""
    
    # 인증 관련
    AUTH_REQUIRED = "로그인이 필요합니다."
    AUTH_INVALID_CREDENTIALS = "이메일 또는 비밀번호가 올바르지 않습니다."
    AUTH_TOKEN_EXPIRED = "인증 토큰이 만료되었습니다. 다시 로그인해주세요."
    AUTH_TOKEN_INVALID = "유효하지 않은 인증 토큰입니다."
    AUTH_PERMISSION_DENIED = "이 작업을 수행할 권한이 없습니다."
    
    # 사용자 관련
    USER_NOT_FOUND = "사용자를 찾을 수 없습니다."
    USER_ALREADY_EXISTS = "이미 존재하는 이메일입니다."
    USER_PROFILE_UPDATE_FAILED = "프로필 업데이트에 실패했습니다."
    
    # 프로젝트 관련
    PROJECT_NOT_FOUND = "프로젝트를 찾을 수 없습니다."
    PROJECT_ALREADY_EXISTS = "이미 같은 이름의 프로젝트가 존재합니다."
    PROJECT_CREATE_FAILED = "프로젝트 생성에 실패했습니다."
    PROJECT_UPDATE_FAILED = "프로젝트 수정에 실패했습니다."
    PROJECT_DELETE_FAILED = "프로젝트 삭제에 실패했습니다."
    PROJECT_ACCESS_DENIED = "이 프로젝트에 접근할 권한이 없습니다."
    
    # 피드백 관련
    FEEDBACK_NOT_FOUND = "피드백을 찾을 수 없습니다."
    FEEDBACK_CREATE_FAILED = "피드백 생성에 실패했습니다."
    FEEDBACK_UPDATE_FAILED = "피드백 수정에 실패했습니다."
    FEEDBACK_DELETE_FAILED = "피드백 삭제에 실패했습니다."
    FEEDBACK_ACCESS_DENIED = "이 피드백에 접근할 권한이 없습니다."
    FEEDBACK_VIDEO_UPLOAD_FAILED = "비디오 업로드에 실패했습니다."
    FEEDBACK_ENCODING_FAILED = "비디오 인코딩에 실패했습니다."
    
    # 파일 관련
    FILE_NOT_FOUND = "파일을 찾을 수 없습니다."
    FILE_UPLOAD_FAILED = "파일 업로드에 실패했습니다."
    FILE_SIZE_EXCEEDED = "파일 크기가 제한을 초과했습니다. (최대 500MB)"
    FILE_TYPE_NOT_ALLOWED = "허용되지 않는 파일 형식입니다."
    
    # 검증 관련
    VALIDATION_FAILED = "입력값 검증에 실패했습니다."
    REQUIRED_FIELD_MISSING = "필수 항목이 누락되었습니다."
    INVALID_FORMAT = "올바르지 않은 형식입니다."
    INVALID_DATE_RANGE = "날짜 범위가 올바르지 않습니다."
    
    # 서버 관련
    SERVER_ERROR = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    DATABASE_ERROR = "데이터베이스 오류가 발생했습니다."
    EXTERNAL_API_ERROR = "외부 서비스 연결에 실패했습니다."
    
    @classmethod
    def get_error_response(cls, error_key, status_code=400, details=None):
        """표준화된 에러 응답 생성"""
        error_message = getattr(cls, error_key, cls.SERVER_ERROR)
        
        response = {
            "success": False,
            "error": {
                "code": error_key,
                "message": error_message
            }
        }
        
        if details:
            response["error"]["details"] = details
            
        return response, status_code