# 최소한의 Python 이미지 사용
FROM python:3.11-slim

# 작업 디렉토리 설정
WORKDIR /app

# Python 파일만 복사
COPY vridge_back/simple_server.py .

# 포트 노출
EXPOSE 8000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8000').read()" || exit 1

# 서버 실행
CMD ["python3", "simple_server.py"]