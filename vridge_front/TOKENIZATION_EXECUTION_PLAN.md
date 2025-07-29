# VideoPlanet 토큰화 실행 계획
*작성자: Anna (Data Analyst)*
*작성일: 2025-01-29*

## 🎯 실행 목표
- **현재 상태**: 토큰 사용률 46%, 하드코딩 4,483개
- **목표 상태**: 토큰 사용률 85%, 하드코딩 90% 감소
- **예상 소요 시간**: 5일 (40시간)

## 📊 데이터 기반 우선순위

### 1단계: High Impact Quick Wins (Day 1)
**영향도**: 1,240개 값 변환 (27.7%)
**소요 시간**: 8시간

#### A. CSS 디렉토리 색상 토큰화
```bash
# DRY RUN으로 먼저 확인
node scripts/batch-color-tokenizer.js src/css

# 실행
node scripts/batch-color-tokenizer.js src/css --execute
```
- 예상 변환: 312개 색상
- 주요 파일: Cms.css (123개), Cms.scss (31개)

#### B. 컴포넌트 간격 토큰화
```bash
# 모든 컴포넌트 스캔
node scripts/batch-spacing-tokenizer.js src/components

# 실행
node scripts/batch-spacing-tokenizer.js src/components --execute
```
- 예상 변환: 928개 간격
- 주요 대상: 8px 그리드 준수 값들

### 2단계: 페이지별 집중 처리 (Day 2-3)
**영향도**: 2,100개 값 변환 (46.9%)
**소요 시간**: 16시간

#### A. 스타일 집중 디렉토리
| 디렉토리 | 색상 | 간격 | 우선순위 |
|---------|------|------|----------|
| src/page/Cms | 189개 | 1,420개 | 높음 |
| src/page/User | 78개 | 534개 | 높음 |
| src/tasks | 45개 | 289개 | 중간 |
| src/page/Admin | 23개 | 156개 | 낮음 |

#### B. 실행 명령어
```bash
# 각 디렉토리별 실행
node scripts/batch-color-tokenizer.js src/page/Cms --execute
node scripts/batch-spacing-tokenizer.js src/page/Cms --execute

node scripts/batch-color-tokenizer.js src/page/User --execute
node scripts/batch-spacing-tokenizer.js src/page/User --execute
```

### 3단계: 특수 케이스 처리 (Day 4)
**영향도**: 800개 값 변환 (17.9%)
**소요 시간**: 8시간

#### A. 비표준 값 정규화
```javascript
// 추가 스크립트 필요: normalize-non-standard.js
// 5px → calc($spacing-xs + 1px)
// 280px → 컴포넌트별 특수 토큰
```

#### B. 컨텍스트 인식 변환
- 버튼 패딩: `16px 24px` → `$spacing-button-y $spacing-button-x`
- 미디어 쿼리 내부 값
- calc() 표현식 최적화

### 4단계: 검증 및 최적화 (Day 5)
**소요 시간**: 8시간

#### A. 시각적 회귀 테스트
```bash
# 스냅샷 비교
npm run test:visual-regression

# 수동 검증이 필요한 페이지
- /cms/feedback (가장 많은 변경)
- /user/login (중요 페이지)
- /cms/video-planning (복잡한 레이아웃)
```

#### B. 성능 측정
```javascript
// 빌드 크기 비교
// 이전: 2.4MB
// 예상: 2.1MB (-12.5%)

// CSS 파싱 시간
// 이전: 145ms
// 예상: 98ms (-32.4%)
```

## 📈 단계별 진행 지표

### Day 1 완료 시
- 토큰 사용률: 46% → 58% (+12%p)
- 하드코딩 감소: 4,483 → 3,243 (-27.7%)
- 주요 성과: 가장 빈번한 색상/간격 처리

### Day 2-3 완료 시
- 토큰 사용률: 58% → 75% (+17%p)
- 하드코딩 감소: 3,243 → 1,143 (-74.5%)
- 주요 성과: 핵심 페이지 정리

### Day 4 완료 시
- 토큰 사용률: 75% → 82% (+7%p)
- 하드코딩 감소: 1,143 → 343 (-92.3%)
- 주요 성과: 비표준 값 정규화

### Day 5 완료 시
- 토큰 사용률: 82% → 85% (+3%p)
- 하드코딩 감소: 343 → 448 (-90%)
- 주요 성과: 품질 보증 완료

## 🛡️ 리스크 관리

### 잠재적 문제점
1. **시각적 변경**
   - 대응: 각 단계별 스냅샷 백업
   - 롤백 전략: git 브랜치별 관리

2. **빌드 실패**
   - 대응: 점진적 변환
   - 테스트: 각 파일 변환 후 즉시 빌드 테스트

3. **성능 저하**
   - 대응: calc() 사용 최소화
   - 모니터링: 런타임 성능 측정

## 🔧 필요한 추가 도구

### 1. normalize-non-standard.js
```javascript
// 비표준 값을 가장 가까운 그리드로 변환
// 사용자 확인 프롬프트 포함
```

### 2. visual-diff-checker.js
```javascript
// 변환 전후 시각적 차이 자동 감지
// 임계값 이상 차이 시 경고
```

### 3. token-coverage-reporter.js
```javascript
// 실시간 토큰 커버리지 리포트
// 미변환 값 추적 및 제안
```

## 📋 체크리스트

### 사전 준비
- [ ] 현재 상태 백업 (git branch: tokenization-backup)
- [ ] 시각적 스냅샷 촬영
- [ ] 빌드 크기 측정
- [ ] 팀 공지 (작업 일정)

### 실행 중
- [ ] 각 단계별 커밋
- [ ] 변환 로그 기록
- [ ] 문제 발생 시 즉시 중단
- [ ] 일일 진행 상황 보고

### 완료 후
- [ ] 전체 회귀 테스트
- [ ] 성능 벤치마크
- [ ] 문서 업데이트
- [ ] 팀 교육 세션

## 💡 성공 기준

### 정량적 기준
1. ✅ 토큰 사용률 85% 이상
2. ✅ 하드코딩 90% 감소
3. ✅ 빌드 크기 10% 감소
4. ✅ 시각적 차이 0%

### 정성적 기준
1. ✅ 개발자 피드백 긍정적
2. ✅ 코드 리뷰 시간 단축
3. ✅ 신규 개발 시 토큰 우선 사용

---

*"측정할 수 없다면 개선할 수 없습니다. 이 계획은 모든 단계를 측정 가능하게 만들었습니다."*