# 경량화된 Django 백엔드용 Dockerfile
FROM python:3.11-alpine

# 환경 변수 설정
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 작업 디렉토리 설정
WORKDIR /app

# Alpine 패키지 설치 (더 가벼움)
RUN apk add --no-cache \
    postgresql-dev \
    gcc \
    python3-dev \
    musl-dev

# 전체 프로젝트 복사
COPY . .

# pip 업그레이드 및 의존성 설치
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r vridge_back/requirements.txt && \
    pip install --no-cache-dir gunicorn

# 정적 파일 디렉토리 생성
RUN mkdir -p /app/vridge_back/staticfiles

# 작업 디렉토리 변경
WORKDIR /app/vridge_back

# 포트 노출
EXPOSE 8000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health').read()" || exit 1

# Django 서버 실행
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120"]