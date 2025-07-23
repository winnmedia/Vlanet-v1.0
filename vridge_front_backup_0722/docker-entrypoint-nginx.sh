#!/bin/sh
set -e

echo "🌐 VideoPlanet 프론트엔드 시작 중..."

# 환경 변수 기본값 설정
BACKEND_HOST=${BACKEND_HOST:-backend}
BACKEND_PORT=${BACKEND_PORT:-8000}

echo "백엔드 서버: $BACKEND_HOST:$BACKEND_PORT"

# 백엔드 서버 연결 대기
echo "⏳ 백엔드 서버 연결 대기 중..."
while ! nc -z $BACKEND_HOST $BACKEND_PORT; do
    echo "백엔드 서버 연결 대기 중... (5초 후 재시도)"
    sleep 5
done
echo "✅ 백엔드 서버 연결됨"

# SSL 인증서 확인
if [ -f "/etc/letsencrypt/live/*/fullchain.pem" ]; then
    echo "✅ Let's Encrypt 인증서 발견됨"
    # 실제 인증서로 교체
    cp /etc/letsencrypt/live/*/fullchain.pem /etc/nginx/ssl/selfsigned.crt
    cp /etc/letsencrypt/live/*/privkey.pem /etc/nginx/ssl/selfsigned.key
else
    echo "⚠️  자체 서명 인증서 사용 중"
    echo "실제 도메인 사용 시 다음 명령어로 인증서를 설치하세요:"
    echo "certbot --nginx -d yourdomain.com"
fi

# Nginx 설정 테스트
echo "🔧 Nginx 설정 테스트 중..."
nginx -t

echo "✅ 설정 완료! Nginx 시작 중..."

# 전달받은 명령어 실행
exec "$@"