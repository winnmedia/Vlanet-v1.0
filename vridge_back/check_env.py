#!/usr/bin/env python
"""환경변수 확인"""
import os

print("=== 환경변수 확인 ===")
print(f"OPENAI_API_KEY: {os.environ.get('OPENAI_API_KEY', 'NOT SET')}")
print(f"GOOGLE_API_KEY: {os.environ.get('GOOGLE_API_KEY', 'NOT SET')}")
print(f"DATABASE_URL: {'SET' if os.environ.get('DATABASE_URL') else 'NOT SET'}")

# 모든 환경변수 확인
print("\n=== 모든 환경변수 ===")
for key, value in os.environ.items():
    if 'KEY' in key or 'TOKEN' in key or 'SECRET' in key:
        print(f"{key}: {'SET' if value else 'NOT SET'}")