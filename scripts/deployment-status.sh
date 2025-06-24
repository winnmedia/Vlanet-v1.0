#!/bin/bash

# GitHub Actions 배포 상태 모니터링 스크립트

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정
PROJECT_DIR="/var/www/vridge"
LOG_FILE="$PROJECT_DIR/deployment.log"

print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "         GitHub Actions 배포 상태 모니터"
    echo "=================================================="
    echo -e "${NC}"
    echo "$(date '+%Y-%m-%d %H:%M:%S')"
    echo
}

check_last_deployment() {
    echo -e "${GREEN}📦 최근 배포 정보${NC}"
    echo "----------------------------------------"
    
    if [ -f "$PROJECT_DIR/deployment-info.txt" ]; then
        cat "$PROJECT_DIR/deployment-info.txt"
    else
        echo -e "${YELLOW}⚠️  배포 정보 파일이 없습니다${NC}"
    fi
    
    echo
}

check_git_status() {
    echo -e "${GREEN}📋 Git 상태${NC}"
    echo "----------------------------------------"
    
    cd "$PROJECT_DIR" 2>/dev/null || {
        echo -e "${RED}❌ 프로젝트 디렉토리를 찾을 수 없습니다${NC}"
        return 1
    }
    
    if [ -d ".git" ]; then
        echo "현재 브랜치: $(git branch --show-current 2>/dev/null || echo 'Unknown')"
        echo "최근 커밋: $(git log -1 --oneline 2>/dev/null || echo 'Unknown')"
        echo "커밋 시간: $(git log -1 --format=%cd 2>/dev/null || echo 'Unknown')"
        
        # 원격 저장소와의 차이 확인
        if git fetch --dry-run 2>/dev/null; then
            BEHIND=$(git rev-list HEAD..origin/$(git branch --show-current) --count 2>/dev/null)
            if [ "$BEHIND" -gt 0 ]; then
                echo -e "${YELLOW}⚠️  원격 저장소보다 ${BEHIND}개 커밋 뒤처져 있습니다${NC}"
            else
                echo -e "${GREEN}✅ 원격 저장소와 동기화됨${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  Git 저장소가 아닙니다${NC}"
    fi
    
    echo
}

check_deployment_logs() {
    echo -e "${GREEN}📝 배포 로그 (최근 10줄)${NC}"
    echo "----------------------------------------"
    
    if [ -f "$LOG_FILE" ]; then
        tail -10 "$LOG_FILE"
    else
        echo -e "${YELLOW}⚠️  배포 로그 파일이 없습니다${NC}"
    fi
    
    echo
}

check_docker_status() {
    echo -e "${GREEN}🐳 Docker 컨테이너 상태${NC}"
    echo "----------------------------------------"
    
    cd "$PROJECT_DIR"
    
    if docker-compose -f docker-compose.gabia.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null; then
        echo
        
        # 각 컨테이너의 상태 확인
        CONTAINERS=$(docker-compose -f docker-compose.gabia.yml ps --services 2>/dev/null)
        
        for container in $CONTAINERS; do
            STATUS=$(docker-compose -f docker-compose.gabia.yml ps $container 2>/dev/null | grep $container | awk '{print $3}')
            if [[ "$STATUS" == *"Up"* ]]; then
                echo -e "${GREEN}✅ $container: 실행중${NC}"
            else
                echo -e "${RED}❌ $container: 중지됨${NC}"
            fi
        done
    else
        echo -e "${RED}❌ Docker Compose 상태를 확인할 수 없습니다${NC}"
    fi
    
    echo
}

