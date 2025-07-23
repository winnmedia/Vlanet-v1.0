import React from 'react'
import classNames from 'classnames'

export function Spinner({ 
  size = 'md',
  color = 'primary',
  className = '' 
}) {
  const spinnerClasses = classNames(
    'spinner',
    size !== 'md' && `spinner-${size}`,
    color !== 'primary' && `spinner-${color}`,
    className
  )
  
  return <div className={spinnerClasses} />
}

export function LoadingOverlay({ 
  active = false,
  text = '로딩 중...',
  spinner = true,
  fullScreen = false,
  blur = true,
  className = ''
}) {
  if (!active) return null
  
  const overlayClasses = classNames(
    'loading-overlay',
    fullScreen && 'loading-overlay-fullscreen',
    blur && 'loading-overlay-blur',
    className
  )
  
  return (
    <div className={overlayClasses}>
      <div className="loading-content">
        {spinner && <Spinner size="lg" />}
        {text && <div className="loading-text">{text}</div>}
      </div>
    </div>
  )
}

export function Skeleton({ 
  variant = 'text',
  width,
  height,
  count = 1,
  className = '' 
}) {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={classNames('skeleton', `skeleton-${variant}`, className)}
      style={{
        width: width,
        height: height
      }}
    />
  ))
  
  return count > 1 ? <div className="skeleton-wrapper">{skeletons}</div> : skeletons[0]
}

export function SkeletonCard({ 
  showAvatar = true,
  lines = 3,
  className = '' 
}) {
  return (
    <div className={classNames('skeleton-card', className)}>
      {showAvatar && (
        <div className="skeleton-header">
          <Skeleton variant="avatar" />
          <div className="skeleton-header-text">
            <Skeleton variant="title" width="60%" />
            <Skeleton width="40%" />
          </div>
        </div>
      )}
      <div className="skeleton-body">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton 
            key={i} 
            width={i === lines - 1 ? '80%' : '100%'} 
          />
        ))}
      </div>
    </div>
  )
}

export function LoadingDots({ 
  size = 'md',
  color = 'primary',
  className = '' 
}) {
  return (
    <div className={classNames('loading-dots', `loading-dots-${size}`, className)}>
      <span className="dot" style={{ animationDelay: '0s' }} />
      <span className="dot" style={{ animationDelay: '0.2s' }} />
      <span className="dot" style={{ animationDelay: '0.4s' }} />
    </div>
  )
}