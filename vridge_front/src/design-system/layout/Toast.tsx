import React, { useEffect } from 'react'
import classNames from 'classnames'
import styles from './Layout.module.scss'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
  className?: string
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 3000,
  onClose,
  className 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'info':
      default:
        return 'ℹ'
    }
  }

  return (
    <div className={classNames(
      styles.toastNotification,
      styles[type],
      className
    )}>
      <span className={styles.toastIcon}>{getIcon()}</span>
      <span className={styles.toastMessage}>{message}</span>
      <button className={styles.toastClose} onClick={onClose}>
        ✕
      </button>
    </div>
  )
}