import React from 'react'

const StepProgress = ({ currentStep, totalSteps = 3 }) => {
  const getProgressPercentage = () => {
    return (currentStep / totalSteps) * 100
  }

  const getStepLabel = (step) => {
    switch (step) {
      case 1: return '기본 정보'
      case 2: return '핵심 일정'
      case 3: return '선택 정보'
      default: return `단계 ${step}`
    }
  }

  return (
    <div className="step-progress">
      <div className="progress-header">
        <div className="step-indicator">
          <span className="current-step">{currentStep}</span>
          <span className="total-steps">/ {totalSteps}</span>
        </div>
        <div className="progress-percentage">
          {Math.round(getProgressPercentage())}% 완료
        </div>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>
      
      <div className="step-labels">
        {[1, 2, 3].map((step) => (
          <div 
            key={step} 
            className={`step-label ${currentStep >= step ? 'active' : ''} ${currentStep === step ? 'current' : ''}`}
          >
            <div className="step-number">{step}</div>
            <span className="step-text">{getStepLabel(step)}</span>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .step-progress {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }
        
        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .step-indicator {
          font-size: 24px;
          font-weight: 700;
          color: #1631F8;
        }
        
        .current-step {
          font-size: 32px;
        }
        
        .total-steps {
          color: #666;
          font-size: 20px;
        }
        
        .progress-percentage {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #1631F8 0%, #0F23C9 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .step-labels {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .step-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          opacity: 0.5;
          transition: opacity 0.3s ease;
        }
        
        .step-label.active {
          opacity: 1;
        }
        
        .step-label.current {
          opacity: 1;
          color: #1631F8;
        }
        
        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-bottom: 8px;
          transition: all 0.3s ease;
        }
        
        .step-label.active .step-number {
          background: #1631F8;
          color: white;
        }
        
        .step-label.current .step-number {
          background: #1631F8;
          color: white;
          transform: scale(1.1);
        }
        
        .step-text {
          font-size: 12px;
          font-weight: 500;
          text-align: center;
          white-space: nowrap;
        }
        
        @media (max-width: 768px) {
          .step-progress {
            padding: 15px;
          }
          
          .progress-header {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }
          
          .step-labels {
            gap: 10px;
          }
          
          .step-text {
            font-size: 10px;
          }
          
          .step-number {
            width: 28px;
            height: 28px;
          }
        }
      `}</style>
    </div>
  )
}

export default StepProgress