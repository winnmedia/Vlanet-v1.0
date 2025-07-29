import React from 'react';
import styles from './Button.module.scss';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  ...props
}) => {
  const classNames = [
    styles.button,
    styles[`button--${variant}`],
    styles[`button--${size}`],
    fullWidth && styles['button--full-width'],
    loading && styles['button--loading'],
    disabled && styles['button--disabled'],
    icon && !children && styles['button--icon-only'],
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className={styles['button__spinner']} />
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className={styles['button__icon']}>{icon}</span>
      )}
      {children && <span className={styles['button__text']}>{children}</span>}
      {!loading && icon && iconPosition === 'right' && (
        <span className={styles['button__icon']}>{icon}</span>
      )}
    </button>
  );
};

export default Button;