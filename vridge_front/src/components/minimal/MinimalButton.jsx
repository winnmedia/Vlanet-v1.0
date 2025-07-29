import React from 'react';
// import 제거 - JavaScript 변환
import styles from './MinimalButton.module.scss';

// MinimalButton 컴포넌트
import { UnifiedButton } from "../unified/Button";
export const MinimalButton = React.memo(({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  ariaLabel,
  icon,
  iconPosition = 'left',
  tooltip,
  tooltipPosition = 'top',
  active = false,
  href,
  target,
  rel,
  className = '',
  ...props
}) => {
  const buttonClasses = [styles.button, styles[`variant-${variant}`], styles[`size-${size}`], fullWidth && styles.fullWidth, disabled && styles.disabled, loading && styles.loading, active && styles.active, className].filter(Boolean).join(' ');
  const handleClick = e => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };
  const content = <>
      {loading && <span className={styles.loadingSpinner} aria-hidden="true" />}
      {icon && iconPosition === 'left' && !loading && <span className={styles.icon}>{icon}</span>}
      <span className={styles.text}>{children}</span>
      {icon && iconPosition === 'right' && !loading && <span className={styles.icon}>{icon}</span>}
    </>;
  if (href && !disabled) {
    return <a href={href} target={target} rel={rel || (target === '_blank' ? 'noopener noreferrer' : undefined)} className={buttonClasses} aria-label={ariaLabel} title={tooltip} data-tooltip-position={tooltipPosition} {...props}>
        {content}
      </a>;
  }
  return <UnifiedButton type={type} className={buttonClasses} disabled={disabled || loading} onClick={handleClick} aria-label={ariaLabel} aria-busy={loading} title={tooltip} data-tooltip-position={tooltipPosition} {...props}>
      {content}
    </UnifiedButton>;
});
MinimalButton.displayName = 'MinimalButton';

// IconButton 컴포넌트
export const IconButton = React.memo(({
  icon,
  ariaLabel,
  size = 'medium',
  ...props
}) => {
  
  return <MinimalButton {...props} size={size} ariaLabel={ariaLabel} className={`${styles.iconButton} ${props.className || ''}`}>
      {icon}
    </MinimalButton>;
});
IconButton.displayName = 'IconButton';

// ButtonGroup 컴포넌트
export const ButtonGroup = React.memo(({
  children,
  spacing = 'small',
  direction = 'horizontal',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const groupClasses = [styles.buttonGroup, styles[`spacing-${spacing}`], styles[`direction-${direction}`], fullWidth && styles.fullWidth, className].filter(Boolean).join(' ');
  return <div className={groupClasses} role="group" {...props}>
      {children}
    </div>;
});
ButtonGroup.displayName = 'ButtonGroup';