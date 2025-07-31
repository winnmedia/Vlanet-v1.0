# VideoPlanet 개발 안전 가이드

## 🚨 테스트 도구 설치 시 주의사항

### 1. 패키지 설치 위치
- **절대 금지**: `dependencies`에 테스트 도구 설치
- **올바른 방법**: `devDependencies`에만 설치

```bash
# ❌ 잘못된 예시
npm install playwright

# ✅ 올바른 예시  
npm install --save-dev playwright
```

### 2. 프로덕션 번들 크기 영향
- Playwright: ~11MB
- Puppeteer: ~8MB
- 이런 도구들이 프로덕션에 포함되면 빌드 속도와 성능에 심각한 영향

### 3. 브랜드 색상 시스템 보호
**절대 변경 금지 파일**: `/src/css/Cms/DesignSystem.scss`

현재 브랜드 색상:
```scss
$primary-blue: #1E88E5;
$primary-dark: #1565C0;
$primary-light: #42A5F5;
$primary-pale: #E3F2FD;
```

### 4. 테스트 파일 위치
- 모든 테스트는 `/tests` 디렉토리에만 생성
- `src/` 디렉토리에 테스트 파일 생성 금지

### 5. 변경 전 체크리스트
- [ ] package.json 변경 시 번들 크기 확인
- [ ] 디자인 시스템 파일 변경 여부 확인
- [ ] 기존 UI 컴포넌트 구조 유지 확인
- [ ] 프로덕션 빌드 테스트 완료

### 6. 문제 발생 시 복구 방법
```bash
# 1. 변경사항 확인
git status
git diff

# 2. 특정 파일만 복구
git checkout -- [파일경로]

# 3. 전체 복구 (주의!)
git reset --hard HEAD
```

## 📋 배포 전 필수 확인사항
1. `npm run build` 성공 여부
2. 번들 크기 급증 여부
3. 브랜드 색상 일관성
4. UI 레이아웃 정상 여부

---
작성일: 2025-08-01
담당: Claude