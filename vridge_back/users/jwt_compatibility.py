"""
JWT 인증 호환성 패치
마이그레이션이 완료되지 않은 환경에서도 JWT 인증이 작동하도록 함
"""
from rest_framework_simplejwt.authentication import JWTAuthentication as BaseJWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .migration_compatibility import get_user_safely
import logging

logger = logging.getLogger(__name__)

class CompatibleJWTAuthentication(BaseJWTAuthentication):
    """마이그레이션 호환성을 갖춘 JWT 인증 클래스"""
    
    def get_user(self, validated_token):
        """토큰에서 사용자를 안전하게 가져오기"""
        try:
            # 기본 동작 시도
            return super().get_user(validated_token)
        except Exception as e:
            logger.warning(f"JWT user lookup failed, trying compatibility mode: {e}")
            
            # 호환성 모드로 재시도
            try:
                user_id = validated_token.get('user_id')
                if not user_id:
                    raise InvalidToken('Token contained no recognizable user identification')
                
                # 안전한 사용자 조회
                from django.contrib.auth import get_user_model
                User = get_user_model()
                
                # ID로 조회하되 안전한 필드만 사용
                try:
                    return User.objects.only(
                        'id', 'username', 'email', 'first_name', 'last_name',
                        'is_active', 'is_staff', 'is_superuser', 'date_joined',
                        'password', 'nickname', 'login_method'
                    ).get(id=user_id)
                except User.DoesNotExist:
                    raise InvalidToken('User not found')
                    
            except Exception as e:
                logger.error(f"Compatibility mode also failed: {e}")
                raise InvalidToken(f'User retrieval failed: {str(e)}')