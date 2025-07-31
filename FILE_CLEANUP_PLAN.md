# 🧹 VideoPlanet 파일 정리 계획

## 📊 현재 상황 분석

### 1. 불필요한 파일 카테고리

#### 테스트/디버그 파일 (117개)
- `test_*.py` - 임시 테스트 파일들
- `debug_*.py` - 디버깅용 임시 파일들
- `fix_*.py` - 임시 수정 스크립트들
- `create_test_*.py` - 테스트 데이터 생성 스크립트들

#### 중복된 설정 파일들
**현재 사용 중**:
- `config/settings_base.py` - 기본 설정
- `config/settings_fixed.py` - Django 앱 의존성 수정된 버전
- `config/settings_dev.py` - 개발 환경

**삭제 가능한 중복 파일들**:
- `config/settings_minimal.py`
- `config/settings_railway.py`
- `config/settings_railway_simple.py`
- `config/settings_railway_standalone.py`
- `config/settings/railway*.py` - settings 하위 폴더의 중복 파일들

#### 오래된 문서들
- 2025년 6-7월 가이드 문서들 (이미 해결된 이슈들)
- 중복된 배포 가이드들

#### 로그 파일들
- `*.log` - 오래된 로그 파일들
- `test_results/` - 테스트 결과 디렉토리

#### 백업/임시 스크립트
- `start_emergency.sh` - emergency_fix.sh로 대체됨
- `run_local_debug.sh` - 로컬 디버깅용

## 🎯 정리 대상 파일들

### 즉시 삭제 가능 (안전)
```bash
# 테스트/디버그 파일들
vridge_back/test_*.py
vridge_back/debug_*.py
vridge_back/fix_*.py
vridge_back/create_test_*.py

# 중복 설정 파일들
vridge_back/config/settings_minimal.py
vridge_back/config/settings_railway*.py
vridge_back/config/settings/  # 전체 디렉토리

# 임시 스크립트
vridge_back/start_emergency.sh
vridge_back/run_local_debug.sh

# 로그 파일
vridge_back/*.log
vridge_back/test_results/

# scripts 폴더의 테스트 파일들
vridge_back/scripts/tests/  # 전체 디렉토리
```

### 검토 후 삭제
```bash
# 오래된 가이드 문서들 (2025년 6월)
vridge_back/CORS_SETUP_GUIDE.md
vridge_back/EMAIL_SETUP_GUIDE.md
vridge_back/DEMO_ACCOUNTS.md
vridge_back/TEST_PROJECTS.md

# 해결된 이슈 문서들
vridge_back/CRITICAL_FIXES_NEEDED.md
vridge_back/PROJECT_CREATION_ISSUES.md
vridge_back/URGENT_MIGRATION_NOW.md
```

### 보존 필요
```bash
# 최신 가이드
vridge_back/RAILWAY_ENV_GUIDE.md  # 방금 작성
vridge_back/API_MODELS_GUIDE.md
vridge_back/DEPLOYMENT_GUIDE.md

# 핵심 설정
vridge_back/config/settings_base.py
vridge_back/config/settings_fixed.py
vridge_back/config/settings_dev.py

# 필수 스크립트
vridge_back/start.sh
vridge_back/start_improved.sh
vridge_back/start_emergency_fix.sh
vridge_back/emergency_server.py
```

## 📋 정리 순서

1. **백업 생성** (안전을 위해)
2. **테스트/디버그 파일 삭제**
3. **중복 설정 파일 삭제**
4. **오래된 문서 아카이브**
5. **로그 파일 정리**

## 예상 결과
- 파일 수: 약 150개 → 50개 이하로 감소
- 코드베이스 명확성 향상
- 현재 사용 중인 파일만 유지

작성일: 2025-08-01