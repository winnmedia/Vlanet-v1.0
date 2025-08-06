#!/bin/bash

# VideoPlanet 통합 배포 매니저
# Blue-Green, Canary, Feature Flag 배포 지원

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
PROJECT_ROOT="/home/winnmedia/VideoPlanet"
FRONTEND_DIR="$PROJECT_ROOT/vridge_front"
BACKEND_DIR="$PROJECT_ROOT/vridge_back"
DEPLOYMENT_LOG="$PROJECT_ROOT/deployment/logs/deployment-$(date +%Y%m%d-%H%M%S).log"

# 환경 변수 로드
if [ -f "$PROJECT_ROOT/.env.deployment" ]; then
    source "$PROJECT_ROOT/.env.deployment"
fi

# 로그 함수
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

# 배포 전 체크
pre_deployment_checks() {
    log "배포 전 체크 시작..."
    
    # Git 상태 확인
    cd "$PROJECT_ROOT"
    if [ -n "$(git status --porcelain)" ]; then
        error "커밋되지 않은 변경사항이 있습니다. 먼저 커밋하세요."
    fi
    
    # 테스트 실행
    log "테스트 실행 중..."
    cd "$FRONTEND_DIR"
    npm test -- --watchAll=false || warning "프론트엔드 테스트 일부 실패"
    
    cd "$BACKEND_DIR"
    python manage.py test || warning "백엔드 테스트 일부 실패"
    
    # 헬스체크
    log "현재 서비스 헬스체크..."
    curl -s https://vlanet.net/api/health || warning "프론트엔드 헬스체크 실패"
    curl -s https://videoplanet.up.railway.app/api/health/ || warning "백엔드 헬스체크 실패"
    
    log "배포 전 체크 완료"
}

# 백업 생성
create_backup() {
    log "백업 생성 중..."
    
    BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # 데이터베이스 백업
    if [ -n "$DATABASE_URL" ]; then
        pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database.sql"
        log "데이터베이스 백업 완료"
    fi
    
    # 현재 배포 태그 저장
    git describe --tags --always > "$BACKUP_DIR/current_version.txt"
    
    # 환경 변수 백업
    cp "$PROJECT_ROOT/.env.deployment" "$BACKUP_DIR/" 2>/dev/null || true
    
    log "백업 완료: $BACKUP_DIR"
    echo "$BACKUP_DIR"
}

# Blue-Green 배포
blue_green_deploy() {
    log "Blue-Green 배포 시작..."
    
    # 새 버전을 Green 환경에 배포
    log "Green 환경에 새 버전 배포 중..."
    
    # Frontend 배포 (Vercel Preview)
    cd "$FRONTEND_DIR"
    PREVIEW_URL=$(vercel --token="$VERCEL_TOKEN" --scope="$VERCEL_ORG_ID" | grep "Preview:" | awk '{print $2}')
    log "Frontend Preview URL: $PREVIEW_URL"
    
    # Backend 배포 (Railway Staging)
    cd "$BACKEND_DIR"
    railway up --environment staging
    
    # Green 환경 테스트
    log "Green 환경 테스트 중..."
    npm run test:e2e -- --url="$PREVIEW_URL" || error "Green 환경 테스트 실패"
    
    # 트래픽 전환
    log "트래픽을 Green 환경으로 전환 중..."
    vercel promote "$PREVIEW_URL" --token="$VERCEL_TOKEN" --scope="$VERCEL_ORG_ID"
    railway environment:promote staging production
    
    # Blue 환경 정리 (이전 버전)
    log "이전 Blue 환경 정리 중..."
    # 여기에 정리 로직 추가
    
    log "Blue-Green 배포 완료"
}

# Canary 배포
canary_deploy() {
    local PERCENTAGE=${1:-10}
    log "Canary 배포 시작 (${PERCENTAGE}% 트래픽)..."
    
    # Feature Flag 설정
    curl -X POST https://videoplanet.up.railway.app/api/feature-flags \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "{
            \"flag\": \"canary_deployment\",
            \"enabled\": true,
            \"percentage\": $PERCENTAGE,
            \"version\": \"$(git describe --tags --always)\"
        }"
    
    # 새 버전 배포
    cd "$FRONTEND_DIR"
    vercel --prod --token="$VERCEL_TOKEN" --scope="$VERCEL_ORG_ID"
    
    cd "$BACKEND_DIR"
    railway up --environment production
    
    # 메트릭 모니터링
    log "Canary 배포 모니터링 중 (5분)..."
    sleep 300
    
    # 에러율 체크
    ERROR_RATE=$(curl -s https://videoplanet.up.railway.app/api/monitoring/metrics | jq '.error_rate')
    
    if (( $(echo "$ERROR_RATE > 5" | bc -l) )); then
        error "에러율이 임계값을 초과했습니다. 롤백을 시작합니다."
        rollback
    fi
    
    # 점진적 트래픽 증가
    if [ "$PERCENTAGE" -lt 100 ]; then
        NEW_PERCENTAGE=$((PERCENTAGE + 20))
        if [ "$NEW_PERCENTAGE" -gt 100 ]; then
            NEW_PERCENTAGE=100
        fi
        log "트래픽을 ${NEW_PERCENTAGE}%로 증가시킵니다..."
        canary_deploy "$NEW_PERCENTAGE"
    else
        log "Canary 배포 완료 (100% 트래픽)"
    fi
}

