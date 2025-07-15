import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import './CustomAlert.scss'

const CustomAlert = ({ message, type = 'info', onClose, duration = 3000, actions }) => {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (duration && !actions) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, actions])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="alert-icon" viewBox="0 0 24 24" width="24" height="24">
            <circle cx="12" cy="12" r="10" fill="#28a745" />
            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      case 'error':
        return (
          <svg className="alert-icon" viewBox="0 0 24 24" width="24" height="24">
            <circle cx="12" cy="12" r="10" fill="#dc3545" />
            <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="alert-icon" viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 2L2 20h20L12 2z" fill="#ffc107" />
            <path d="M12 9v4M12 17h.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      default:
        return (
          <svg className="alert-icon" viewBox="0 0 24 24" width="24" height="24">
            <circle cx="12" cy="12" r="10" fill="#1631F8" />
            <path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
    }
  }

  return ReactDOM.createPortal(
    <div className={`custom-alert-overlay ${isClosing ? 'closing' : ''}`} onClick={!actions ? handleClose : undefined}>
      <div className={`custom-alert ${type} ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="alert-content">
          {getIcon()}
          <div className="alert-message">{message}</div>
          {!actions && (
            <button className="alert-close" onClick={handleClose}>
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        {actions && (
          <div className="alert-actions">
            {actions.map((action, index) => (
              <button
                key={index}
                className={`alert-button ${action.primary ? 'primary' : 'secondary'}`}
                onClick={() => {
                  action.onClick()
                  handleClose()
                }}
              >
                {action.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// 전역 함수로 사용할 수 있도록 export
export const showAlert = (message, type = 'info', duration = 3000, actions) => {
  const div = document.createElement('div')
  document.body.appendChild(div)

  const cleanup = () => {
    try {
      ReactDOM.unmountComponentAtNode(div)
      if (div.parentNode) {
        document.body.removeChild(div)
      }
    } catch (error) {
      // DOM 에러 방지 - 이미 제거된 경우 무시
      console.warn('CustomAlert cleanup error:', error)
    }
  }

  ReactDOM.render(
    <CustomAlert
      message={message}
      type={type}
      duration={duration}
      actions={actions}
      onClose={cleanup}
    />,
    div
  )
}

// window.alert를 대체하는 함수
export const customAlert = (message) => {
  showAlert(message, 'info', 0, [
    { text: '확인', primary: true, onClick: () => {} }
  ])
}

// window.confirm을 대체하는 함수
export const customConfirm = (message) => {
  return new Promise((resolve) => {
    showAlert(message, 'warning', 0, [
      { text: '취소', onClick: () => resolve(false) },
      { text: '확인', primary: true, onClick: () => resolve(true) }
    ])
  })
}

export default CustomAlert