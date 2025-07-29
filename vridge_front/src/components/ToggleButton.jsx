import React from 'react';
import styles from './ToggleButton.module.scss';
import { Button } from './unified/Button';

const ToggleButton = ({ isExpanded, onClick, className = '' }) => {
  return (
    <UnifiedButton
      variant="ghost"
      size="sm"
      className={`${styles.toggleButton} ${isExpanded ? styles.expanded : ''} ${className}`}
      onClick={onClick}
      aria-expanded={isExpanded}
      aria-label={isExpanded ? '접기' : '펼치기'}>

      <span className={styles.icon}>
        {isExpanded ? '−' : '+'}
      </span>
    </UnifiedButton>);

};

export default ToggleButton;