#!/usr/bin/env python3
"""
Railway에서 미디어 파일 상태 확인 스크립트
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.conf import settings

print("=== Media Files Configuration ===")
print(f"MEDIA_URL: {settings.MEDIA_URL}")
print(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
print(f"MEDIA_ROOT exists: {os.path.exists(settings.MEDIA_ROOT)}")

if os.path.exists(settings.MEDIA_ROOT):
    print(f"\n=== Media Directory Contents ===")
    for root, dirs, files in os.walk(settings.MEDIA_ROOT):
        level = root.replace(settings.MEDIA_ROOT, '').count(os.sep)
        indent = ' ' * 2 * level
        print(f"{indent}{os.path.basename(root)}/")
        subindent = ' ' * 2 * (level + 1)
        for file in files[:10]:  # 처음 10개 파일만
            print(f"{subindent}{file}")
        if len(files) > 10:
            print(f"{subindent}... and {len(files) - 10} more files")

print(f"\n=== Railway Environment ===")
print(f"RAILWAY_ENVIRONMENT: {os.environ.get('RAILWAY_ENVIRONMENT', 'Not set')}")
print(f"RAILWAY_VOLUME_MOUNT_PATH: {os.environ.get('RAILWAY_VOLUME_MOUNT_PATH', 'Not set')}")

# 피드백 파일 디렉토리 체크
feedback_dir = os.path.join(settings.MEDIA_ROOT, 'feedback_file')
print(f"\n=== Feedback Files Directory ===")
print(f"Path: {feedback_dir}")
print(f"Exists: {os.path.exists(feedback_dir)}")

if os.path.exists(feedback_dir):
    files = os.listdir(feedback_dir)
    print(f"Number of files: {len(files)}")
    for file in files[:5]:
        file_path = os.path.join(feedback_dir, file)
        file_size = os.path.getsize(file_path) / (1024 * 1024)  # MB
        print(f"  - {file} ({file_size:.2f} MB)")