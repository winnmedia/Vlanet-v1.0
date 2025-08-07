import React, { useEffect, useState } from 'react'
import styles from './MobileFirst.module.scss'
import { Progress } from 'antd'

// Mobile-First Responsive Hook
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  })
  
  const [deviceType, setDeviceType] = useState('desktop')
  const [orientation, setOrientation] = useState('landscape')
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setScreenSize({ width, height })
      setOrientation(width > height ? 'landscape' : 'portrait')
      
      // Determine device type based on width and touch capability
      if (width <= 480) {
        setDeviceType('mobile')
      } else if (width <= 768) {
        setDeviceType('tablet')
      } else if (width <= 1024) {
        setDeviceType('laptop')
      } else {
        setDeviceType('desktop')
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return {
    screenSize,
    deviceType,
    orientation,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop' || deviceType === 'laptop',
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape'
  }
}

// Adaptive Layout Component
export const AdaptiveLayout = ({ 
  children,
  mobileLayout,
  tabletLayout,
  desktopLayout,
  className = ''
}) => {
  const { deviceType } = useResponsive()
  
  const getLayoutComponent = () => {
    switch (deviceType) {
      case 'mobile':
        return mobileLayout || children
      case 'tablet':
        return tabletLayout || children
      default:
        return desktopLayout || children
    }
  }
  
  return (
    <div className={`${styles.adaptiveLayout} ${styles[deviceType]} ${className}`}>
      {getLayoutComponent()}
    </div>
  )
}

