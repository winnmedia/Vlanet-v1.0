import React, { useState, createContext, useContext, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './StepWizard.module.scss';
import { Button } from '../unified/Button';

// Context for wizard state
const WizardContext = createContext();

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider');
  }
  return context;
};

// Main wizard component with enhanced accessibility
export const StepWizard = ({
  children,
  onComplete,
  initialStep = 0,
  className = '',
  ariaLabel = '단계별 마법사'
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [data, setData] = useState({});
  const [focusedStep, setFocusedStep] = useState(null);

  const steps = React.Children.toArray(children);
  const totalSteps = steps.length;

  // 키보드 네비게이션 지원
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.closest(`.${styles.steps}`)) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            if (currentStep > 0) {
              goToStep(currentStep - 1);
            }
            break;
          case 'ArrowRight':
            e.preventDefault();
            if (currentStep < totalSteps - 1 && canNavigateToStep(currentStep + 1)) {
              goToStep(currentStep + 1);
            }
            break;
          case 'Home':
            e.preventDefault();
            goToStep(0);
            break;
          case 'End':
            e.preventDefault();
            for (let i = totalSteps - 1; i >= 0; i--) {
              if (canNavigateToStep(i)) {
                goToStep(i);
                break;
              }
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, totalSteps]);

  const goToStep = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setCurrentStep(stepIndex);
      // 스크린 리더를 위한 알림
      const stepName = steps[stepIndex]?.props?.title || `${stepIndex + 1}단계`;
      announceToScreenReader(`${stepName}로 이동했습니다`);
    }
  }, [totalSteps, steps]);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
    } else if (onComplete) {
      onComplete(data);
    }
  }, [currentStep, totalSteps, onComplete, data]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const updateData = useCallback((stepData) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const isStepCompleted = useCallback((stepIndex) =>
  completedSteps.has(stepIndex), [completedSteps]);

  const canNavigateToStep = useCallback((stepIndex) => {
    if (stepIndex <= currentStep) return true;

    for (let i = 0; i < stepIndex; i++) {
      if (!completedSteps.has(i)) return false;
    }
    return true;
  }, [currentStep, completedSteps]);

  const value = {
    currentStep,
    totalSteps,
    goToStep,
    nextStep,
    prevStep,
    data,
    updateData,
    isStepCompleted,
    canNavigateToStep
  };

  return (
    <WizardContext.Provider value={value}>
      <div
        className={`${styles.wizard} ${className}`}
        role="region"
        aria-label={ariaLabel}>

        <WizardProgress
          currentStep={currentStep}
          totalSteps={totalSteps}
          focusedStep={focusedStep}
          setFocusedStep={setFocusedStep} />

        <div
          className={styles.content}
          role="tabpanel"
          aria-labelledby={`step-${currentStep}`}
          tabIndex={-1}>

          {steps[currentStep]}
        </div>
      </div>
    </WizardContext.Provider>);

};

StepWizard.propTypes = {
  children: PropTypes.node.isRequired,
  onComplete: PropTypes.func,
  initialStep: PropTypes.number,
  className: PropTypes.string,
  ariaLabel: PropTypes.string
};