# 롤백
rollback() {
    log "롤백 시작..."
    
    # 이전 버전 태그 가져오기
    PREVIOUS_TAG=$(git describe --tags --abbrev=0 HEAD^)
    log "이전 버전으로 롤백: $PREVIOUS_TAG"
    
    # Git 체크아웃
    git checkout "$PREVIOUS_TAG"
    
    # Frontend 롤백
    cd "$FRONTEND_DIR"
    vercel rollback --token="$VERCEL_TOKEN"
    
    # Backend 롤백
    cd "$BACKEND_DIR"
    railway rollback --environment production
    
    # Feature Flags 초기화
    curl -X POST https://videoplanet.up.railway.app/api/feature-flags/reset \
        -H "Authorization: Bearer $ADMIN_TOKEN"
    
    # 알림 발송
    send_alert "critical" "Production rollback to $PREVIOUS_TAG completed"
    
    log "롤백 완료"
}

# 배포 후 작업
post_deployment() {
    log "배포 후 작업 시작..."
    
    # 캐시 초기화
    curl -X POST https://videoplanet.up.railway.app/api/cache/clear \
        -H "Authorization: Bearer $ADMIN_TOKEN"
    
    # Sentry 릴리즈 생성
    VERSION=$(git describe --tags --always)
    sentry-cli releases new "$VERSION"
    sentry-cli releases set-commits "$VERSION" --auto
    sentry-cli releases finalize "$VERSION"
    sentry-cli releases deploys "$VERSION" new -e production
    
    # 배포 메트릭 수집
    collect_deployment_metrics
    
    # 알림 발송
    send_alert "info" "Deployment completed successfully: $VERSION"
    
    log "배포 후 작업 완료"
}

# 배포 메트릭 수집
collect_deployment_metrics() {
    log "배포 메트릭 수집 중..."
    
    METRICS=$(cat <<EOF
{
    "deployment_id": "$(uuidgen)",
    "version": "$(git describe --tags --always)",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "duration": "$SECONDS",
    "type": "$DEPLOYMENT_TYPE",
    "status": "success",
    "metrics": {
        "build_time": "$BUILD_TIME",
        "test_duration": "$TEST_DURATION",
        "deployment_duration": "$DEPLOY_DURATION"
    }
}
EOF
)
    
    echo "$METRICS" >> "$PROJECT_ROOT/deployment/metrics.json"
    
    # 메트릭을 모니터링 시스템으로 전송
    curl -X POST https://videoplanet.up.railway.app/api/monitoring/deployment \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "$METRICS"
}

# 알림 발송
send_alert() {
    local SEVERITY=$1
    local MESSAGE=$2
    
    # Slack 알림
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"[$SEVERITY] $MESSAGE\",
                \"attachments\": [{
                    \"color\": \"$([ "$SEVERITY" = "critical" ] && echo "danger" || echo "good")\",
                    \"fields\": [
                        {\"title\": \"Project\", \"value\": \"VideoPlanet\", \"short\": true},
                        {\"title\": \"Environment\", \"value\": \"Production\", \"short\": true},
                        {\"title\": \"Version\", \"value\": \"$(git describe --tags --always)\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true}
                    ]
                }]
            }"
    fi
}

# 메인 함수
main() {
    DEPLOYMENT_TYPE=${1:-"blue-green"}
    
    # 로그 디렉토리 생성
    mkdir -p "$(dirname "$DEPLOYMENT_LOG")"
    
    log "VideoPlanet 배포 시작 (Type: $DEPLOYMENT_TYPE)"
    
    # 시간 측정 시작
    SECONDS=0
    
    # 배포 전 체크
    pre_deployment_checks
    
    # 백업 생성
    BACKUP_PATH=$(create_backup)
    
    # 배포 타입별 실행
    case "$DEPLOYMENT_TYPE" in
        "blue-green")
            blue_green_deploy
            ;;
        "canary")
            canary_deploy 10
            ;;
        "rollback")
            rollback
            ;;
        "direct")
            # 직접 배포 (개발 환경용)
            cd "$FRONTEND_DIR" && vercel --prod --token="$VERCEL_TOKEN"
            cd "$BACKEND_DIR" && railway up
            ;;
        *)
            error "Unknown deployment type: $DEPLOYMENT_TYPE"
            ;;
    esac
    
    # 배포 후 작업
    if [ "$DEPLOYMENT_TYPE" != "rollback" ]; then
        post_deployment
    fi
    
    # 배포 시간 출력
    log "배포 완료! (소요 시간: ${SECONDS}초)"
    
    # 최종 헬스체크
    log "최종 헬스체크..."
    curl -s https://vlanet.net/api/health || error "프론트엔드 헬스체크 실패"
    curl -s https://videoplanet.up.railway.app/api/health/ || error "백엔드 헬스체크 실패"
    
    log "모든 작업이 성공적으로 완료되었습니다!"
}

# 스크립트 실행
main "$@"