// Mobile Navigation Component
export const MobileNavigation = ({ 
  items = [],
  activeItem,
  onItemClick,
  position = 'bottom' // 'top', 'bottom', 'floating'
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (position === 'bottom') {
        // Hide navigation when scrolling down, show when scrolling up
        setIsVisible(currentScrollY < lastScrollY || currentScrollY < 100)
      }
      
      setLastScrollY(currentScrollY)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY, position])
  
  return (
    <nav 
      className={`${styles.mobileNavigation} ${styles[position]} ${
        isVisible ? styles.visible : styles.hidden
      }`}
    >
      <div className={styles.navContainer}>
        {items.map((item, index) => (
          <button
            key={item.id || index}
            className={`${styles.navItem} ${
              activeItem === item.id ? styles.active : ''
            }`}
            onClick={() => onItemClick?.(item)}
            aria-label={item.label}
          >
            <div className={styles.navIcon}>{item.icon}</div>
            {item.label && (
              <div className={styles.navLabel}>{item.label}</div>
            )}
            {item.badge && (
              <div className={styles.navBadge}>{item.badge}</div>
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}

// Touch-Optimized Card Component
export const TouchCard = ({ 
  children,
  onTap,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  className = '',
  pressEffect = true
}) => {
  const [isPressed, setIsPressed] = useState(false)
  const [startTouch, setStartTouch] = useState(null)
  const [longPressTimer, setLongPressTimer] = useState(null)
  
  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    setStartTouch({ x: touch.clientX, y: touch.clientY, time: Date.now() })
    setIsPressed(true)
    
    if (onLongPress) {
      const timer = setTimeout(() => {
        onLongPress()
        setLongPressTimer(null)
      }, 500)
      setLongPressTimer(timer)
    }
  }
  
  const handleTouchEnd = (e) => {
    setIsPressed(false)
    
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    
    if (!startTouch) return
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - startTouch.x
    const deltaY = touch.clientY - startTouch.y
    const deltaTime = Date.now() - startTouch.time
    
    // Swipe detection
    if (Math.abs(deltaX) > 100 && Math.abs(deltaY) < 50 && deltaTime < 300) {
      if (deltaX > 0) {
        onSwipeRight?.()
      } else {
        onSwipeLeft?.()
      }
    }
    // Tap detection
    else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
      onTap?.()
    }
    
    setStartTouch(null)
  }
  
  const handleTouchCancel = () => {
    setIsPressed(false)
    setStartTouch(null)
    
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }
  
  return (
    <div
      className={`${styles.touchCard} ${className} ${
        pressEffect && isPressed ? styles.pressed : ''
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}
    </div>
  )
}

// Mobile-Optimized Form Field
export const MobileFormField = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  icon,
  multiline = false,
  rows = 3,
  autoResize = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [textareaHeight, setTextareaHeight] = useState('auto')
  
  const handleTextareaChange = (e) => {
    onChange?.(e)
    
    if (autoResize && multiline) {
      setTextareaHeight('auto')
      setTextareaHeight(`${e.target.scrollHeight}px`)
    }
  }
  
  const InputComponent = multiline ? 'textarea' : 'input'
  
  return (
    <div className={`${styles.mobileFormField} ${isFocused ? styles.focused : ''} ${error ? styles.error : ''}`}>
      {label && (
        <label className={styles.fieldLabel}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.inputContainer}>
        {icon && <div className={styles.inputIcon}>{icon}</div>}
        
        <InputComponent
          type={multiline ? undefined : type}
          value={value}
          onChange={handleTextareaChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={multiline ? rows : undefined}
          style={multiline && autoResize ? { height: textareaHeight } : undefined}
          className={styles.inputField}
          {...props}
        />
      </div>
      
      {error && (
        <div className={styles.errorMessage}>
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}

// Mobile-Friendly Modal
export const MobileModal = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'bottom', // 'center', 'bottom', 'fullscreen'
  showHandle = true
}) => {
  const [startY, setStartY] = useState(null)
  const [currentY, setCurrentY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  
  const handleTouchStart = (e) => {
    if (position !== 'bottom') return
    setStartY(e.touches[0].clientY)
    setIsDragging(true)
  }
  
  const handleTouchMove = (e) => {
    if (!isDragging || !startY) return
    
    const currentY = e.touches[0].clientY
    const deltaY = Math.max(0, currentY - startY)
    setCurrentY(deltaY)
  }
  
  const handleTouchEnd = () => {
    if (!isDragging) return
    
    if (currentY > 100) {
      onClose?.()
    }
    
    setCurrentY(0)
    setStartY(null)
    setIsDragging(false)
  }
  
  if (!isOpen) return null
  
  return (
    <div className={`${styles.mobileModalOverlay} ${styles[position]}`} onClick={onClose}>
      <div
        className={`${styles.mobileModalContent} ${styles[position]}`}
        style={{ transform: `translateY(${currentY}px)` }}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {showHandle && position === 'bottom' && (
          <div className={styles.modalHandle} />
        )}
        
        {title && (
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>{title}</h3>
            <button className={styles.modalClose} onClick={onClose}>
              ✕
            </button>
          </div>
        )}
        
        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  )
}

// Responsive Grid System
export const ResponsiveGrid = ({ 
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = '16px',
  className = ''
}) => {
  const { deviceType } = useResponsive()
  
  const getColumns = () => {
    switch (deviceType) {
      case 'mobile':
        return columns.mobile || 1
      case 'tablet':
        return columns.tablet || 2
      default:
        return columns.desktop || 3
    }
  }
  
  return (
    <div
      className={`${styles.responsiveGrid} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${getColumns()}, 1fr)`,
        gap
      }}
    >
      {children}
    </div>
  )
}

// Mobile Video Player Controls
export const MobileVideoControls = ({
  isPlaying,
  onPlayPause,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  isFullscreen,
  onFullscreenToggle,
  isVisible = true
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [tempTime, setTempTime] = useState(currentTime)
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const handleSeekStart = () => {
    setIsDragging(true)
    setTempTime(currentTime)
  }
  
  const handleSeekChange = (value) => {
    setTempTime(value)
  }
  
  const handleSeekEnd = (value) => {
    setIsDragging(false)
    onSeek?.(value)
  }
  
  return (
    <div className={`${styles.mobileVideoControls} ${isVisible ? styles.visible : styles.hidden}`}>
      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        <input
          type="range"
          min={0}
          max={duration}
          value={isDragging ? tempTime : currentTime}
          onChange={(e) => handleSeekChange(Number(e.target.value))}
          onMouseDown={handleSeekStart}
          onTouchStart={handleSeekStart}
          onMouseUp={(e) => handleSeekEnd(Number(e.target.value))}
          onTouchEnd={(e) => handleSeekEnd(Number(e.target.value))}
          className={styles.progressBar}
        />
        <div className={styles.timeDisplay}>
          {formatTime(isDragging ? tempTime : currentTime)} / {formatTime(duration)}
        </div>
      </div>
      
      {/* Control Buttons */}
      <div className={styles.controlsRow}>
        <button 
          className={styles.controlButton}
          onClick={onPlayPause}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div className={styles.volumeControl}>
          <span>🔊</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={volume}
            onChange={(e) => onVolumeChange?.(Number(e.target.value))}
            className={styles.volumeSlider}
          />
        </div>
        
        <button
          className={styles.controlButton}
          onClick={onFullscreenToggle}
        >
          {isFullscreen ? '🗗' : '⛶'}
        </button>
      </div>
    </div>
  )
}

export default {
  useResponsive,
  AdaptiveLayout,
  MobileNavigation,
  TouchCard,
  MobileFormField,
  MobileModal,
  ResponsiveGrid,
  MobileVideoControls
}
