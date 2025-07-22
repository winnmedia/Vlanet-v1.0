import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO 최적화를 위한 메타 태그 컴포넌트
 */
const SEOHelmet = ({ 
  title = 'VideoPlanet - 영상 제작 프로젝트 관리 시스템',
  description = '효율적인 영상 제작 프로젝트 관리와 실시간 피드백 시스템',
  image = '/og-image.png',
  url = window.location.href,
  type = 'website'
}) => {
  const siteName = 'VideoPlanet';
  const fullTitle = title === siteName ? title : `${title} | ${siteName}`;
  
  return (
    <Helmet>
      {/* 기본 메타 태그 */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph 메타 태그 */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="ko_KR" />
      
      {/* Twitter Card 메타 태그 */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* 추가 메타 태그 */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#1631F8" />
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default SEOHelmet;