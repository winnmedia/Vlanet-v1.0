# 🔍 배포 상태 확인 가이드

## 1. GitHub Actions 확인

### 배포 상태 확인:
1. **GitHub Repository**: https://github.com/winnmedia/Vlanet-v1.0
2. **Actions** 탭 클릭
3. 최근 워크플로우 실행 상태 확인

### 확인사항:
- ✅ 녹색 체크: 배포 성공
- ❌ 빨간 X: 배포 실패 (로그 확인 필요)
- 🟡 노란 원: 진행 중

## 2. 가비아 호스팅 상태 확인

### SSH 접속 테스트:
```bash
ssh sukkeun17@winnmedia
# 또는
ssh sukkeun17@vlanet.net
```

### FTP로 파일 확인:
- 호스트: winnmedia
- 사용자: sukkeun17
- 비밀번호: dnlsdos123$

### 확인할 디렉토리:
```
/home/sukkeun17/
├── htdocs/        # 또는 public_html/ 또는 www/
│   └── index.html # React 앱이 있어야 함
└── videoplanet/   # Django 백엔드가 있어야 함
```

## 3. 문제 진단

### 가능한 문제들:

#### 1. SSH 접속이 안 되는 경우
- My가비아 → SSH 접속 관리 → SSH 활성화 확인
- 포트 22가 열려있는지 확인

#### 2. 파일이 업로드되지 않은 경우
- GitHub Secrets 설정 확인
- 특히 GABIA_HOST, GABIA_USERNAME, GABIA_PASSWORD

#### 3. 웹 루트 디렉토리 문제
- htdocs/ 대신 public_html/ 또는 www/ 일 수 있음
- FTP로 접속해서 실제 디렉토리 구조 확인

## 4. 수동 배포 방법

GitHub Actions가 실패한 경우:

### FileZilla로 수동 업로드:
1. FileZilla 접속
2. 로컬: `/home/winnmedia/VideoPlanet/gabia-deploy/`
3. 원격: `/home/sukkeun17/`
4. 업로드:
   - `frontend/` → `htdocs/` (또는 웹루트)
   - `backend/` → `videoplanet/`

## 5. 임시 테스트 파일

웹서버가 작동하는지 확인:

```html
<!-- test.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
</head>
<body>
    <h1>가비아 웹호스팅 테스트</h1>
    <p>이 페이지가 보이면 웹서버는 정상입니다.</p>
</body>
</html>
```

이 파일을 FTP로 업로드해서 테스트해보세요.

## 6. 가비아 지원 연락

문제가 지속되면:
- 가비아 고객센터: 1588-7535
- 이메일: help@gabia.com
- 실시간 채팅: My가비아 내 채팅 지원