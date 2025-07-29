import React from 'react'
import classNames from 'classnames'
import styles from './Layout.module.scss'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}) => {
  return (
    <div className={classNames(styles.emptyState, className)}>
      {icon && <div className={styles.emptyIcon}>{icon}</div>}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className={styles.emptyAction}>{action}</div>}
    </div>
  )
}