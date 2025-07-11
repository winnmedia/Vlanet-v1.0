#!/bin/bash

# VideoPlanet 고급 배포 스크립트
# 자동화된 배포 프로세스 with 롤백 지원

set -e  # 에러 발생 시 즉시 중단

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ${CYAN}INFO${NC} $1"
}

log_success() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ${GREEN}SUCCESS${NC} $1"
}

log_warning() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ${YELLOW}WARNING${NC} $1"
}

log_error() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ${RED}ERROR${NC} $1"
}

# 스피너 함수
spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# 타임스탬프
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
START_TIME=$(date +%s)

# 배포 환경 확인
if [ -z "$1" ]; then
    echo "VideoPlanet 배포 스크립트"
    echo "========================="
    echo "사용법: ./deploy_advanced.sh [명령] [환경]"
    echo ""
    echo "명령:"
    echo "  deploy    - 전체 배포"
    echo "  backend   - 백엔드만 배포"
    echo "  frontend  - 프론트엔드만 배포"
    echo "  rollback  - 이전 버전으로 롤백"
    echo "  status    - 배포 상태 확인"
    echo ""
    echo "환경:"
    echo "  staging    - 스테이징 환경"
    echo "  production - 프로덕션 환경"
    echo ""
    echo "예시:"
    echo "  ./deploy_advanced.sh deploy production"
    echo "  ./deploy_advanced.sh backend staging"
    exit 1
fi

COMMAND=$1
ENVIRONMENT=${2:-staging}

# 환경 검증
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    log_error "잘못된 환경: $ENVIRONMENT"
    exit 1
fi

# 프로젝트 루트 디렉토리
PROJECT_ROOT=$(dirname "$0")
cd "$PROJECT_ROOT"

# 환경별 설정
if [ "$ENVIRONMENT" == "production" ]; then
    BACKEND_URL="https://videoplanet.up.railway.app"
    FRONTEND_URL="https://vlanet.net"
    VERCEL_ENV="--prod"
    RAILWAY_ENV="production"
else
    BACKEND_URL="https://videoplanet-staging.up.railway.app"
    FRONTEND_URL="https://videoplanet-staging.vercel.app"
    VERCEL_ENV=""
    RAILWAY_ENV="staging"
fi

# 사전 체크 함수
pre_deploy_checks() {
    log_info "사전 배포 체크 시작..."
    
    # Git 상태 확인
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "커밋되지 않은 변경사항이 있습니다."
        git status --short
        echo ""
        read -p "계속하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "배포가 취소되었습니다."
            exit 1
        fi
    fi
    
    # 필수 도구 확인
    local required_tools=("git" "node" "npm" "python3")
    for tool in "${required_tools[@]}"; do
        if ! command -v $tool &> /dev/null; then
            log_error "$tool이 설치되지 않았습니다."
            exit 1
        fi
    done
    
    # Railway CLI 확인 (선택사항)
    if ! command -v railway &> /dev/null; then
        log_warning "Railway CLI가 설치되지 않았습니다. 자동 배포가 제한됩니다."
    fi
    
    # Vercel CLI 확인 (선택사항)
    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI가 설치되지 않았습니다. 자동 배포가 제한됩니다."
    fi
    
    log_success "사전 체크 완료"
}

# 백엔드 테스트
test_backend() {
    log_info "백엔드 테스트 실행 중..."
    cd vridge_back
    
    # 마이그레이션 체크
    python3 manage.py showmigrations --plan | grep -q "\[ \]" && {
        log_warning "적용되지 않은 마이그레이션이 있습니다."
    }
    
    # 간단한 테스트 실행
    python3 manage.py check --deploy
    
    cd ..
    log_success "백엔드 테스트 완료"
}

# 프론트엔드 테스트
test_frontend() {
    log_info "프론트엔드 테스트 실행 중..."
    cd vridge_front
    
    # 린트 체크
    if [ -f "package.json" ] && grep -q "\"lint\"" package.json; then
        npm run lint || log_warning "린트 경고가 있습니다."
    fi
    
    # 빌드 테스트
    npm run build
    
    cd ..
    log_success "프론트엔드 테스트 완료"
}

