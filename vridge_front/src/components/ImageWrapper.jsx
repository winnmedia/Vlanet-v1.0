import React from 'react';

// Next.js 이미지 래퍼 컴포넌트
// src/images 경로를 /images (public) 경로로 변환
export default function ImageWrapper({ src, alt, ...props }) {
  // import된 이미지 객체인 경우
  if (typeof src === 'object' && src.src) {
    return <img src={src.src || src} alt={alt} {...props} />;
  }
  
  // 문자열 경로인 경우
  let imageSrc = src;
  
  // src/images로 시작하는 경로를 /images로 변환
  if (typeof src === 'string') {
    if (src.startsWith('images/')) {
      imageSrc = '/' + src;
    } else if (src.startsWith('/images/')) {
      imageSrc = src;
    }
  }
  
  return <img src={imageSrc} alt={alt} {...props} />;
}