#!/bin/bash
set -e

# VideoPlanet 통합 배포 스크립트
# 백엔드(Railway) + 프론트엔드(Vercel) 배포 자동화

echo "🚀 =========================================="
echo "🚀 VideoPlanet 통합 배포 시작"
echo "🚀 =========================================="
echo "⏰ 배포 시간: $(date)"
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 헬퍼 함수
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 환경 변수 설정
BACKEND_URL="https://videoplanet.up.railway.app"
FRONTEND_URL="https://vlanet.net"
BACKEND_HEALTH_ENDPOINT="${BACKEND_URL}/api/health/"
FRONTEND_HEALTH_ENDPOINT="${FRONTEND_URL}"

# 옵션 파싱
DEPLOY_BACKEND=true
DEPLOY_FRONTEND=true
SKIP_TESTS=false
SKIP_HEALTH_CHECK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-only)
            DEPLOY_BACKEND=true
            DEPLOY_FRONTEND=false
            shift
            ;;
        --frontend-only)
            DEPLOY_BACKEND=false
            DEPLOY_FRONTEND=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-health-check)
            SKIP_HEALTH_CHECK=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [옵션]"
            echo ""
            echo "옵션:"
            echo "  --backend-only      백엔드만 배포"
            echo "  --frontend-only     프론트엔드만 배포"  
            echo "  --skip-tests       테스트 건너뛰기"
            echo "  --skip-health-check 헬스체크 건너뛰기"
            echo "  -h, --help         도움말 출력"
            echo ""
            echo "예제:"
            echo "  $0                    # 전체 배포"
            echo "  $0 --backend-only     # 백엔드만 배포"
            echo "  $0 --frontend-only    # 프론트엔드만 배포"
            exit 0
            ;;
        *)
            log_error "알 수 없는 옵션: $1"
            exit 1
            ;;
    esac
done

# 사전 체크 함수
pre_deployment_check() {
    log_info "🔍 사전 배포 체크 실행 중..."
    
    # Git 상태 확인
    if ! git diff-index --quiet HEAD --; then
        log_warning "커밋되지 않은 변경사항이 있습니다."
        git status --short
        read -p "계속 진행하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "배포가 취소되었습니다."
            exit 1
        fi
    fi
    
    # 현재 브랜치 확인
    current_branch=$(git branch --show-current)
    log_info "현재 브랜치: $current_branch"
    
    # 환경 체크
    log_info "배포 환경 설정:"
    log_info "  - 백엔드 배포: $DEPLOY_BACKEND"
    log_info "  - 프론트엔드 배포: $DEPLOY_FRONTEND"
    log_info "  - 테스트 건너뛰기: $SKIP_TESTS"
    log_info "  - 헬스체크 건너뛰기: $SKIP_HEALTH_CHECK"
    
    log_success "사전 체크 완료"
    echo ""
}

# 헬스체크 함수
health_check() {
    local url=$1
    local service_name=$2
    local max_retries=12
    local retry_interval=10
    local count=0
    
    log_info "${service_name} 헬스체크 시작..."
    log_info "URL: $url"
    
    while [ $count -lt $max_retries ]; do
        if curl -f -s --max-time 10 "$url" > /dev/null 2>&1; then
            log_success "${service_name} 헬스체크 성공! (시도: $((count+1))/$max_retries)"
            
            # API 응답 상세 정보 출력 (백엔드인 경우)
            if [[ $url == *"/api/health/"* ]]; then
                response=$(curl -s "$url" | jq -r '.status // "OK"' 2>/dev/null || echo "OK")
                log_info "API 상태: $response"
            fi
            return 0
        else
            count=$((count+1))
            if [ $count -lt $max_retries ]; then
                log_warning "${service_name} 헬스체크 실패 (시도: $count/$max_retries) - ${retry_interval}초 후 재시도..."
                sleep $retry_interval
            fi
        fi
    done
    
    log_error "${service_name} 헬스체크 최종 실패!"
    return 1
}

# 백엔드 배포 함수
deploy_backend() {
    log_info "🚂 백엔드 배포 시작 (Railway)..."
    
    if [ "$SKIP_TESTS" = false ]; then
        log_info "백엔드 테스트 실행 중..."
        cd vridge_back
        
        # Django 설정 체크
        if ! python3 manage.py check --deploy --settings=config.settings.railway 2>/dev/null; then
            log_warning "Django 설정 체크 실패 - 계속 진행합니다."
        fi
        
        cd ..
    fi
    
    # Railway 배포는 Git push로 자동 트리거됨
    log_info "Git 변경사항을 Railway에 푸시 중..."
    git push origin $(git branch --show-current)
    
    log_success "Railway 배포 트리거 완료"
    log_info "배포 상태는 Railway 대시보드에서 확인하세요: https://railway.app"
    
    # 배포 완료 대기
    log_info "Railway 배포 완료 대기 중... (예상 시간: 3-5분)"
    sleep 120  # 2분 대기
    
    return 0
}

