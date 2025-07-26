import React, { useState, useEffect, useRef } from 'react'
// import 제거 - JavaScript 변환
import { MinimalButton } from './MinimalButton'
import styles from './StepWizard.module.scss'

export const StepWizard = React.memo(({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  allowStepSkip = false,
  showStepNumbers = true,
  orientation = 'horizontal',
  className = '',
  ...props
}) => {
  const [internalStep, setInternalStep] = useState(currentStep)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [validationErrors, setValidationErrors] = useState({})
  const stepRefs = useRef([])
  
  useEffect(() => {
    setInternalStep(currentStep)
  }, [currentStep])
  
  useEffect(() => {
    // 키보드 네비게이션
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          if (internalStep > 0) {
            handleStepChange(internalStep - 1)
          }
          break
        case 'ArrowRight':
          if (internalStep < steps.length - 1) {
            handleStepChange(internalStep + 1)
          }
          break
        case 'Home':
          handleStepChange(0)
          break
        case 'End':
          handleStepChange(steps.length - 1)
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [internalStep, steps.length])
  
  const handleStepChange = async (newStep) => {
    if (newStep === internalStep) return
    
    const currentStepConfig = steps[internalStep]
    
    // 유효성 검사
    if (currentStepConfig?.validation && newStep > internalStep) {
      try {
        const isValid = await currentStepConfig.validation()
        if (!isValid) {
          setValidationErrors({
            ...validationErrors,
            [internalStep]: '이 단계를 완료해주세요.'
          })
          return
        }
      } catch (error) {
        setValidationErrors({
          ...validationErrors,
          [internalStep]: '유효성 검사 중 오류가 발생했습니다.'
        })
        return
      }
    }
    
    // 단계 변경
    if (!steps[newStep]?.disabled && (allowStepSkip || newStep === internalStep + 1 || newStep < internalStep)) {
      setInternalStep(newStep)
      setCompletedSteps(prev => new Set([...prev, internalStep]))
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[internalStep]
        return newErrors
      })
      
      if (onStepChange) {
        onStepChange(newStep)
      }
      
      // 포커스 이동
      stepRefs.current[newStep]?.focus()
    }
  }
  
  const handleNext = () => {
    if (internalStep < steps.length - 1) {
      handleStepChange(internalStep + 1)
    } else if (onComplete) {
      setCompletedSteps(prev => new Set([...prev, internalStep]))
      onComplete()
    }
  }
  
  const handlePrevious = () => {
    if (internalStep > 0) {
      handleStepChange(internalStep - 1)
    }
  }
  
  const getStepStatus = (index) => {
    if (index === internalStep) return 'active'
    if (completedSteps.has(index)) return 'completed'
    if (validationErrors[index]) return 'error'
    return 'pending'
  }
  
  const wizardClasses = [
    styles.stepWizard,
    styles[`orientation-${orientation}`],
    className
  ].filter(Boolean).join(' ')
  
  return (
    <div className={wizardClasses} {...props}>
      {/* 단계 표시기 */}
      <div className={styles.stepIndicator} role="tablist">
        {steps.map((step, index) => {
          const status = getStepStatus(index)
          const isClickable = allowStepSkip || index <= internalStep || completedSteps.has(index)
          
          return (
            <div
              key={step.id}
              ref={el => stepRefs.current[index] = el}
              className={[
                styles.step,
                styles[`status-${status}`],
                isClickable && styles.clickable
              ].filter(Boolean).join(' ')}
              role="tab"
              aria-selected={index === internalStep}
              aria-disabled={step.disabled}
              tabIndex={isClickable && !step.disabled ? 0 : -1}
              onClick={() => isClickable && handleStepChange(index)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && isClickable) {
                  e.preventDefault()
                  handleStepChange(index)
                }
              }}
            >
              {/* 단계 아이콘/번호 */}
              <div className={styles.stepIcon}>
                {status === 'completed' ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
                  </svg>
                ) : step.icon ? (
                  step.icon
                ) : showStepNumbers ? (
                  index + 1
                ) : null}
              </div>
              
              {/* 단계 정보 */}
              <div className={styles.stepInfo}>
                <div className={styles.stepTitle}>{step.title}</div>
                {step.description && (
                  <div className={styles.stepDescription}>{step.description}</div>
                )}
              </div>
              
              {/* 연결선 */}
              {index < steps.length - 1 && (
                <div className={styles.stepConnector} />
              )}
            </div>
          )
        })}
      </div>
      
      {/* 단계 콘텐츠 */}
      <div className={styles.stepContent} role="tabpanel">
        {steps[internalStep]?.content || (
          <div className={styles.emptyContent}>
            <p>이 단계의 콘텐츠가 없습니다.</p>
          </div>
        )}
        
        {validationErrors[internalStep] && (
          <div className={styles.validationError} role="alert">
            {validationErrors[internalStep]}
          </div>
        )}
      </div>
      
      {/* 네비게이션 버튼 */}
      <div className={styles.stepNavigation}>
        <MinimalButton
          variant="outline"
          onClick={handlePrevious}
          disabled={internalStep === 0}
          aria-label="이전 단계"
        >
          이전
        </MinimalButton>
        
        <div className={styles.stepProgress}>
          <span className="sr-only">
            전체 {steps.length}단계 중 {internalStep + 1}단계
          </span>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${((internalStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
        
        <MinimalButton
          variant="primary"
          onClick={handleNext}
          disabled={steps[internalStep]?.disabled}
          aria-label={internalStep === steps.length - 1 ? '완료' : '다음 단계'}
        >
          {internalStep === steps.length - 1 ? '완료' : '다음'}
        </MinimalButton>
      </div>
    </div>
  )
})

StepWizard.displayName = 'StepWizard'