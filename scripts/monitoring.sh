#!/bin/bash

# 가비아 서버 모니터링 스크립트

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정
PROJECT_DIR="/var/www/vridge"
LOG_FILE="/var/log/vridge-monitor.log"
ALERT_EMAIL=""  # 알림 받을 이메일 (선택사항)

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}         Vridge 서버 모니터링 대시보드${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo "$(date '+%Y-%m-%d %H:%M:%S')"
    echo
}

check_system_resources() {
    echo -e "${GREEN}📊 시스템 리소스${NC}"
    echo "----------------------------------------"
    
    # CPU 사용률
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    echo -e "CPU 사용률: ${CPU_USAGE}%"
    
    # 메모리 사용률
    MEMORY_INFO=$(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')
    echo -e "메모리 사용률: ${MEMORY_INFO}"
    
    # 디스크 사용률
    DISK_USAGE=$(df -h / | awk 'NR==2{print $5}')
    echo -e "디스크 사용률: ${DISK_USAGE}"
    
    # 로드 애버리지
    LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}')
    echo -e "로드 애버리지:${LOAD_AVG}"
    
    echo
}

check_docker_services() {
    echo -e "${GREEN}🐳 Docker 서비스 상태${NC}"
    echo "----------------------------------------"
    
    cd $PROJECT_DIR 2>/dev/null || {
        echo -e "${RED}❌ 프로젝트 디렉토리를 찾을 수 없습니다: $PROJECT_DIR${NC}"
        return 1
    }
    
    # Docker 서비스 상태 확인
    if systemctl is-active --quiet docker; then
        echo -e "${GREEN}✅ Docker 서비스: 실행중${NC}"
    else
        echo -e "${RED}❌ Docker 서비스: 중지됨${NC}"
        return 1
    fi
    
    # 컨테이너 상태 확인
    echo
    echo "컨테이너 상태:"
    docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || {
        echo -e "${RED}❌ Docker Compose 서비스 확인 실패${NC}"
        return 1
    }
    
    echo
}

check_application_health() {
    echo -e "${GREEN}🏥 애플리케이션 헬스체크${NC}"
    echo "----------------------------------------"
    
    # 백엔드 헬스체크
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/admin/ 2>/dev/null)
    if [ "$BACKEND_STATUS" = "200" ] || [ "$BACKEND_STATUS" = "302" ]; then
        echo -e "${GREEN}✅ 백엔드: 정상 (HTTP $BACKEND_STATUS)${NC}"
    else
        echo -e "${RED}❌ 백엔드: 오류 (HTTP $BACKEND_STATUS)${NC}"
    fi
    
    # 프론트엔드 헬스체크
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
    if [ "$FRONTEND_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ 프론트엔드: 정상 (HTTP $FRONTEND_STATUS)${NC}"
    else
        echo -e "${RED}❌ 프론트엔드: 오류 (HTTP $FRONTEND_STATUS)${NC}"
    fi
    
    # 데이터베이스 헬스체크
    if docker-compose exec -T postgres pg_isready -U vridge &>/dev/null; then
        echo -e "${GREEN}✅ 데이터베이스: 정상${NC}"
    else
        echo -e "${RED}❌ 데이터베이스: 연결 실패${NC}"
    fi
    
    # Redis 헬스체크
    if docker-compose exec -T redis redis-cli ping &>/dev/null; then
        echo -e "${GREEN}✅ Redis: 정상${NC}"
    else
        echo -e "${RED}❌ Redis: 연결 실패${NC}"
    fi
    
    echo
}

check_nginx_status() {
    echo -e "${GREEN}🌐 Nginx 상태${NC}"
    echo "----------------------------------------"
    
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✅ Nginx: 실행중${NC}"
        
        # 설정 파일 검증
        if nginx -t &>/dev/null; then
            echo -e "${GREEN}✅ Nginx 설정: 정상${NC}"
        else
            echo -e "${RED}❌ Nginx 설정: 오류${NC}"
        fi
    else
        echo -e "${RED}❌ Nginx: 중지됨${NC}"
    fi
    
    echo
}