check_application_health() {
    echo -e "${GREEN}🏥 애플리케이션 헬스체크${NC}"
    echo "----------------------------------------"
    
    # 백엔드 체크
    echo -n "백엔드 (Django): "
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/admin/ 2>/dev/null)
    if [ "$BACKEND_STATUS" = "200" ] || [ "$BACKEND_STATUS" = "302" ]; then
        echo -e "${GREEN}✅ 정상 (HTTP $BACKEND_STATUS)${NC}"
    else
        echo -e "${RED}❌ 오류 (HTTP $BACKEND_STATUS)${NC}"
    fi
    
    # 프론트엔드 체크
    echo -n "프론트엔드 (React): "
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
    if [ "$FRONTEND_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ 정상 (HTTP $FRONTEND_STATUS)${NC}"
    else
        echo -e "${RED}❌ 오류 (HTTP $FRONTEND_STATUS)${NC}"
    fi
    
    # 데이터베이스 체크
    echo -n "데이터베이스 (PostgreSQL): "
    if docker-compose -f docker-compose.gabia.yml exec -T postgres pg_isready -U vridge &>/dev/null; then
        echo -e "${GREEN}✅ 정상${NC}"
    else
        echo -e "${RED}❌ 연결 실패${NC}"
    fi
    
    # Redis 체크
    echo -n "캐시 (Redis): "
    if docker-compose -f docker-compose.gabia.yml exec -T redis redis-cli ping &>/dev/null; then
        echo -e "${GREEN}✅ 정상${NC}"
    else
        echo -e "${RED}❌ 연결 실패${NC}"
    fi
    
    echo
}

check_public_access() {
    echo -e "${GREEN}🌐 외부 접근 상태${NC}"
    echo "----------------------------------------"
    
    # 도메인이 설정되어 있는지 확인
    if [ -f "$PROJECT_DIR/vridge_back/.env" ]; then
        DOMAIN=$(grep "ALLOWED_HOSTS" "$PROJECT_DIR/vridge_back/.env" | cut -d'=' -f2 | cut -d',' -f1)
        if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "localhost" ]; then
            echo "설정된 도메인: $DOMAIN"
            
            # 도메인 접근 테스트
            echo -n "도메인 접근 테스트: "
            DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "http://$DOMAIN" 2>/dev/null)
            if [ "$DOMAIN_STATUS" = "200" ] || [ "$DOMAIN_STATUS" = "301" ] || [ "$DOMAIN_STATUS" = "302" ]; then
                echo -e "${GREEN}✅ 정상 (HTTP $DOMAIN_STATUS)${NC}"
            else
                echo -e "${RED}❌ 접근 실패 (HTTP $DOMAIN_STATUS)${NC}"
            fi
            
            # HTTPS 테스트
            echo -n "HTTPS 접근 테스트: "
            HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "https://$DOMAIN" 2>/dev/null)
            if [ "$HTTPS_STATUS" = "200" ] || [ "$HTTPS_STATUS" = "301" ] || [ "$HTTPS_STATUS" = "302" ]; then
                echo -e "${GREEN}✅ 정상 (HTTP $HTTPS_STATUS)${NC}"
            else
                echo -e "${YELLOW}⚠️  SSL 미설정 또는 접근 실패 (HTTP $HTTPS_STATUS)${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  도메인이 설정되지 않았습니다${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  환경 설정 파일을 찾을 수 없습니다${NC}"
    fi
    
    echo
}

check_system_resources() {
    echo -e "${GREEN}💻 시스템 리소스${NC}"
    echo "----------------------------------------"
    
    # CPU 사용률
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}' | cut -d. -f1)
    echo "CPU 사용률: ${CPU_USAGE}%"
    
    # 메모리 사용률
    MEMORY_INFO=$(free -m | awk 'NR==2{printf "사용: %sMB / 전체: %sMB (%.1f%%)", $3,$2,$3*100/$2}')
    echo "메모리: $MEMORY_INFO"
    
    # 디스크 사용률
    DISK_USAGE=$(df -h / | awk 'NR==2{print $5}')
    echo "디스크 사용률: $DISK_USAGE"
    
    # Docker 이미지 크기
    DOCKER_SIZE=$(docker system df 2>/dev/null | grep "Images" | awk '{print $3}' || echo "Unknown")
    echo "Docker 이미지 크기: $DOCKER_SIZE"
    
    echo
}

