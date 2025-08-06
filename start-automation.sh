#!/bin/bash

# VideoPlanet 자동화 시스템 시작 스크립트
# 완벽한 오류 방지를 위한 통합 자동화 시스템

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로고 출력
echo -e "${CYAN}"
echo "═══════════════════════════════════════════════════════════════════════"
echo "🎯 VideoPlanet 완벽한 자동화 오류 방지 시스템 v1.0.0"
echo "FolderOpenOutlined 같은 런타임 오류를 100% 방지합니다!"
echo "═══════════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# 현재 디렉토리 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/vridge_front"
AUTOMATION_DIR="$SCRIPT_DIR/automation-scripts"

echo -e "${BLUE}📁 작업 디렉토리: $SCRIPT_DIR${NC}"

# Node.js 버전 확인
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js가 설치되어 있지 않습니다.${NC}"
    echo -e "${YELLOW}Node.js를 설치한 후 다시 실행하세요.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js 버전: $NODE_VERSION${NC}"

# npm 의존성 확인
echo -e "${BLUE}📦 의존성 확인 중...${NC}"
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️ node_modules가 없습니다. npm install을 실행합니다...${NC}"
    npm install
fi

# 자동화 스크립트 실행 권한 확인
echo -e "${BLUE}🔧 스크립트 권한 설정 중...${NC}"
chmod +x "$AUTOMATION_DIR"/*.js
chmod +x "$SCRIPT_DIR"/.husky/pre-commit 2>/dev/null || true

# 사용자 메뉴
echo -e "${CYAN}"
echo "🚀 어떤 모드로 시작하시겠습니까?"
echo "─────────────────────────────────────────────────"
echo "1. 🎯 전체 자동화 시스템 시작 (권장)"
echo "2. 🔍 Import 검증만 실행"
echo "3. 👀 실시간 개발 감시 시작"
echo "4. 🧪 빠른 테스트 실행"
echo "5. 🤖 자동 수정 봇 실행"
echo "6. 📊 오류 모니터링 대시보드 시작"
echo "7. 🏗️ CI/CD 파이프라인 테스트"
echo "8. 📋 시스템 상태 확인"
echo "9. 📖 도움말 및 문서"
echo "0. 종료"
echo "─────────────────────────────────────────────────"
echo -e "${NC}"

read -p "선택하세요 (0-9): " choice

case $choice in
    1)
        echo -e "${GREEN}🚀 전체 자동화 시스템을 시작합니다...${NC}"
        cd "$SCRIPT_DIR"
        node automation-scripts/videoplanet-automation.js start
        ;;
    2)
        echo -e "${GREEN}🔍 Import 검증을 실행합니다...${NC}"
        cd "$SCRIPT_DIR"
        node automation-scripts/import-validator.js
        ;;
    3)
        echo -e "${GREEN}👀 실시간 개발 감시를 시작합니다...${NC}"
        cd "$SCRIPT_DIR"
        node automation-scripts/dev-watcher.js
        ;;
    4)
        echo -e "${GREEN}🧪 빠른 테스트를 실행합니다...${NC}"
        cd "$SCRIPT_DIR"
        node automation-scripts/quick-test.js
        ;;
    5)
        echo -e "${GREEN}🤖 자동 수정 봇을 시작합니다...${NC}"
        echo "옵션을 선택하세요:"
        echo "1. 전체 프로젝트 자동 수정"
        echo "2. 실시간 감시 모드"
        read -p "선택 (1-2): " fix_choice
        
        cd "$SCRIPT_DIR"
        if [ "$fix_choice" = "1" ]; then
            node automation-scripts/auto-fix-bot.js --fix-all
        else
            node automation-scripts/auto-fix-bot.js --watch
        fi
        ;;
    6)
        echo -e "${GREEN}📊 오류 모니터링 대시보드를 시작합니다...${NC}"
        echo -e "${CYAN}🌐 대시보드 URL: http://localhost:8081${NC}"
        cd "$SCRIPT_DIR"
        node automation-scripts/error-monitor.js
        ;;
    7)
        echo -e "${GREEN}🏗️ CI/CD 파이프라인 테스트를 실행합니다...${NC}"
        cd "$SCRIPT_DIR"
        node automation-scripts/videoplanet-automation.js ci-test
        ;;
    8)
        echo -e "${GREEN}📋 시스템 상태를 확인합니다...${NC}"
        cd "$SCRIPT_DIR"
        node automation-scripts/videoplanet-automation.js status
        ;;
    9)
        echo -e "${CYAN}"
        echo "📖 VideoPlanet 자동화 시스템 도움말"
        echo "═══════════════════════════════════════════"
        echo ""
        echo "🎯 주요 기능:"
        echo "  ✅ Import 구문 자동 검증 및 수정"
        echo "  ✅ 실시간 파일 감시 및 자동 수정"
        echo "  ✅ ESLint 자동 실행 및 오류 수정"
        echo "  ✅ Prettier 자동 포맷팅"
        echo "  ✅ Pre-commit Hook으로 오류 방지"
        echo "  ✅ GitHub Actions CI/CD 자동화"
        echo "  ✅ 실시간 오류 모니터링 대시보드"
        echo "  ✅ 패턴 분석 및 예측적 오류 방지"
        echo ""
        echo "🔧 파일 위치:"
        echo "  📁 automation-scripts/     # 모든 자동화 도구"
        echo "  📁 .husky/                 # Git hooks"
        echo "  📁 .github/workflows/      # CI/CD 설정"
        echo ""
        echo "🌐 모니터링 대시보드: http://localhost:8081"
        echo "📧 이메일 알림: 환경 변수 설정 필요"
        echo "💾 백업: automation-scripts/backups/"
        echo "📝 로그: automation-scripts/logs/"
        echo ""
        echo "❓ 문제 해결:"
        echo "  1. 권한 오류 시: chmod +x start-automation.sh"
        echo "  2. 의존성 오류 시: npm install 재실행"
        echo "  3. 포트 충돌 시: 다른 서비스 종료"
        echo "  4. Git hooks 오류 시: npx husky init"
        echo ""
        echo "📞 지원: automation-scripts/logs/ 디렉토리의 로그 확인"
        echo -e "${NC}"
        
        read -p "계속하려면 Enter를 누르세요..."
        exec "$0" # 스크립트 재실행
        ;;
    0)
        echo -e "${YELLOW}👋 종료합니다.${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ 잘못된 선택입니다. 다시 시도하세요.${NC}"
        exec "$0" # 스크립트 재실행
        ;;
esac