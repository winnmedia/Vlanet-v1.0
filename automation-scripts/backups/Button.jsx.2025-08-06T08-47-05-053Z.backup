import React from 'react'
import styles from './Button.module.scss'
import { Button } from 'antd'

/**
 * 공통 버튼 컴포넌트
 * @param {string} variant - 버튼 스타일 변형 (primary, secondary, danger, minimal, text)
 * @param {string} size - 버튼 크기 (small, medium, large)
 * @param {boolean} fullWidth - 전체 너비 사용 여부
 * @param {boolean} loading - 로딩 상태
 * @param {boolean} disabled - 비활성화 상태
 * @param {React.ReactNode} icon - 아이콘 요소
 * @param {string} iconPosition - 아이콘 위치 (left, right)
 * @param {React.ReactNode} children - 버튼 내용
 * @param {string} className - 추가 클래스명
 * @param {Object} props - 기타 props
 */
const Button = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  ...props
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className={styles.loadingSpinner}>
          <svg 
            className={styles.spinner} 
            viewBox="0 0 24 24" 
            fill="none"
            width="16"
            height="16"
          >
            <circle 
              className={styles.spinnerCircle}
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="2"
            />
          </svg>
          {children && <span className={styles.loadingText}>{children}</span>}
        </div>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className={styles.icon}>{icon}</span>
          )}
          {children && <span className={styles.text}>{children}</span>}
          {icon && iconPosition === 'right' && (
            <span className={styles.icon}>{icon}</span>
          )}
        </>
      )}
    </button>
  )
}

// 버튼 변형 컴포넌트들
export const PrimaryButton = (props) => <Button variant="primary" {...props} />
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />
export const DangerButton = (props) => <Button variant="danger" {...props} />
export const MinimalButton = (props) => <Button variant="minimal" {...props} />
export const TextButton = (props) => <Button variant="text" {...props} />

export default Button