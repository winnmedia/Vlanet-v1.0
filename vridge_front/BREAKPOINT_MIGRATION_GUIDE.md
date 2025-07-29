# 브레이크포인트 마이그레이션 가이드

## 현재 상태
여러 SCSS 파일에서 서로 다른 브레이크포인트를 사용 중

## 통일된 브레이크포인트 시스템

### 브레이크포인트 값
```scss
// src/design-system/tokens/_breakpoints.scss
$breakpoint-sm: 768px;   // 태블릿
$breakpoint-md: 1024px;  // 소형 데스크톱
$breakpoint-lg: 1280px;  // 대형 데스크톱
```

### 믹스인 사용법
```scss
// 사용 전
@media (max-width: 767px) {
  // 모바일 스타일
}

// 사용 후
@import '@/design-system/tokens/breakpoints';

@include media-down('sm') {
  // 모바일 스타일
}
```

### 마이그레이션 체크리스트
- [ ] Home.scss의 미디어 쿼리 통일
- [ ] Cms.scss의 미디어 쿼리 통일  
- [ ] 컴포넌트별 SCSS 파일 검토
- [ ] 하드코딩된 브레이크포인트 제거

## 자동화 스크립트
```bash
# 브레이크포인트 사용 현황 분석
grep -r "@media" src/css src/page src/components | grep -v node_modules

# 하드코딩된 픽셀값 찾기
grep -r "@media.*[0-9]px" src/
```

## 주의사항
- 기존 반응형 동작이 변경되지 않도록 주의
- 테스트 시 모든 뷰포트 크기 확인 필요