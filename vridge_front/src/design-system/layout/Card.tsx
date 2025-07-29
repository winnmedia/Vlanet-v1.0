import React, { ReactNode } from 'react'
import classNames from 'classnames'
import styles from './Layout.module.scss'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  onClick,
  hoverable = false 
}) => {
  return (
    <div 
      className={classNames(
        styles.card,
        { [styles.hoverable]: hoverable },
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  actions?: ReactNode
  className?: string
}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  title, 
  actions, 
  className 
}) => {
  return (
    <div className={classNames(styles.cardHeader, className)}>
      <h3 className={styles.cardTitle}>{title}</h3>
      {actions && <div className={styles.cardActions}>{actions}</div>}
    </div>
  )
}