check_ssl_certificate() {
    echo -e "${GREEN}🔒 SSL 인증서 상태${NC}"
    echo "----------------------------------------"
    
    # SSL 인증서 만료일 확인
    if command -v certbot &> /dev/null; then
        CERT_INFO=$(certbot certificates 2>/dev/null | grep "Expiry Date" | head -1)
        if [ -n "$CERT_INFO" ]; then
            echo "SSL 인증서: $CERT_INFO"
            
            # 만료일까지 남은 일수 계산
            EXPIRY_DATE=$(echo "$CERT_INFO" | grep -oP '\d{4}-\d{2}-\d{2}')
            if [ -n "$EXPIRY_DATE" ]; then
                DAYS_LEFT=$(( ($(date -d "$EXPIRY_DATE" +%s) - $(date +%s)) / 86400 ))
                if [ $DAYS_LEFT -lt 30 ]; then
                    echo -e "${YELLOW}⚠️  SSL 인증서가 ${DAYS_LEFT}일 후 만료됩니다${NC}"
                else
                    echo -e "${GREEN}✅ SSL 인증서: ${DAYS_LEFT}일 남음${NC}"
                fi
            fi
        else
            echo -e "${YELLOW}⚠️  SSL 인증서 정보를 찾을 수 없습니다${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Certbot이 설치되지 않았습니다${NC}"
    fi
    
    echo
}

check_disk_space() {
    echo -e "${GREEN}💾 디스크 공간 상세${NC}"
    echo "----------------------------------------"
    
    # 전체 디스크 사용률
    df -h | grep -E '^/dev/' | while read line; do
        USAGE=$(echo $line | awk '{print $5}' | sed 's/%//')
        MOUNT=$(echo $line | awk '{print $6}')
        
        if [ $USAGE -gt 90 ]; then
            echo -e "${RED}❌ $MOUNT: ${USAGE}% (위험)${NC}"
        elif [ $USAGE -gt 80 ]; then
            echo -e "${YELLOW}⚠️  $MOUNT: ${USAGE}% (주의)${NC}"
        else
            echo -e "${GREEN}✅ $MOUNT: ${USAGE}%${NC}"
        fi
    done
    
    # 프로젝트 디렉토리 크기
    if [ -d "$PROJECT_DIR" ]; then
        PROJECT_SIZE=$(du -sh $PROJECT_DIR 2>/dev/null | cut -f1)
        echo "프로젝트 디렉토리 크기: $PROJECT_SIZE"
    fi
    
    # 로그 디렉토리 크기
    if [ -d "/var/log" ]; then
        LOG_SIZE=$(du -sh /var/log 2>/dev/null | cut -f1)
        echo "로그 디렉토리 크기: $LOG_SIZE"
    fi
    
    echo
}

check_recent_logs() {
    echo -e "${GREEN}📝 최근 로그 (마지막 10줄)${NC}"
    echo "----------------------------------------"
    
    # Docker 로그
    echo "🐳 Docker 로그:"
    cd $PROJECT_DIR && docker-compose logs --tail=5 2>/dev/null | tail -10
    
    echo
    
    # Nginx 에러 로그
    echo "🌐 Nginx 에러 로그:"
    tail -5 /var/log/nginx/error.log 2>/dev/null || echo "로그 파일 없음"
    
    echo
}

