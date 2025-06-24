#!/bin/bash
set -e

echo "🚀 VideoPlanet GPU 서버 시작 중..."

# GPU 상태 확인
echo "=== GPU 환경 확인 ==="
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi --query-gpu=name,driver_version,memory.total,memory.used --format=csv,noheader,nounits
    echo "GPU 감지됨 ✅"
else
    echo "⚠️  GPU를 감지할 수 없습니다. CPU 모드로 실행됩니다."
fi

# CUDA 환경 확인
if [ -n "$CUDA_VISIBLE_DEVICES" ]; then
    echo "CUDA_VISIBLE_DEVICES: $CUDA_VISIBLE_DEVICES"
fi

# 데이터베이스 연결 대기
echo "⏳ PostgreSQL 연결 대기 중..."
while ! nc -z ${DB_HOST:-postgres} ${DB_PORT:-5432}; do
    echo "PostgreSQL 연결 대기 중... (5초 후 재시도)"
    sleep 5
done
echo "✅ PostgreSQL 연결됨"

# Redis 연결 대기
echo "⏳ Redis 연결 대기 중..."
while ! nc -z ${REDIS_HOST:-redis} ${REDIS_PORT:-6379}; do
    echo "Redis 연결 대기 중... (5초 후 재시도)"
    sleep 5
done
echo "✅ Redis 연결됨"

# 데이터베이스 마이그레이션
echo "🔄 데이터베이스 마이그레이션 실행 중..."
poetry run python manage.py migrate --noinput

# 정적 파일 수집
echo "📁 정적 파일 수집 중..."
poetry run python manage.py collectstatic --noinput --clear

# 슈퍼유저 생성 (선택적)
if [ "$DJANGO_SUPERUSER_EMAIL" ] && [ "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "👤 슈퍼유저 생성 중..."
    poetry run python manage.py createsuperuser \
        --email "$DJANGO_SUPERUSER_EMAIL" \
        --noinput || echo "슈퍼유저가 이미 존재합니다."
fi

# GPU 라이브러리 테스트
echo "🧪 GPU 라이브러리 테스트 중..."
poetry run python -c "
try:
    import torch
    print(f'PyTorch: {torch.__version__} | CUDA: {torch.cuda.is_available()}')
except ImportError:
    print('PyTorch 미설치')

try:
    import tensorflow as tf
    gpus = tf.config.list_physical_devices('GPU')
    print(f'TensorFlow: {tf.__version__} | GPU 개수: {len(gpus)}')
except ImportError:
    print('TensorFlow 미설치')

try:
    import cv2
    print(f'OpenCV: {cv2.__version__} | CUDA: {cv2.cuda.getCudaEnabledDeviceCount()}')
except ImportError:
    print('OpenCV 미설치')
"

echo "✅ 초기화 완료! 서버 시작 중..."

# 전달받은 명령어 실행
exec "$@"