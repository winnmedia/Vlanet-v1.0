import React from 'react'
import classNames from 'classnames'

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
  const buttonClasses = classNames(
    'btn',
    `btn-${variant}`,
    size !== 'md' && `btn-${size}`,
    loading && 'btn-loading',
    fullWidth && 'w-full',
    className
  )
  
  const content = (
    <>
      {icon && iconPosition === 'left' && <span className="btn-icon-left">{icon}</span>}
      {!loading && children}
      {icon && iconPosition === 'right' && <span className="btn-icon-right">{icon}</span>}
    </>
  )
  
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  )
}

// Icon Button Variant
export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  tooltip,
  ...props
}) {
  return (
    <button
      className={classNames('btn', 'btn-icon', `btn-${variant}`, size !== 'md' && `btn-${size}`)}
      title={tooltip}
      {...props}
    >
      {icon}
    </button>
  )
}

// Button Group Component
export function ButtonGroup({ children, className = '' }) {
  return (
    <div className={classNames('btn-group', className)}>
      {children}
    </div>
  )
}