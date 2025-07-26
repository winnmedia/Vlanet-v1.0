import React from 'react'
// import 제거 - JavaScript 변환
import styles from './MinimalCard.module.scss'

// MinimalCard 컴포넌트
export const MinimalCard = React.memo(({ 
  children, 
  hover = false, 
  onClick, 
  padding = 'normal',
  className = '', 
  role = 'article', 
  ariaLabel, 
  tabIndex, 
  onKeyDown,
  as: Component = 'div',
  ...props
}) => {
  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
    if (onKeyDown) {
      onKeyDown(e)
    }
  }
  
  const cardClasses = [
    styles.card,
    hover && styles.hover,
    onClick && styles.clickable,
    styles[`padding-${padding}`],
    className
  ].filter(Boolean).join(' ')
  
  return (
    <Component
      className={cardClasses}
      onClick={onClick}
      role={role}
      aria-label={ariaLabel}
      tabIndex={onClick ? (tabIndex ?? 0) : tabIndex}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </Component>
  )
})

MinimalCard.displayName = 'MinimalCard'

// CardHeader 컴포넌트
export const CardHeader = React.memo(({ 
  title, 
  subtitle, 
  action, 
  icon,
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`${styles.cardHeader} ${className}`} {...props}>
      {icon && <div className={styles.headerIcon}>{icon}</div>}
      
      <div className={styles.headerContent}>
        {title && <h3 className={styles.headerTitle}>{title}</h3>}
        {subtitle && <p className={styles.headerSubtitle}>{subtitle}</p>}
        {children}
      </div>
      
      {action && <div className={styles.headerAction}>{action}</div>}
    </div>
  )
})

CardHeader.displayName = 'CardHeader'

// CardContent 컴포넌트
export const CardContent = React.memo(({ 
  children, 
  className = '',
  padding = 'normal',
  ...props
}) => {
  const contentClasses = [
    styles.cardContent,
    styles[`contentPadding-${padding}`],
    className
  ].filter(Boolean).join(' ')
  
  return (
    <div className={contentClasses} {...props}>
      {children}
    </div>
  )
})

CardContent.displayName = 'CardContent'

// CardFooter 컴포넌트
export const CardFooter = React.memo(({ 
  children, 
  className = '',
  align = 'end',
  divider = false,
  ...props
}) => {
  const footerClasses = [
    styles.cardFooter,
    styles[`align-${align}`],
    divider && styles.withDivider,
    className
  ].filter(Boolean).join(' ')
  
  return (
    <div className={footerClasses} {...props}>
      {children}
    </div>
  )
})

CardFooter.displayName = 'CardFooter'

// CardSkeleton 로딩 컴포넌트
export const CardSkeleton = ({ 
  lines = 3, 
  className = '' 
}) => {
  return (
    <div className={`${styles.card} ${styles.skeleton} ${className}`}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonSubtitle} />
      </div>
      <div className={styles.skeletonContent}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={styles.skeletonLine} />
        ))}
      </div>
    </div>
  )
}

CardSkeleton.displayName = 'CardSkeleton'