import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SmartFormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  options = [],
  rows = 3,
  required = false,
  aiHelp = null,
  validation = null,
  autoComplete = false,
  debounceMs = 300
}) {
  const [isFocused, setIsFocused] = useState(false)
  const [isValid, setIsValid] = useState(true)
  const [validationMessage, setValidationMessage] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // 디바운스된 검증 - 사용자 타이핑 중 방해하지 않음
  const debouncedValidation = useCallback(
    debounce((inputValue) => {
      if (validation) {
        const result = validation(inputValue)
        setIsValid(result.isValid)
        setValidationMessage(result.message || '')
      }
      
      // AI 자동완성 제안 (실시간 도움)
      if (autoComplete && inputValue.length > 2) {
        generateAISuggestions(inputValue)
      }
    }, debounceMs),
    [validation, autoComplete, debounceMs]
  )

  useEffect(() => {
    if (value) {
      debouncedValidation(value)
    }
  }, [value, debouncedValidation])

  const generateAISuggestions = async (inputValue) => {
    try {
      // AI 기반 자동완성 제안
      const response = await fetch('/api/ai/form-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: label,
          currentValue: inputValue,
          context: type
        })
      })
      
      const suggestions = await response.json()
      setAiSuggestions(suggestions)
      setShowSuggestions(suggestions.length > 0)
    } catch (error) {
      console.error('AI 제안 생성 실패:', error)
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    setTimeout(() => setShowSuggestions(false), 200) // 클릭 이벤트 처리 위해 지연
  }

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion)
    setShowSuggestions(false)
  }

  const renderField = () => {
    const commonProps = {
      value,
      onChange: (e) => onChange(e.target.value),
      onFocus: handleFocus,
      onBlur: handleBlur,
      placeholder,
      className: `smart-field ${!isValid ? 'invalid' : ''} ${isFocused ? 'focused' : ''}`,
      'aria-invalid': !isValid,
      'aria-describedby': validationMessage ? `${label}-error` : undefined
    }

    switch (type) {
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">선택해주세요</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      case 'textarea':
        return (
          <textarea 
            {...commonProps}
            rows={rows}
            style={{ resize: 'vertical', minHeight: `${rows * 24}px` }}
          />
        )
      
      default:
        return <input type={type} {...commonProps} />
    }
  }

  return (
    <div className="smart-form-field">
      <div className="field-header">
        <label className={`field-label ${required ? 'required' : ''}`}>
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
        
        {aiHelp && (
          <div className="ai-help-trigger">
            <button
              type="button"
              className="help-btn"
              onClick={() => {/* AI 도움말 모달 열기 */}}
              title="AI 도움말"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="field-container">
        {renderField()}
        
        {/* AI 자동완성 제안 */}
        <AnimatePresence>
          {showSuggestions && aiSuggestions.length > 0 && (
            <motion.div
              className="ai-suggestions"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span className="suggestion-text">{suggestion}</span>
                  <span className="ai-badge">AI</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 실시간 검증 피드백 */}
        <AnimatePresence>
          {!isValid && validationMessage && (
            <motion.div
              id={`${label}-error`}
              className="validation-message"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {validationMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI 도움말 텍스트 */}
      {aiHelp && (
        <div className="ai-help-text">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          {aiHelp}
        </div>
      )}

      <style jsx>{`
        .smart-form-field {
          position: relative;
          margin-bottom: 4px;
        }

        .field-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .field-label {
          font-size: 14px;
          font-weight: 600;
          color: #495057;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .field-label.required {
          color: #1631F8;
        }

        .required-indicator {
          color: #dc3545;
          font-weight: 700;
        }

        .ai-help-trigger .help-btn {
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .ai-help-trigger .help-btn:hover {
          color: #1631F8;
          background: rgba(22, 49, 248, 0.1);
        }

        .field-container {
          position: relative;
        }

        .smart-field {
          width: 100%;
          padding: 12px 16px;
          font-size: 14px;
          line-height: 1.5;
          color: #495057;
          background: #ffffff;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .smart-field:focus {
          outline: none;
          border-color: #1631F8;
          box-shadow: 0 0 0 3px rgba(22, 49, 248, 0.1);
        }

        .smart-field.focused {
          transform: translateY(-1px);
        }

        .smart-field.invalid {
          border-color: #dc3545;
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
        }

        .smart-field::placeholder {
          color: #adb5bd;
        }

        select.smart-field {
          cursor: pointer;
        }

        textarea.smart-field {
          resize: vertical;
          font-family: inherit;
        }

        .ai-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          max-height: 200px;
          overflow-y: auto;
        }

        .suggestion-item {
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .suggestion-item:hover {
          background: rgba(22, 49, 248, 0.05);
        }

        .suggestion-text {
          flex: 1;
          font-size: 14px;
          color: #495057;
        }

        .ai-badge {
          font-size: 10px;
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
        }

        .validation-message {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #dc3545;
          font-size: 13px;
          margin-top: 6px;
          padding: 8px 12px;
          background: rgba(220, 53, 69, 0.05);
          border-radius: 6px;
          border-left: 3px solid #dc3545;
        }

        .ai-help-text {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6c757d;
          margin-top: 6px;
          font-style: italic;
        }

        .ai-help-text svg {
          color: #28a745;
        }
      `}</style>
    </div>
  )
}

// 디바운스 유틸리티 함수
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}