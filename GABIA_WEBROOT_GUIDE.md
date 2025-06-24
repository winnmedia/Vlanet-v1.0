# 🌐 가비아 웹 루트 디렉토리 찾기 가이드

## 🔍 웹 루트 디렉토리 확인 방법

### 1. FileZilla에서 확인할 폴더들
```
연결 후 원격 사이트 창에서 다음 중 하나가 보입니다:
□ public_html/  ← 일반 웹호스팅
□ htdocs/       ← Python/Django 호스팅
□ www/          ← 클라우드 호스팅  
□ html/         ← 기타 호스팅
□ web/          ← 일부 호스팅
```

### 2. 웹 루트 확인 방법
```bash
# SSH 접속 후 확인
ls -la ~/
# 또는
ls -la /home/호스팅계정명/

# 웹 루트 디렉토리를 찾으면:
ls -la htdocs/  # 또는 다른 웹 루트 폴더명
```

## 📂 호스팅 타입별 업로드 위치

### Python/Django 호스팅인 경우 (가장 가능성 높음)
```
업로드 위치:
htdocs/ ← 프론트엔드 파일 (React 빌드)
videoplanet/ ← 백엔드 파일 (Django)
scripts/ ← 배포 스크립트
```

### 일반 웹호스팅인 경우
```
업로드 위치:
public_html/ ← 프론트엔드 파일
videoplanet/ ← 백엔드 파일
scripts/ ← 배포 스크립트
```

## 🚀 FileZilla 업로드 방법 (웹 루트별)

### htdocs/가 있는 경우:
```
로컬 → 원격:
gabia-deploy/frontend/ → htdocs/
gabia-deploy/backend/ → videoplanet/ (폴더 생성)
gabia-deploy/scripts/ → scripts/ (폴더 생성)
```

### www/가 있는 경우:
```
로컬 → 원격:
gabia-deploy/frontend/ → www/
gabia-deploy/backend/ → videoplanet/ (폴더 생성)
gabia-deploy/scripts/ → scripts/ (폴더 생성)
```

## 🛠️ 폴더 생성 방법

### FileZilla에서 새 폴더 만들기:
1. 원격 사이트 창에서 우클릭
2. "디렉토리 생성" 선택
3. 폴더명 입력:
   - `videoplanet` (백엔드용)
   - `scripts` (스크립트용)
   - `tmp` (임시 파일용)

## 💡 현재 상황 대응

### 1단계: 웹 루트 확인
FileZilla에서 보이는 폴더명들을 확인하고 알려주세요:
- [ ] htdocs/
- [ ] www/  
- [ ] html/
- [ ] 기타: ____________

### 2단계: 필요 폴더 생성
```
생성할 폴더:
□ videoplanet/ (백엔드)
□ scripts/ (스크립트)  
□ tmp/ (임시 파일) - 필요시
```

### 3단계: 파일 업로드
```
gabia-deploy/frontend/ → [웹루트폴더]/
gabia-deploy/backend/ → videoplanet/
gabia-deploy/scripts/ → scripts/
```

## 🔧 문제 해결

### 웹 루트를 모르겠는 경우:
1. **가비아 관리페이지 확인**
   - My가비아 → 서비스관리 → 웹호스팅
   - 호스팅 관리 → 파일관리자
   
2. **SSH로 직접 확인**
   ```bash
   ls -la ~/
   find ~ -name "index.html" 2>/dev/null
   ```

3. **테스트 파일 업로드**
   - 간단한 HTML 파일을 각 폴더에 업로드
   - 브라우저에서 접속하여 확인

---
📞 **도움이 필요하면**: FileZilla에서 보이는 모든 폴더명을 알려주세요!