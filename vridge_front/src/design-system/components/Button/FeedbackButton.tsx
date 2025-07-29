import React, { forwardRef } from 'react'
import classNames from 'classnames'
import Button, { ButtonProps } from './Button'
import styles from './Button.module.scss'

export interface FeedbackButtonProps extends ButtonProps {
  feedbackType?: 'like' | 'dislike' | 'reply' | 'needExplanation' | 'important'
  active?: boolean
}

const FeedbackButton = forwardRef<HTMLButtonElement, FeedbackButtonProps>(
  ({ className, feedbackType, active, children, ...props }, ref) => {
    const buttonClasses = classNames(
      styles.feedbackAction,
      {
        [styles[feedbackType || '']]: feedbackType,
        [styles.active]: active,
      },
      className
    )

    return (
      <button
        ref={ref}
        className={buttonClasses}
        {...props}
      >
        {children}
      </button>
    )
  }
)

FeedbackButton.displayName = 'FeedbackButton'

export default FeedbackButton