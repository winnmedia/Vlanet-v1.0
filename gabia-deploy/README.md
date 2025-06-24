# VideoPlanet 가비아 웹호스팅 배포 패키지

## 📦 패키지 구성

```
gabia-deploy/
├── backend/              # Django 백엔드
│   ├── config/
│   ├── video_analysis/   # Twelve Labs API 연동
│   ├── requirements.txt
│   ├── .env.example
│   └── passenger_wsgi.py
├── frontend/             # React 프론트엔드 (빌드됨)
│   ├── index.html
│   ├── static/
│   └── .htaccess
├── scripts/              # 배포 스크립트
│   ├── deploy-to-gabia.sh
│   └── upload-to-gabia.sh
├── docs/                 # 문서
│   ├── GABIA_HOSTING_GUIDE.md
│   └── TWELVE_LABS_SETUP.md
└── README.md

```

## 🚀 빠른 시작

### 1. 가비아 웹호스팅 구매
- **디럭스 이상** 상품 (Python/Django 지원)
- MySQL 데이터베이스 포함

### 2. 파일 업로드
```bash
# FTP로 업로드하거나
./scripts/upload-to-gabia.sh

# 수동 업로드:
# backend/ → /home/계정명/videoplanet/
# frontend/ → /home/계정명/public_html/
```

### 3. 서버 설정
```bash
# SSH 접속 후
./scripts/deploy-to-gabia.sh
```

### 4. 환경 변수 설정
```bash
# .env 파일 편집
nano /home/계정명/videoplanet/.env

# Twelve Labs API 키 입력
TWELVE_LABS_API_KEY=your_api_key_here
TWELVE_LABS_INDEX_ID=your_index_id_here
```

## 📖 상세 가이드

- **배포 가이드**: `docs/GABIA_HOSTING_GUIDE.md`
- **Twelve Labs 설정**: `docs/TWELVE_LABS_SETUP.md`

## 💰 예상 비용

- 가비아 웹호스팅: 월 13,200원
- Twelve Labs API: 월 $5-50 (사용량에 따라)
- 총 예상 비용: **월 15,000-50,000원**

## 🔧 지원

- 이메일: dev@videoplanet.com
- GitHub: https://github.com/videoplanet/issues

---
🎬 **VideoPlanet** - AI 영상 분석 플랫폼
