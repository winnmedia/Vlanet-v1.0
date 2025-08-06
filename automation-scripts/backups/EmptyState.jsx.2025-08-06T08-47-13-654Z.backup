import React from 'react'
import styles from './EmptyState.module.scss'

const EmptyState = ({ 
  icon, 
  title = '데이터가 없습니다', 
  description = '', 
  actionButton,
  style = {},
  className = ''
}) => {
  // 기본 아이콘 SVG
  const defaultIcon = (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
      <path 
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" 
        stroke="#6c757d" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M8 9h8M8 13h6" 
        stroke="#6c757d" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )

  return (
    <div className={`${styles.emptyState} ${className}`} style={style}>
      <div className={styles.iconWrapper}>
        {icon || defaultIcon}
      </div>
      
      <h3 className={styles.title}>{title}</h3>
      
      {description && (
        <p className={styles.description}>{description}</p>
      )}
      
      {actionButton && (
        <div className={styles.actionWrapper}>
          {actionButton}
        </div>
      )}
    </div>
  )
}

export default EmptyState