import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import './FeedbackPlayer.scss'

const FeedbackPlayer = forwardRef(({ videoUrl, onTimeClick, initialTime }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showScreenshot, setShowScreenshot] = useState(false)
  const [screenshotUrl, setScreenshotUrl] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    seekTo: (time) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time
        setCurrentTime(time)
      }
    },
    play: () => {
      if (videoRef.current) {
        videoRef.current.play()
        setIsPlaying(true)
      }
    },
    pause: () => {
      if (videoRef.current) {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    }
  }))

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
    }
  }, [videoUrl])
  
  // Touch gestures for mobile
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    let touchStartX = 0
    let touchStartTime = 0
    
    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX
      touchStartTime = video.currentTime
    }
    
    const handleTouchMove = (e) => {
      if (!touchStartX) return
      
      const touchEndX = e.touches[0].clientX
      const diff = touchEndX - touchStartX
      const seekAmount = (diff / video.clientWidth) * 30 // 30초 범위
      
      video.currentTime = Math.max(0, Math.min(touchStartTime + seekAmount, video.duration))
    }
    
    const handleTouchEnd = () => {
      touchStartX = 0
      touchStartTime = 0
    }
    
    // 모바일에서만 터치 이벤트 추가
    if (window.innerWidth <= 768) {
      video.addEventListener('touchstart', handleTouchStart)
      video.addEventListener('touchmove', handleTouchMove)
      video.addEventListener('touchend', handleTouchEnd)
    }
    
    return () => {
      video.removeEventListener('touchstart', handleTouchStart)
      video.removeEventListener('touchmove', handleTouchMove)
      video.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!videoRef.current) return
      
      switch(e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (e.shiftKey) {
            handleSkip(-1/30) // Frame backward (~1/30 sec)
          } else {
            handleSkip(-10)
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (e.shiftKey) {
            handleSkip(1/30) // Frame forward (~1/30 sec)
          } else {
            handleSkip(10)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          const newVol = Math.min(1, volume + 0.1)
          videoRef.current.volume = newVol
          setVolume(newVol)
          break
        case 'ArrowDown':
          e.preventDefault()
          const newVol2 = Math.max(0, volume - 0.1)
          videoRef.current.volume = newVol2
          setVolume(newVol2)
          break
        case 'f':
          e.preventDefault()
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            videoRef.current.requestFullscreen()
          }
          break
        case 's':
          e.preventDefault()
          handleScreenshot()
          break
        case 'c':
          e.preventDefault()
          handleAddComment()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [volume, isPlaying])

  const togglePlay = () => {
    const video = videoRef.current
    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e) => {
    const video = videoRef.current
    const newTime = (e.target.value / 100) * duration
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100
    videoRef.current.volume = newVolume
    setVolume(newVolume)
  }

  const handlePlaybackRateChange = (rate) => {
    videoRef.current.playbackRate = rate
    setPlaybackRate(rate)
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const handleAddComment = () => {
    if (onTimeClick) {
      onTimeClick(currentTime)
    }
  }

  const handleSkip = (seconds) => {
    const video = videoRef.current
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration))
  }
  
  const handleScreenshot = () => {
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      setScreenshotUrl(url)
      setShowScreenshot(true)
      
      // Auto download
      const a = document.createElement('a')
      a.href = url
      a.download = `screenshot_${formatTime(currentTime).replace(':', '')}.png`
      a.click()
    })
  }

  return (
    <div className="feedback-player">
      <div className="video-container" onMouseEnter={() => setShowHelp(true)} onMouseLeave={() => setShowHelp(false)}>
        <video
          ref={videoRef}
          src={videoUrl}
          onClick={togglePlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => {
            console.error('Video playback error:', e)
            console.error('Video URL:', videoUrl)
          }}
          playsInline
          crossOrigin="anonymous"
        />
        <div className="video-overlay" onClick={togglePlay}>
          {!isPlaying && (
            <div className="play-button">
              <svg viewBox="0 0 24 24" width="60" height="60">
                <path fill="white" d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </div>
        
        {showHelp && (
          <div className="keyboard-help">
            <div className="help-content">
              <h4>단축키 안내</h4>
              <div className="help-grid">
                <div><kbd>Space</kbd> 재생/일시정지</div>
                <div><kbd>←/→</kbd> 10초 이동</div>
                <div><kbd>Shift+←/→</kbd> 프레임 이동</div>
                <div><kbd>↑/↓</kbd> 볼륨 조절</div>
                <div><kbd>F</kbd> 전체화면</div>
                <div><kbd>S</kbd> 스크린샷</div>
                <div><kbd>C</kbd> 코멘트 추가</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="controls">
        <div className="progress-bar">
          <input
            type="range"
            min="0"
            max="100"
            value={(currentTime / duration) * 100 || 0}
            onChange={handleSeek}
            className="seek-slider"
          />
          <div className="progress-fill" style={{ width: `${(currentTime / duration) * 100}%` }} />
        </div>

        <div className="control-buttons">
          <div className="left-controls">
            <button onClick={togglePlay} className="play-pause">
              {isPlaying ? (
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button onClick={() => handleSkip(-10)} className="skip-button">
              -10s
            </button>
            <button onClick={() => handleSkip(10)} className="skip-button">
              +10s
            </button>

            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="right-controls">
            <button onClick={handleAddComment} className="add-comment-btn">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
              </svg>
              코멘트 추가
            </button>
            
            <button onClick={handleScreenshot} className="screenshot-btn" title="스크린샷">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
              </svg>
            </button>

            <div className="volume-control">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>

            <div className="playback-rate">
              <select 
                value={playbackRate} 
                onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>

            <button 
              onClick={() => videoRef.current.requestFullscreen()} 
              className="fullscreen-btn"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

FeedbackPlayer.displayName = 'FeedbackPlayer'
export default FeedbackPlayer