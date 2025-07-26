import React, { useId, useState, useRef, useEffect } from 'react'
// import 제거 - JavaScript 변환
import styles from './MinimalInput.module.scss'

// MinimalInput 컴포넌트
export const MinimalInput = React.memo(({
  type = 'text',
  name,
  value,
  defaultValue,
  placeholder,
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  readOnly = false,
  autoFocus = false,
  autoComplete,
  maxLength,
  min,
  max,
  step,
  pattern,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  icon,
  iconPosition = 'left',
  showCharacterCount = false,
  size = 'medium',
  className = '',
  ...props
}) => {
  const id = useId()
  const inputId = props.id || id
  const [charCount, setCharCount] = useState(value?.length || defaultValue?.length || 0)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])
  
  const handleChange = (e) => {
    if (showCharacterCount) {
      setCharCount(e.target.value.length)
    }
    if (onChange) {
      onChange(e)
    }
  }
  
  const handleFocus = (e) => {
    setIsFocused(true)
    if (onFocus) {
      onFocus(e)
    }
  }
  
  const handleBlur = (e) => {
    setIsFocused(false)
    if (onBlur) {
      onBlur(e)
    }
  }
  
  const wrapperClasses = [
    styles.inputWrapper,
    styles[`size-${size}`],
    error && styles.error,
    disabled && styles.disabled,
    isFocused && styles.focused,
    className
  ].filter(Boolean).join(' ')
  
  const inputClasses = [
    styles.input,
    icon && styles.withIcon,
    icon && styles[`iconPosition-${iconPosition}`]
  ].filter(Boolean).join(' ')
  
  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-label="필수">*</span>}
        </label>
      )}
      
      <div className={styles.inputContainer}>
        {icon && (
          <span className={`${styles.icon} ${styles[`icon-${iconPosition}`]}`}>
            {icon}
          </span>
        )}
        
        <input
          ref={inputRef}
          id={inputId}
          type={type}
          name={name}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete={autoComplete}
          maxLength={maxLength}
          min={min}
          max={max}
          step={step}
          pattern={pattern}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={onKeyDown}
          className={inputClasses}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
      </div>
      
      {(error || helperText || (showCharacterCount && maxLength)) && (
        <div className={styles.footer}>
          {error && (
            <span id={`${inputId}-error`} className={styles.error} role="alert">
              {error}
            </span>
          )}
          {!error && helperText && (
            <span id={`${inputId}-helper`} className={styles.helperText}>
              {helperText}
            </span>
          )}
          {showCharacterCount && maxLength && (
            <span className={styles.charCount}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  )
})

MinimalInput.displayName = 'MinimalInput'

// MinimalTextarea 컴포넌트
export const MinimalTextarea = React.memo(({
  name,
  value,
  defaultValue,
  placeholder,
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  readOnly = false,
  autoFocus = false,
  maxLength,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  rows = 4,
  cols,
  resize = 'vertical',
  showCharacterCount = false,
  size = 'medium',
  className = '',
  ...props
}) => {
  const id = useId()
  const textareaId = props.id || id
  const [charCount, setCharCount] = useState(value?.length || defaultValue?.length || 0)
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])
  
  const handleChange = (e) => {
    if (showCharacterCount) {
      setCharCount(e.target.value.length)
    }
    if (onChange) {
      onChange(e)
    }
  }
  
  const handleFocus = (e) => {
    setIsFocused(true)
    if (onFocus) {
      onFocus(e)
    }
  }
  
  const handleBlur = (e) => {
    setIsFocused(false)
    if (onBlur) {
      onBlur(e)
    }
  }
  
  const wrapperClasses = [
    styles.textareaWrapper,
    styles[`size-${size}`],
    error && styles.error,
    disabled && styles.disabled,
    isFocused && styles.focused,
    className
  ].filter(Boolean).join(' ')
  
  const textareaClasses = [
    styles.textarea,
    styles[`resize-${resize}`]
  ].filter(Boolean).join(' ')
  
  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={textareaId} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-label="필수">*</span>}
        </label>
      )}
      
      <textarea
        ref={textareaRef}
        id={textareaId}
        name={name}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={onKeyDown}
        rows={rows}
        cols={cols}
        className={textareaClasses}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
        }
        {...props}
      />
      
      {(error || helperText || (showCharacterCount && maxLength)) && (
        <div className={styles.footer}>
          {error && (
            <span id={`${textareaId}-error`} className={styles.error} role="alert">
              {error}
            </span>
          )}
          {!error && helperText && (
            <span id={`${textareaId}-helper`} className={styles.helperText}>
              {helperText}
            </span>
          )}
          {showCharacterCount && maxLength && (
            <span className={styles.charCount}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  )
})

MinimalTextarea.displayName = 'MinimalTextarea'