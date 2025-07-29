import React, { useState, forwardRef } from 'react';
import { UnifiedInput } from '../../components/unified/UnifiedInput';

import styles from './UnifiedInput.module.scss';

/**
 * 통합 입력 컴포넌트
 * 모든 입력 필드 변형을 하나의 컴포넌트로 통합
 */
const UnifiedInput = forwardRef(({
  // 기본 속성
  type = 'text',
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  disabled = false,
  readOnly = false,
  required = false,
  autoFocus = false,
  
  // 레이블 및 도움말
  label,
  helperText,
  
  // 유효성 검사
  error = false,
  errorMessage,
  success = false,
  successMessage,
  
  // 스타일 변형
  size = 'medium', // small, medium, large
  fullWidth = false,
  
  // 아이콘
  leftIcon,
  rightIcon,
  
  // 추가 속성
  className = '',
  style = {},
  inputProps = {},
  ...rest
}, ref) => {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value || !!defaultValue);

  // 포커스 핸들러
  const handleFocus = (e) => {
    setFocused(true);
    onFocus && onFocus(e);
  };

  // 블러 핸들러
  const handleBlur = (e) => {
    setFocused(false);
    onBlur && onBlur(e);
  };

  // 체인지 핸들러
  const handleChange = (e) => {
    setHasValue(!!e.target.value);
    onChange && onChange(e);
  };

  // 컨테이너 클래스
  const containerClasses = [
    styles.container,
    styles[`size-${size}`],
    fullWidth && styles.fullWidth,
    focused && styles.focused,
    disabled && styles.disabled,
    readOnly && styles.readOnly,
    error && styles.error,
    success && styles.success,
    hasValue && styles.hasValue,
    className
  ].filter(Boolean).join(' ');

  // 입력 필드 클래스
  const inputClasses = [
    styles.input,
    leftIcon && styles.hasLeftIcon,
    rightIcon && styles.hasRightIcon
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} style={style} {...rest}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.inputWrapper}>
        {leftIcon && (
          <span className={styles.leftIcon}>{leftIcon}</span>
        )}
        
        <UnifiedInput
          ref={ref}
          type={type}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          autoFocus={autoFocus}
          className={inputClasses}
          {...inputProps}
        / aria-label="Input field" />
        
        {rightIcon && (
          <span className={styles.rightIcon}>{rightIcon}</span>
        )}
      </div>
      
      {(helperText || errorMessage || successMessage) && (
        <div className={styles.message}>
          {error && errorMessage ? errorMessage : 
           success && successMessage ? successMessage : 
           helperText}
        </div>
      )}
    </div>
  );
});

UnifiedInput.displayName = 'UnifiedInput';

export default UnifiedInput;