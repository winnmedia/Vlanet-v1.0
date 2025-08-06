import React from 'react'
import styles from './LoadingSpinner.module.scss'
import { message } from 'antd'

/**
 * 로딩 스피너 컴포넌트
 * @param {string} size - 스피너 크기 (small, medium, large)
 * @param {string} color - 스피너 색상 (primary, white, gray)
 * @param {string} message - 로딩 메시지
 * @param {boolean} fullScreen - 전체화면 표시 여부
 * @param {boolean} overlay - 오버레이 표시 여부
 * @param {string} className - 추가 클래스명
 */
const LoadingSpinner = ({
  size = 'medium',
  color = 'primary',
  message = '',
  fullScreen = false,
  overlay = false,
  className = ''
}) => {
  const spinnerContent = (
    <div className={`${styles.spinnerContainer} ${className}`}>
      <div className={`${styles.spinner} ${styles[size]} ${styles[color]}`}>
        <svg viewBox="0 0 50 50" className={styles.circular}>
          <circle
            className={styles.path}
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="3"
          />
        </svg>
      </div>
      {message && (
        <p className={`${styles.message} ${styles[color]}`}>{message}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className={styles.fullScreen}>
        {spinnerContent}
      </div>
    )
  }

  if (overlay) {
    return (
      <div className={styles.overlay}>
        {spinnerContent}
      </div>
    )
  }

  return spinnerContent
}

// 특정 용도의 로딩 스피너들
export const PageLoadingSpinner = (props) => (
  <LoadingSpinner fullScreen message="페이지를 불러오는 중..." {...props} />
)

export const DataLoadingSpinner = (props) => (
  <LoadingSpinner message="데이터를 불러오는 중..." {...props} />
)

export const SubmitLoadingSpinner = (props) => (
  <LoadingSpinner overlay message="전송 중..." {...props} />
)

export default LoadingSpinner