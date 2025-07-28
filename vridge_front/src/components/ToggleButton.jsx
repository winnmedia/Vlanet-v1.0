import React from 'react'
import styles from './ToggleButton.module.scss'

const ToggleButton = ({ isExpanded, onClick, className = '' }) => {
  return (
    <button 
      className={`${styles.toggleButton} ${isExpanded ? styles.expanded : ''} ${className}`}
      onClick={onClick}
      type="button"
      aria-expanded={isExpanded}
      aria-label={isExpanded ? '접기' : '펼치기'}
    >
      <span className={styles.icon}>
        {isExpanded ? '−' : '+'}
      </span>
    </button>
  )
}

export default ToggleButton