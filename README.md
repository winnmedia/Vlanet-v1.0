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
- **MySQL** - 데이터베이스 (가비아 호스팅)
- **Redis** - 캐싱 및 세션 관리

### 프론트엔드
- **React 18** - 모던 UI 라이브러리
- **Modern CSS** - 반응형 디자인

### 🚀 배포 & 인프라
- **GitHub Actions** - CI/CD 자동화
- **가비아 웹호스팅** - 프로덕션 환경
- **SSH 자동 배포** - 코드 푸시 시 자동 배포

## 📦 설치 및 실행

### 🔧 환경 요구사항
- Node.js 18+
- Python 3.9+
- MySQL 8.0+

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

## 🌐 자동 배포

### GitHub Actions를 통한 가비아 배포
이 프로젝트는 **완전 자동화된 배포 시스템**을 구축했습니다!

```bash
# 코드 수정 후 푸시만 하면 자동 배포!
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin main
# 🚀 자동으로 가비아 서버에 배포됩니다!
```

### 📋 배포 과정
1. **🔧 빌드**: React 앱 빌드, Django 설정
2. **📤 업로드**: SSH를 통해 가비아 서버에 파일 전송
3. **⚙️ 설정**: Django 마이그레이션, 정적 파일 수집
4. **🌐 웹서버**: Apache 설정, CGI 스크립트 구성
5. **🧪 테스트**: 배포 후 자동 동작 확인

## 🔐 환경 설정

### GitHub Secrets 설정 필요
```
GABIA_HOST=your-domain.com
GABIA_USERNAME=호스팅계정명
GABIA_PASSWORD=호스팅비밀번호
GABIA_DOMAIN=your-domain.com

DJANGO_SECRET_KEY=django-secret-key
DB_NAME=database_name
DB_USER=database_user
DB_PASSWORD=database_password

TWELVE_LABS_API_KEY=tlk_your_api_key
TWELVE_LABS_INDEX_ID=your_index_id
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
│   ├── video_analysis/       # Twelve Labs 연동
│   ├── feedbacks/            # 피드백 관리
│   └── manage.py
├── 🚀 .github/workflows/     # GitHub Actions
│   └── gabia-deploy.yml      # 자동 배포 설정
├── 📚 docs/                  # 문서
└── 🔧 scripts/               # 배포 스크립트
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

- **프로덕션**: https://your-domain.com
- **API 문서**: https://your-domain.com/api/docs/
- **관리자**: https://your-domain.com/admin/

## 👥 팀

- **개발팀**: VideoPlanet Development Team
- **AI 파트너**: Twelve Labs
- **호스팅**: 가비아

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🎉 특징

### 💡 혁신적인 AI 기술
- **Twelve Labs의 최신 영상 이해 AI** 활용
- **자연어 기반 영상 검색** 지원
- **실시간 영상 분석** 및 피드백

### 🚀 현대적인 개발 환경
- **완전 자동화된 CI/CD** 파이프라인
- **모던 React & Django** 스택
- **클라우드 네이티브** 아키텍처

### 💰 비용 효율적인 배포
- **가비아 웹호스팅** 활용 (월 13,200원)
- **Twelve Labs API** 사용량 기반 과금
- **총 운영비용**: 월 15,000-50,000원

---

🎬 **VideoPlanet**으로 영상 제작의 새로운 차원을 경험하세요!