import React, { ReactNode } from 'react'
import classNames from 'classnames'
import styles from './Layout.module.scss'

interface FeedbackLayoutProps {
  videoSection: ReactNode
  sideSection: ReactNode
  className?: string
}

export const FeedbackLayout: React.FC<FeedbackLayoutProps> = ({ 
  videoSection, 
  sideSection, 
  className 
}) => {
  return (
    <div className={classNames(styles.feedbackLayout, className)}>
      <div className={styles.videoSection}>
        {videoSection}
      </div>
      <div className={styles.sideSection}>
        {sideSection}
      </div>
    </div>
  )
}

interface FeedbackSideProps {
  title: string
  tabs: ReactNode
  content: ReactNode
  className?: string
}

export const FeedbackSide: React.FC<FeedbackSideProps> = ({ 
  title, 
  tabs, 
  content, 
  className 
}) => {
  return (
    <div className={classNames(styles.feedbackSide, className)}>
      <div className={styles.sideHeader}>
        <h2 className={styles.sideTitle}>{title}</h2>
      </div>
      <div className={styles.tabContainer}>
        <div className={styles.tabMenu}>
          {tabs}
        </div>
        <div className={styles.tabContent}>
          {content}
        </div>
      </div>
    </div>
  )
}