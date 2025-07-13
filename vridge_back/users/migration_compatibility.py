"""
마이그레이션 호환성 유틸리티
Railway 배포 시 마이그레이션이 아직 적용되지 않은 경우를 위한 임시 해결책
"""
from django.db import connection, models
import logging

logger = logging.getLogger(__name__)

def check_column_exists(table_name, column_name):
    """테이블에 컬럼이 존재하는지 확인"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = %s AND column_name = %s
            """, [table_name, column_name])
            return cursor.fetchone() is not None
    except Exception as e:
        logger.warning(f"Error checking column {table_name}.{column_name}: {e}")
        return False

def get_user_fields_safely():
    """User 모델에서 안전하게 사용할 수 있는 필드 목록 반환"""
    safe_fields = [
        'id', 'username', 'email', 'first_name', 'last_name', 
        'is_active', 'is_staff', 'is_superuser', 'date_joined', 'last_login',
        'password', 'nickname', 'login_method', 'email_secret'
    ]
    
    # 새로 추가된 필드들이 존재하는지 확인
    if check_column_exists('users_user', 'email_verified'):
        safe_fields.extend(['email_verified', 'email_verified_at'])
    
    return safe_fields

def create_user_queryset_safely():
    """마이그레이션 상태에 관계없이 안전한 User 쿼리셋 생성"""
    from .models import User
    
    try:
        # 모든 필드로 시도
        return User.objects.all()
    except Exception as e:
        logger.warning(f"Full queryset failed, using safe fields: {e}")
        
        # 안전한 필드만 사용
        safe_fields = get_user_fields_safely()
        return User.objects.only(*safe_fields)

def get_user_safely(username):
    """안전하게 사용자 조회"""
    from .models import User
    
    try:
        return User.objects.get(username=username)
    except Exception as e:
        logger.warning(f"Safe user lookup failed for {username}: {e}")
        
        # 기본 필드만 사용해서 조회
        safe_fields = get_user_fields_safely()
        return User.objects.only(*safe_fields).get(username=username)