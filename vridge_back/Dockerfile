FROM python:3.11

WORKDIR /app

# 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Python 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn

# 프로젝트 복사
COPY . .

# 정적 파일 수집
RUN python manage.py collectstatic --noinput || true

# 포트 설정
EXPOSE 8000

# 환경변수 설정
ENV DJANGO_SETTINGS_MODULE=config.settings_railway_standalone
ENV PYTHONPATH=/app

# 실행
CMD ["sh", "-c", "python manage.py migrate --noinput || true && gunicorn config.wsgi --bind 0.0.0.0:${PORT:-8000} --workers 2 --access-logfile - --error-logfile -"]