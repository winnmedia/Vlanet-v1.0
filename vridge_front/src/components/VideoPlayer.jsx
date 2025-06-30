import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import FeedbackPlayer from './FeedbackPlayer'
import './VideoPlayer.scss'

const VideoPlayer = forwardRef(({ videoUrl, onTimeClick, initialTime, onError, onFeedbackClick }, ref) => {
  const [useNativePlayer, setUseNativePlayer] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const playerRef = useRef(null)
  
  // URL 유효성 검사
  const isValidUrl = (url) => {
    if (!url) return false
    // 절대 경로 또는 상대 경로 모두 허용
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')
  }
  
  const isUrlValid = isValidUrl(videoUrl)
  
  // Expose methods to parent - Hook must be called unconditionally
  useImperativeHandle(ref, () => ({
    seekTo: (time) => {
      if (playerRef.current && isUrlValid) {
        playerRef.current.seekTo(time)
      }
    },
    play: () => {
      if (playerRef.current && isUrlValid) {
        playerRef.current.play()
      }
    },
    pause: () => {
      if (playerRef.current && isUrlValid) {
        playerRef.current.pause()
      }
    }
  }))
  
  const handleError = (e) => {
    console.error('Video playback error detected, switching to native player')
    setVideoError(true)
    setUseNativePlayer(true)
    if (onError) onError(e)
  }
  
  // 파일 확장자 확인
  const getFileExtension = (url) => {
    if (!url) return ''
    const match = url.match(/\.([^.]+)(?:\?.*)?$/)
    return match ? match[1].toLowerCase() : ''
  }
  
  const extension = getFileExtension(videoUrl)
  
  // 문제가 될 수 있는 형식은 네이티브 플레이어 사용
  useEffect(() => {
    const problematicFormats = ['avi', 'mkv', 'wmv', 'flv', 'm4v']
    
    if (!isUrlValid) {
      setIsChecking(false)
      return
    }
    
    setIsChecking(true)
    setVideoError(false)
    
    // 짧은 지연 후 형식 확인
    const checkTimer = setTimeout(() => {
      if (problematicFormats.includes(extension)) {
        console.log(`Detected ${extension} format, using native player`)
        setUseNativePlayer(true)
      } else {
        setUseNativePlayer(false)
      }
      setIsChecking(false)
    }, 100)
    
    return () => clearTimeout(checkTimer)
  }, [videoUrl, extension, isUrlValid])
  
  // URL이 유효하지 않은 경우
  if (!isUrlValid) {
    console.error('Invalid video URL:', videoUrl)
    return (
      <div className="video-player-wrapper">
        <div className="error-container">
          <p>⚠️ 유효하지 않은 비디오 URL입니다.</p>
          <p className="error-detail">URL: {videoUrl || '없음'}</p>
        </div>
      </div>
    )
  }
  
  if (isChecking) {
    return (
      <div className="video-player-wrapper">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>비디오 형식 확인 중...</p>
        </div>
      </div>
    )
  }
  
  if (useNativePlayer || videoError) {
    return (
      <div className="video-player-wrapper">
        <div className="native-player-container">
          {videoError && (
            <div className="format-warning">
              <p>⚠️ 커스텀 플레이어에서 재생할 수 없는 형식입니다.</p>
              <p>브라우저 기본 플레이어를 사용합니다.</p>
            </div>
          )}
          <video
            ref={playerRef}
            src={videoUrl}
            controls
            width="100%"
            height="100%"
            crossOrigin="anonymous"
            onError={(e) => {
              console.error('Native player also failed:', e)
              if (onError) onError(e)
            }}
          >
            <source src={videoUrl} type={`video/${extension}`} />
            <source src={videoUrl} />
            브라우저가 비디오 재생을 지원하지 않습니다.
          </video>
          <div className="player-info">
            <small>네이티브 플레이어 사용 중 | 형식: {extension.toUpperCase()}</small>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <FeedbackPlayer
      ref={playerRef}
      videoUrl={videoUrl}
      onTimeClick={onTimeClick}
      initialTime={initialTime}
      onError={handleError}
      onFeedbackClick={onFeedbackClick}
    />
  )
})

VideoPlayer.displayName = 'VideoPlayer'
export default VideoPlayer