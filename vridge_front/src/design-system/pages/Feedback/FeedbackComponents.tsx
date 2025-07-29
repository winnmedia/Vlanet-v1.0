import React, { ReactNode } from 'react'
import classNames from 'classnames'
import styles from './Feedback.module.scss'
import { Button } from '../../../components/unified/Button'

// 피드백 페이지 레이아웃
interface FeedbackPageProps {
  children: ReactNode
  className?: string
}

export const FeedbackPage: React.FC<FeedbackPageProps> = ({ children, className }) => {
  return (
    <div className={classNames(styles.feedbackPage, className)}>
      {children}
    </div>
  )
}

// 피드백 컨테이너
interface FeedbackContainerProps {
  videoSection: ReactNode
  sidebarSection: ReactNode
  className?: string
}

export const FeedbackContainer: React.FC<FeedbackContainerProps> = ({ 
  videoSection, 
  sidebarSection, 
  className 
}) => {
  return (
    <div className={classNames(styles.feedbackContainer, className)}>
      {videoSection}
      {sidebarSection}
    </div>
  )
}

// 비디오 섹션
interface VideoSectionProps {
  title: string
  onInfoClick?: () => void
  children: ReactNode
  className?: string
}

export const VideoSection: React.FC<VideoSectionProps> = ({ 
  title, 
  onInfoClick, 
  children, 
  className 
}) => {
  return (
    <div className={classNames(styles.videoSection, className)}>
      <div className={styles.videoHeader}>
        <h2 className={styles.projectTitle}>{title}</h2>
        {onInfoClick && (
          <Button 
            variant="ghost" 
            size="sm" 
            className={styles.infoButton} 
            onClick={onInfoClick}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </Button>
        )}
      </div>
      {children}
    </div>
  )
}

// 비디오 플레이어 래퍼
interface VideoPlayerWrapperProps {
  children: ReactNode
  loading?: boolean
  className?: string
}

export const VideoPlayerWrapper: React.FC<VideoPlayerWrapperProps> = ({ 
  children, 
  loading = false, 
  className 
}) => {
  return (
    <div className={classNames(styles.videoPlayerWrapper, className)}>
      {loading ? (
        <div className={styles.playerLoading}>로딩 중...</div>
      ) : (
        children
      )}
    </div>
  )
}

// 비디오 컨트롤
interface VideoControlsProps {
  onAddFeedback?: () => void
  onUpload?: () => void
  onDelete?: () => void
  onShare?: () => void
  onScreenshot?: () => void
  onFullview?: () => void
  className?: string
}

export const VideoControls: React.FC<VideoControlsProps> = ({ 
  onAddFeedback,
  onUpload,
  onDelete,
  onShare,
  onScreenshot,
  onFullview,
  className 
}) => {
  return (
    <div className={classNames(styles.videoControls, className)}>
      {onAddFeedback && (
        <Button 
          variant="ghost" 
          size="sm" 
          className={styles.controlButton} 
          onClick={onAddFeedback} 
          title="피드백 추가"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </Button>
      )}
      {onUpload && (
        <Button 
          variant="ghost" 
          size="sm" 
          className={styles.controlButton} 
          onClick={onUpload} 
          title="영상 업로드"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
          </svg>
        </Button>
      )}
      {onDelete && (
        <Button 
          variant="ghost" 
          size="sm" 
          className={styles.controlButton} 
          onClick={onDelete} 
          title="영상 삭제"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </Button>
      )}
      <div className={styles.controlDivider} />
      {onShare && (
        <Button 
          variant="ghost" 
          size="sm" 
          className={styles.controlButton} 
          onClick={onShare} 
          title="공유"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
          </svg>
        </Button>
      )}
      {onScreenshot && (
        <Button 
          variant="ghost" 
          size="sm" 
          className={styles.controlButton} 
          onClick={onScreenshot} 
          title="스크린샷"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        </Button>
      )}
      {onFullview && (
        <Button 
          variant="ghost" 
          size="sm" 
          className={styles.controlButton} 
          onClick={onFullview} 
          title="전체보기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5.83L15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9 12 5.83zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15 12 18.17z"/>
          </svg>
        </Button>
      )}
    </div>
  )
}

// 피드백 사이드바
interface FeedbackSidebarProps {
  title: string
  children: ReactNode
  className?: string
}

export const FeedbackSidebar: React.FC<FeedbackSidebarProps> = ({ 
  title, 
  children, 
  className 
}) => {
  return (
    <div className={classNames(styles.feedbackSidebar, className)}>
      <div className={styles.sidebarHeader}>
        <h3 className={styles.sidebarTitle}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

// 탭 메뉴
interface Tab {
  id: string
  label: string
}

interface TabMenuProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export const TabMenu: React.FC<TabMenuProps> = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className 
}) => {
  return (
    <div className={classNames(styles.tabMenu, className)}>
      {tabs.map(tab => (
        <Button 
          key={tab.id}
          variant={activeTab === tab.id ? "primary" : "ghost"}
          size="sm"
          className={classNames(
            styles.tabButton,
            { [styles.active]: activeTab === tab.id }
          )}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  )
}

// 탭 컨텐츠
interface TabContentProps {
  children: ReactNode
  className?: string
}

export const TabContent: React.FC<TabContentProps> = ({ children, className }) => {
  return (
    <div className={classNames(styles.tabContent, className)}>
      {children}
    </div>
  )
}

// 피드백 아이템
interface FeedbackItemProps {
  user: {
    name: string
    avatar?: string
  }
  content: string
  timestamp: string
  timeInVideo?: string
  selected?: boolean
  onClick?: () => void
  className?: string
}

export const FeedbackItem: React.FC<FeedbackItemProps> = ({ 
  user, 
  content, 
  timestamp, 
  timeInVideo,
  selected = false,
  onClick,
  className 
}) => {
  return (
    <div 
      className={classNames(
        styles.feedbackItem,
        { [styles.selected]: selected },
        className
      )}
      onClick={onClick}
    >
      <div className={styles.feedbackHeader}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user.avatar || user.name.charAt(0).toUpperCase()}
          </div>
          <span className={styles.userName}>{user.name}</span>
        </div>
        <span className={styles.timestamp}>{timestamp}</span>
      </div>
      <div className={styles.feedbackContent}>
        {timeInVideo && (
          <span className={styles.timeBadge}>{timeInVideo}</span>
        )}
        {content}
      </div>
    </div>
  )
}

// 피드백 입력
interface FeedbackInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const FeedbackInput: React.FC<FeedbackInputProps> = ({ 
  value, 
  onChange, 
  onSend,
  placeholder = "피드백을 입력하세요...",
  disabled = false,
  className 
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className={classNames(styles.feedbackInput, className)}>
      <div className={styles.inputWrapper}>
        <textarea
          className={styles.textInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
        />
        <Button 
          variant="primary"
          size="sm"
          className={styles.sendButton}
          onClick={onSend}
          disabled={disabled || !value.trim()}
        >
          전송
        </Button>
      </div>
    </div>
  )
}