# 백업 생성
create_backup() {
    log_info "백업 생성 중..."
    
    # 백업 디렉토리 생성
    BACKUP_DIR="backups/deploy_${ENVIRONMENT}_${TIMESTAMP}"
    mkdir -p "$BACKUP_DIR"
    
    # Git 상태 저장
    git rev-parse HEAD > "$BACKUP_DIR/git_commit.txt"
    git branch --show-current > "$BACKUP_DIR/git_branch.txt"
    
    # 환경변수 백업 (민감한 정보 제외)
    if [ -f "vridge_back/.env" ]; then
        grep -v "SECRET\|PASSWORD\|KEY" vridge_back/.env > "$BACKUP_DIR/backend_env_sample.txt" || true
    fi
    
    if [ -f "vridge_front/.env" ]; then
        cp vridge_front/.env "$BACKUP_DIR/frontend_env.txt"
    fi
    
    log_success "백업 생성 완료: $BACKUP_DIR"
}

# 백엔드 배포
deploy_backend() {
    log_info "백엔드 배포 시작 ($ENVIRONMENT)..."
    
    cd vridge_back
    
    # 배포 체크리스트 실행
    if [ -f "deployment_checklist.py" ]; then
        python3 deployment_checklist.py || {
            log_error "배포 체크리스트 실패"
            return 1
        }
    fi
    
    # Git push
    git add -A
    git commit -m "Deploy: Backend $ENVIRONMENT $(date +'%Y-%m-%d %H:%M:%S')" || true
    git push origin $(git branch --show-current)
    
    # Railway 배포 (CLI 있는 경우)
    if command -v railway &> /dev/null; then
        log_info "Railway로 배포 중..."
        railway environment $RAILWAY_ENV
        railway up --detach &
        spinner $!
    fi
    
    cd ..
    
    # 헬스체크 대기
    log_info "백엔드 헬스체크 대기 중..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$BACKEND_URL/api/health/" > /dev/null; then
            log_success "백엔드 배포 완료"
            return 0
        fi
        sleep 2
        ((attempt++))
    done
    
    log_error "백엔드 헬스체크 실패"
    return 1
}

# 프론트엔드 배포
deploy_frontend() {
    log_info "프론트엔드 배포 시작 ($ENVIRONMENT)..."
    
    cd vridge_front
    
    # 배포 체크리스트 실행
    if [ -f "deployment_checklist.js" ]; then
        node deployment_checklist.js || {
            log_error "배포 체크리스트 실패"
            return 1
        }
    fi
    
    # 환경별 설정
    if [ "$ENVIRONMENT" == "production" ]; then
        [ -f ".env.production" ] && cp .env.production .env.production.local
    else
        [ -f ".env.staging" ] && cp .env.staging .env.production.local
    fi
    
    # 의존성 설치
    npm ci --production=false
    
    # 빌드
    log_info "프론트엔드 빌드 중..."
    CI=false npm run build &
    spinner $!
    
    # Vercel 배포 (CLI 있는 경우)
    if command -v vercel &> /dev/null; then
        log_info "Vercel로 배포 중..."
        vercel $VERCEL_ENV --yes &
        spinner $!
    else
        log_warning "Vercel CLI가 없어 수동 배포가 필요합니다."
    fi
    
    cd ..
    log_success "프론트엔드 배포 완료"
}

# 전체 배포
deploy_all() {
    log_info "전체 배포 시작 ($ENVIRONMENT)..."
    
    pre_deploy_checks
    create_backup
    
    # 병렬 테스트
    log_info "테스트 실행 중..."
    test_backend &
    PID1=$!
    test_frontend &
    PID2=$!
    
    wait $PID1 || { log_error "백엔드 테스트 실패"; exit 1; }
    wait $PID2 || { log_error "프론트엔드 테스트 실패"; exit 1; }
    
    # 순차 배포
    deploy_backend || { log_error "백엔드 배포 실패"; exit 1; }
    deploy_frontend || { log_error "프론트엔드 배포 실패"; exit 1; }
    
    # 배포 검증
    verify_deployment
}

