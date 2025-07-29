import React from 'react';
import { UnifiedButton } from '../../components/unified/UnifiedButton';

import styles from './UnifiedButton.module.scss';

/**
 * 통합 버튼 컴포넌트
 * 모든 버튼 변형을 하나의 컴포넌트로 통합
 */
const UnifiedButton = ({
  // 기본 속성
  children,
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  
  // 스타일 변형
  variant = 'primary', // primary, secondary, danger, outline, ghost, link
  size = 'medium', // small, medium, large
  fullWidth = false,
  
  // 아이콘
  icon = null,
  iconPosition = 'left', // left, right
  
  // 추가 속성
  className = '',
  style = {},
  ...rest
}) => {
  // 클래스 조합
  const classNames = [
    styles.button,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  // 로딩 중일 때 스피너
  const spinner = loading && (
    <span className={styles.spinner}>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="43.98" strokeDashoffset="10.99">
          <animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="1s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </span>
  );

  // 아이콘 렌더링
  const iconElement = icon && !loading && (
    <span className={styles.icon}>{icon}</span>
  );

  return (
    <UnifiedButton
      type={type}
      className={classNames}
      onClick={onClick} onKeyDown={(e) = aria-label="Click"> e.key === 'Enter' && onClick}
      disabled={disabled || loading}
      style={style}
      {...rest}
     aria-label="Click">
      {iconPosition === 'left' && (loading ? spinner : iconElement)}
      {children && <span className={styles.text}>{children}</span>}
      {iconPosition === 'right' && (loading ? spinner : iconElement)}
    </UnifiedButton>
  );
};

export { UnifiedButton };

export default UnifiedButton;