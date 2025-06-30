import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import './FeedbackPlayer.scss'

const FeedbackPlayer = forwardRef(({ videoUrl, onTimeClick, initialTime, onError, onFeedbackClick }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showScreenshot, setShowScreenshot] = useState(false)
  const [screenshotUrl, setScreenshotUrl] = useState(null)
  const isMountedRef = useRef(true)
  
  // 컴포넌트 언마운트 감지
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false) // 기본값을 false로 설정
  
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
    if (!video || !videoUrl) return

    console.log('Video URL changed:', videoUrl)
    
    // URL 유효성 검사 (더 느슨하게)
    console.log('Checking video URL validity:', videoUrl);
    
    // 비디오 src 직접 설정
    video.src = videoUrl;
    
    // 에러 핸들러 추가
    const handleError = (e) => {
      console.error('Video error event:', e);
      console.error('Video readyState:', video.readyState);
      console.error('Video networkState:', video.networkState);
      console.error('Current src:', video.src);
    };
    
    video.addEventListener('error', handleError);
    video.load();

    // 로딩 타임아웃 설정 (30초)
    const loadingTimeout = setTimeout(() => {
      if (isLoading && isMountedRef.current) {
        setError('영상 로딩 시간이 초과되었습니다. 페이지를 새로고침해주세요.');
        setIsLoading(false);
      }
    }, 30000);

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => {
      setDuration(video.duration)
      setIsLoading(false)
      clearTimeout(loadingTimeout)
      console.log('Video duration:', video.duration)
    }
    const handleLoadStart = () => {
      // 처음 URL이 설정될 때만 로딩 상태로 설정
      if (!video.src || video.src !== videoUrl) {
        setIsLoading(true)
        setError(null)
        console.log('Video loading started')
      }
    }
    const handleCanPlay = () => {
      setIsLoading(false)
      setError(null)
      clearTimeout(loadingTimeout)
      console.log('Video can play')
    }
    const handleLoadedData = () => {
      setIsLoading(false)
      setError(null)
      clearTimeout(loadingTimeout)
      console.log('Video data loaded')
    }

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('loadeddata', handleLoadedData)

    return () => {
      clearTimeout(loadingTimeout)
      
      // 비디오 정리 - 재생 중지 및 src 제거로 play() 인터럽트 방지
      if (video) {
        video.pause()
        video.removeAttribute('src')
        video.load()
      }
      
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('error', handleError)
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
    if (!video) return;
    
    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      // play() 프로미스를 적절히 처리
      const playPromise = video.play()
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // 재생 성공 - 컴포넌트가 마운트된 경우에만 상태 업데이트
            if (isMountedRef.current) {
              setIsPlaying(true)
            }
          })
          .catch((error) => {
            // 재생 실패 - DOM 제거 등의 이유
            if (error.name === 'AbortError') {
              console.log('Playback was prevented')
            } else if (error.name === 'NotAllowedError') {
              // 사용자 상호작용이 필요한 경우
              console.log('User interaction required')
              setError('재생 버튼을 다시 클릭해주세요.')
              setTimeout(() => setError(null), 3000)
            } else {
              console.error('Error attempting to play video:', error)
              setError('영상 재생에 실패했습니다.')
            }
            
            if (isMountedRef.current) {
              setIsPlaying(false)
            }
          })
      } else {
        // 구형 브라우저의 경우
        setIsPlaying(true)
      }
    }
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
    if (onFeedbackClick) {
      onFeedbackClick(currentTime)
    } else if (onTimeClick) {
      onTimeClick(currentTime)
    }
  }

  const handleSkip = (seconds) => {
    const video = videoRef.current
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration))
  }
  
  const handleScreenshot = () => {
    try {
      const video = videoRef.current
      
      // 비디오가 로드되었는지 확인
      if (!video || video.readyState < 2) {
        console.error('Video not ready for screenshot')
        alert('영상이 아직 로드되지 않았습니다.')
        return
      }
      
      // Canvas 생성
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || video.clientWidth
      canvas.height = video.videoHeight || video.clientHeight
      
      const ctx = canvas.getContext('2d')
      
      // 비디오 프레임을 캔버스에 그리기
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // 이미지 데이터 URL로 변환
        const dataURL = canvas.toDataURL('image/png', 1.0)
        
        // 다운로드 링크 생성
        const a = document.createElement('a')
        a.href = dataURL
        a.download = `screenshot_${formatTime(currentTime).replace(':', '-')}_${Date.now()}.png`
        
        // 다운로드 실행
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        
        // 성공 메시지
        console.log('Screenshot saved successfully')
        // alert('스크린샷이 저장되었습니다.')
      } catch (e) {
        console.error('Screenshot failed:', e)
        // CORS 에러 메시지 개선
        if (e.name === 'SecurityError') {
          alert('CORS 정책으로 인해 스크린샷을 찍을 수 없습니다.\n\n이 기능을 사용하려면 서버에서 적절한 CORS 헤더가 설정되어야 합니다.')
        } else {
          alert('스크린샷 캡처에 실패했습니다.')
        }
      }
    } catch (error) {
      console.error('Screenshot error:', error)
      alert('스크린샷 캡처 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="feedback-player">
      <div className="video-container">
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>영상 로딩중...</p>
          </div>
        )}
        {error && (
          <div className="error-overlay">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="#ff4444" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <p>{error}</p>
            <p className="error-url">URL: {videoUrl}</p>
          </div>
        )}
        <video
          ref={videoRef}
          onClick={togglePlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          crossOrigin="anonymous"
          onError={(e) => {
            // source 태그의 에러는 무시 (video 태그의 에러만 처리)
            if (e.target.tagName.toLowerCase() === 'source') {
              return;
            }
            
            const error = e.target.error;
            console.error('Video playback error:', e)
            console.error('Video URL:', videoUrl)
            console.error('Error details:', error)
            
            let errorMessage = '영상을 재생할 수 없습니다.';
            if (error) {
              switch(error.code) {
                case error.MEDIA_ERR_NETWORK:
                  errorMessage = '네트워크 오류: 영상을 로드할 수 없습니다.';
                  break;
                case error.MEDIA_ERR_DECODE:
                  errorMessage = '디코드 오류: 영상 형식을 지원하지 않습니다.';
                  break;
                case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                  errorMessage = '지원하지 않는 영상 형식입니다. MP4, WebM, OGG 형식을 권장합니다.';
                  break;
                case error.MEDIA_ERR_ABORTED:
                  errorMessage = '영상 로드가 취소되었습니다.';
                  break;
              }
            }
            
            // 파일 확장자 확인
            const extension = videoUrl.split('.').pop().toLowerCase();
            const supportedFormats = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
            if (!supportedFormats.includes(extension)) {
              errorMessage += ` (${extension} 형식은 브라우저에서 직접 재생이 어려울 수 있습니다)`;
            }
            
            setError(errorMessage)
            setIsLoading(false)
            if (onError) onError(e)
          }}
          onLoadedData={() => {
            console.log('Video loaded successfully:', videoUrl)
            setError(null)
          }}
          playsInline
          controls={false}
          preload="metadata"
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


            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="right-controls">
            <button onClick={handleAddComment} className="icon-button comment-button" title="현재 시점에 피드백 추가">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
              </svg>
              <span className="button-text">현재 시점에 피드백</span>
            </button>
            
            <button onClick={handleScreenshot} className="icon-button" title="스크린샷 찍기">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
              </svg>
            </button>

            <div className="volume-control" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
              <button className="icon-button volume-button" onClick={() => setVolume(volume > 0 ? 0 : 1)}>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  {volume === 0 ? (
                    <path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  ) : volume < 0.5 ? (
                    <path fill="currentColor" d="M7 9v6h4l5 5V4l-5 5H7z" />
                  ) : (
                    <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  )}
                </svg>
              </button>
              <div className={`volume-slider-container ${showVolumeSlider ? 'show' : ''}`}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
              </div>
            </div>

            <div className="playback-rate">
              <button className="icon-button rate-button" onClick={() => {
                const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
                const currentIndex = rates.indexOf(playbackRate);
                const nextIndex = (currentIndex + 1) % rates.length;
                handlePlaybackRateChange(rates[nextIndex]);
              }}>
                <span className="rate-text">{playbackRate}x</span>
              </button>
            </div>

            <button 
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  videoRef.current.requestFullscreen();
                }
              }} 
              className="icon-button"
              title="전체화면"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                {document.fullscreenElement ? (
                  <path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                ) : (
                  <path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                )}
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