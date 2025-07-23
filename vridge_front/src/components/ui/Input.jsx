import React, { forwardRef } from 'react'
import classNames from 'classnames'

export const Input = forwardRef(({
  type = 'text',
  label,
  error,
  helpText,
  required = false,
  className = '',
  ...props
}, ref) => {
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div className={classNames('form-group', error && 'error', className)}>
      {label && (
        <label htmlFor={inputId}>
          {label}
          {required && <span className="required"> *</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className="form-input"
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
        {...props}
      />
      {helpText && !error && (
        <div id={`${inputId}-help`} className="help-text">{helpText}</div>
      )}
      {error && (
        <div id={`${inputId}-error`} className="error-message" role="alert">{error}</div>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export const Textarea = forwardRef(({
  label,
  error,
  helpText,
  required = false,
  rows = 4,
  className = '',
  ...props
}, ref) => {
  const textareaId = props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div className={classNames('form-group', error && 'error', className)}>
      {label && (
        <label htmlFor={textareaId}>
          {label}
          {required && <span className="required"> *</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className="form-textarea"
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : helpText ? `${textareaId}-help` : undefined}
        {...props}
      />
      {helpText && !error && (
        <div id={`${textareaId}-help`} className="help-text">{helpText}</div>
      )}
      {error && (
        <div id={`${textareaId}-error`} className="error-message" role="alert">{error}</div>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'

export const Select = forwardRef(({
  label,
  error,
  helpText,
  required = false,
  options = [],
  placeholder = '선택하세요',
  className = '',
  ...props
}, ref) => {
  const selectId = props.id || `select-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div className={classNames('form-group', error && 'error', className)}>
      {label && (
        <label htmlFor={selectId}>
          {label}
          {required && <span className="required"> *</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className="form-select"
        aria-invalid={!!error}
        aria-describedby={error ? `${selectId}-error` : helpText ? `${selectId}-help` : undefined}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helpText && !error && (
        <div id={`${selectId}-help`} className="help-text">{helpText}</div>
      )}
      {error && (
        <div id={`${selectId}-error`} className="error-message" role="alert">{error}</div>
      )}
    </div>
  )
})

Select.displayName = 'Select'

export const Checkbox = forwardRef(({
  label,
  error,
  className = '',
  ...props
}, ref) => {
  const checkboxId = props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div className={classNames('form-checkbox', error && 'error', className)}>
      <input
        ref={ref}
        id={checkboxId}
        type="checkbox"
        aria-invalid={!!error}
        {...props}
      />
      {label && (
        <label htmlFor={checkboxId}>{label}</label>
      )}
      {error && (
        <div className="error-message" role="alert">{error}</div>
      )}
    </div>
  )
})

Checkbox.displayName = 'Checkbox'

export const Radio = forwardRef(({
  label,
  error,
  className = '',
  ...props
}, ref) => {
  const radioId = props.id || `radio-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div className={classNames('form-radio', error && 'error', className)}>
      <input
        ref={ref}
        id={radioId}
        type="radio"
        aria-invalid={!!error}
        {...props}
      />
      {label && (
        <label htmlFor={radioId}>{label}</label>
      )}
      {error && (
        <div className="error-message" role="alert">{error}</div>
      )}
    </div>
  )
})

Radio.displayName = 'Radio'