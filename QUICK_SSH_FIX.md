# 🚨 SSH 연결 문제 빠른 해결

## 1. GitHub Secrets 수정

### 가능한 올바른 호스트명:
다음 중 하나로 `GABIA_HOST` 값을 변경해보세요:

```
GABIA_HOST = winnmedia.gabia.io
```
또는
```
GABIA_HOST = vlanet.net
```
또는
```
GABIA_HOST = 211.47.74.37
```

## 2. My가비아에서 SSH 정보 재확인

### 확인할 정보:
1. **SSH 접속 관리** → **정확한 호스트명**
2. **SSH 포트** (22가 아닐 수 있음)
3. **SSH 활성화 상태**

## 3. 수동 SSH 테스트

Windows 명령 프롬프트에서:
```bash
ssh sukkeun17@winnmedia.gabia.io
ssh sukkeun17@vlanet.net
ssh sukkeun17@211.47.74.37
```

어느 것이 연결되는지 확인!

## 4. 포트 변경이 필요한 경우

만약 SSH 포트가 22가 아니라면:
- 워크플로우 파일에서 포트 변경 필요
- My가비아에서 정확한 포트 번호 확인

## 5. 임시 해결: FTP 사용

SSH가 안 되면 FTP로 수동 업로드:
1. FileZilla 사용
2. 호스트: winnmedia
3. 사용자: sukkeun17  
4. 비밀번호: dnlsdos123$
5. 수동으로 파일 업로드