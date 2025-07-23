# Next.js 이미지 누락 문제 해결 보고서

## 🔍 문제 진단
- **서버 상태**: ✅ 정상 실행 (http://localhost:3000)
- **문제 원인**: 이미지 태그의 src 속성이 `[object Object]`로 렌더링됨
- **예시**: `<img src="[object Object]"/>` 

## 🎯 근본 원인
React에서 Next.js로 마이그레이션 시 이미지 import 방식의 차이:
- React: `import logo from 'images/logo.svg'` → `<img src={logo}>`
- Next.js: import된 이미지는 객체로 변환됨 → `.src` 속성 접근 필요

## ✅ 해결 방법

### 옵션 1: 이미지 컴포넌트에서 .src 속성 사용
```jsx
// 수정 전
<img src={logo} />

// 수정 후
<img src={logo.src || logo} />
```

### 옵션 2: public 폴더 직접 경로 사용
```jsx
// import 제거하고 직접 경로 사용
<img src="/images/Common/w_logo02.svg" />
```

### 옵션 3: Next.js Image 컴포넌트 사용 (권장)
```jsx
import Image from 'next/image'
import logo from 'images/Common/w_logo02.svg'

<Image src={logo} alt="Logo" />
```

## 📁 현재 상태
- 이미지 파일들은 모두 존재 (src/images/ 및 public/images/)
- 서버는 정상 작동
- 이미지 렌더링 코드만 수정 필요

## 🛠️ 즉시 적용 가능한 해결책
모든 이미지 태그에 `.src` 속성 추가하는 헬퍼 함수 사용:

```jsx
const getImageSrc = (img) => {
  return typeof img === 'object' ? img.src : img;
}

// 사용 예
<img src={getImageSrc(logo)} />
```