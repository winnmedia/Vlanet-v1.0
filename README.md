# 🎬 VideoPlanet - AI Video Analysis Platform

## 🚀 개요
VideoPlanet은 **Twelve Labs AI**를 활용한 차세대 영상 분석 및 피드백 플랫폼입니다. 영상 제작팀의 협업을 위한 종합적인 솔루션을 제공합니다.

### ✨ 핵심 기능
- 🤖 **AI 영상 분석**: Twelve Labs API를 통한 영상 내용 이해
- 📊 **실시간 피드백**: 영상에 대한 즉각적인 AI 분석 결과
- 👥 **협업 도구**: 프로젝트 관리, 실시간 커뮤니케이션
- 📁 **파일 관리**: 안전한 영상 파일 저장 및 공유

## 🛠 기술 스택

### 백엔드
- **Django 4.2** - 웹 프레임워크
- **Django REST Framework** - API 개발
- **Twelve Labs API** - AI 영상 분석
- **PostgreSQL** - 데이터베이스
- **Redis** - 캐싱 및 세션 관리

### 프론트엔드
- **React 18** - 모던 UI 라이브러리
- **Modern CSS** - 반응형 디자인

### 🚀 배포 & 인프라
- **Railway** - 클라우드 플랫폼
- **GitHub 자동 배포** - 코드 푸시 시 자동 배포
- **PostgreSQL** - Railway 통합 데이터베이스

## 📦 설치 및 실행

### 🔧 환경 요구사항
- Node.js 18+
- Python 3.9+
- PostgreSQL 14+

### 🚀 빠른 시작

#### 1. 저장소 클론
```bash
git clone https://github.com/winnmedia/Vlanet-v1.0.git
cd Vlanet-v1.0
```

#### 2. 프론트엔드 설정
```bash
cd vridge_front
npm install
npm start
# 🌐 http://localhost:3000
```

#### 3. 백엔드 설정
```bash
cd vridge_back
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
# 🌐 http://localhost:8000
```

## 🌐 Railway 자동 배포

### GitHub에서 Railway로 자동 배포
이 프로젝트는 **Railway**에서 **완전 자동화된 배포**를 지원합니다!

```bash
# 코드 수정 후 푸시만 하면 자동 배포!
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin main
# 🚀 자동으로 Railway에 배포됩니다!
```

### 📋 배포 과정
1. **🔧 빌드**: React 앱 빌드, Django 설정
2. **📦 설치**: Python/Node.js 의존성 설치
3. **🗄️ 데이터베이스**: PostgreSQL 자동 마이그레이션
4. **📁 정적파일**: collectstatic 자동 실행
5. **🌐 배포**: Gunicorn으로 Django 서버 시작

## 🔐 환경 설정

### Railway 환경변수 설정
```
SECRET_KEY=django-insecure-DcuaI3zQmYubdwPqXgkCQgJkfZJCeiJ5NM7-HqsgEQRUADnZeb
DJANGO_SETTINGS_MODULE=config.settings.railway

TWELVE_LABS_API_KEY=tlk_your_api_key
TWELVE_LABS_INDEX_ID=your_index_id

DATABASE_URL=postgresql://... (자동 생성)
```

## 🤖 Twelve Labs AI 연동

### API 기능
- **영상 업로드**: 자동 인덱싱 및 분석
- **내용 검색**: 자연어로 영상 내용 검색
- **요약 생성**: AI가 생성하는 영상 요약
- **감정 분석**: 영상 속 감정 및 분위기 분석

### 사용 예시
```python
# 영상 분석 요청
analyzer = TwelveLabsVideoAnalyzer()
result = analyzer.analyze_video("video_url")
```

## 📁 프로젝트 구조

```
VideoPlanet/
├── 🎬 vridge_front/          # React 프론트엔드
│   ├── src/
│   ├── public/
│   └── package.json
├── 🛠 vridge_back/           # Django 백엔드
│   ├── config/               # Django 설정
│   │   └── settings/
│   │       └── railway.py    # Railway 배포 설정
│   ├── video_analysis/       # Twelve Labs 연동
│   ├── feedbacks/            # 피드백 관리
│   └── manage.py
├── 🚀 Procfile              # Railway 배포 명령어
├── 🔧 nixpacks.toml         # Railway 빌드 설정
├── 📊 railway.json          # Railway 구성
└── 📚 RAILWAY_SETUP_GUIDE.md # 배포 가이드
```

## 🎯 주요 기능

### 👤 사용자 관리
- 회원가입/로그인
- 프로필 관리
- 권한 시스템

### 📁 프로젝트 관리
- 영상 프로젝트 생성
- 팀원 초대 및 권한 관리
- 진행 상태 추적

### 🎬 영상 분석
- AI 기반 영상 내용 분석
- 자동 태그 생성
- 영상 요약 제공

### 💬 피드백 시스템
- 실시간 댓글 시스템
- AI 추천 피드백
- 승인/거부 워크플로우

## 🔗 링크

- **프로덕션**: https://your-app.railway.app
- **API 문서**: https://your-app.railway.app/api/docs/
- **관리자**: https://your-app.railway.app/admin/

## 👥 팀

- **개발팀**: VideoPlanet Development Team
- **AI 파트너**: Twelve Labs
- **클라우드**: Railway

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🎉 특징

### 💡 혁신적인 AI 기술
- **Twelve Labs의 최신 영상 이해 AI** 활용
- **자연어 기반 영상 검색** 지원
- **실시간 영상 분석** 및 피드백

### 🚀 현대적인 개발 환경
- **Railway 클라우드 네이티브** 배포
- **완전 자동화된 CI/CD** 파이프라인
- **모던 React & Django** 스택

### 💰 비용 효율적인 배포
- **Railway 호스팅** 활용 (무료 → $5/월)
- **PostgreSQL** 통합 데이터베이스
- **Twelve Labs API** 사용량 기반 과금
- **총 운영비용**: 월 무료 → $10 (13,000원)

---

🎬 **VideoPlanet**으로 영상 제작의 새로운 차원을 경험하세요!