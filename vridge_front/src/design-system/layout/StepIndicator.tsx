import React from 'react'
import classNames from 'classnames'
import styles from './Layout.module.scss'

interface Step {
  id: string
  label: string
  completed: boolean
  active: boolean
}

interface StepIndicatorProps {
  steps: Step[]
  className?: string
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, className }) => {
  return (
    <div className={classNames(styles.stepIndicator, className)}>
      {steps.map((step, index) => (
        <div key={step.id} className={styles.step}>
          <div 
            className={classNames(
              styles.stepCircle,
              {
                [styles.active]: step.active,
                [styles.completed]: step.completed
              }
            )}
          >
            {step.completed ? '✓' : index + 1}
          </div>
          {index < steps.length - 1 && (
            <div 
              className={classNames(
                styles.stepLine,
                { [styles.completed]: step.completed }
              )} 
            />
          )}
        </div>
      ))}
    </div>
  )
}