// VideoPlanet 디자인 시스템 - Icon 컴포넌트
// 영상 제작 워크플로우에 특화된 아이콘 시스템

import React from 'react';
import PropTypes from 'prop-types';
import styles from './Icon.module.scss';

const Icon = ({
  name,
  size = 'medium',
  color = 'currentColor',
  className = '',
  ...props
}) => {
  const iconClasses = [
    styles.icon,
    styles[`icon--${size}`],
    className,
  ].filter(Boolean).join(' ');

  // SVG 아이콘 정의
  const icons = {
    // ========================================
    // 프로젝트 단계 아이콘
    // ========================================
    'phase-planning': (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L17.7071 7.70711C17.8946 7.89464 18 8.149 18 8.41421V19C18 20.1046 17.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13 3V7C13 7.55228 13.4477 8 14 8H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    
    'phase-production': (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <polygon points="10,8 16,12 10,16" fill="currentColor"/>
      </svg>
    ),
    
    'phase-postproduction': (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M2.458 12C3.732 7.943 7.523 5 12 5C16.478 5 20.268 7.943 21.542 12C20.268 16.057 16.478 19 12 19C7.523 19 3.732 16.057 2.458 12Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 9L14 7M12 15L14 17M12 9L10 7M12 15L10 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    
    'phase-review': (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    
    'phase-completed': (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.1"/>
      </svg>
    ),
    
    'phase-onhold': (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <rect x="8" y="8" width="2" height="8" fill="currentColor"/>
        <rect x="14" y="8" width="2" height="8" fill="currentColor"/>
      </svg>
    ),

    // ========================================
    // 우선순위 아이콘
    // ========================================
    'priority-critical': (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.1"/>
      </svg>
    ),
    
    'priority-high': (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    
    'priority-medium': (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 12L12 8L16 12L12 16L8 12Z" fill="currentColor"/>
      </svg>
    ),
    
    'priority-low': (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 10L12 14L16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    // ========================================
    // 피드백 상태 아이콘
    // ========================================
    'feedback-pending': (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    
    'feedback-inprogress': (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 12L12 16L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    
    'feedback-resolved': (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    
    'feedback-rejected': (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),

    // ========================================
    // AI 기능 아이콘
    // ========================================
    'ai-generate': (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 2L13.09 8.26L22 12L13.09 15.74L12 22L10.91 15.74L2 12L10.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M8 8L9 11L12 12L9 13L8 16L7 13L4 12L7 11L8 8Z" fill="currentColor"/>
      </svg>
    ),
    
    'ai-analyze': (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
        <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11 8V14M8 11H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    
    'ai-recommend': (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M9.663 17H4C2.895 17 2 16.105 2 15V5C2 3.895 2.895 3 4 3H14C15.105 3 16 3.895 16 5V12.663L12 16.663L9.663 17Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M7 7H13M7 11H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M22 11.5L18.5 8L15 11.5L18.5 15L22 11.5Z" fill="currentColor"/>
      </svg>
    ),

    // ========================================
    // 일반 기능 아이콘
    // ========================================
    'video-play': (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <polygon points="10,8 16,12 10,16" fill="currentColor"/>
      </svg>
    ),
    
    'video-pause': (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <rect x="9" y="8" width="2" height="8" fill="currentColor"/>
        <rect x="13" y="8" width="2" height="8" fill="currentColor"/>
      </svg>
    ),
    
    'video-timeline': (
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="3" y="11" width="18" height="2" fill="currentColor"/>
        <circle cx="8" cy="12" r="2" fill="currentColor"/>
        <circle cx="16" cy="12" r="2" fill="currentColor"/>
        <path d="M3 6H21M3 18H21" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    ),
    
    'calendar': (
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    
    'project': (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4905 2.02168 11.3363C2.16356 9.18219 2.99721 7.13716 4.39828 5.49997C5.79935 3.86278 7.69279 2.71549 9.79619 2.24025C11.8996 1.76502 14.1003 1.98245 16.07 2.86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    
    'team': (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M23 21V19C23 18.1645 22.7155 17.3541 22.2094 16.6927C21.7033 16.0313 20.9944 15.5523 20.197 15.329" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 3.13C16.8604 3.35031 17.623 3.82071 18.1217 4.48578C18.6204 5.15085 18.8294 5.97073 18.8156 6.80838C18.8018 7.64603 18.5661 8.45465 18.0458 9.10265C17.5255 9.75065 16.7474 10.1932 15.88 10.37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    
    'chat': (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    
    'settings': (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
        <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2569 9.77251 19.9859C9.5799 19.7148 9.31074 19.5057 9 19.38C8.69838 19.2469 8.36381 19.2072 8.03941 19.266C7.71502 19.3248 7.41568 19.4795 7.18 19.71L7.12 19.77C6.93425 19.956 6.71368 20.1035 6.47088 20.2041C6.22808 20.3048 5.96783 20.3566 5.705 20.3566C5.44217 20.3566 5.18192 20.3048 4.93912 20.2041C4.69632 20.1035 4.47575 19.956 4.29 19.77C4.10405 19.5843 3.95653 19.3637 3.85588 19.1209C3.75523 18.8781 3.70343 18.6178 3.70343 18.355C3.70343 18.0922 3.75523 17.8319 3.85588 17.5891C3.95653 17.3463 4.10405 17.1257 4.29 16.94L4.35 16.88C4.58054 16.6443 4.73519 16.345 4.794 16.0206C4.85282 15.6962 4.81312 15.3616 4.68 15.06C4.55324 14.7642 4.34276 14.512 4.07447 14.3343C3.80618 14.1566 3.49179 14.0613 3.17 14.06H3C2.46957 14.06 1.96086 13.8493 1.58579 13.4742C1.21071 13.0991 1 12.5904 1 12.06C1 11.5296 1.21071 11.0209 1.58579 10.6458C1.96086 10.2707 2.46957 10.06 3 10.06H3.09C3.42099 10.0523 3.742 9.94512 4.01309 9.75251C4.28417 9.5599 4.49329 9.29074 4.62 8.98C4.75312 8.67838 4.79282 8.34381 4.734 8.01941C4.67519 7.69502 4.52054 7.39568 4.29 7.16L4.23 7.1C4.04405 6.91425 3.89653 6.69368 3.79588 6.45088C3.69523 6.20808 3.64343 5.94783 3.64343 5.685C3.64343 5.42217 3.69523 5.16192 3.79588 4.91912C3.89653 4.67632 4.04405 4.45575 4.23 4.27C4.41575 4.08405 4.63632 3.93653 4.87912 3.83588C5.12192 3.73523 5.38217 3.68343 5.645 3.68343C5.90783 3.68343 6.16808 3.73523 6.41088 3.83588C6.65368 3.93653 6.87425 4.08405 7.06 4.27L7.12 4.33C7.35568 4.56054 7.65502 4.71519 7.97941 4.774C8.30381 4.83282 8.63838 4.79312 8.94 4.66H9C9.29577 4.53324 9.54802 4.32276 9.72569 4.05447C9.90337 3.78618 9.99872 3.47179 10 3.15V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65518 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    
    'export': (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    
    'upload': (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="17,8 12,3 7,8" stroke="currentColor" strokeWidth="2" strokeLineCap="round" strokeLinejoin="round"/>
        <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    
    'add': (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    
    'edit': (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18.5 2.50023C18.8978 2.10243 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.10243 21.5 2.50023C21.8978 2.89804 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.10243 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    
    'delete': (
      <svg viewBox="0 0 24 24" fill="none">
        <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  };

  const IconComponent = icons[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <span 
      className={iconClasses} 
      style={{ color }}
      {...props}
    >
      {IconComponent}
    </span>
  );
};

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge']),
  color: PropTypes.string,
  className: PropTypes.string,
};

export default Icon;