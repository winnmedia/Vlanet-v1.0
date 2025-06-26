#!/usr/bin/env python
"""
미디어 파일 저장 경로 확인 스크립트
Railway 볼륨이 제대로 마운트되었는지 확인합니다.
"""
import os
import sys
import django

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

from django.conf import settings

def check_media_setup():
    print("=== Media File Configuration Check ===\n")
    
    # 1. MEDIA 설정 확인
    print(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
    print(f"MEDIA_URL: {settings.MEDIA_URL}")
    
    # 2. 디렉토리 존재 확인
    if os.path.exists(settings.MEDIA_ROOT):
        print(f"✓ MEDIA_ROOT directory exists")
        
        # 권한 확인
        if os.access(settings.MEDIA_ROOT, os.W_OK):
            print(f"✓ MEDIA_ROOT is writable")
        else:
            print(f"✗ MEDIA_ROOT is NOT writable")
            
        # feedback_file 디렉토리 확인
        feedback_dir = os.path.join(settings.MEDIA_ROOT, 'feedback_file')
        if os.path.exists(feedback_dir):
            print(f"✓ feedback_file directory exists")
        else:
            print(f"✗ feedback_file directory does NOT exist")
            # 디렉토리 생성 시도
            try:
                os.makedirs(feedback_dir)
                print(f"✓ Created feedback_file directory")
            except Exception as e:
                print(f"✗ Failed to create feedback_file directory: {e}")
    else:
        print(f"✗ MEDIA_ROOT directory does NOT exist")
        # 디렉토리 생성 시도
        try:
            os.makedirs(settings.MEDIA_ROOT)
            print(f"✓ Created MEDIA_ROOT directory")
        except Exception as e:
            print(f"✗ Failed to create MEDIA_ROOT directory: {e}")
    
    # 3. 파일 업로드 설정 확인
    print(f"\n=== File Upload Settings ===")
    print(f"FILE_UPLOAD_MAX_MEMORY_SIZE: {settings.FILE_UPLOAD_MAX_MEMORY_SIZE / 1024 / 1024:.0f}MB")
    print(f"DATA_UPLOAD_MAX_MEMORY_SIZE: {settings.DATA_UPLOAD_MAX_MEMORY_SIZE / 1024 / 1024:.0f}MB")
    
    # 4. 볼륨 마운트 확인 (Railway)
    print(f"\n=== Volume Mount Check ===")
    if os.path.exists('/app/media'):
        print(f"✓ /app/media volume mount point exists")
        
        # 용량 확인
        try:
            stat = os.statvfs('/app/media')
            total_space = stat.f_blocks * stat.f_frsize / 1024 / 1024 / 1024  # GB
            free_space = stat.f_avail * stat.f_frsize / 1024 / 1024 / 1024  # GB
            used_space = total_space - free_space
            usage_percent = (used_space / total_space) * 100 if total_space > 0 else 0
            
            print(f"Total Space: {total_space:.2f}GB")
            print(f"Used Space: {used_space:.2f}GB ({usage_percent:.1f}%)")
            print(f"Free Space: {free_space:.2f}GB")
        except Exception as e:
            print(f"Could not check volume space: {e}")
    else:
        print(f"✗ /app/media volume mount point does NOT exist")

if __name__ == '__main__':
    check_media_setup()