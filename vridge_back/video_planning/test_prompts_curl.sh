#!/bin/bash

# 프로덕션 서버 테스트
echo "=== 개선된 DALL-E 프롬프트 생성 테스트 ==="
echo ""

# 테스트 1: 한국어 설명 - minimal 스타일
echo "테스트 1: 한국어 설명 - minimal 스타일"
curl -X POST https://videoplanet.up.railway.app/api/video-planning/test-improved-prompts/ \
  -H "Content-Type: application/json" \
  -d '{"description": "카페에 들어가는 남자", "style": "minimal"}' \
  | python -m json.tool

echo -e "\n\n"

# 테스트 2: 한국어 설명 - detailed 스타일
echo "테스트 2: 한국어 설명 - detailed 스타일"
curl -X POST https://videoplanet.up.railway.app/api/video-planning/test-improved-prompts/ \
  -H "Content-Type: application/json" \
  -d '{"description": "비오는 밤 거리를 걷는 여성", "style": "detailed"}' \
  | python -m json.tool

echo -e "\n\n"

# 테스트 3: 영어 설명 - artistic 스타일
echo "테스트 3: 영어 설명 - artistic 스타일"
curl -X POST https://videoplanet.up.railway.app/api/video-planning/test-improved-prompts/ \
  -H "Content-Type: application/json" \
  -d '{"description": "A man walking into a coffee shop", "style": "artistic"}' \
  | python -m json.tool

echo -e "\n\n"

# 테스트 4: 복잡한 한국어 설명 - cinematic 스타일
echo "테스트 4: 복잡한 한국어 설명 - cinematic 스타일"
curl -X POST https://videoplanet.up.railway.app/api/video-planning/test-improved-prompts/ \
  -H "Content-Type: application/json" \
  -d '{"description": "햇살이 비치는 공원에서 책을 읽는 노인", "style": "cinematic"}' \
  | python -m json.tool