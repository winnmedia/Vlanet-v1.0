#!/usr/bin/env python3
"""
VideoPlanet 배포 환경 체크리스트 및 자동 검증 스크립트
배포 전/후 실행하여 모든 설정이 올바른지 확인
"""

import os
import sys
import json
from urllib.parse import urlparse
import django

# Django 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
django.setup()

from django.conf import settings
from django.core.management import call_command
from django.test.client import Client

class DeploymentChecker:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.successes = []
        
    def check_environment_variables(self):
        """필수 환경변수 확인"""
        print("\n🔍 환경변수 검사...")
        
        required_vars = {
            'SECRET_KEY': '보안을 위한 Django 시크릿 키',
            'DATABASE_URL': 'PostgreSQL 데이터베이스 연결 문자열',
        }
        
        optional_vars = {
            'REDIS_URL': 'Redis 캐시 서버 연결 문자열',
            'GOOGLE_API_KEY': 'Google Gemini API 키',
            'HUGGINGFACE_API_KEY': 'Hugging Face API 키',
            'SENDGRID_API_KEY': '이메일 발송을 위한 SendGrid API 키',
            'AWS_ACCESS_KEY_ID': 'AWS S3 액세스 키',
            'AWS_SECRET_ACCESS_KEY': 'AWS S3 시크릿 키',
            'AWS_STORAGE_BUCKET_NAME': 'AWS S3 버킷 이름',
            'SENTRY_DSN': '에러 모니터링을 위한 Sentry DSN',
        }
        
        # 필수 변수 확인
        for var, description in required_vars.items():
            if os.environ.get(var):
                self.successes.append(f"✅ {var}: {description} - 설정됨")
            else:
                self.errors.append(f"❌ {var}: {description} - 누락됨!")
        
        # 선택적 변수 확인
        for var, description in optional_vars.items():
            if os.environ.get(var):
                self.successes.append(f"✅ {var}: {description} - 설정됨")
            else:
                self.warnings.append(f"⚠️  {var}: {description} - 미설정 (선택사항)")
    
    def check_database_connection(self):
        """데이터베이스 연결 확인"""
        print("\n🔍 데이터베이스 연결 확인...")
        
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                self.successes.append("✅ 데이터베이스 연결 성공")
        except Exception as e:
            self.errors.append(f"❌ 데이터베이스 연결 실패: {str(e)}")
    
    def check_migrations(self):
        """마이그레이션 상태 확인"""
        print("\n🔍 마이그레이션 상태 확인...")
        
        try:
            from django.core.management import call_command
            from io import StringIO
            
            out = StringIO()
            call_command('showmigrations', '--plan', stdout=out)
            output = out.getvalue()
            
            if '[X]' in output and '[ ]' not in output:
                self.successes.append("✅ 모든 마이그레이션이 적용됨")
            else:
                unmigrated = output.count('[ ]')
                self.warnings.append(f"⚠️  적용되지 않은 마이그레이션 {unmigrated}개 존재")
        except Exception as e:
            self.errors.append(f"❌ 마이그레이션 확인 실패: {str(e)}")
    
    def check_static_files(self):
        """정적 파일 설정 확인"""
        print("\n🔍 정적 파일 설정 확인...")
        
        if hasattr(settings, 'STATIC_ROOT'):
            self.successes.append(f"✅ STATIC_ROOT 설정됨: {settings.STATIC_ROOT}")
        else:
            self.errors.append("❌ STATIC_ROOT가 설정되지 않음")
        
        if hasattr(settings, 'STATICFILES_STORAGE'):
            if 'whitenoise' in settings.STATICFILES_STORAGE.lower():
                self.successes.append("✅ WhiteNoise를 통한 정적 파일 서빙 설정됨")
            else:
                self.warnings.append("⚠️  WhiteNoise가 설정되지 않음")
    
    def check_media_files(self):
        """미디어 파일 설정 확인"""
        print("\n🔍 미디어 파일 설정 확인...")
        
        if hasattr(settings, 'MEDIA_ROOT'):
            self.successes.append(f"✅ MEDIA_ROOT 설정됨: {settings.MEDIA_ROOT}")
            
            # 미디어 디렉토리 존재 확인
            if os.path.exists(settings.MEDIA_ROOT):
                self.successes.append("✅ 미디어 디렉토리 존재함")
            else:
                self.warnings.append("⚠️  미디어 디렉토리가 존재하지 않음 (자동 생성됨)")
        else:
            self.errors.append("❌ MEDIA_ROOT가 설정되지 않음")
        
        # AWS S3 설정 확인
        if os.environ.get('AWS_ACCESS_KEY_ID'):
            self.successes.append("✅ AWS S3 스토리지 설정됨")
        else:
            self.warnings.append("⚠️  AWS S3 미설정 - 로컬 스토리지 사용")
    
    def check_cors_settings(self):
        """CORS 설정 확인"""
        print("\n🔍 CORS 설정 확인...")
        
        if hasattr(settings, 'CORS_ALLOWED_ORIGINS'):
            origins = settings.CORS_ALLOWED_ORIGINS
            self.successes.append(f"✅ CORS 허용 도메인 {len(origins)}개 설정됨")
            
            # 중요 도메인 확인
            important_domains = ['https://vlanet.net', 'https://www.vlanet.net']
            for domain in important_domains:
                if domain in origins:
                    self.successes.append(f"  ✅ {domain} 허용됨")
                else:
                    self.errors.append(f"  ❌ {domain} 누락됨!")
        else:
            self.errors.append("❌ CORS_ALLOWED_ORIGINS가 설정되지 않음")
        
        if hasattr(settings, 'CORS_ALLOW_CREDENTIALS'):
            if settings.CORS_ALLOW_CREDENTIALS:
                self.successes.append("✅ CORS 인증 정보 포함 허용됨")
            else:
                self.warnings.append("⚠️  CORS 인증 정보 포함 비허용")
    
    def check_security_settings(self):
        """보안 설정 확인"""
        print("\n🔍 보안 설정 확인...")
        
        # DEBUG 모드
        if not settings.DEBUG:
            self.successes.append("✅ DEBUG 모드 비활성화됨")
        else:
            self.errors.append("❌ DEBUG 모드가 활성화되어 있음!")
        
        # ALLOWED_HOSTS
        if settings.ALLOWED_HOSTS:
            self.successes.append(f"✅ ALLOWED_HOSTS 설정됨: {len(settings.ALLOWED_HOSTS)}개")
        else:
            self.errors.append("❌ ALLOWED_HOSTS가 비어있음!")
        
        # SECURE_SSL_REDIRECT
        if hasattr(settings, 'SECURE_SSL_REDIRECT') and settings.SECURE_SSL_REDIRECT:
            self.successes.append("✅ HTTPS 강제 리다이렉트 활성화됨")
        else:
            self.warnings.append("⚠️  HTTPS 강제 리다이렉트 비활성화됨")
        
        # CSRF 설정
        if hasattr(settings, 'CSRF_TRUSTED_ORIGINS'):
            self.successes.append(f"✅ CSRF 신뢰 도메인 {len(settings.CSRF_TRUSTED_ORIGINS)}개 설정됨")
    
    def check_cache_settings(self):
        """캐시 설정 확인"""
        print("\n🔍 캐시 설정 확인...")
        
        if os.environ.get('REDIS_URL'):
            self.successes.append("✅ Redis 캐시 설정됨")
        else:
            self.warnings.append("⚠️  Redis 미설정 - 데이터베이스 캐시 사용")
            
            # 캐시 테이블 확인
            try:
                from django.core.cache import cache
                cache.set('test_key', 'test_value', 1)
                if cache.get('test_key') == 'test_value':
                    self.successes.append("✅ 캐시 시스템 작동 중")
                else:
                    self.errors.append("❌ 캐시 시스템 작동 안함")
            except Exception as e:
                self.errors.append(f"❌ 캐시 테스트 실패: {str(e)}")
    
    def check_websocket_settings(self):
        """웹소켓 설정 확인"""
        print("\n🔍 웹소켓 설정 확인...")
        
        if 'channels' in settings.INSTALLED_APPS:
            self.successes.append("✅ Django Channels 설치됨")
            
            if hasattr(settings, 'CHANNEL_LAYERS'):
                backend = settings.CHANNEL_LAYERS.get('default', {}).get('BACKEND', '')
                if 'redis' in backend.lower():
                    self.successes.append("✅ Redis를 통한 웹소켓 채널 레이어 설정됨")
                elif 'inmemory' in backend.lower():
                    self.warnings.append("⚠️  InMemory 채널 레이어 사용 중 (단일 서버만 지원)")
                else:
                    self.warnings.append(f"⚠️  알 수 없는 채널 레이어: {backend}")
        else:
            self.warnings.append("⚠️  Django Channels 미설치 - 웹소켓 미지원")
    
    def check_logging_settings(self):
        """로깅 설정 확인"""
        print("\n🔍 로깅 설정 확인...")
        
        if hasattr(settings, 'LOGGING'):
            self.successes.append("✅ 로깅 설정 존재함")
            
            # Sentry 확인
            if os.environ.get('SENTRY_DSN'):
                self.successes.append("✅ Sentry 에러 모니터링 설정됨")
            else:
                self.warnings.append("⚠️  Sentry 미설정 - 에러 모니터링 제한적")
        else:
            self.warnings.append("⚠️  로깅 설정이 없음")
    
    def check_api_endpoints(self):
        """주요 API 엔드포인트 확인"""
        print("\n🔍 API 엔드포인트 확인...")
        
        client = Client()
        
        # Health check
        try:
            response = client.get('/api/health/')
            if response.status_code == 200:
                self.successes.append("✅ Health check 엔드포인트 정상")
            else:
                self.errors.append(f"❌ Health check 실패: {response.status_code}")
        except Exception as e:
            self.errors.append(f"❌ Health check 접근 실패: {str(e)}")
    
    def run_all_checks(self):
        """모든 검사 실행"""
        print("=" * 80)
        print("🚀 VideoPlanet 배포 환경 검증 시작")
        print("=" * 80)
        
        self.check_environment_variables()
        self.check_database_connection()
        self.check_migrations()
        self.check_static_files()
        self.check_media_files()
        self.check_cors_settings()
        self.check_security_settings()
        self.check_cache_settings()
        self.check_websocket_settings()
        self.check_logging_settings()
        self.check_api_endpoints()
        
        # 결과 출력
        print("\n" + "=" * 80)
        print("📊 검증 결과 요약")
        print("=" * 80)
        
        print(f"\n✅ 성공: {len(self.successes)}개")
        for success in self.successes:
            print(f"  {success}")
        
        if self.warnings:
            print(f"\n⚠️  경고: {len(self.warnings)}개")
            for warning in self.warnings:
                print(f"  {warning}")
        
        if self.errors:
            print(f"\n❌ 오류: {len(self.errors)}개")
            for error in self.errors:
                print(f"  {error}")
        
        # 최종 평가
        print("\n" + "=" * 80)
        if not self.errors:
            print("✅ 배포 준비 완료! 모든 필수 검사를 통과했습니다.")
        else:
            print("❌ 배포 전 해결해야 할 오류가 있습니다.")
            print("위의 오류를 먼저 해결한 후 다시 검사를 실행하세요.")
        
        return len(self.errors) == 0

if __name__ == "__main__":
    checker = DeploymentChecker()
    success = checker.run_all_checks()
    sys.exit(0 if success else 1)