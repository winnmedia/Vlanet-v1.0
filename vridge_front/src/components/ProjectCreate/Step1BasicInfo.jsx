import React, { useState, useEffect } from 'react'

const Step1BasicInfo = ({ inputs, onChange, onValidationChange }) => {
  const { name, manager, consumer } = inputs
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const validateField = (fieldName, value) => {
    const newErrors = { ...errors }
    
    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = '프로젝트명은 필수입니다'
        } else if (value.length < 2) {
          newErrors.name = '프로젝트명은 2자 이상이어야 합니다'
        } else if (value.length > 50) {
          newErrors.name = '프로젝트명은 50자 이하여야 합니다'
        } else {
          delete newErrors.name
        }
        break
        
      case 'manager':
        if (!value.trim()) {
          newErrors.manager = '담당자명은 필수입니다'
        } else if (value.length < 2) {
          newErrors.manager = '담당자명은 2자 이상이어야 합니다'
        } else {
          delete newErrors.manager
        }
        break
        
      case 'consumer':
        if (!value.trim()) {
          newErrors.consumer = '고객사명은 필수입니다'
        } else if (value.length < 2) {
          newErrors.consumer = '고객사명은 2자 이상이어야 합니다'
        } else {
          delete newErrors.consumer
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name: fieldName, value } = e.target
    onChange(e)
    validateField(fieldName, value)
  }

  const handleBlur = (e) => {
    const { name: fieldName } = e.target
    setTouched(prev => ({ ...prev, [fieldName]: true }))
  }

  useEffect(() => {
    const isValid = name.trim() && manager.trim() && consumer.trim() && 
                   Object.keys(errors).length === 0
    onValidationChange(isValid)
  }, [name, manager, consumer, errors, onValidationChange])

  return (
    <div className="step1-basic-info">
      <div className="step-header">
        <h2>기본 정보를 입력해주세요</h2>
        <p>프로젝트의 기본적인 정보를 설정합니다</p>
      </div>

      <div className="form-section">
        <div className="input-group">
          <label htmlFor="name" className="required">
            프로젝트명
            <span className="required-mark">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="예: 브랜드 홍보 영상 제작"
            className={`form-input ${errors.name && touched.name ? 'error' : ''} ${name.trim() && !errors.name ? 'success' : ''}`}
            maxLength={50}
          />
          {errors.name && touched.name && (
            <div className="error-message">{errors.name}</div>
          )}
          <div className="char-count">{name.length}/50</div>
        </div>

        <div className="input-group">
          <label htmlFor="manager" className="required">
            담당자
            <span className="required-mark">*</span>
          </label>
          <input
            type="text"
            id="manager"
            name="manager"
            value={manager}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="예: 김철수"
            className={`form-input ${errors.manager && touched.manager ? 'error' : ''} ${manager.trim() && !errors.manager ? 'success' : ''}`}
            maxLength={50}
          />
          {errors.manager && touched.manager && (
            <div className="error-message">{errors.manager}</div>
          )}
        </div>

        <div className="input-group">
          <label htmlFor="consumer" className="required">
            고객사
            <span className="required-mark">*</span>
          </label>
          <input
            type="text"
            id="consumer"
            name="consumer"
            value={consumer}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="예: (주)테크컴퍼니"
            className={`form-input ${errors.consumer && touched.consumer ? 'error' : ''} ${consumer.trim() && !errors.consumer ? 'success' : ''}`}
            maxLength={50}
          />
          {errors.consumer && touched.consumer && (
            <div className="error-message">{errors.consumer}</div>
          )}
        </div>
      </div>

      <div className="step-info">
        <div className="info-box">
          <div className="info-icon">💡</div>
          <div className="info-content">
            <strong>필수 정보만 입력하면 됩니다</strong>
            <p>세부 설명이나 추가 옵션은 다음 단계에서 설정할 수 있습니다.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .step1-basic-info {
          max-width: 600px;
          margin: 0 auto;
        }
        
        .step-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .step-header h2 {
          font-size: 28px;
          font-weight: 700;
          color: #1631F8;
          margin-bottom: 8px;
        }
        
        .step-header p {
          font-size: 16px;
          color: #666;
        }
        
        .form-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 30px;
        }
        
        .input-group {
          position: relative;
        }
        
        .input-group label {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }
        
        .required-mark {
          color: #dc3545;
          margin-left: 4px;
        }
        
        .form-input {
          width: 100%;
          padding: 16px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.3s ease;
          background: #fff;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #1631F8;
          box-shadow: 0 0 0 3px rgba(22, 49, 248, 0.1);
        }
        
        .form-input.error {
          border-color: #dc3545;
          background: #fff5f5;
        }
        
        .form-input.success {
          border-color: #28a745;
          background: #f8fff9;
        }
        
        .error-message {
          color: #dc3545;
          font-size: 14px;
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .error-message::before {
          content: "⚠️";
          font-size: 12px;
        }
        
        .char-count {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          color: #999;
          background: #fff;
          padding: 2px 4px;
        }
        
        .step-info {
          margin-top: 30px;
        }
        
        .info-box {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: #f0f7ff;
          border: 1px solid #b8daff;
          border-radius: 8px;
        }
        
        .info-icon {
          font-size: 20px;
          flex-shrink: 0;
        }
        
        .info-content strong {
          display: block;
          color: #1631F8;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .info-content p {
          color: #666;
          font-size: 14px;
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .step-header h2 {
            font-size: 24px;
          }
          
          .form-input {
            padding: 14px;
            font-size: 16px;
          }
          
          .char-count {
            position: static;
            transform: none;
            text-align: right;
            margin-top: 4px;
          }
        }
      `}</style>
    </div>
  )
}

export default Step1BasicInfo