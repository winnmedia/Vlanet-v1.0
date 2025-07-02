#!/bin/bash
# Railway 환경에서 feedbacks 앱 마이그레이션 적용 스크립트

echo "=== Feedbacks 앱 마이그레이션 시작 ==="

# 마이그레이션 상태 확인
echo "1. 현재 마이그레이션 상태 확인:"
python manage.py showmigrations feedbacks --settings=config.settings.cors_emergency_fix

# 마이그레이션 적용
echo -e "\n2. 마이그레이션 적용:"
python manage.py migrate feedbacks --settings=config.settings.cors_emergency_fix

# 적용 후 상태 확인
echo -e "\n3. 적용 후 마이그레이션 상태:"
python manage.py showmigrations feedbacks --settings=config.settings.cors_emergency_fix

# 데이터베이스 테이블 구조 확인 (PostgreSQL)
echo -e "\n4. feedbacks_feedback 테이블 구조 확인:"
python manage.py dbshell --settings=config.settings.cors_emergency_fix << EOF
\d feedbacks_feedback
EOF

echo -e "\n=== 마이그레이션 완료 ==="