"""
미디어 파일 스토리지 백엔드
- 로컬 스토리지와 S3 스토리지 자동 전환
- 파일 업로드 최적화
- 보안 강화
"""

import os
import hashlib
import mimetypes
from datetime import datetime
from pathlib import Path

from django.core.files.storage import FileSystemStorage
from django.conf import settings
from django.utils.deconstruct import deconstructible


@deconstructible
class MediaStorage(FileSystemStorage):
    """
    미디어 파일 저장소
    - 파일명 중복 방지
    - 한글 파일명 처리
    - 파일 타입 검증
    """
    
    def __init__(self, *args, **kwargs):
        if settings.USE_S3:
            # S3 스토리지 사용
            from storages.backends.s3boto3 import S3Boto3Storage
            self.__class__ = type('S3MediaStorage', (S3Boto3Storage,), {
                'bucket_name': settings.AWS_STORAGE_BUCKET_NAME,
                'custom_domain': settings.AWS_S3_CUSTOM_DOMAIN,
                'object_parameters': settings.AWS_S3_OBJECT_PARAMETERS,
                'file_overwrite': False,
                'default_acl': 'private',  # 비공개 설정
                'querystring_auth': True,  # 서명된 URL 사용
                'querystring_expire': 3600,  # 1시간
            })
            return S3Boto3Storage.__init__(self)
        else:
            # 로컬 스토리지 사용
            super().__init__(*args, **kwargs)
            self.base_location = settings.MEDIA_ROOT
            self.base_url = settings.MEDIA_URL
    
    def get_valid_name(self, name):
        """
        파일명을 안전하게 변환
        - 한글 파일명을 영문으로 변환
        - 특수문자 제거
        """
        import unicodedata
        import re
        
        # 파일명과 확장자 분리
        name = Path(name).name
        stem = Path(name).stem
        suffix = Path(name).suffix
        
        # 한글이 포함된 경우 해시값으로 변환
        if any(ord(char) > 127 for char in stem):
            # 원본 파일명의 해시값 생성
            hash_object = hashlib.md5(stem.encode('utf-8'))
            stem = hash_object.hexdigest()[:8]
        
        # 영문, 숫자, 하이픈, 언더스코어만 허용
        stem = re.sub(r'[^a-zA-Z0-9_-]', '_', stem)
        
        # 타임스탬프 추가로 고유성 보장
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        return f"{stem}_{timestamp}{suffix}"
    
    def get_available_name(self, name, max_length=None):
        """
        중복되지 않는 파일명 생성
        """
        # 먼저 안전한 이름으로 변환
        name = self.get_valid_name(name)
        
        # 부모 클래스의 중복 방지 로직 사용
        return super().get_available_name(name, max_length)
    
    def _save(self, name, content):
        """
        파일 저장 시 추가 검증
        """
        # MIME 타입 확인
        if hasattr(content, 'content_type'):
            content_type = content.content_type
        else:
            content_type = mimetypes.guess_type(name)[0]
        
        # 허용된 파일 타입 확인
        allowed_types = getattr(settings, 'ALLOWED_UPLOAD_TYPES', {
            'video': ['video/mp4', 'video/quicktime', 'video/x-msvideo', 
                     'video/x-ms-wmv', 'video/x-matroska'],
            'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            'document': ['application/pdf', 'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        })
        
        # 파일 타입별로 다른 디렉토리에 저장
        file_category = None
        for category, types in allowed_types.items():
            if content_type in types:
                file_category = category
                break
        
        if not file_category:
            # 알 수 없는 파일 타입
            file_category = 'misc'
        
        # 연/월 기반 디렉토리 구조
        date_path = datetime.now().strftime('%Y/%m')
        name = os.path.join(file_category, date_path, name)
        
        return super()._save(name, content)


class StaticStorage(FileSystemStorage):
    """
    정적 파일 저장소
    프로덕션에서는 WhiteNoise가 처리하므로 개발용
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.base_location = settings.STATIC_ROOT
        self.base_url = settings.STATIC_URL


def clean_filename(filename):
    """
    파일명 정리 유틸리티 함수
    """
    import re
    
    # 파일명과 확장자 분리
    name, ext = os.path.splitext(filename)
    
    # 특수문자를 언더스코어로 변환
    name = re.sub(r'[^\w\s-]', '_', name)
    
    # 공백을 언더스코어로 변환
    name = re.sub(r'\s+', '_', name)
    
    # 연속된 언더스코어 제거
    name = re.sub(r'_+', '_', name)
    
    # 앞뒤 언더스코어 제거
    name = name.strip('_')
    
    # 파일명이 비어있으면 기본값 사용
    if not name:
        name = 'file'
    
    return f"{name}{ext}"


def get_upload_path(instance, filename):
    """
    모델별 업로드 경로 생성
    """
    # 모델명으로 디렉토리 생성
    model_name = instance.__class__.__name__.lower()
    
    # 날짜 기반 경로
    date_path = datetime.now().strftime('%Y/%m/%d')
    
    # 안전한 파일명
    safe_filename = clean_filename(filename)
    
    # 사용자별 분리 (user 필드가 있는 경우)
    if hasattr(instance, 'user') and instance.user:
        user_path = f"user_{instance.user.id}"
        return os.path.join(model_name, user_path, date_path, safe_filename)
    
    return os.path.join(model_name, date_path, safe_filename)


# 싱글톤 인스턴스
media_storage = MediaStorage()


# S3 presigned URL 생성 함수
def generate_presigned_url(file_path, expires_in=3600):
    """
    S3 presigned URL 생성
    - 임시 접근 권한 부여
    - 보안 강화
    """
    if not settings.USE_S3:
        # 로컬 스토리지는 일반 URL 반환
        return settings.MEDIA_URL + file_path
    
    try:
        from boto3 import client
        
        s3_client = client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME,
        )
        
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                'Key': file_path,
            },
            ExpiresIn=expires_in
        )
        
        return url
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Presigned URL 생성 실패: {e}")
        return None