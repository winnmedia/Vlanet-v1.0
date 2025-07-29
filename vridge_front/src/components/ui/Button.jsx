import React from 'react';
import classNames from 'classnames';
import { UnifiedButton } from "../unified/Button";
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  onClick,
  ...props
}) {
  const buttonClasses = classNames('btn', `btn-${variant}`, size !== 'md' && `btn-${size}`, loading && 'btn-loading', fullWidth && 'w-full', className);
  const content = <>
      {icon && iconPosition === 'left' && <span className="btn-icon-left">{icon}</span>}
      {!loading && children}
      {icon && iconPosition === 'right' && <span className="btn-icon-right">{icon}</span>}
    </>;
  return <UnifiedButton type={type} className={buttonClasses} disabled={disabled || loading} onClick={onClick} onKeyDown={(e) => e.key === 'Enter' && onClick} {...props} aria-label="Click">
      {content}
    </UnifiedButton>;
}

// Icon Button Variant
export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  tooltip,
  ...props
}) {
  return <UnifiedButton className={classNames('btn', 'btn-icon', `btn-${variant}`, size !== 'md' && `btn-${size}`)} title={tooltip} {...props} aria-label="Click">
      {icon}
    </UnifiedButton>;
}

// Button Group Component
export function ButtonGroup({
  children,
  className = ''
}) {
  return <div className={classNames('btn-group', className)}>
      {children}
    </div>;
}