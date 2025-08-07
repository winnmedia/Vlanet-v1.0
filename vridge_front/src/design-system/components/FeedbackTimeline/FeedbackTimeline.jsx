import React, { useEffect, useState, useRef } from 'react'
import styles from './FeedbackTimeline.module.scss'
import { colors, getFeedbackColor } from '../../tokens/colors'
import moment from 'moment'
import { Progress, Timeline, message } from 'antd'

const FeedbackTimeline = ({ 
  feedbacks = [],
  videoMetadata = { duration: 0 },
  currentTime = 0,
  onSeekTo,
  onFeedbackClick,
  onAddFeedback,
  isPlaying = false,
  viewMode = 'timeline' // 'timeline', 'list', 'heatmap'
}) => {
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newFeedbackTime, setNewFeedbackTime] = useState(0)
  const timelineRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  // Convert time to pixel position
  const timeToPixel = (time) => {
    if (!videoMetadata.duration) return 0
    return (time / videoMetadata.duration) * 100
  }

  // Convert pixel position to time
  const pixelToTime = (pixel, containerWidth) => {
    return (pixel / containerWidth) * videoMetadata.duration
  }

  // Handle timeline click for seeking
  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = pixelToTime(clickX, rect.width)
    
    onSeekTo?.(newTime)
  }

  // Handle double click to add feedback
  const handleTimelineDoubleClick = (e) => {
    if (!timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const time = pixelToTime(clickX, rect.width)
    
    setNewFeedbackTime(time)
    setShowAddModal(true)
  }

  // Group feedbacks by time proximity
  const groupFeedbacks = (feedbacks, threshold = 5) => {
    const groups = []
    const sortedFeedbacks = [...feedbacks].sort((a, b) => a.timestamp - b.timestamp)
    
    sortedFeedbacks.forEach(feedback => {
      const existingGroup = groups.find(group => 
        Math.abs(group.timestamp - feedback.timestamp) <= threshold
      )
      
      if (existingGroup) {
        existingGroup.feedbacks.push(feedback)
      } else {
        groups.push({
          timestamp: feedback.timestamp,
          feedbacks: [feedback]
        })
      }
    })
    
    return groups
  }

  const feedbackGroups = groupFeedbacks(feedbacks)

  return (
    <div className={styles.feedbackTimelineContainer}>
      {/* Header Controls */}
      <div className={styles.timelineHeader}>
        <div className={styles.headerLeft}>
          <h3 className={styles.timelineTitle}>📝 피드백 타임라인</h3>
          <div className={styles.viewModeToggle}>
            {['timeline', 'list', 'heatmap'].map(mode => (
              <button
                key={mode}
                className={`${styles.modeButton} ${viewMode === mode ? styles.active : ''}`}
                onClick={() => {}}
              >
                {mode === 'timeline' && '📊'}
                {mode === 'list' && '📋'}
                {mode === 'heatmap' && '🔥'}
              </button>
            ))}
          </div>
        </div>
        
        <div className={styles.headerRight}>
          <div className={styles.timeDisplay}>
            {formatTime(currentTime)} / {formatTime(videoMetadata.duration)}
          </div>
          <button 
            className={styles.addFeedbackButton}
            onClick={() => {
              setNewFeedbackTime(currentTime)
              setShowAddModal(true)
            }}
          >
            💬 피드백 추가
          </button>
        </div>
      </div>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className={styles.timelineView}>
          {/* Time ruler */}
          <div className={styles.timeRuler}>
            {Array.from({ length: 11 }, (_, i) => {
              const time = (videoMetadata.duration / 10) * i
              return (
                <div key={i} className={styles.timeMarker}>
                  <div className={styles.timeTick} />
                  <div className={styles.timeLabel}>{formatTime(time)}</div>
                </div>
              )
            })}
          </div>

          {/* Main timeline track */}
          <div 
            ref={timelineRef}
            className={styles.timelineTrack}
            onClick={handleTimelineClick}
            onDoubleClick={handleTimelineDoubleClick}
          >
            {/* Progress indicator */}
            <div 
              className={styles.progressIndicator}
              style={{ left: `${timeToPixel(currentTime)}%` }}
            >
              <div className={styles.progressLine} />
              <div className={styles.progressHandle}>
                <div className={styles.currentTime}>
                  {formatTime(currentTime)}
                </div>
              </div>
            </div>

            {/* Feedback markers */}
            {feedbackGroups.map((group, index) => (
              <FeedbackMarker
                key={index}
                group={group}
                position={timeToPixel(group.timestamp)}
                isSelected={selectedFeedback?.id === group.feedbacks[0]?.id}
                onClick={() => {
                  setSelectedFeedback(group.feedbacks[0])
                  onFeedbackClick?.(group.feedbacks[0])
                  onSeekTo?.(group.timestamp)
                }}
              />
            ))}

            {/* Playback zones */}
            <div className={styles.playbackZones}>
              {generatePlaybackZones(feedbacks, videoMetadata.duration).map((zone, index) => (
                <div
                  key={index}
                  className={`${styles.playbackZone} ${styles[zone.type]}`}
                  style={{
                    left: `${timeToPixel(zone.start)}%`,
                    width: `${timeToPixel(zone.end - zone.start)}%`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Feedback threads */}
          <div className={styles.feedbackThreads}>
            {feedbackGroups.map((group, index) => (
              <FeedbackThread
                key={index}
                group={group}
                position={timeToPixel(group.timestamp)}
                isExpanded={selectedFeedback?.id === group.feedbacks[0]?.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className={styles.listView}>
          <div className={styles.feedbackList}>
            {feedbacks
              .sort((a, b) => a.timestamp - b.timestamp)
              .map((feedback, index) => (
                <FeedbackListItem
                  key={feedback.id}
                  feedback={feedback}
                  onClick={() => {
                    setSelectedFeedback(feedback)
                    onFeedbackClick?.(feedback)
                    onSeekTo?.(feedback.timestamp)
                  }}
                  isSelected={selectedFeedback?.id === feedback.id}
                />
              ))}
          </div>
        </div>
      )}

      {/* Heatmap View */}
      {viewMode === 'heatmap' && (
        <div className={styles.heatmapView}>
          <FeedbackHeatmap 
            feedbacks={feedbacks}
            videoDuration={videoMetadata.duration}
            onTimeClick={onSeekTo}
          />
        </div>
      )}

      {/* Add Feedback Modal */}
      {showAddModal && (
        <AddFeedbackModal
          timestamp={newFeedbackTime}
          onSubmit={(feedbackData) => {
            onAddFeedback?.({ ...feedbackData, timestamp: newFeedbackTime })
            setShowAddModal(false)
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}

// Feedback Marker Component
const FeedbackMarker = ({ group, position, isSelected, onClick }) => {
  const totalFeedbacks = group.feedbacks.length
  const urgentCount = group.feedbacks.filter(f => f.priority === 'urgent').length
  const resolvedCount = group.feedbacks.filter(f => f.status === 'resolved').length
  
  const markerType = urgentCount > 0 ? 'urgent' : 
                     resolvedCount === totalFeedbacks ? 'resolved' : 'active'

  return (
    <div
      className={`${styles.feedbackMarker} ${styles[markerType]} ${
        isSelected ? styles.selected : ''
      }`}
      style={{ left: `${position}%` }}
      onClick={onClick}
    >
      <div className={styles.markerDot} />
      {totalFeedbacks > 1 && (
        <div className={styles.markerCount}>{totalFeedbacks}</div>
      )}
      <div className={styles.markerTooltip}>
        <div className={styles.tooltipTime}>
          {formatTime(group.timestamp)}
        </div>
        <div className={styles.tooltipContent}>
          {totalFeedbacks}개의 피드백
        </div>
      </div>
    </div>
  )
}

// Feedback Thread Component
const FeedbackThread = ({ group, position, isExpanded }) => {
  if (!isExpanded) return null

  return (
    <div 
      className={styles.feedbackThread}
      style={{ left: `${position}%` }}
    >
      <div className={styles.threadConnector} />
      <div className={styles.threadContent}>
        {group.feedbacks.map(feedback => (
          <div key={feedback.id} className={styles.threadItem}>
            <div className={styles.threadHeader}>
              <div className={styles.threadAuthor}>{feedback.author}</div>
              <div className={styles.threadTime}>
                {moment(feedback.created_at).fromNow()}
              </div>
            </div>
            <div className={styles.threadMessage}>{feedback.message}</div>
            <div className={styles.threadStatus}>
              <span className={`${styles.statusBadge} ${styles[feedback.status]}`}>
                {getStatusLabel(feedback.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Feedback List Item Component
const FeedbackListItem = ({ feedback, onClick, isSelected }) => {
  const statusColor = getFeedbackColor(feedback.status)

  return (
    <div 
      className={`${styles.feedbackListItem} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
    >
      <div className={styles.listItemLeft}>
        <div 
          className={styles.listItemMarker}
          style={{ backgroundColor: statusColor?.main }}
        />
        <div className={styles.listItemTime}>
          {formatTime(feedback.timestamp)}
        </div>
      </div>
      
      <div className={styles.listItemContent}>
        <div className={styles.listItemHeader}>
          <div className={styles.listItemAuthor}>{feedback.author}</div>
          <div className={styles.listItemMeta}>
            <span className={`${styles.priorityBadge} ${styles[feedback.priority]}`}>
              {getPriorityLabel(feedback.priority)}
            </span>
            <span className={styles.listItemDate}>
              {moment(feedback.created_at).format('MM/DD HH:mm')}
            </span>
          </div>
        </div>
        <div className={styles.listItemMessage}>{feedback.message}</div>
        {feedback.replies && feedback.replies.length > 0 && (
          <div className={styles.listItemReplies}>
            💬 {feedback.replies.length}개의 답글
          </div>
        )}
      </div>
    </div>
  )
}

// Feedback Heatmap Component
const FeedbackHeatmap = ({ feedbacks, videoDuration, onTimeClick }) => {
  const segments = 100 // Divide video into 100 segments
  const segmentDuration = videoDuration / segments
  
  const heatmapData = Array.from({ length: segments }, (_, i) => {
    const startTime = i * segmentDuration
    const endTime = (i + 1) * segmentDuration
    
    const segmentFeedbacks = feedbacks.filter(f => 
      f.timestamp >= startTime && f.timestamp < endTime
    )
    
    return {
      segment: i,
      count: segmentFeedbacks.length,
      intensity: Math.min(segmentFeedbacks.length / 5, 1) // Max intensity at 5+ feedbacks
    }
  })

  return (
    <div className={styles.heatmapContainer}>
      <div className={styles.heatmapGrid}>
        {heatmapData.map(data => (
          <div
            key={data.segment}
            className={styles.heatmapSegment}
            style={{
              backgroundColor: data.count > 0 ? 
                `rgba(239, 68, 68, ${data.intensity})` : 
                'transparent'
            }}
            onClick={() => onTimeClick?.(data.segment * segmentDuration)}
            title={`${formatTime(data.segment * segmentDuration)}: ${data.count}개 피드백`}
          />
        ))}
      </div>
      
      <div className={styles.heatmapLegend}>
        <span>적음</span>
        <div className={styles.legendGradient} />
        <span>많음</span>
      </div>
    </div>
  )
}

// Add Feedback Modal Component
const AddFeedbackModal = ({ timestamp, onSubmit, onClose }) => {
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('normal')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!message.trim()) return
    
    onSubmit({
      message: message.trim(),
      priority,
      timestamp,
      status: 'pending',
      created_at: new Date().toISOString()
    })
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>피드백 추가</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.timestampInfo}>
            📍 {formatTime(timestamp)}
          </div>
          
          <div className={styles.formGroup}>
            <label>피드백 내용</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="이 시점에 대한 피드백을 작성해주세요..."
              rows={4}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>우선순위</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">낮음</option>
              <option value="normal">보통</option>
              <option value="high">높음</option>
              <option value="urgent">긴급</option>
            </select>
          </div>
          
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              취소
            </button>
            <button type="submit" className={styles.submitButton}>
              추가하기
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Utility functions
const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const getStatusLabel = (status) => {
  const labels = {
    'pending': '대기',
    'in-progress': '진행중',
    'resolved': '해결됨',
    'rejected': '거절됨'
  }
  return labels[status] || status
}

const getPriorityLabel = (priority) => {
  const labels = {
    'low': '낮음',
    'normal': '보통',
    'high': '높음',
    'urgent': '긴급'
  }
  return labels[priority] || priority
}

const generatePlaybackZones = (feedbacks, duration) => {
  // Generate zones based on feedback density
  const zones = []
  const zoneSize = duration / 20 // Divide into 20 zones
  
  for (let i = 0; i < 20; i++) {
    const start = i * zoneSize
    const end = (i + 1) * zoneSize
    const zoneFeedbacks = feedbacks.filter(f => f.timestamp >= start && f.timestamp < end)
    
    if (zoneFeedbacks.length > 0) {
      const type = zoneFeedbacks.some(f => f.priority === 'urgent') ? 'critical' :
                   zoneFeedbacks.length > 2 ? 'high' : 'normal'
      
      zones.push({ start, end, type, count: zoneFeedbacks.length })
    }
  }
  
  return zones
}

export default FeedbackTimeline
