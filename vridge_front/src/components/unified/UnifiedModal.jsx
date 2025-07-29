import React, { useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { useFocusTrap } from '../../utils/accessibility';
import { UnifiedButton } from './UnifiedButton';
import styles from './UnifiedModal.module.scss';

/**
 * 통합 Modal 컴포넌트
 * - 일관된 모달 스타일 제공
 * - 접근성 완벽 지원
 * - 다양한 크기와 위치 옵션
 */
const UnifiedModal = ({
  visible = false,
  title,
  footer,
  closable = true,
  maskClosable = true,
  keyboard = true,
  centered = false,
  width = 'medium', // small(400px), medium(600px), large(800px), full
  loading = false,
  confirmLoading = false,
  okText = '확인',
  cancelText = '취소',
  okButtonProps = {},
  cancelButtonProps = {},
  onOk,
  onCancel,
  afterClose,
  className,
  bodyClassName,
  maskClassName,
  children,
  zIndex = 1000,
  destroyOnClose = false,
  ...props
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // 포커스 트랩 사용
  useFocusTrap(modalRef, visible);

  // ESC 키 처리
  useEffect(() => {
    if (!keyboard || !visible) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onCancel) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboard, visible, onCancel]);

  // 모달 열릴 때 포커스 관리
  useEffect(() => {
    if (visible) {
      previousActiveElement.current = document.activeElement;
      // 스크롤 방지
      document.body.style.overflow = 'hidden';
    } else {
      // 스크롤 복원
      document.body.style.overflow = '';
      // 이전 포커스 복원
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
        previousActiveElement.current = null;
      }
      // afterClose 콜백
      if (afterClose) {
        setTimeout(afterClose, 300); // 애니메이션 완료 후
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [visible, afterClose]);

  // 마스크 클릭 처리
  const handleMaskClick = useCallback((e) => {
    if (e.target === e.currentTarget && maskClosable && onCancel) {
      onCancel();
    }
  }, [maskClosable, onCancel]);

  // 모달이 보이지 않고 destroyOnClose가 true면 렌더링하지 않음
  if (!visible && destroyOnClose) {
    return null;
  }

  const modalClasses = classNames(
    styles.modal,
    styles[`width-${width}`],
    {
      [styles.centered]: centered,
      [styles.visible]: visible,
      [styles.loading]: loading
    },
    className
  );

  const maskClasses = classNames(
    styles.mask,
    {
      [styles.visible]: visible
    },
    maskClassName
  );

  const bodyClasses = classNames(
    styles.body,
    bodyClassName
  );

  const modalContent = (
    <div 
      className={maskClasses}
      style={{ zIndex }}
      onClick={handleMaskClick} onKeyDown={(e) => e.key === 'Enter' && handleMaskClick}
    >
      <div 
        className={modalClasses}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        {...props}
      >
        {/* 로딩 오버레이 */}
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} aria-label="로딩 중" />
          </div>
        )}

        {/* 헤더 */}
        {(title || closable) && (
          <div className={styles.header}>
            {title && (
              <h2 id="modal-title" className={styles.title}>
                {title}
              </h2>
            )}
            {closable && (
              <UnifiedButton
                className={styles.closeButton}
                onClick={onCancel}
                onKeyDown={(e) => e.key === 'Enter' && onCancel}
                aria-label="닫기"
                disabled={loading || confirmLoading}
                type="button"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M18 6L6 18M6 6L18 18" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                  />
                </svg>
              </UnifiedButton>
            )}
          </div>
        )}

        {/* 바디 */}
        <div className={bodyClasses}>
          {children}
        </div>

        {/* 푸터 */}
        {footer !== null && (
          <div className={styles.footer}>
            {footer || (
              <>
                {onCancel && (
                  <UnifiedButton
                    className={classNames(styles.button, styles.cancelButton)}
                    onClick={onCancel}
                    onKeyDown={(e) => e.key === 'Enter' && onCancel}
                    disabled={loading || confirmLoading}
                    aria-label={cancelText}
                    type="button"
                    {...cancelButtonProps}
                  >
                    {cancelText}
                  </UnifiedButton>
                )}
                {onOk && (
                  <UnifiedButton
                    className={classNames(styles.button, styles.okButton, {
                      [styles.loading]: confirmLoading
                    })}
                    onClick={onOk}
                    onKeyDown={(e) => e.key === 'Enter' && onOk}
                    disabled={loading || confirmLoading}
                    aria-label={okText}
                    type="button"
                    {...okButtonProps}
                  >
                    {confirmLoading && (
                      <span className={styles.buttonSpinner} />
                    )}
                    {okText}
                  </UnifiedButton>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // 포털을 사용하여 body에 직접 렌더링
  return ReactDOM.createPortal(
    modalContent,
    document.body
  );
};

// 확인 모달 프리셋
export const ConfirmModal = ({
  title = '확인',
  content,
  type = 'confirm', // confirm, info, success, warning, error
  onConfirm,
  onCancel,
  confirmText = '확인',
  cancelText = '취소',
  ...props
}) => {
  const iconMap = {
    confirm: '❓',
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  return (
    <UnifiedModal
      title={title}
      width="small"
      centered
      onOk={onConfirm}
      onCancel={onCancel}
      okText={confirmText}
      cancelText={cancelText}
      {...props}
    >
      <div className={styles.confirmContent}>
        <div className={`${styles.confirmIcon} ${styles[type]}`}>
          {iconMap[type]}
        </div>
        <div className={styles.confirmMessage}>
          {content}
        </div>
      </div>
    </UnifiedModal>
  );
};

// 정보 모달 프리셋
export const InfoModal = ({
  title,
  content,
  onClose,
  ...props
}) => {
  return (
    <UnifiedModal
      title={title}
      width="small"
      centered
      footer={
        <UnifiedButton
          className={classNames(styles.button, styles.okButton)}
          onClick={onClose} 
          onKeyDown={(e) => e.key === 'Enter' && onClose}
          type="button" 
          aria-label="확인">
          확인
        </UnifiedButton>
      }
      onCancel={onClose}
      {...props}
    >
      <div className={styles.infoContent}>
        {content}
      </div>
    </UnifiedModal>
  );
};

// 폼 모달 프리셋
export const FormModal = ({
  title,
  form,
  onSubmit,
  onCancel,
  submitText = '저장',
  cancelText = '취소',
  loading = false,
  ...props
}) => {
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (onSubmit) {
        await onSubmit(values);
      }
    } catch (error) {
      // 검증 실패
      
    }
  };

  return (
    <UnifiedModal
      title={title}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText={submitText}
      cancelText={cancelText}
      confirmLoading={loading}
      {...props}
    >
      {form}
    </UnifiedModal>
  );
};

// 이미지 미리보기 모달 프리셋
export const ImagePreviewModal = ({
  images = [],
  currentIndex = 0,
  onClose,
  onPrev,
  onNext,
  ...props
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft' && onPrev) {
      onPrev();
    } else if (e.key === 'ArrowRight' && onNext) {
      onNext();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <UnifiedModal
      visible
      width="full"
      centered
      footer={null}
      onCancel={onClose}
      className={styles.imagePreviewModal}
      maskClassName={styles.imagePreviewMask}
      {...props}
     role="dialog" aria-modal="true">
      <div className={styles.imagePreviewContent}>
        {onPrev && currentIndex > 0 && (
          <UnifiedButton
            className={styles.prevButton}
            onClick={onPrev}
            onKeyDown={(e) => e.key === 'Enter' && onPrev()}
            type="button"
            aria-label="이전 이미지"
          >
            ‹
          </UnifiedButton>
        )}
        
        <img 
          src={images[currentIndex]?.url || images[currentIndex]}
          alt={images[currentIndex]?.alt || `이미지 ${currentIndex + 1}`}
          className={styles.previewImage}
        / loading="lazy">
        
        {onNext && currentIndex < images.length - 1 && (
          <UnifiedButton
            className={styles.nextButton}
            onClick={onNext} onKeyDown={(e) = type="button" aria-label="Click"> e.key === 'Enter' && onNext}
            aria-label="다음 이미지"
          >
            ›
          </UnifiedButton>
        )}
        
        <div className={styles.imageCounter}>
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </UnifiedModal>
  );
};

export default UnifiedModal;