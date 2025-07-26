import React from 'react'
import PropTypes from 'prop-types'
import styles from './MinimalCard.module.scss'

// 메모이제이션으로 성능 최적화
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
  as: Component = 'div'
}) => {
  // 클릭 가능한 카드의 키보드 접근성
  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
    if (onKeyDown) {
      onKeyDown(e)
    }
  }
  
  // 동적 props 설정
  const cardProps = {
    className: `${styles.card} ${hover ? styles.hover : ''} ${styles[`padding-${padding}`]} ${className}`,
    onClick,
    role: onClick ? 'button' : role,
    'aria-label': ariaLabel,
    tabIndex: onClick ? (tabIndex ?? 0) : tabIndex,
    onKeyDown: handleKeyDown
  }
  
  // onClick이 있으면 button으로 렌더링
  if (onClick && Component === 'div') {
    Component = 'button'
    cardProps.type = 'button'
  }
  
  return (
    <Component {...cardProps}>
      {children}
    </Component>
  )
})

MinimalCard.displayName = 'MinimalCard'

MinimalCard.propTypes = {
  children: PropTypes.node.isRequired,
  hover: PropTypes.bool,
  onClick: PropTypes.func,
  padding: PropTypes.oneOf(['none', 'small', 'normal', 'large']),
  className: PropTypes.string,
  role: PropTypes.string,
  ariaLabel: PropTypes.string,
  tabIndex: PropTypes.number,
  onKeyDown: PropTypes.func,
  as: PropTypes.elementType
}

// CardHeader 컴포넌트
export const CardHeader = React.memo(({ 
  title, 
  subtitle, 
  action,
  titleAs: TitleComponent = 'h3',
  className = ''
}) => (
  <header className={`${styles.header} ${className}`}>
    <div>
      <TitleComponent className={styles.title}>{title}</TitleComponent>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
    {action && <div className={styles.action} role="group">{action}</div>}
  </header>
))

CardHeader.displayName = 'CardHeader'

CardHeader.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  action: PropTypes.node,
  titleAs: PropTypes.elementType,
  className: PropTypes.string
}

// CardContent 컴포넌트
export const CardContent = React.memo(({ 
  children, 
  className = '',
  as: Component = 'div'
}) => (
  <Component className={`${styles.content} ${className}`}>
    {children}
  </Component>
))

CardContent.displayName = 'CardContent'

CardContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  as: PropTypes.elementType
}

// CardFooter 컴포넌트
export const CardFooter = React.memo(({ 
  children, 
  align = 'left',
  className = ''
}) => (
  <footer className={`${styles.footer} ${styles[`align-${align}`]} ${className}`}>
    {children}
  </footer>
))

CardFooter.displayName = 'CardFooter'

CardFooter.propTypes = {
  children: PropTypes.node.isRequired,
  align: PropTypes.oneOf(['left', 'center', 'right', 'between']),
  className: PropTypes.string
}

// 스켈레톤 로더 컴포넌트
export const CardSkeleton = React.memo(({ 
  showHeader = true,
  showContent = true,
  showFooter = false,
  className = ''
}) => (
  <div className={`${styles.card} ${styles.skeleton} ${className}`}>
    {showHeader && (
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonSubtitle} />
      </div>
    )}
    {showContent && (
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonLine} />
        <div className={styles.skeletonLine} style={{ width: '80%' }} />
        <div className={styles.skeletonLine} style={{ width: '60%' }} />
      </div>
    )}
    {showFooter && (
      <div className={styles.skeletonFooter}>
        <div className={styles.skeletonButton} />
      </div>
    )}
  </div>
))

CardSkeleton.displayName = 'CardSkeleton'

CardSkeleton.propTypes = {
  showHeader: PropTypes.bool,
  showContent: PropTypes.bool,
  showFooter: PropTypes.bool,
  className: PropTypes.string
}