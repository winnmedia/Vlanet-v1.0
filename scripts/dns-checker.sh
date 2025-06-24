#!/bin/bash

# 가비아 DNS 설정 확인 스크립트

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 도메인 입력 받기
if [ -z "$1" ]; then
    echo -e "${BLUE}🌐 가비아 DNS 설정 확인 도구${NC}"
    echo "----------------------------------------"
    read -p "vlanet.net" DOMAIN
else
    DOMAIN=$1
fi

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ 도메인이 입력되지 않았습니다.${NC}"
    exit 1
fi

print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "         DNS 설정 확인: $DOMAIN"
    echo "=================================================="
    echo -e "${NC}"
    echo "$(date '+%Y-%m-%d %H:%M:%S')"
    echo
}

check_domain_resolution() {
    echo -e "${GREEN}🔍 도메인 해석 확인${NC}"
    echo "----------------------------------------"
    
    # 메인 도메인 확인
    echo -n "메인 도메인 ($DOMAIN): "
    MAIN_IP=$(dig +short $DOMAIN 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
    if [ -n "$MAIN_IP" ]; then
        echo -e "${GREEN}✅ $MAIN_IP${NC}"
    else
        echo -e "${RED}❌ 해석 실패${NC}"
    fi
    
    # www 서브도메인 확인
    echo -n "www 서브도메인 (www.$DOMAIN): "
    WWW_IP=$(dig +short www.$DOMAIN 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
    if [ -n "$WWW_IP" ]; then
        echo -e "${GREEN}✅ $WWW_IP${NC}"
    else
        echo -e "${RED}❌ 해석 실패${NC}"
    fi
    
    # API 서브도메인 확인
    echo -n "API 서브도메인 (api.$DOMAIN): "
    API_IP=$(dig +short api.$DOMAIN 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
    if [ -n "$API_IP" ]; then
        echo -e "${GREEN}✅ $API_IP${NC}"
    else
        echo -e "${YELLOW}⚠️  설정되지 않음${NC}"
    fi
    
    echo
}

check_dns_records() {
    echo -e "${GREEN}📋 DNS 레코드 상세 정보${NC}"
    echo "----------------------------------------"
    
    # A 레코드
    echo "A 레코드:"
    dig +short $DOMAIN A 2>/dev/null | while read ip; do
        if [ -n "$ip" ]; then
            echo "  $DOMAIN → $ip"
        fi
    done
    
    dig +short www.$DOMAIN A 2>/dev/null | while read ip; do
        if [ -n "$ip" ]; then
            echo "  www.$DOMAIN → $ip"
        fi
    done
    
    # CNAME 레코드
    echo
    echo "CNAME 레코드:"
    CNAME_RESULT=$(dig +short www.$DOMAIN CNAME 2>/dev/null)
    if [ -n "$CNAME_RESULT" ]; then
        echo "  www.$DOMAIN → $CNAME_RESULT"
    else
        echo "  CNAME 레코드 없음"
    fi
    
    # MX 레코드
    echo
    echo "MX 레코드 (이메일):"
    MX_RESULT=$(dig +short $DOMAIN MX 2>/dev/null)
    if [ -n "$MX_RESULT" ]; then
        echo "$MX_RESULT" | while read mx; do
            echo "  $mx"
        done
    else
        echo "  MX 레코드 없음"
    fi
    
    # TXT 레코드
    echo
    echo "TXT 레코드:"
    TXT_RESULT=$(dig +short $DOMAIN TXT 2>/dev/null)
    if [ -n "$TXT_RESULT" ]; then
        echo "$TXT_RESULT" | while read txt; do
            echo "  $txt"
        done
    else
        echo "  TXT 레코드 없음"
    fi
    
    echo
}

check_connectivity() {
    echo -e "${GREEN}🌐 연결성 테스트${NC}"
    echo "----------------------------------------"
    
    if [ -n "$MAIN_IP" ]; then
        # Ping 테스트
        echo -n "Ping 테스트 ($MAIN_IP): "
        if ping -c 3 $MAIN_IP >/dev/null 2>&1; then
            echo -e "${GREEN}✅ 성공${NC}"
        else
            echo -e "${RED}❌ 실패${NC}"
        fi
        
        # HTTP 테스트
        echo -n "HTTP 연결 테스트 (포트 80): "
        if timeout 5 bash -c "</dev/tcp/$MAIN_IP/80" 2>/dev/null; then
            echo -e "${GREEN}✅ 성공${NC}"
        else
            echo -e "${RED}❌ 실패${NC}"
        fi
        
        # HTTPS 테스트
        echo -n "HTTPS 연결 테스트 (포트 443): "
        if timeout 5 bash -c "</dev/tcp/$MAIN_IP/443" 2>/dev/null; then
            echo -e "${GREEN}✅ 성공${NC}"
        else
            echo -e "${YELLOW}⚠️  SSL 미설정 또는 실패${NC}"
        fi
    else
        echo -e "${RED}❌ IP 주소를 확인할 수 없어 연결성 테스트를 건너뜁니다.${NC}"
    fi
    
    echo
}

check_web_response() {
    echo -e "${GREEN}🌍 웹 서비스 응답 확인${NC}"
    echo "----------------------------------------"
    
    # HTTP 응답 확인
    echo -n "HTTP 응답 (http://$DOMAIN): "
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://$DOMAIN 2>/dev/null)
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ 정상 (200)${NC}"
    elif [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
        echo -e "${YELLOW}↗️  리다이렉트 ($HTTP_STATUS)${NC}"
    elif [ -n "$HTTP_STATUS" ]; then
        echo -e "${RED}❌ 오류 ($HTTP_STATUS)${NC}"
    else
        echo -e "${RED}❌ 연결 실패${NC}"
    fi
    
    # HTTPS 응답 확인
    echo -n "HTTPS 응답 (https://$DOMAIN): "
    HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 https://$DOMAIN 2>/dev/null)
    if [ "$HTTPS_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ 정상 (200)${NC}"
    elif [ "$HTTPS_STATUS" = "301" ] || [ "$HTTPS_STATUS" = "302" ]; then
        echo -e "${YELLOW}↗️  리다이렉트 ($HTTPS_STATUS)${NC}"
    elif [ -n "$HTTPS_STATUS" ]; then
        echo -e "${RED}❌ 오류 ($HTTPS_STATUS)${NC}"
    else
        echo -e "${RED}❌ SSL 미설정 또는 연결 실패${NC}"
    fi
    
    echo
}

check_global_propagation() {
    echo -e "${GREEN}🌏 전 세계 DNS 전파 상태${NC}"
    echo "----------------------------------------"
    echo "주요 DNS 서버에서의 해석 결과:"
    
    # Google DNS
    echo -n "Google DNS (8.8.8.8): "
    GOOGLE_IP=$(dig @8.8.8.8 +short $DOMAIN 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
    if [ -n "$GOOGLE_IP" ]; then
        echo -e "${GREEN}$GOOGLE_IP${NC}"
    else
        echo -e "${RED}해석 실패${NC}"
    fi
    
    # Cloudflare DNS
    echo -n "Cloudflare DNS (1.1.1.1): "
    CF_IP=$(dig @1.1.1.1 +short $DOMAIN 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
    if [ -n "$CF_IP" ]; then
        echo -e "${GREEN}$CF_IP${NC}"
    else
        echo -e "${RED}해석 실패${NC}"
    fi
    
    # KT DNS
    echo -n "KT DNS (168.126.63.1): "
    KT_IP=$(dig @168.126.63.1 +short $DOMAIN 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
    if [ -n "$KT_IP" ]; then
        echo -e "${GREEN}$KT_IP${NC}"
    else
        echo -e "${RED}해석 실패${NC}"
    fi
    
    # 일관성 확인
    echo
    if [ "$MAIN_IP" = "$GOOGLE_IP" ] && [ "$MAIN_IP" = "$CF_IP" ] && [ "$MAIN_IP" = "$KT_IP" ]; then
        echo -e "${GREEN}✅ 모든 DNS 서버에서 동일한 IP 반환 (전파 완료)${NC}"
    else
        echo -e "${YELLOW}⚠️  DNS 서버마다 다른 결과 (전파 진행 중)${NC}"
    fi
    
    echo
}

check_ssl_certificate() {
    echo -e "${GREEN}🔒 SSL 인증서 확인${NC}"
    echo "----------------------------------------"
    
    if [ -n "$MAIN_IP" ]; then
        SSL_INFO=$(echo | timeout 10 openssl s_client -servername $DOMAIN -connect $MAIN_IP:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        
        if [ -n "$SSL_INFO" ]; then
            echo -e "${GREEN}✅ SSL 인증서 설치됨${NC}"
            echo "$SSL_INFO" | while read line; do
                echo "  $line"
            done
            
            # 만료일 확인
            EXPIRE_DATE=$(echo "$SSL_INFO" | grep "notAfter" | cut -d= -f2)
            if [ -n "$EXPIRE_DATE" ]; then
                EXPIRE_TIMESTAMP=$(date -d "$EXPIRE_DATE" +%s 2>/dev/null)
                CURRENT_TIMESTAMP=$(date +%s)
                DAYS_LEFT=$(( (EXPIRE_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
                
                if [ $DAYS_LEFT -gt 30 ]; then
                    echo -e "  ${GREEN}✅ 만료까지 ${DAYS_LEFT}일 남음${NC}"
                elif [ $DAYS_LEFT -gt 0 ]; then
                    echo -e "  ${YELLOW}⚠️  만료까지 ${DAYS_LEFT}일 남음 (갱신 필요)${NC}"
                else
                    echo -e "  ${RED}❌ 인증서 만료됨${NC}"
                fi
            fi
        else
            echo -e "${RED}❌ SSL 인증서 없음${NC}"
        fi
    else
        echo -e "${RED}❌ IP 주소를 확인할 수 없어 SSL 확인을 건너뜁니다.${NC}"
    fi
    
    echo
}

generate_recommendations() {
    echo -e "${BLUE}💡 권장사항${NC}"
    echo "----------------------------------------"
    
    ISSUES=0
    
    # IP 해석 확인
    if [ -z "$MAIN_IP" ]; then
        echo -e "${RED}❌ 메인 도메인 A 레코드 설정 필요${NC}"
        ((ISSUES++))
    fi
    
    if [ -z "$WWW_IP" ]; then
        echo -e "${YELLOW}⚠️  www 서브도메인 A 레코드 설정 권장${NC}"
        ((ISSUES++))
    fi
    
    # HTTP/HTTPS 확인
    if [ "$HTTP_STATUS" != "200" ] && [ "$HTTP_STATUS" != "301" ] && [ "$HTTP_STATUS" != "302" ]; then
        echo -e "${RED}❌ 웹 서버 설정 확인 필요${NC}"
        ((ISSUES++))
    fi
    
    if [ "$HTTPS_STATUS" != "200" ] && [ "$HTTPS_STATUS" != "301" ] && [ "$HTTPS_STATUS" != "302" ]; then
        echo -e "${YELLOW}⚠️  SSL 인증서 설정 권장${NC}"
        ((ISSUES++))
    fi
    
    if [ $ISSUES -eq 0 ]; then
        echo -e "${GREEN}✅ DNS 설정이 올바르게 구성되었습니다!${NC}"
    else
        echo -e "${YELLOW}💡 다음 사항을 확인해주세요:${NC}"
        echo "   1. 가비아 DNS 관리에서 A 레코드 설정 확인"
        echo "   2. 서버 IP 주소가 정확한지 확인"
        echo "   3. 웹 서버(Nginx) 실행 상태 확인"
        echo "   4. SSL 인증서 설치 및 설정 확인"
    fi
    
    echo
}

show_useful_commands() {
    echo -e "${BLUE}🔧 유용한 명령어${NC}"
    echo "----------------------------------------"
    echo "DNS 캐시 플러시:"
    echo "  Windows: ipconfig /flushdns"
    echo "  macOS:   sudo dscacheutil -flushcache"
    echo "  Linux:   sudo systemctl restart systemd-resolved"
    echo
    echo "수동 DNS 조회:"
    echo "  dig $DOMAIN"
    echo "  nslookup $DOMAIN"
    echo
    echo "온라인 DNS 전파 확인:"
    echo "  https://www.whatsmydns.net"
    echo "  https://dnschecker.org"
    echo
}

# 메인 실행
main() {
    print_header
    check_domain_resolution
    check_dns_records
    check_connectivity
    check_web_response
    check_global_propagation
    check_ssl_certificate
    generate_recommendations
    show_useful_commands
}

# 필수 명령어 확인
if ! command -v dig &> /dev/null; then
    echo -e "${RED}❌ dig 명령어가 필요합니다. 설치해주세요.${NC}"
    echo "Ubuntu/Debian: sudo apt install dnsutils"
    echo "CentOS/RHEL: sudo yum install bind-utils"
    echo "macOS: brew install bind"
    exit 1
fi

# 스크립트 실행
main