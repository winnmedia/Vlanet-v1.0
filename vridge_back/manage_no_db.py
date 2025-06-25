#!/usr/bin/env python
"""Django's command-line utility - NO DATABASE VERSION"""
import os
import sys

if __name__ == "__main__":
    # 강제로 no_db 설정 사용
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.railway_no_db")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)