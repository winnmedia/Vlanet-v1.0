import React from 'react'
import styles from './ProgressIndicator.module.scss';

const ProgressIndicator = ({ 
  currentStep, 
  totalSteps, 
  completedSteps = [],
  canNavigateToStep,
  onStepClick,
  stepLabels = []
}) => {
  const getStepStatus = (stepIndex) => {
    if (completedSteps.includes(stepIndex)) return 'completed';
    if (stepIndex === currentStep) return 'current';
    if (stepIndex < currentStep) return 'visited';
    return 'pending';
  };

  const handleStepClick = (stepIndex) => {
    if (canNavigateToStep && canNavigateToStep(stepIndex) && onStepClick) {
      onStepClick(stepIndex);
    }
  };

  const calculateProgress = () => {
    if (totalSteps === 0) return 0;
    const completedCount = completedSteps.length;
    return Math.round((completedCount / totalSteps) * 100);
  };

  const steps = Array.from({ length: totalSteps }, (_, index) => ({
    number: index + 1,
    label: stepLabels[index] || `단계 ${index + 1}`,
    status: getStepStatus(index + 1)
  }));

  return (
    <div className={styles['progress-indicator']}>
      <div className={styles['progress-header']}>
        <h3 className={styles['progress-title']}>전체 진행 상황</h3>
        <span className={styles['progress-percentage']}>{calculateProgress()}% 완료</span>
      </div>
      
      <div className={styles['progress-bar-container']}>
        <div 
          className={styles['progress-bar-fill']}
          style={{ width: `${calculateProgress()}%` }}
        />
      </div>

      <div className={styles['progress-steps']}>
        {steps.map((step, index) => {
          const isClickable = canNavigateToStep && canNavigateToStep(step.number);
          
          return (
            <div
              key={step.number}
              className={`${styles['progress-step']} ${styles[step.status]} ${isClickable ? styles.clickable : ''}`}
              onClick={() => handleStepClick(step.number)}
            >
              <div className={styles['step-connector']}>
                {index > 0 && (
                  <div className={`${styles['connector-line']} ${
                    completedSteps.includes(step.number - 1) ? styles.completed : ''
                  }`} />
                )}
              </div>
              
              <div className={styles['step-circle']}>
                {step.status === 'completed' ? (
                  <svg viewBox="0 0 24 24" className={styles.checkmark}>
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                ) : (
                  <span className={styles['step-number']}>{step.number}</span>
                )}
              </div>
              
              <div className={styles['step-info']}>
                <span className={styles['step-label']}>{step.label}</span>
                {step.status === 'current' && (
                  <span className={styles['step-status']}>진행 중</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles['progress-summary']}>
        <div className={styles['summary-item']}>
          <span className={styles['summary-label']}>완료된 단계:</span>
          <span className={styles['summary-value']}>{completedSteps.length}/{totalSteps}</span>
        </div>
        <div className={styles['summary-item']}>
          <span className={styles['summary-label']}>현재 단계:</span>
          <span className={styles['summary-value']}>{stepLabels[currentStep - 1] || `단계 ${currentStep}`}</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;