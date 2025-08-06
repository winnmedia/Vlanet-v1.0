// VideoPlanet 디자인 시스템 - Button 컴포넌트
// 영상 제작 워크플로우에 특화된 버튼 시스템

import React from 'react';
import PropTypes from 'prop-types';
import styles from './Button.module.scss';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const buttonClasses = [
    styles.button,
    styles[`button--${variant}`],
    styles[`button--${size}`],
    disabled && styles['button--disabled'],
    loading && styles['button--loading'],
    fullWidth && styles['button--fullWidth'],
    icon && styles['button--withIcon'],
    className,
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  const renderIcon = () => {
    if (!icon) return null;
    return (
      <span className={`${styles.buttonIcon} ${styles[`buttonIcon--${iconPosition}`]}`}>
        {icon}
      </span>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <span className={styles.loadingSpinner} />
          <span className={styles.buttonText}>
            {typeof loading === 'string' ? loading : '로딩중...'}
          </span>
        </>
      );
    }

    return (
      <>
        {iconPosition === 'left' && renderIcon()}
        <span className={styles.buttonText}>{children}</span>
        {iconPosition === 'right' && renderIcon()}
      </>
    );
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'danger',
    'success',
    'warning',
    'info',
    'outline',
    'ghost',
    'link',
    'ai-generate',
    'ai-analyze',
    'phase-planning',
    'phase-production',
    'phase-review',
  ]),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  loading: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  fullWidth: PropTypes.bool,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
};

export default Button;