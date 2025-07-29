import React, { ButtonHTMLAttributes, forwardRef } from 'react'
import classNames from 'classnames'
import styles from './Button.module.scss'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'text'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  iconOnly?: boolean
  ripple?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      iconOnly = false,
      ripple = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const buttonClasses = classNames(
      styles.button,
      styles[variant],
      styles[size],
      {
        [styles.fullWidth]: fullWidth,
        [styles.loading]: loading,
        [styles.iconOnly]: iconOnly,
        [styles.ripple]: ripple,
      },
      className
    )

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button