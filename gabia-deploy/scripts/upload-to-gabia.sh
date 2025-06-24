#!/bin/bash
# 로컬에서 가비아 서버로 파일 업로드 스크립트

set -e

# 설정 (실제 값으로 수정 필요)
FTP_HOST="ftp.your-domain.com"
FTP_USER="your-hosting-account"
FTP_PASSWORD="your-ftp-password"
BUILD_DIR="$(dirname "$0")/.."

echo "📤 가비아 서버로 파일 업로드 중..."

# FTP 업로드 (lftp 사용)
if command -v lftp &> /dev/null; then
    lftp -c "
    set ftp:ssl-allow no;
    open -u $FTP_USER,$FTP_PASSWORD $FTP_HOST;
    lcd $BUILD_DIR;
    
    # 백엔드 파일 업로드
    mirror -R backend/ videoplanet/;
    
    # 프론트엔드 파일 업로드
    mirror -R frontend/ public_html/;
    
    quit;
    "
    echo "✅ FTP 업로드 완료"
else
    echo "❌ lftp가 설치되지 않았습니다."
    echo "수동으로 다음 파일들을 업로드하세요:"
    echo "- backend/ → /home/계정명/videoplanet/"
    echo "- frontend/ → /home/계정명/public_html/"
    echo ""
    echo "FTP 접속 정보:"
    echo "호스트: $FTP_HOST"
    echo "사용자: $FTP_USER"
    echo "비밀번호: $FTP_PASSWORD"
fi
