import React, { ReactNode } from 'react'
import classNames from 'classnames'
import styles from './Layout.module.scss'

interface GridProps {
  children: ReactNode
  className?: string
  variant?: 'projects' | 'activity'
}

export const Grid: React.FC<GridProps> = ({ 
  children, 
  className,
  variant = 'projects' 
}) => {
  const gridClass = variant === 'activity' ? styles.homeActivityGrid : styles.projectsGrid

  return (
    <div className={classNames(gridClass, className)}>
      {children}
    </div>
  )
}

interface FormRowProps {
  children: ReactNode
  className?: string
  single?: boolean
}

export const FormRow: React.FC<FormRowProps> = ({ 
  children, 
  className,
  single = false 
}) => {
  return (
    <div className={classNames(
      styles.formRow,
      { [styles.single]: single },
      className
    )}>
      {children}
    </div>
  )
}