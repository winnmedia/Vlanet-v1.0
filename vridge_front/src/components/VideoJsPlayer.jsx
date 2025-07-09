import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import '@videojs/themes/dist/sea/index.css'
import './VideoJsPlayer.scss'

const VideoJsPlayer = forwardRef(({ 
  videoUrl, 
  onTimeClick, 
  initialTime = 0, 
  onError, 
  onFeedbackClick,
  feedbacks = [],
  autoplay = false,
  muted = false,
  fluid = true,
  responsive = true,
  playbackRates = [0.5, 1, 1.5, 2],
  controls = true
}, ref) => {
  const videoRef = useRef(null)
  const playerRef = useRef(null)

  // 부모 컴포넌트에서 사용할 수 있는 메서드들
  useImperativeHandle(ref, () => ({
    seekTo: (time) => {
      if (playerRef.current) {
        playerRef.current.currentTime(time)
      }
    },
    play: () => {
      if (playerRef.current) {
        playerRef.current.play()
      }
    },
    pause: () => {
      if (playerRef.current) {
        playerRef.current.pause()
      }
    },
    getCurrentTime: () => {
      return playerRef.current ? playerRef.current.currentTime() : 0
    },
    getDuration: () => {
      return playerRef.current ? playerRef.current.duration() : 0
    },
    takeScreenshot: () => {
      if (playerRef.current && videoRef.current) {
        const canvas = document.createElement('canvas')
        const video = videoRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL('image/png')
      }
      return null
    }
  }))

  useEffect(() => {
    // Video.js 플레이어 옵션
    const options = {
      autoplay,
      muted,
      controls,
      responsive,
      fluid,
      playbackRates,
      controlBar: {
        volumePanel: {
          inline: false
        },
        currentTimeDisplay: true,
        timeDivider: true,
        durationDisplay: true,
        remainingTimeDisplay: false,
        customControlSpacer: true,
        playbackRateMenuButton: {
          playbackRates
        },
        fullscreenToggle: true
      },
      userActions: {
        hotkeys: function(event) {
          // 스페이스바: 재생/일시정지
          if (event.which === 32) {
            event.preventDefault()
            if (this.paused()) {
              this.play()
            } else {
              this.pause()
            }
          }
          // 왼쪽 화살표: 10초 뒤로
          if (event.which === 37) {
            event.preventDefault()
            this.currentTime(Math.max(0, this.currentTime() - 10))
          }
          // 오른쪽 화살표: 10초 앞으로
          if (event.which === 39) {
            event.preventDefault()
            this.currentTime(Math.min(this.duration(), this.currentTime() + 10))
          }
          // 위쪽 화살표: 볼륨 증가
          if (event.which === 38) {
            event.preventDefault()
            this.volume(Math.min(1, this.volume() + 0.1))
          }
          // 아래쪽 화살표: 볼륨 감소
          if (event.which === 40) {
            event.preventDefault()
            this.volume(Math.max(0, this.volume() - 0.1))
          }
          // F 키: 전체화면
          if (event.which === 70) {
            event.preventDefault()
            if (!this.isFullscreen()) {
              this.requestFullscreen()
            } else {
              this.exitFullscreen()
            }
          }
          // S 키: 스크린샷
          if (event.which === 83) {
            event.preventDefault()
            if (onTimeClick) {
              const screenshotUrl = ref.current?.takeScreenshot()
              if (screenshotUrl) {
                onTimeClick(this.currentTime(), screenshotUrl)
              }
            }
          }
        }
      }
    }

    // 비디오 요소가 준비되었을 때만 플레이어 초기화
    if (!playerRef.current && videoRef.current) {
      const player = videojs(videoRef.current, options, function onPlayerReady() {
        console.log('VideoJS Player is ready')
        
        // 초기 시간으로 이동
        if (initialTime > 0) {
          this.currentTime(initialTime)
        }

        // 에러 핸들링
        this.on('error', (error) => {
          console.error('Video error:', error)
          if (onError) {
            onError(error)
          }
        })

        // 피드백 마커 추가
        if (feedbacks && feedbacks.length > 0) {
          feedbacks.forEach(feedback => {
            if (feedback.time_position) {
              // 마커 추가 (플러그인 필요)
              // 임시로 콘솔에 로그
              console.log('Feedback at', feedback.time_position, feedback)
            }
          })
        }

        // 클릭 이벤트로 피드백 추가
        this.on('click', (e) => {
          // 컨트롤바가 아닌 비디오 영역 클릭 시
          if (e.target === this.el() || e.target.classList.contains('vjs-tech')) {
            if (onFeedbackClick) {
              const rect = this.el().getBoundingClientRect()
              const x = ((e.clientX - rect.left) / rect.width) * 100
              const y = ((e.clientY - rect.top) / rect.height) * 100
              onFeedbackClick(this.currentTime(), x, y)
            }
          }
        })
      })

      playerRef.current = player
    }

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [videoUrl]) // videoUrl이 변경될 때만 재초기화

  // 소스 업데이트
  useEffect(() => {
    if (playerRef.current && videoUrl) {
      playerRef.current.src({ type: 'video/mp4', src: videoUrl })
    }
  }, [videoUrl])

  return (
    <div className="video-js-player-wrapper">
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-theme-sea vjs-big-play-centered"
          playsInline
          crossOrigin="anonymous"
        />
      </div>
      
      {/* 키보드 단축키 안내 */}
      <div className="keyboard-shortcuts">
        <h4>키보드 단축키</h4>
        <ul>
          <li><kbd>Space</kbd> 재생/일시정지</li>
          <li><kbd>←</kbd> 10초 뒤로</li>
          <li><kbd>→</kbd> 10초 앞으로</li>
          <li><kbd>↑</kbd> 볼륨 증가</li>
          <li><kbd>↓</kbd> 볼륨 감소</li>
          <li><kbd>F</kbd> 전체화면</li>
          <li><kbd>S</kbd> 스크린샷</li>
        </ul>
      </div>
    </div>
  )
})

VideoJsPlayer.displayName = 'VideoJsPlayer'

export default VideoJsPlayer