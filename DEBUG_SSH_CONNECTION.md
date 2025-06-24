# 🔍 SSH 연결 문제 해결 가이드

## 1. 가비아 SSH 설정 확인

### My가비아에서:
1. **호스팅 관리** → **SSH 접속 관리**
2. 확인사항:
   - ✅ SSH 사용: **활성화**
   - 📍 접속 호스트: winnmedia 또는 다른 호스트명
   - 🔢 포트: 22 (또는 다른 포트)

## 2. GitHub Secrets 재확인

### 다음 값들이 정확한지 확인:
```
GABIA_HOST = winnmedia (또는 실제 호스트명)
GABIA_USERNAME = sukkeun17
GABIA_PASSWORD = dnlsdos123$
```

## 3. 대체 호스트명 시도

가비아 호스팅은 여러 호스트명을 사용할 수 있습니다:
- winnmedia
- winnmedia.gabia.io
- vlanet.net
- 211.47.74.37 (IP 직접 사용)

## 4. 수동 SSH 테스트

Windows PowerShell 또는 명령 프롬프트에서:
```bash
ssh sukkeun17@winnmedia
# 또는
ssh sukkeun17@winnmedia.gabia.io
# 또는
ssh sukkeun17@vlanet.net
# 또는
ssh sukkeun17@211.47.74.37
```

어느 것이 작동하는지 확인!

## 5. 포트 번호 확인

가비아는 때때로 다른 SSH 포트를 사용합니다:
- 기본: 22
- 대체: 2222, 22222, 또는 커스텀 포트

My가비아에서 정확한 포트 번호 확인!

## 6. 임시 해결책: FTP 사용

SSH가 안 되면 FTP로 수동 업로드:
1. FileZilla 사용
2. 호스트: winnmedia
3. 사용자: sukkeun17
4. 비밀번호: dnlsdos123$
5. 포트: 21