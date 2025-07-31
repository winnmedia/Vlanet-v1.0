# VideoPlanet 백업 정리 계획

## 📊 현재 백업 현황 분석

### 대용량 백업 파일 (총 용량: 약 966MB)
1. `vridge_front_backup_20250728_181235.tar.gz` - 541MB (가장 최근)
2. `vridge_front_backup_20250722_150942.tar.gz` - 165MB
3. `vridge_front_backup_20250716_001904.tar.gz` - 152MB  
4. `vridge_front_backup_20250728_181353.tar.gz` - 108MB

### 백업 디렉토리
- `backup/` - 일반 백업
- `ui_backup_20250730_230605/` - UI 백업
- `ui_backup_20250730_231010/` - UI 백업
- `vridge_front_backup_0722/` - 프론트엔드 백업
- `vridge_front_backup_20250723/` - 프론트엔드 백업
- `vridge_front_current_backup/` - 현재 백업
- `vridge_front_hybrid/` - 하이브리드 버전

### 기타 백업 파일
- `gabia-backend.tar.gz` - 10MB
- `gabia-frontend.tar.gz` - 21MB

## 🎯 정리 전략

### 1단계: 중요도 분류
**보존 필수 (최신/중요)**
- `vridge_front_backup_20250728_181235.tar.gz` - 가장 최근 대용량 백업
- `vridge_front_current_backup/` - 현재 작업 백업

**검토 후 삭제 가능**
- 중복된 날짜의 백업들
- 오래된 백업 파일들 (7월 16일 이전)
- 임시 백업 디렉토리들

### 2단계: 백업 아카이브 생성
```bash
# 오래된 백업들을 하나의 아카이브로 통합
mkdir -p archived_backups
tar -czf archived_backups/old_backups_202507.tar.gz \
  vridge_front_backup_20250716_001904.tar.gz \
  vridge_front_backup_20250722_150942.tar.gz
```

### 3단계: 안전한 정리
1. **백업 검증**: 최신 백업이 정상인지 확인
2. **Git 상태 확인**: 현재 작업이 커밋되어 있는지 확인
3. **단계별 삭제**: 한 번에 모두 삭제하지 않고 단계적으로 진행

## 📋 정리 우선순위

### 즉시 삭제 가능 (안전)
- 중복된 UI 백업: `ui_backup_20250730_*`
- 오래된 압축 파일: 2주 이상 된 `.tar.gz` 파일들

### 검토 후 삭제
- `vridge_front_backup_0722/`
- `vridge_front_backup_20250723/`
- `vridge_front_hybrid/` (하이브리드 버전이 더 이상 필요한지 확인)

### 보존 권장
- 최신 백업 1-2개
- `vridge_front_current_backup/`
- Git 히스토리

## 🛡️ 안전 조치
1. 정리 전 전체 프로젝트 백업 생성
2. 각 백업의 내용 확인 후 삭제
3. 삭제 로그 기록

## 예상 결과
- **정리 전**: 약 1GB 이상의 백업 파일
- **정리 후**: 약 200-300MB (최신 백업만 유지)
- **공간 절약**: 약 700-800MB

작성일: 2025-08-01