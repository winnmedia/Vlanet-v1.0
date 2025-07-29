import React, { ReactNode } from 'react'
import classNames from 'classnames'
import styles from './Layout.module.scss'

interface PageLayoutProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'feedback' | 'create'
}

export const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  className,
  variant = 'default' 
}) => {
  const layoutClass = variant === 'feedback' ? styles.feedbackLayout :
                     variant === 'create' ? styles.projectCreateLayout :
                     styles.homeLayout

  return (
    <div className={classNames(layoutClass, className)}>
      {children}
    </div>
  )
}

interface ContentAreaProps {
  children: ReactNode
  className?: string
}

export const ContentArea: React.FC<ContentAreaProps> = ({ children, className }) => {
  return (
    <div className={classNames(styles.homeContent, className)}>
      {children}
    </div>
  )
}