// Toast Notification System
// 사용법: showToast('success', '성공!', '프로젝트가 생성되었습니다.')

class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = new Map();
    this.createContainer();
  }

  createContainer() {
    if (typeof window === 'undefined') return;
    
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  }

  show(type, title, message, options = {}) {
    if (!this.container) return;

    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duration = options.duration || 4000;
    const closable = options.closable !== false;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.id = id;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      ${closable ? '<button class="toast-close" aria-label="닫기">×</button>' : ''}
    `;

    // Close button event
    if (closable) {
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => this.remove(id));
    }

    // Auto remove
    const timer = setTimeout(() => this.remove(id), duration);
    
    // Store toast info
    this.toasts.set(id, { element: toast, timer });

    // Add to container
    this.container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.style.animation = 'slideInRight 0.3s ease-out';
    });

    return id;
  }

  remove(id) {
    const toastInfo = this.toasts.get(id);
    if (!toastInfo) return;

    const { element, timer } = toastInfo;
    
    // Clear timer
    clearTimeout(timer);

    // Remove animation
    element.classList.add('toast-removing');
    
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.toasts.delete(id);
    }, 300);
  }

  clear() {
    this.toasts.forEach((_, id) => this.remove(id));
  }

  success(title, message, options) {
    return this.show('success', title, message, options);
  }

  error(title, message, options) {
    return this.show('error', title, message, options);
  }

  warning(title, message, options) {
    return this.show('warning', title, message, options);
  }

  info(title, message, options) {
    return this.show('info', title, message, options);
  }
}

// Global instance
const toastManager = typeof window !== 'undefined' ? new ToastManager() : null;

// Export functions
export const showToast = (type, title, message, options) => {
  if (!toastManager) return null;
  return toastManager.show(type, title, message, options);
};

export const showSuccess = (title, message, options) => {
  if (!toastManager) return null;
  return toastManager.success(title, message, options);
};

export const showError = (title, message, options) => {
  if (!toastManager) return null;
  return toastManager.error(title, message, options);
};

export const showWarning = (title, message, options) => {
  if (!toastManager) return null;
  return toastManager.warning(title, message, options);
};

export const showInfo = (title, message, options) => {
  if (!toastManager) return null;
  return toastManager.info(title, message, options);
};

export const removeToast = (id) => {
  if (!toastManager) return;
  toastManager.remove(id);
};

export const clearAllToasts = () => {
  if (!toastManager) return;
  toastManager.clear();
};

// React Hook 버전 (향후 사용)
export const useToast = () => {
  if (typeof window === 'undefined') {
    return {
      showToast: () => null,
      showSuccess: () => null,
      showError: () => null,
      showWarning: () => null,
      showInfo: () => null,
      removeToast: () => {},
      clearAllToasts: () => {}
    };
  }

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAllToasts
  };
};

// Legacy window.alert 대체 함수
export const alertReplacer = {
  success: (message) => showSuccess('성공', message),
  error: (message) => showError('오류', message),
  warning: (message) => showWarning('주의', message),
  info: (message) => showInfo('알림', message)
};

export default toastManager;