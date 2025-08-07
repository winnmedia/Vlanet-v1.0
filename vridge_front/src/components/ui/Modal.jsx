import React, { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import classNames from 'classnames'
import { Modal } from 'antd'

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEsc = true,
  className = '',
}) {
  // ESC 키 처리
  const handleEsc = useCallback((e) => {
    if (closeOnEsc && e.key === 'Escape') {
      onClose()
    }
  }, [closeOnEsc, onClose])
  
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEsc])
  
  if (!isOpen) return null
  
  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose()
    }
  }
  
  const modalSizeClass = {
    sm: 'modal-sm',
    md: '',
    lg: 'modal-lg',
    xl: 'modal-xl',
    full: 'modal-full'
  }[size]
  
  return createPortal(
    <div className="modal" onClick={handleBackdropClick}>
      <div className="modal-backdrop" />
      <div className={classNames('modal-content', modalSizeClass, className)}>
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            <button 
              className="close-btn"
              onClick={onClose}
              aria-label="닫기"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