// Step component with enhanced accessibility
export const WizardStep = ({
  title,
  subtitle,
  children,
  onNext,
  onPrev,
  nextLabel = '다음',
  prevLabel = '이전',
  showPrev = true,
  isValid = true,
  className = ''
}) => {
  const { nextStep, prevStep, currentStep, totalSteps } = useWizard();

  const handleNext = async () => {
    if (onNext) {
      const result = await onNext();
      if (result !== false) {
        nextStep();
      }
    } else {
      nextStep();
    }
  };

  const handlePrev = () => {
    if (onPrev) {
      onPrev();
    }
    prevStep();
  };

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div
      className={`${styles.step} ${className}`}
      role="region"
      aria-label={title}>

      <div className={styles.stepHeader}>
        <h2 id={`step-${currentStep}`} className={styles.stepTitle}>{title}</h2>
        {subtitle &&
        <p className={styles.stepSubtitle} id={`step-${currentStep}-desc`}>
            {subtitle}
          </p>
        }
      </div>
      
      <div
        className={styles.stepContent}
        aria-describedby={subtitle ? `step-${currentStep}-desc` : undefined}>

        {children}
      </div>
      
      <div className={styles.stepFooter} role="navigation" aria-label="단계 네비게이션">
        {showPrev && currentStep > 0 &&
        <UnifiedButton
          type="button"
          variant="secondary"
          size="md"
          onClick={handlePrev} onKeyDown={(e) => e.key === 'Enter' && handlePrev}
          className={styles.prevButton}
          aria-label={`${prevLabel} 단계로 이동`}>

            <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true">

              <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round" />

            </svg>
            {prevLabel}
          </UnifiedButton>
        }
        
        <UnifiedButton
          type="button"
          variant="primary"
          size="md"
          onClick={handleNext} onKeyDown={(e) => e.key === 'Enter' && handleNext}
          disabled={!isValid}
          className={styles.nextButton}
          aria-label={isLastStep ? '마법사 완료' : `${nextLabel} 단계로 이동`}
          aria-disabled={!isValid}>

          {isLastStep ? '완료' : nextLabel}
          {!isLastStep &&
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true">

              <path
              d="M6 4L10 8L6 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round" />

            </svg>
          }
        </UnifiedButton>
      </div>
    </div>);

};

WizardStep.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
  onNext: PropTypes.func,
  onPrev: PropTypes.func,
  nextLabel: PropTypes.string,
  prevLabel: PropTypes.string,
  showPrev: PropTypes.bool,
  isValid: PropTypes.bool,
  className: PropTypes.string
};

// Progress indicator with enhanced accessibility
const WizardProgress = React.memo(({
  currentStep,
  totalSteps,
  focusedStep,
  setFocusedStep
}) => {
  const { goToStep, isStepCompleted, canNavigateToStep } = useWizard();

  const progressPercentage = (currentStep + 1) / totalSteps * 100;

  return (
    <div className={styles.progress} role="group" aria-label="진행 상황">
      <div
        className={styles.progressBar}
        role="progressbar"
        aria-valuenow={progressPercentage}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={`전체 ${totalSteps}단계 중 ${currentStep + 1}단계 진행 중`}>

        <div
          className={styles.progressFill}
          style={{ width: `${progressPercentage}%` }} />

      </div>
      
      <div
        className={styles.steps}
        role="tablist"
        aria-label="단계 선택">

        {Array.from({ length: totalSteps }, (_, i) => {
          const completed = isStepCompleted(i);
          const active = i === currentStep;
          const navigable = canNavigateToStep(i);

          return (
            <UnifiedButton
              key={i}
              type="button"
              variant="ghost"
              size="sm"
              role="tab"
              className={`
                ${styles.stepIndicator}
                ${active ? styles.active : ''}
                ${completed ? styles.completed : ''}
                ${!navigable ? styles.disabled : ''}
              `}
              onClick={() = aria-label="Click"> navigable && goToStep(i)} onKeyDown={(e) => e.key === 'Enter' && () = aria-label="Click"> navigable && goToStep(i)}
              disabled={!navigable}
              aria-label={`${i + 1}단계${completed ? ' (완료됨)' : ''}${active ? ' (현재)' : ''}`}
              aria-selected={active}
              aria-disabled={!navigable}
              tabIndex={active ? 0 : -1}
              onFocus={() => setFocusedStep(i)}
              onBlur={() => setFocusedStep(null)}>

              {completed ?
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                  d="M13.5 4.5L6 12L2.5 8.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round" />

                </svg> :

              <span aria-hidden="true">{i + 1}</span>
              }
            </UnifiedButton>);

        })}
      </div>
    </div>);

});

WizardProgress.displayName = 'WizardProgress';

WizardProgress.propTypes = {
  currentStep: PropTypes.number.isRequired,
  totalSteps: PropTypes.number.isRequired,
  focusedStep: PropTypes.number,
  setFocusedStep: PropTypes.func.isRequired
};

// 스크린 리더 알림 유틸리티
function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Export all components
export default StepWizard;