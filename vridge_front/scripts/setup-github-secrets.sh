#!/bin/bash

# GitHub Actions Secrets 설정 스크립트
# 이 스크립트는 GitHub CLI (gh)를 사용하여 필요한 시크릿을 설정합니다

set -e

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}GitHub Actions Secrets 설정 도구${NC}"
echo -e "${BLUE}====================================${NC}\n"

# GitHub CLI 설치 확인
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh)가 설치되어 있지 않습니다.${NC}"
    echo -e "${YELLOW}설치 방법:${NC}"
    echo "  macOS: brew install gh"
    echo "  Ubuntu: sudo apt install gh"
    echo "  Windows: winget install GitHub.cli"
    exit 1
fi

# GitHub 로그인 확인
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}GitHub에 로그인이 필요합니다.${NC}"
    gh auth login
fi

# 리포지토리 확인
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
if [ -z "$REPO" ]; then
    echo -e "${YELLOW}리포지토리를 수동으로 지정해주세요.${NC}"
    read -p "리포지토리 (예: winnmedia/Vlanet-v1.0): " REPO
fi

echo -e "${GREEN}✅ 리포지토리: $REPO${NC}\n"

# 필수 시크릿 설정
echo -e "${BLUE}1. Vercel 배포 설정${NC}"
echo "Vercel 토큰을 얻는 방법:"
echo "  1. https://vercel.com/account/tokens 접속"
echo "  2. 'Create Token' 클릭"
echo "  3. 토큰 이름 입력 (예: GitHub Actions)"
echo "  4. 'Full Access' 선택 후 생성"
echo ""

read -p "VERCEL_TOKEN: " VERCEL_TOKEN
if [ ! -z "$VERCEL_TOKEN" ]; then
    echo "$VERCEL_TOKEN" | gh secret set VERCEL_TOKEN -R $REPO
    echo -e "${GREEN}✅ VERCEL_TOKEN 설정 완료${NC}"
fi

echo ""
echo "Vercel Project ID를 얻는 방법:"
echo "  1. Vercel 대시보드에서 프로젝트 선택"
echo "  2. Settings → General"
echo "  3. 'Project ID' 복사"
echo ""

read -p "VERCEL_PROJECT_ID: " VERCEL_PROJECT_ID
if [ ! -z "$VERCEL_PROJECT_ID" ]; then
    echo "$VERCEL_PROJECT_ID" | gh secret set VERCEL_PROJECT_ID -R $REPO
    echo -e "${GREEN}✅ VERCEL_PROJECT_ID 설정 완료${NC}"
fi

echo ""
echo "Vercel Organization ID를 얻는 방법:"
echo "  1. Vercel 대시보드에서 프로젝트 선택"
echo "  2. Settings → General"
echo "  3. 'Team ID' 복사 (개인 계정이면 비워두세요)"
echo ""

read -p "VERCEL_ORG_ID (선택사항, Enter로 건너뛰기): " VERCEL_ORG_ID
if [ ! -z "$VERCEL_ORG_ID" ]; then
    echo "$VERCEL_ORG_ID" | gh secret set VERCEL_ORG_ID -R $REPO
    echo -e "${GREEN}✅ VERCEL_ORG_ID 설정 완료${NC}"
fi

# 선택적 시크릿 설정
echo -e "\n${BLUE}2. 선택적 설정 (Enter로 건너뛰기)${NC}"

# Slack Webhook
echo -e "\n${YELLOW}Slack 알림 설정${NC}"
echo "Slack Webhook URL을 얻는 방법:"
echo "  1. https://api.slack.com/apps 접속"
echo "  2. 앱 생성 또는 선택"
echo "  3. 'Incoming Webhooks' 활성화"
echo "  4. Webhook URL 복사"
echo ""

read -p "SLACK_WEBHOOK_URL (선택사항): " SLACK_WEBHOOK_URL
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    echo "$SLACK_WEBHOOK_URL" | gh secret set SLACK_WEBHOOK_URL -R $REPO
    echo -e "${GREEN}✅ SLACK_WEBHOOK_URL 설정 완료${NC}"
fi

# 설정된 시크릿 확인
echo -e "\n${BLUE}====================================${NC}"
echo -e "${BLUE}설정된 시크릿 목록${NC}"
echo -e "${BLUE}====================================${NC}\n"

gh secret list -R $REPO

echo -e "\n${GREEN}✅ GitHub Actions Secrets 설정이 완료되었습니다!${NC}"
echo -e "${YELLOW}다음 단계:${NC}"
echo "  1. GitHub Actions 탭에서 워크플로우 확인"
echo "  2. 'Run workflow' 버튼으로 수동 실행 가능"
echo "  3. 다음 push 시 자동으로 워크플로우 실행됨"
echo ""
echo -e "${BLUE}워크플로우 수동 실행:${NC}"
echo "  gh workflow run ci.yml -R $REPO"
echo ""
echo -e "${BLUE}워크플로우 상태 확인:${NC}"
echo "  gh run list -R $REPO"