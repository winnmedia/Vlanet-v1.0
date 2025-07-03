#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    # Railway 환경에서는 railway 설정 사용
    if os.environ.get('RAILWAY_ENVIRONMENT'):
        # 환경변수로 설정 모듈을 지정할 수 있도록 수정
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", os.environ.get('DJANGO_SETTINGS_MODULE', "config.settings_minimal"))
    else:
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings_dev")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
