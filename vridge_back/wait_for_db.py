#!/usr/bin/env python
"""
데이터베이스 연결을 기다리는 스크립트
Railway 환경에서 PostgreSQL이 준비될 때까지 대기
"""
import os
import sys
import time
import psycopg2
from urllib.parse import urlparse

def wait_for_database(max_attempts=30, delay=2):
    """데이터베이스가 준비될 때까지 대기"""
    database_url = os.environ.get('DATABASE_URL') or os.environ.get('RAILWAY_DATABASE_URL')
    
    if not database_url:
        print("WARNING: No DATABASE_URL found, skipping database wait")
        return True
    
    # Parse database URL
    url = urlparse(database_url)
    
    print(f"Waiting for database at {url.hostname}:{url.port or 5432}...")
    
    for attempt in range(max_attempts):
        try:
            conn = psycopg2.connect(
                host=url.hostname,
                port=url.port or 5432,
                user=url.username,
                password=url.password,
                database=url.path[1:],  # Remove leading slash
                connect_timeout=5
            )
            conn.close()
            print("Database is ready!")
            return True
        except psycopg2.OperationalError as e:
            if attempt < max_attempts - 1:
                print(f"Attempt {attempt + 1}/{max_attempts} failed: {str(e)[:50]}...")
                time.sleep(delay)
            else:
                print(f"Failed to connect to database after {max_attempts} attempts")
                return False
    
    return False

if __name__ == "__main__":
    if not wait_for_database():
        sys.exit(1)
    sys.exit(0)