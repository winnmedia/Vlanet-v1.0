"""
버전 정보를 제공하는 모듈
"""
import os
from pathlib import Path

def get_version():
    """프로젝트 버전을 반환합니다."""
    version_file = Path(__file__).parent.parent.parent / 'VERSION'
    if version_file.exists():
        return version_file.read_text().strip()
    return "0.1.0"  # 기본값

def get_commit_hash():
    """현재 Git 커밋 해시를 반환합니다."""
    try:
        import subprocess
        result = subprocess.run(
            ['git', 'rev-parse', '--short', 'HEAD'],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent.parent
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except:
        pass
    return "unknown"

# 전역 변수로 버전 정보 저장
VERSION = get_version()
COMMIT_HASH = get_commit_hash()
FULL_VERSION = f"{VERSION}-{COMMIT_HASH}"