generate_summary() {
    echo -e "${BLUE}📋 배포 상태 요약${NC}"
    echo "----------------------------------------"
    
    ISSUES=0
    WARNINGS=0
    
    # 컨테이너 상태 체크
    if ! docker-compose -f docker-compose.gabia.yml ps --filter "status=running" | grep -q "Up"; then
        echo -e "${RED}❌ 일부 컨테이너가 실행되지 않고 있습니다${NC}"
        ((ISSUES++))
    fi
    
    # 애플리케이션 헬스체크
    if [ "$BACKEND_STATUS" != "200" ] && [ "$BACKEND_STATUS" != "302" ]; then
        echo -e "${RED}❌ 백엔드 서비스에 문제가 있습니다${NC}"
        ((ISSUES++))
    fi
    
    if [ "$FRONTEND_STATUS" != "200" ]; then
        echo -e "${RED}❌ 프론트엔드 서비스에 문제가 있습니다${NC}"
        ((ISSUES++))
    fi
    
    # 리소스 체크
    if [ "$CPU_USAGE" -gt 80 ]; then
        echo -e "${YELLOW}⚠️  CPU 사용률이 높습니다 (${CPU_USAGE}%)${NC}"
        ((WARNINGS++))
    fi
    
    # 결과 출력
    if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✅ 모든 시스템이 정상 작동 중입니다${NC}"
    elif [ $ISSUES -eq 0 ]; then
        echo -e "${YELLOW}⚠️  ${WARNINGS}개의 주의사항이 있습니다${NC}"
    else
        echo -e "${RED}❌ ${ISSUES}개의 문제와 ${WARNINGS}개의 주의사항이 있습니다${NC}"
    fi
    
    echo
}

show_deployment_commands() {
    echo -e "${BLUE}🔧 배포 관련 명령어${NC}"
    echo "----------------------------------------"
    echo "수동 재배포:       cd $PROJECT_DIR && git pull && docker-compose -f docker-compose.gabia.yml up --build -d"
    echo "서비스 재시작:     cd $PROJECT_DIR && docker-compose -f docker-compose.gabia.yml restart"
    echo "로그 확인:         cd $PROJECT_DIR && docker-compose -f docker-compose.gabia.yml logs -f"
    echo "컨테이너 상태:     cd $PROJECT_DIR && docker-compose -f docker-compose.gabia.yml ps"
    echo "시스템 모니터링:   cd $PROJECT_DIR && ./scripts/monitoring.sh"
    echo "배포 로그:         tail -f $LOG_FILE"
    echo
    echo "GitHub Actions:"
    echo "  - 프로덕션 배포: main 브랜치에 푸시"
    echo "  - 스테이징 배포: develop 브랜치에 푸시"
    echo "  - 수동 배포: GitHub Actions 탭에서 'Run workflow'"
    echo
}

# 메인 함수
main() {
    case "${1:-status}" in
        "status"|"")
            print_header
            check_last_deployment
            check_git_status
            check_docker_status
            check_application_health
            check_public_access
            generate_summary
            show_deployment_commands
            ;;
        "logs")
            print_header
            check_deployment_logs
            echo -e "${GREEN}📝 실시간 Docker 로그${NC}"
            echo "Ctrl+C로 종료"
            echo "----------------------------------------"
            cd "$PROJECT_DIR" && docker-compose -f docker-compose.gabia.yml logs -f
            ;;
        "quick")
            print_header
            check_docker_status
            check_application_health
            generate_summary
            ;;
        "full")
            print_header
            check_last_deployment
            check_git_status
            check_deployment_logs
            check_docker_status
            check_application_health
            check_public_access
            check_system_resources
            generate_summary
            show_deployment_commands
            ;;
        "help")
            echo "사용법: $0 [옵션]"
            echo "옵션:"
            echo "  status    - 기본 배포 상태 확인 (기본값)"
            echo "  quick     - 빠른 상태 확인"
            echo "  full      - 상세 상태 확인"
            echo "  logs      - 실시간 로그 보기"
            echo "  help      - 도움말 보기"
            ;;
        *)
            echo "알 수 없는 옵션: $1"
            echo "사용법: $0 [status|quick|full|logs|help]"
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@"