import React from 'react'
import classNames from 'classnames'

export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  pill = true,
  dot = false,
  className = '',
  ...props
}) {
  const badgeClasses = classNames(
    'badge',
    `badge-${variant}`,
    size === 'lg' && 'badge-lg',
    !pill && 'badge-square',
    dot && 'badge-dot',
    className
  )
  
  return (
    <span className={badgeClasses} {...props}>
      {dot && <span className="badge-dot-indicator" />}
      {children}
    </span>
  )
}

// Badge with count
export function CountBadge({ 
  count, 
  max = 99,
  showZero = false,
  ...props 
}) {
  if (count === 0 && !showZero) return null
  
  const displayCount = count > max ? `${max}+` : count
  
  return (
    <Badge {...props}>
      {displayCount}
    </Badge>
  )
}

// Status Badge
export function StatusBadge({ 
  status,
  customStatuses = {},
  ...props 
}) {
  const defaultStatuses = {
    active: { variant: 'success', label: '활성' },
    inactive: { variant: 'light', label: '비활성' },
    pending: { variant: 'warning', label: '대기중' },
    completed: { variant: 'success', label: '완료' },
    failed: { variant: 'danger', label: '실패' },
    processing: { variant: 'info', label: '처리중' }
  }
  
  const statuses = { ...defaultStatuses, ...customStatuses }
  const statusConfig = statuses[status] || { variant: 'light', label: status }
  
  return (
    <Badge variant={statusConfig.variant} {...props}>
      {statusConfig.label}
    </Badge>
  )
}