# 배포 검증
verify_deployment() {
    log_info "배포 검증 시작..."
    
    local all_good=true
    
    # 백엔드 확인
    log_info "백엔드 상태 확인..."
    if curl -s -f "$BACKEND_URL/api/health/" > /dev/null; then
        log_success "백엔드 정상"
    else
        log_error "백엔드 응답 없음"
        all_good=false
    fi
    
    # 프론트엔드 확인
    log_info "프론트엔드 상태 확인..."
    if curl -s -f "$FRONTEND_URL" > /dev/null; then
        log_success "프론트엔드 정상"
    else
        log_error "프론트엔드 응답 없음"
        all_good=false
    fi
    
    # CORS 확인
    log_info "CORS 설정 확인..."
    CORS_CHECK=$(curl -s -H "Origin: $FRONTEND_URL" -I "$BACKEND_URL/api/health/" | grep -i "access-control-allow-origin" || true)
    if [ -n "$CORS_CHECK" ]; then
        log_success "CORS 설정 정상"
    else
        log_warning "CORS 헤더를 찾을 수 없습니다"
    fi
    
    if [ "$all_good" = true ]; then
        log_success "배포 검증 완료"
    else
        log_error "배포 검증 실패"
        return 1
    fi
}

# 배포 상태 확인
check_status() {
    echo "======================================"
    echo "VideoPlanet 배포 상태 ($ENVIRONMENT)"
    echo "======================================"
    echo ""
    
    # 백엔드 상태
    echo -n "백엔드 ($BACKEND_URL): "
    if curl -s -f "$BACKEND_URL/api/health/" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 정상${NC}"
    else
        echo -e "${RED}✗ 오류${NC}"
    fi
    
    # 프론트엔드 상태
    echo -n "프론트엔드 ($FRONTEND_URL): "
    if curl -s -f "$FRONTEND_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 정상${NC}"
    else
        echo -e "${RED}✗ 오류${NC}"
    fi
    
    echo ""
    
    # 최근 배포 정보
    if [ -d "backups" ]; then
        echo "최근 배포:"
        ls -t backups/ | head -5 | while read backup; do
            echo "  - $backup"
        done
    fi
}

# 롤백 함수
rollback() {
    log_warning "롤백 기능은 수동으로 진행해야 합니다."
    echo ""
    echo "롤백 가이드:"
    echo "1. Railway 대시보드에서 이전 배포 선택"
    echo "2. Vercel 대시보드에서 이전 배포 프로모트"
    echo "3. 또는 Git에서 이전 커밋으로 되돌리고 재배포"
    echo ""
    echo "백업 위치: backups/"
}

# 배포 알림
send_notification() {
    local status=$1
    local message="VideoPlanet $ENVIRONMENT 배포 $status - $(date)"
    
    # Slack webhook (설정 필요)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi
    
    # 로컬 알림 (macOS)
    if command -v osascript &> /dev/null; then
        osascript -e "display notification \"$message\" with title \"VideoPlanet 배포\""
    fi
    
    # 로컬 알림 (Linux)
    if command -v notify-send &> /dev/null; then
        notify-send "VideoPlanet 배포" "$message"
    fi
}

# 메인 실행 로직
main() {
    echo ""
    echo "🚀 VideoPlanet 배포 스크립트"
    echo "=============================="
    echo "명령: $COMMAND"
    echo "환경: $ENVIRONMENT"
    echo "시작: $(date)"
    echo ""
    
    case $COMMAND in
        deploy)
            deploy_all
            ;;
        backend)
            pre_deploy_checks
            create_backup
            test_backend
            deploy_backend
            ;;
        frontend)
            pre_deploy_checks
            create_backup
            test_frontend
            deploy_frontend
            ;;
        rollback)
            rollback
            ;;
        status)
            check_status
            ;;
        *)
            log_error "알 수 없는 명령: $COMMAND"
            exit 1
            ;;
    esac
    
    # 실행 시간 계산
    END_TIME=$(date +%s)
    ELAPSED=$((END_TIME - START_TIME))
    
    echo ""
    echo "=============================="
    log_success "작업 완료!"
    echo "소요 시간: ${ELAPSED}초"
    echo "=============================="
    
    # 배포 성공 알림
    if [[ "$COMMAND" =~ ^(deploy|backend|frontend)$ ]]; then
        send_notification "성공"
        
        echo ""
        echo "📋 배포 후 체크리스트:"
        echo "  □ 주요 기능 테스트"
        echo "  □ 로그인/회원가입 테스트"
        echo "  □ 프로젝트 생성 테스트"
        echo "  □ 피드백 업로드 테스트"
        echo "  □ 에러 로그 확인"
        echo ""
        echo "🔗 URL:"
        echo "  백엔드: $BACKEND_URL"
        echo "  프론트엔드: $FRONTEND_URL"
    fi
}

# 에러 핸들러
trap 'log_error "배포 중 오류 발생"; send_notification "실패"; exit 1' ERR

# 실행
main