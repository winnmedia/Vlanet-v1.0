#!/bin/bash

# 버전 업데이트 스크립트
# 사용법: ./scripts/bump-version.sh [major|minor|patch]

set -e

VERSION_FILE="VERSION"
CHANGELOG_FILE="CHANGELOG.md"
DEPLOYMENT_LOG="deployment-logs.md"
PACKAGE_JSON="vridge_front/package.json"

# 현재 버전 읽기
CURRENT_VERSION=$(cat $VERSION_FILE)
echo "현재 버전: $CURRENT_VERSION"

# 버전 파싱
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

# 버전 업데이트
case "$1" in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch|*)
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "새 버전: $NEW_VERSION"

# VERSION 파일 업데이트
echo "$NEW_VERSION" > $VERSION_FILE

# package.json 업데이트
if [ -f "$PACKAGE_JSON" ]; then
    sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" $PACKAGE_JSON
fi

# 배포 로그에 추가
TIMESTAMP=$(date +"%Y-%m-%d %H:%M KST")
COMMIT_HASH=$(git rev-parse --short HEAD)

cat >> $DEPLOYMENT_LOG << EOF

## $TIMESTAMP
- **버전**: $NEW_VERSION
- **커밋**: $COMMIT_HASH
- **배포자**: $(git config user.name || echo "Unknown")
- **플랫폼**: Railway/Vercel
- **주요 변경사항**: [수동 입력 필요]
- **상태**: 배포 진행 중
EOF

echo "버전이 $NEW_VERSION(으)로 업데이트되었습니다."
echo "deployment-logs.md에 로그가 추가되었습니다."
echo "CHANGELOG.md를 수동으로 업데이트해주세요."