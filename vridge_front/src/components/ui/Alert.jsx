import React, { useState, useEffect } from 'react';
import classNames from 'classnames';

export default function Alert({
  type = 'info',
  title,
  message,
  dismissible = false,
  autoClose = 0,
  onClose,
  className = '',
  icon = true
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoClose);

      return () => clearTimeout(timer);
    }
  }, [autoClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!isVisible) return null;

  const icons = {
    success:
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>,

    danger:
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>,

    warning:
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>,

    info:
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>

  };

  return (
    <div className={classNames('alert', `alert-${type}`, dismissible && 'alert-dismissible', className)}>
      <div className="alert-content">
        {icon &&
        <div className="alert-icon">
            {icons[type]}
          </div>
        }
        <div className="alert-message">
          {title && <div className="alert-title">{title}</div>}
          {message}
        </div>
      </div>
      {dismissible &&
      <UnifiedButton variant="secondary" onClick={handleClose} onKeyDown={(e) => e.key === 'Enter' && handleClose} icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-label="Click">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>} />
      }
    </div>);

}

// Toast Notification Component
export function Toast({
  type = 'info',
  message,
  position = 'top-right',
  duration = 3000,
  onClose
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const positionClasses = {
    'top-left': 'toast-top-left',
    'top-right': 'toast-top-right',
    'bottom-left': 'toast-bottom-left',
    'bottom-right': 'toast-bottom-right',
    'top-center': 'toast-top-center',
    'bottom-center': 'toast-bottom-center'
  };

  return createPortal(
    <div className={classNames('toast', `toast-${type}`, positionClasses[position])}>
      <div className="toast-content">
        {message}
      </div>
    </div>,
    document.body
  );
}
import { Button } from '../unified/Button';