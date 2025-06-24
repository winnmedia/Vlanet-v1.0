# 📁 가비아 웹호스팅 디렉토리 구조 가이드

## 🏠 가비아 호스팅 기본 디렉토리

### 로그인 후 기본 경로: `/home/호스팅계정명/`

```
/home/호스팅계정명/
├── public_html/           # ← 웹 루트 (여기에 프론트엔드 업로드)
├── tmp/                   # ← 임시 파일 디렉토리 (여기에 압축 파일 업로드)
├── mail/                  # 이메일 관련
├── logs/                  # 로그 파일
├── cgi-bin/              # CGI 스크립트
└── (기타 디렉토리)
```

## 📂 FileZilla에서 보이는 디렉토리

### FileZilla 접속 시 원격 사이트 창에서:
```
/ (루트)
├── public_html/          # ← 웹사이트 파일이 들어가는 곳
├── tmp/                  # ← 압축 파일을 여기에 업로드
├── mail/
├── logs/
└── cgi-bin/
```

## 🎯 업로드 위치 가이드

### 1. 압축 파일 업로드 (임시)
- **FileZilla에서**: `tmp/` 폴더에 업로드
- **실제 경로**: `/home/호스팅계정명/tmp/`

### 2. 최종 파일 위치
- **프론트엔드**: `public_html/` (웹 루트)
- **백엔드**: `videoplanet/` (직접 생성할 디렉토리)
- **스크립트**: `scripts/` (직접 생성할 디렉토리)

## 🚀 올바른 업로드 방법

### 방법 1: tmp 디렉토리 사용 (권장)
```
FileZilla 업로드:
tmp/gabia-backend.tar.gz
tmp/gabia-frontend.tar.gz  
tmp/gabia-scripts.tar.gz

SSH에서 압축 해제:
cd ~/tmp  # /home/호스팅계정명/tmp/ 와 동일
tar -xzf gabia-backend.tar.gz -C ~/videoplanet/
tar -xzf gabia-frontend.tar.gz -C ~/public_html/
tar -xzf gabia-scripts.tar.gz -C ~/scripts/
```

### 방법 2: 직접 업로드 (간단함)
```
FileZilla에서 바로:
public_html/ ← 프론트엔드 파일들
videoplanet/ ← 백엔드 파일들 (폴더 생성 후)
```

## 🔍 FileZilla에서 tmp 디렉토리 찾기

### 1. FileZilla 접속 후
- 원격 사이트 창에서 `tmp` 폴더가 보입니다
- 더블클릭으로 들어가기

### 2. tmp 폴더가 안 보이는 경우
- **새 폴더 생성**: 우클릭 → "디렉토리 생성" → `tmp`
- **또는** 다른 임시 폴더 사용: `uploads/`, `temp/` 등

## 📋 실제 업로드 단계

### 1단계: FileZilla 디렉토리 확인
```
연결 후 원격 사이트에서 확인:
□ public_html/ (있음)
□ tmp/ (있으면 사용, 없으면 생성)
□ mail/ (보통 있음)
□ logs/ (보통 있음)
```

### 2단계: 필요 시 디렉토리 생성
```
FileZilla에서 우클릭 → "디렉토리 생성":
□ tmp/ (압축 파일용)
□ videoplanet/ (백엔드용)  
□ scripts/ (스크립트용)
```

### 3단계: 파일 업로드
```
로컬 → 원격:
gabia-backend.tar.gz → tmp/
gabia-frontend.tar.gz → tmp/
gabia-scripts.tar.gz → tmp/
```

## 💡 팁

### 더 쉬운 방법 (압축 없이)
```
FileZilla에서 폴더째로 업로드:
gabia-deploy/backend/ → videoplanet/
gabia-deploy/frontend/ → public_html/
gabia-deploy/scripts/ → scripts/
```

이 방법이 더 직관적이고 SSH 압축 해제 과정을 생략할 수 있습니다!