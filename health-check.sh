#!/bin/bash
set -e

# VideoPlanet 헬스체크 스크립트
# 백엔드와 프론트엔드의 정상 작동 상태를 확인

echo "🩺 =========================================="
echo "🩺 VideoPlanet 헬스체크 시작"
echo "🩺 =========================================="
echo "⏰ 체크 시간: $(date)"
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
BACKEND_API_AUTH_ENDPOINT="${BACKEND_URL}/api/auth/test/"

# 전체 시스템 상태
OVERALL_STATUS=true

# 상세 헬스체크 함수
detailed_health_check() {
    local url=$1
    local service_name=$2
    local timeout=${3:-10}
    
    log_info "${service_name} 상세 헬스체크 중..."
    
    # 기본 연결 테스트
    local status_code=$(curl -o /dev/null -s -w "%{http_code}" --connect-timeout $timeout "$url" || echo "000")
    
    if [ "$status_code" = "200" ]; then
        log_success "${service_name} HTTP 연결 성공 (${status_code})"
        
        # 응답 시간 측정
        local response_time=$(curl -o /dev/null -s -w "%{time_total}" --connect-timeout $timeout "$url" 2>/dev/null || echo "N/A")
        if [ "$response_time" != "N/A" ]; then
            log_info "응답 시간: ${response_time}초"
            
            # 응답 시간 경고
            if (( $(echo "$response_time > 3.0" | bc -l) )); then
                log_warning "응답 시간이 3초를 초과했습니다."
            fi
        fi
        
        # API 응답 내용 확인 (백엔드인 경우)
        if [[ $url == *"/api/health/"* ]]; then
            local api_response=$(curl -s --connect-timeout $timeout "$url" 2>/dev/null || echo "{}")
            
            # JSON 파싱 시도
            if command -v jq &> /dev/null; then
                local status=$(echo "$api_response" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
                local timestamp=$(echo "$api_response" | jq -r '.timestamp // "unknown"' 2>/dev/null || echo "unknown")
                
                log_info "API 상태: $status"
                log_info "타임스탬프: $timestamp"
                
                # 추가 서비스 상태 확인
                local database=$(echo "$api_response" | jq -r '.services.database // "unknown"' 2>/dev/null || echo "unknown")
                local cache=$(echo "$api_response" | jq -r '.services.cache // "unknown"' 2>/dev/null || echo "unknown")
                
                if [ "$database" != "unknown" ]; then
                    log_info "데이터베이스: $database"
                fi
                
                if [ "$cache" != "unknown" ]; then
                    log_info "캐시: $cache"
                fi
            else
                log_info "API 응답: $(echo "$api_response" | head -c 100)..."
            fi
        fi
        
        return 0
    else
        log_error "${service_name} HTTP 연결 실패 (${status_code})"
        return 1
    fi
}

# DNS 해결 확인
check_dns() {
    local domain=$1
    log_info "DNS 해결 확인: $domain"
    
    if nslookup "$domain" > /dev/null 2>&1; then
        local ip=$(nslookup "$domain" | grep -A 1 "Non-authoritative answer:" | grep "Address" | head -1 | cut -d' ' -f2)
        log_success "DNS 해결 성공 ($ip)"
        return 0
    else
        log_error "DNS 해결 실패: $domain"
        return 1
    fi
}

# SSL 인증서 확인
check_ssl() {
    local domain=$1
    log_info "SSL 인증서 확인: $domain"
    
    local ssl_info=$(echo | timeout 10 openssl s_client -servername "$domain" -connect "${domain}:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        local expiry=$(echo "$ssl_info" | grep "notAfter" | cut -d= -f2)
        log_success "SSL 인증서 유효"
        log_info "만료일: $expiry"
        return 0
    else
        log_error "SSL 인증서 확인 실패"
        return 1
    fi
}

# API 기능 테스트
test_api_functionality() {
    log_info "API 기능 테스트 실행 중..."
    
    # 인증 테스트 엔드포인트 확인
    local auth_status=$(curl -o /dev/null -s -w "%{http_code}" --connect-timeout 10 "$BACKEND_API_AUTH_ENDPOINT" || echo "000")
    
    if [ "$auth_status" = "200" ] || [ "$auth_status" = "401" ]; then
        log_success "인증 API 엔드포인트 응답 ($auth_status)"
    else
        log_warning "인증 API 엔드포인트 이상 상태 ($auth_status)"
    fi
    
    # CORS 헤더 확인
    local cors_headers=$(curl -s -I -H "Origin: https://vlanet.net" "$BACKEND_HEALTH_ENDPOINT" | grep -i "access-control-allow-origin" || echo "")
    
    if [ -n "$cors_headers" ]; then
        log_success "CORS 설정 확인됨"
    else
        log_warning "CORS 헤더가 감지되지 않음"
    fi
}

# 백엔드 헬스체크
check_backend() {
    echo ""
    log_info "🚂 백엔드 (Railway) 헬스체크 시작..."
    log_info "URL: $BACKEND_URL"
    
    local backend_success=true
    
    # DNS 체크
    if ! check_dns "videoplanet.up.railway.app"; then
        backend_success=false
    fi
    
    # SSL 체크
    if ! check_ssl "videoplanet.up.railway.app"; then
        backend_success=false
    fi
    
    # 상세 헬스체크
    if ! detailed_health_check "$BACKEND_HEALTH_ENDPOINT" "백엔드 헬스 API"; then
        backend_success=false
    fi
    
    # API 기능 테스트
    test_api_functionality
    
    if [ "$backend_success" = true ]; then
        log_success "백엔드 헬스체크 완료"
    else
        log_error "백엔드 헬스체크 실패"
        OVERALL_STATUS=false
    fi
    
    return $([ "$backend_success" = true ] && echo 0 || echo 1)
}

# 프론트엔드 헬스체크
check_frontend() {
    echo ""
    log_info "🌐 프론트엔드 (Vercel) 헬스체크 시작..."
    log_info "URL: $FRONTEND_URL"
    
    local frontend_success=true
    
    # DNS 체크
    if ! check_dns "vlanet.net"; then
        frontend_success=false
    fi
    
    # SSL 체크
    if ! check_ssl "vlanet.net"; then
        frontend_success=false
    fi
    
    # 상세 헬스체크
    if ! detailed_health_check "$FRONTEND_URL" "프론트엔드" 15; then
        frontend_success=false
    fi
    
    # 정적 리소스 확인
    log_info "정적 리소스 확인 중..."
    local static_status=$(curl -o /dev/null -s -w "%{http_code}" --connect-timeout 10 "${FRONTEND_URL}/favicon.ico" || echo "000")
    
    if [ "$static_status" = "200" ]; then
        log_success "정적 리소스 접근 가능"
    else
        log_warning "정적 리소스 접근 불가 ($static_status)"
    fi
    
    if [ "$frontend_success" = true ]; then
        log_success "프론트엔드 헬스체크 완료"
    else
        log_error "프론트엔드 헬스체크 실패"
        OVERALL_STATUS=false
    fi
    
    return $([ "$frontend_success" = true ] && echo 0 || echo 1)
}

# 통합 연결성 테스트
test_integration() {
    echo ""
    log_info "🔗 통합 연결성 테스트..."
    
    # 프론트엔드에서 백엔드로의 연결성 시뮬레이션
    log_info "프론트엔드 → 백엔드 연결성 테스트..."
    
    local integration_test=$(curl -s -H "Origin: https://vlanet.net" \
                           -H "Referer: https://vlanet.net" \
                           --connect-timeout 10 \
                           "$BACKEND_HEALTH_ENDPOINT" || echo "FAILED")
    
    if [ "$integration_test" != "FAILED" ]; then
        log_success "통합 연결성 테스트 성공"
    else
        log_error "통합 연결성 테스트 실패"
        OVERALL_STATUS=false
    fi
}

# 성능 벤치마크
performance_benchmark() {
    echo ""
    log_info "⚡ 성능 벤치마크 실행..."
    
    # 백엔드 응답 시간 측정
    local backend_times=()
    for i in {1..3}; do
        local time=$(curl -o /dev/null -s -w "%{time_total}" --connect-timeout 10 "$BACKEND_HEALTH_ENDPOINT" 2>/dev/null || echo "0")
        backend_times+=($time)
    done
    
    # 평균 계산 (간단한 방법)
    local avg_backend=0
    for time in "${backend_times[@]}"; do
        avg_backend=$(echo "$avg_backend + $time" | bc -l)
    done
    avg_backend=$(echo "scale=3; $avg_backend / ${#backend_times[@]}" | bc -l)
    
    log_info "백엔드 평균 응답시간: ${avg_backend}초"
    
    # 프론트엔드 응답 시간 측정
    local frontend_times=()
    for i in {1..3}; do
        local time=$(curl -o /dev/null -s -w "%{time_total}" --connect-timeout 15 "$FRONTEND_URL" 2>/dev/null || echo "0")
        frontend_times+=($time)
    done
    
    local avg_frontend=0
    for time in "${frontend_times[@]}"; do
        avg_frontend=$(echo "$avg_frontend + $time" | bc -l)
    done
    avg_frontend=$(echo "scale=3; $avg_frontend / ${#frontend_times[@]}" | bc -l)
    
    log_info "프론트엔드 평균 응답시간: ${avg_frontend}초"
    
    # 성능 평가
    if (( $(echo "$avg_backend < 2.0" | bc -l) )); then
        log_success "백엔드 성능 양호"
    else
        log_warning "백엔드 성능 개선 필요"
    fi
    
    if (( $(echo "$avg_frontend < 3.0" | bc -l) )); then
        log_success "프론트엔드 성능 양호"
    else
        log_warning "프론트엔드 성능 개선 필요"
    fi
}

# 메인 실행
main() {
    # 필수 도구 확인
    for tool in curl nslookup openssl bc jq; do
        if ! command -v $tool &> /dev/null; then
            log_warning "$tool이 설치되어 있지 않습니다. 일부 기능이 제한될 수 있습니다."
        fi
    done
    
    # 헬스체크 실행
    check_backend
    check_frontend
    test_integration
    performance_benchmark
    
    # 최종 결과
    echo ""
    echo "🎯 =========================================="
    echo "🎯 헬스체크 완료 리포트"
    echo "🎯 =========================================="
    echo "⏰ 완료 시간: $(date)"
    echo ""
    
    if [ "$OVERALL_STATUS" = true ]; then
        log_success "🎉 전체 시스템 정상 작동 중!"
        echo ""
        log_info "🔗 서비스 상태:"
        log_info "   ✅ 프론트엔드: 정상"
        log_info "   ✅ 백엔드: 정상"
        log_info "   ✅ 통합 연결: 정상"
        echo ""
        log_info "📊 모니터링 대시보드:"
        log_info "   Railway: https://railway.app"
        log_info "   Vercel: https://vercel.com"
    else
        log_error "⚠️  일부 시스템에서 문제가 감지되었습니다."
        echo ""
        log_info "🔧 문제 해결 가이드:"
        log_info "   1. 서비스 로그 확인"
        log_info "   2. 네트워크 연결 상태 확인"
        log_info "   3. DNS 및 SSL 설정 검토"
        log_info "   4. 서버 리소스 사용량 확인"
        echo ""
        log_info "📞 긴급 연락처:"
        log_info "   - 시스템 관리자에게 즉시 보고"
        log_info "   - Railway/Vercel 고객지원 문의"
        exit 1
    fi
}

# 스크립트 실행
main "$@"