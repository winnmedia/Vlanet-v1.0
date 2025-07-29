import React, { forwardRef, InputHTMLAttributes } from 'react';
import styles from './Input.module.scss';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'filled' | 'outlined' | 'borderless';
  inputSize?: 'sm' | 'md' | 'lg';
  error?: boolean;
  errorMessage?: string;
  label?: string;
  helpText?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  variant = 'default',
  inputSize = 'md',
  error = false,
  errorMessage,
  label,
  helpText,
  prefix,
  suffix,
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  const inputClasses = [
    styles.input,
    styles[`input--${variant}`],
    styles[`input--${inputSize}`],
    error && styles['input--error'],
    fullWidth && styles['input--full-width'],
    className
  ].filter(Boolean).join(' ');

  const wrapperClasses = [
    styles.inputWrapper,
    fullWidth && styles['inputWrapper--full-width']
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label className={styles.label}>
          {label}
        </label>
      )}
      
      <div className={styles.inputContainer}>
        {prefix && (
          <span className={styles.prefix}>
            {prefix}
          </span>
        )}
        
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
        
        {suffix && (
          <span className={styles.suffix}>
            {suffix}
          </span>
        )}
      </div>
      
      {errorMessage && error && (
        <span className={styles.errorMessage}>
          {errorMessage}
        </span>
      )}
      
      {helpText && !error && (
        <span className={styles.helpText}>
          {helpText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';