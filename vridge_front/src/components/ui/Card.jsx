import React from 'react'
import classNames from 'classnames'

export default function Card({
  children,
  variant = 'default',
  hoverable = false,
  className = '',
  onClick,
  ...props
}) {
  const cardClasses = classNames(
    'card',
    variant !== 'default' && `card-${variant}`,
    hoverable && 'card-hover',
    className
  )
  
  return (
    <div 
      className={cardClasses} 
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ 
  children, 
  title, 
  action,
  className = '' 
}) {
  return (
    <div className={classNames('card-header', className)}>
      {title ? <h3>{title}</h3> : children}
      {action && <div className="card-header-action">{action}</div>}
    </div>
  )
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={classNames('card-body', className)}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={classNames('card-footer', className)}>
      {children}
    </div>
  )
}