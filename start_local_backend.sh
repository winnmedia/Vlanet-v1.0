#!/bin/bash
# 로컬 백엔드 서버 실행 스크립트

echo "로컬 백엔드 서버 시작..."

cd vridge_back

# 가상환경 활성화
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "../venv" ]; then
    source ../venv/bin/activate
else
    echo "가상환경을 찾을 수 없습니다. 새로 생성합니다..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

# 마이그레이션
python manage.py migrate

# 서버 실행 (CORS 허용)
echo "서버를 http://localhost:8000 에서 시작합니다..."
python manage.py runserver 0.0.0.0:8000