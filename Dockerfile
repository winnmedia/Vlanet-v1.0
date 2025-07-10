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

# Railway가 vridge_back 내용을 루트에 복사하는 경우를 처리
# requirements.txt가 루트에 있는지 확인하고 설치
RUN if [ -f requirements.txt ]; then \
        pip install --upgrade pip && \
        pip install --no-cache-dir -r requirements.txt && \
        pip install --no-cache-dir gunicorn; \
    elif [ -f vridge_back/requirements.txt ]; then \
        pip install --upgrade pip && \
        pip install --no-cache-dir -r vridge_back/requirements.txt && \
        pip install --no-cache-dir gunicorn; \
    else \
        echo "requirements.txt not found!" && exit 1; \
    fi

# 정적 파일 디렉토리 생성
RUN mkdir -p /app/staticfiles

# 포트 노출
EXPOSE 8000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health').read()" || exit 1

# start.sh 스크립트에 실행 권한 부여
RUN if [ -f vridge_back/start.sh ]; then chmod +x vridge_back/start.sh; fi

# Railway는 Procfile을 사용하므로 기본 CMD는 간단하게
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]