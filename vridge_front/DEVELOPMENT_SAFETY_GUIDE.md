# 🛡️ VideoPlanet 개발 안전 가이드

## 🚨 테스트 도구 추가 시 필수 준수사항

### ✅ 올바른 패키지 설치 방법

#### 개발 전용 도구 (devDependencies)
```bash
# ✅ 올바른 방법
npm install -D @playwright/test
npm install -D jest
npm install -D cypress
npm install -D @testing-library/react

# ❌ 잘못된 방법 (프로덕션 번들에 포함됨)
npm install playwright
npm install jest
```

#### 프로덕션 필수 도구 (dependencies)
```bash
# ✅ 런타임에 필요한 라이브러리만
npm install react
npm install axios
npm install next
```

### 🔍 패키지 추가 전 필수 체크리스트

#### 1. 의존성 타입 결정
- [ ] **런타임 필수**: 사용자가 앱을 사용할 때 필요한가?
  - YES → `dependencies`
  - NO → `devDependencies`

#### 2. 시스템 영향 분석
- [ ] **번들 크기**: 패키지 크기가 1MB 이상인가?
- [ ] **보안**: 알려진 취약점이 있는가? (`npm audit`)
- [ ] **호환성**: 기존 패키지와 충돌하는가?
- [ ] **유지보수**: 최근 업데이트된 패키지인가?

#### 3. 설치 후 검증
- [ ] **빌드 테스트**: `npm run build` 성공 확인
- [ ] **번들 크기**: 크기 증가량 확인
- [ ] **로컬 테스트**: 개발 서버 정상 작동 확인

### 📊 번들 크기 모니터링 방법

#### 설치 전/후 크기 비교
```bash
# 현재 번들 크기 확인
npm run build
ls -lh .next/static/chunks/pages/_app*.js

# 패키지 설치 후 다시 확인
npm install -D [package]
npm run build
ls -lh .next/static/chunks/pages/_app*.js
```

#### 허용 가능한 증가량 기준
- **개발 도구**: 번들 크기에 영향 없어야 함
- **프로덕션 라이브러리**: 10KB 이하 권장, 100KB 이상 시 사전 승인

### 🗂️ 테스트 파일 구조 표준

```
tests/
├── unit/                    # 단위 테스트
│   ├── components/
│   └── utils/
├── integration/             # 통합 테스트  
│   ├── api/
│   └── pages/
├── e2e/                     # E2E 테스트
│   ├── user-flows/
│   └── critical-paths/
└── fixtures/                # 테스트 데이터
    ├── mocks/
    └── test-data/
```

### 🚫 절대 금지사항

#### 위험한 패키지 설치 패턴
```bash
# ❌ 브라우저 자동화 도구를 production에 설치
npm install playwright puppeteer selenium-webdriver

# ❌ 대용량 개발 도구를 production에 설치  
npm install webpack-dev-server eslint-config-airbnb

# ❌ 테스트 프레임워크를 production에 설치
npm install jest mocha chai
```

#### 위험한 파일 배치
```bash
# ❌ 루트 디렉토리에 테스트 파일 배치
test-*.js
*.test.js
playwright.config.js (루트)

# ✅ 올바른 배치
tests/unit/component.test.js
tests/e2e/playwright.config.js
```

### 🔧 복구 절차 (문제 발생 시)

#### 1. 즉시 대응
```bash
# 문제 패키지 제거
npm uninstall [problematic-package]

# 의존성 재설치
npm install

# 빌드 테스트
npm run build
```

#### 2. 올바른 재설치
```bash
# 개발 도구는 devDependencies에
npm install -D [package]

# 빌드 검증
npm run build
```

#### 3. 정리 작업
```bash
# 불필요한 파일 정리
mv test-*.js tests/integration/
rm -f playwright.config.js (루트 레벨)

# Git 커밋
git add .
git commit -m "fix: 테스트 도구 의존성 정리 및 프로젝트 구조 개선"
```

### 📈 성능 최적화 가이드

#### 번들 분석 도구 활용
```bash
# 번들 분석기 실행 (필요시)
npm install -D @next/bundle-analyzer
```

#### 정기 점검 사항
- 월 1회 `npm audit` 보안 점검
- 분기 1회 불필요한 패키지 정리
- 반기 1회 주요 패키지 업데이트

### 🎯 품질 보증 프로세스

#### Pull Request 체크리스트
- [ ] package.json에서 dependencies/devDependencies 구분 확인
- [ ] 빌드 성공 여부 확인
- [ ] 번들 크기 변화량 명시
- [ ] 새 패키지 추가 이유 문서화

#### 배포 전 최종 검증
- [ ] `npm run build` 성공
- [ ] 주요 페이지 로드 테스트
- [ ] 번들 크기 기준치 준수
- [ ] 보안 취약점 없음

---

## 🚨 긴급 상황 대응

### 배포 후 문제 발생 시
1. **즉시 이전 버전으로 롤백**
2. **문제 원인 분석** (5 Whys 방법론)
3. **본질적 해결책 수립**
4. **재배포 및 검증**

### 연락처
- 개발팀 리드: [연락처]
- 시스템 관리자: [연락처]

---
*작성일: 2025-08-01*
*버전: 1.0*
*다음 리뷰: 2025-09-01*