# 프론트엔드 배포 함수
deploy_frontend() {
    log_info "🌐 프론트엔드 배포 시작 (Vercel)..."
    
    cd vridge_front
    
    if [ "$SKIP_TESTS" = false ]; then
        log_info "프론트엔드 빌드 테스트 중..."
        
        # 빠른 빌드 테스트 (이미지 최적화 스킵)
        if ! NEXT_PUBLIC_API_URL=$BACKEND_URL npx next build > /dev/null 2>&1; then
            log_error "프론트엔드 빌드 실패"
            cd ..
            return 1
        fi
        
        log_success "프론트엔드 빌드 테스트 성공"
    fi
    
    # Vercel 배포
    log_info "Vercel에 배포 중..."
    
    # Vercel CLI가 설치되어 있는지 확인
    if ! command -v vercel &> /dev/null; then
        log_info "Vercel CLI 설치 중..."
        npm install -g vercel
    fi
    
    # Vercel 배포 실행
    if vercel --prod --yes > deployment.log 2>&1; then
        log_success "Vercel 배포 성공"
        # 배포 URL 추출
        deployment_url=$(grep -o 'https://[^[:space:]]*\.vercel\.app' deployment.log | head -1)
        if [ -n "$deployment_url" ]; then
            log_info "배포 URL: $deployment_url"
        fi
    else
        log_error "Vercel 배포 실패"
        log_info "배포 로그:"
        cat deployment.log
        cd ..
        return 1
    fi
    
    cd ..
    return 0
}

# 배포 실행
main() {
    # 사전 체크
    pre_deployment_check
    
    # 배포 실행
    deployment_success=true
    
    if [ "$DEPLOY_BACKEND" = true ]; then
        if ! deploy_backend; then
            log_error "백엔드 배포 실패"
            deployment_success=false
        fi
    fi
    
    if [ "$DEPLOY_FRONTEND" = true ]; then
        if ! deploy_frontend; then
            log_error "프론트엔드 배포 실패"
            deployment_success=false
        fi
    fi
    
    # 헬스체크
    if [ "$SKIP_HEALTH_CHECK" = false ] && [ "$deployment_success" = true ]; then
        echo ""
        log_info "🩺 배포 완료 후 헬스체크 실행..."
        
        health_check_success=true
        
        if [ "$DEPLOY_BACKEND" = true ]; then
            if ! health_check "$BACKEND_HEALTH_ENDPOINT" "백엔드"; then
                health_check_success=false
            fi
        fi
        
        if [ "$DEPLOY_FRONTEND" = true ]; then
            if ! health_check "$FRONTEND_HEALTH_ENDPOINT" "프론트엔드"; then
                health_check_success=false
            fi
        fi
        
        if [ "$health_check_success" = true ]; then
            log_success "모든 서비스 헬스체크 성공!"
        else
            log_error "일부 서비스 헬스체크 실패"
            deployment_success=false
        fi
    fi
    
    # 배포 완료 리포트
    echo ""
    echo "🎯 =========================================="
    echo "🎯 배포 완료 리포트"
    echo "🎯 =========================================="
    echo "⏰ 완료 시간: $(date)"
    echo ""
    
    if [ "$deployment_success" = true ]; then
        log_success "🎉 전체 배포 성공!"
        echo ""
        log_info "🔗 서비스 URL:"
        log_info "   프론트엔드: $FRONTEND_URL"
        log_info "   백엔드 API: $BACKEND_URL"
        log_info "   헬스체크: $BACKEND_HEALTH_ENDPOINT"
        echo ""
        log_info "📊 배포 상태 모니터링:"
        log_info "   Railway: https://railway.app"
        log_info "   Vercel: https://vercel.com"
    else
        log_error "❌ 배포 중 오류가 발생했습니다."
        echo ""
        log_info "🔧 문제 해결을 위한 체크 사항:"
        log_info "   1. Railway 환경변수 설정 확인"
        log_info "   2. Vercel 프로젝트 설정 확인"
        log_info "   3. GitHub Actions 워크플로우 로그 확인"
        log_info "   4. DNS 설정 및 도메인 상태 확인"
        exit 1
    fi
}

# 스크립트 실행
main "$@"