generate_summary() {
    echo -e "${BLUE}📋 요약${NC}"
    echo "----------------------------------------"
    
    # 전체 서비스 상태 요약
    ISSUES=0
    
    # 시스템 리소스 체크
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}' | cut -d. -f1)
    if [ "$CPU_USAGE" -gt 80 ]; then
        echo -e "${RED}⚠️  높은 CPU 사용률: ${CPU_USAGE}%${NC}"
        ((ISSUES++))
    fi
    
    # 메모리 체크
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$MEMORY_USAGE" -gt 85 ]; then
        echo -e "${RED}⚠️  높은 메모리 사용률: ${MEMORY_USAGE}%${NC}"
        ((ISSUES++))
    fi
    
    # 디스크 체크
    DISK_USAGE=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 85 ]; then
        echo -e "${RED}⚠️  높은 디스크 사용률: ${DISK_USAGE}%${NC}"
        ((ISSUES++))
    fi
    
    if [ $ISSUES -eq 0 ]; then
        echo -e "${GREEN}✅ 모든 시스템이 정상 작동 중입니다${NC}"
    else
        echo -e "${YELLOW}⚠️  $ISSUES개의 주의사항이 있습니다${NC}"
    fi
    
    echo
}

show_useful_commands() {
    echo -e "${BLUE}🔧 유용한 명령어${NC}"
    echo "----------------------------------------"
    echo "서비스 재시작:     cd $PROJECT_DIR && docker-compose restart"
    echo "로그 실시간 보기:  cd $PROJECT_DIR && docker-compose logs -f"
    echo "시스템 리소스:     htop"
    echo "디스크 사용량:     df -h"
    echo "Nginx 재시작:      sudo systemctl reload nginx"
    echo "SSL 인증서 갱신:   sudo certbot renew"
    echo
}

auto_fix_issues() {
    echo -e "${YELLOW}🔧 자동 복구 시도${NC}"
    echo "----------------------------------------"
    
    # Docker 서비스 체크 및 재시작
    if ! systemctl is-active --quiet docker; then
        echo "Docker 서비스 시작 중..."
        sudo systemctl start docker
        sleep 5
    fi
    
    # 중지된 컨테이너 재시작
    cd $PROJECT_DIR
    STOPPED_CONTAINERS=$(docker-compose ps --filter "status=exited" --format "{{.Name}}" 2>/dev/null)
    if [ -n "$STOPPED_CONTAINERS" ]; then
        echo "중지된 컨테이너 재시작 중..."
        docker-compose up -d
        sleep 10
    fi
    
    # Nginx 설정 검증 및 재시작
    if ! nginx -t &>/dev/null; then
        echo "Nginx 설정 오류가 발견되었습니다. 수동 확인이 필요합니다."
    elif ! systemctl is-active --quiet nginx; then
        echo "Nginx 서비스 시작 중..."
        sudo systemctl start nginx
    fi
    
    echo "자동 복구 완료"
    echo
}

# 로그 기록 함수
log_status() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
}

# 메인 함수
main() {
    case "${1:-status}" in
        "status"|"")
            print_header
            check_system_resources
            check_docker_services
            check_application_health
            check_nginx_status
            check_ssl_certificate
            generate_summary
            show_useful_commands
            ;;
        "detailed")
            print_header
            check_system_resources
            check_docker_services
            check_application_health
            check_nginx_status
            check_ssl_certificate
            check_disk_space
            check_recent_logs
            generate_summary
            show_useful_commands
            ;;
        "fix")
            print_header
            auto_fix_issues
            check_application_health
            ;;
        "logs")
            echo -e "${GREEN}📝 실시간 로그 모니터링${NC}"
            echo "Ctrl+C로 종료"
            echo "----------------------------------------"
            cd $PROJECT_DIR && docker-compose logs -f
            ;;
        "help")
            echo "사용법: $0 [옵션]"
            echo "옵션:"
            echo "  status    - 기본 상태 확인 (기본값)"
            echo "  detailed  - 상세 상태 확인"
            echo "  fix       - 자동 복구 시도"
            echo "  logs      - 실시간 로그 보기"
            echo "  help      - 도움말 보기"
            ;;
        *)
            echo "알 수 없는 옵션: $1"
            echo "사용법: $0 [status|detailed|fix|logs|help]"
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@"