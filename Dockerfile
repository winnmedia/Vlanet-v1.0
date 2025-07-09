# Django 백엔드용 Dockerfile
FROM python:3.11-slim

# 환경 변수 설정
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 복사 및 설치
COPY vridge_back/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 백엔드 코드 복사
COPY vridge_back/ ./vridge_back/

# 정적 파일 디렉토리 생성
RUN mkdir -p /app/vridge_back/staticfiles

# 작업 디렉토리 변경
WORKDIR /app/vridge_back

# 포트 노출
EXPOSE 8000

# Django 서버 실행
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]