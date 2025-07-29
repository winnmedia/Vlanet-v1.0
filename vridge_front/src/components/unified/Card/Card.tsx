import React from 'react';
import styles from './Card.module.scss';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'bordered' | 'elevated' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  fullWidth = false,
  hoverable = false,
  clickable = false,
  onClick,
  className = '',
  header,
  footer
}) => {
  const cardClasses = [
    styles.card,
    styles[`card--${variant}`],
    styles[`card--padding-${padding}`],
    fullWidth && styles['card--full-width'],
    hoverable && styles['card--hoverable'],
    clickable && styles['card--clickable'],
    className
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={cardClasses}
      onClick={handleClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {header && (
        <div className={styles.cardHeader}>
          {header}
        </div>
      )}
      
      <div className={styles.cardBody}>
        {children}
      </div>
      
      {footer && (
        <div className={styles.cardFooter}>
          {footer}
        </div>
      )}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`${styles.cardHeader} ${className}`}>
    {children}
  </div>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`${styles.cardBody} ${className}`}>
    {children}
  </div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`${styles.cardFooter} ${className}`}>
    {children}
  </div>
);