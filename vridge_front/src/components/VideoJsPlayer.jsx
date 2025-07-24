import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import videojs from 'video.js'

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
  console.log('[VideoJsPlayer] Component rendered with props:', {
    videoUrl,
    hasVideoUrl: !!videoUrl,
    videoUrlLength: videoUrl?.length
  });
  
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
      if (playerRef.current && playerRef.current.paused()) {
        console.log('[VideoJsPlayer] Playing video');
        playerRef.current.play();
        return true;
      } else if (playerRef.current && !playerRef.current.paused()) {
        console.log('[VideoJsPlayer] Video is already playing');
        return true;
      }
      return false;
    },
    pause: () => {
      if (playerRef.current && !playerRef.current.paused()) {
        console.log('[VideoJsPlayer] Pausing video');
        playerRef.current.pause();
        return true;
      } else if (playerRef.current && playerRef.current.paused()) {
        console.log('[VideoJsPlayer] Video is already paused');
        return true;
      }
      return false;
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
    },
    isReady: () => {
      return !!(playerRef.current && playerRef.current.readyState && playerRef.current.readyState() >= 1)
    },
    getPlayer: () => {
      return playerRef.current
    }
  }))


  useEffect(() => {
    // Video.js 플레이어 옵션
    const options = {
      autoplay,
      muted,
      controls: true, // 컨트롤 강제 활성화
      responsive,
      fluid,
      playbackRates,
      preload: 'auto',
      html5: {
        vhs: {
          overrideNative: true,
          withCredentials: false
        },
        nativeVideoTracks: false,
        nativeAudioTracks: false,
        nativeTextTracks: false,
        hls: {
          withCredentials: false,
          overrideNative: true
        }
      },
      techOrder: ['html5'],
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
      console.log('[VideoJsPlayer] Initializing player with URL:', videoUrl);
      
      // 플레이어가 이미 초기화되어 있는지 확인
      if (videoRef.current.player) {
        console.log('[VideoJsPlayer] Player already initialized, disposing old player');
        videoRef.current.player.dispose();
      }
      
      const player = videojs(videoRef.current, options, function onPlayerReady() {
        console.log('[VideoJS] Player is ready')
        console.log('[VideoJS] Setting video source:', videoUrl)
        
        // 비디오 소스 설정 - URL이 있을 때만
        if (videoUrl) {
          const videoType = (() => {
            if (videoUrl.includes('.mp4')) return 'video/mp4';
            if (videoUrl.includes('.webm')) return 'video/webm';
            if (videoUrl.includes('.ogg')) return 'video/ogg';
            if (videoUrl.includes('.mov')) return 'video/quicktime';
            return 'video/mp4'; // 기본값
          })();
          
          console.log('[VideoJS] Setting source with type:', videoType);
          this.src({ type: videoType, src: videoUrl });
        } else {
          console.log('[VideoJS] No video URL provided, player ready without source');
        }
        
        // 로드 상태 모니터링
        this.on('loadstart', () => {
          console.log('[VideoJS] Load started for:', videoUrl);
        });
        
        this.on('loadedmetadata', () => {
          console.log('[VideoJS] Metadata loaded');
        });
        
        this.on('loadeddata', () => {
          console.log('[VideoJS] Data loaded, ready to play');
        });
        
        this.on('canplay', () => {
          console.log('[VideoJS] Can start playing');
          // canplay 시점에 컨트롤 다시 활성화
          this.controls(true);
        });
        
        this.on('waiting', () => {
          console.log('[VideoJS] Waiting for data...');
        });
        
        // ready 이벤트에서도 컨트롤 활성화
        this.on('ready', () => {
          console.log('[VideoJS] Player ready event fired');
          this.controls(true);
          this.controlBar.show();
        });
        
        // 초기 시간으로 이동
        if (initialTime > 0) {
          this.currentTime(initialTime)
        }

        // 재생/일시정지 이벤트로 big play button 제어
        this.on('play', () => {
          console.log('[VideoJS] Play event - hiding big play button');
          this.bigPlayButton.hide();
        });

        this.on('pause', () => {
          console.log('[VideoJS] Pause event - showing big play button');
          this.bigPlayButton.show();
        });

        this.on('ended', () => {
          console.log('[VideoJS] Video ended - showing big play button');
          this.bigPlayButton.show();
        });

        // 에러 핸들링
        this.on('error', (error) => {
          const playerError = this.error();
          console.error('[VideoJS] Video error:', {
            error: error,
            playerError: playerError,
            code: playerError?.code,
            message: playerError?.message,
            type: playerError?.type,
            url: videoUrl
          });
          
          // 에러 코드별 처리
          if (playerError?.code === 4) {
            console.error('[VideoJS] Media not supported or CORS issue');
          } else if (playerError?.code === 2) {
            console.error('[VideoJS] Network error');
          }
          
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

        // 클릭 이벤트로 재생/일시정지 토글
        this.on('click', (e) => {
          // 컨트롤바가 아닌 비디오 영역 클릭 시
          if (e.target === this.el() || e.target.classList.contains('vjs-tech')) {
            e.preventDefault();
            e.stopPropagation();
            
            // 재생/일시정지 토글
            if (this.paused()) {
              console.log('[VideoJS] Click to play');
              this.play();
            } else {
              console.log('[VideoJS] Click to pause');
              this.pause();
            }
            
            // 피드백 클릭 이벤트 (필요한 경우)
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
      
      // 플레이어 UI 강제 표시
      setTimeout(() => {
        if (playerRef.current) {
          console.log('[VideoJS] Forcing UI display');
          playerRef.current.controls(true);
          const controlBar = playerRef.current.controlBar;
          if (controlBar) {
            controlBar.show();
            controlBar.el().style.display = 'flex';
            controlBar.el().style.visibility = 'visible';
            controlBar.el().style.opacity = '1';
          }
        }
      }, 100);
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
      console.log('[VideoJsPlayer] Updating video source:', videoUrl);
      
      // 기존 에러 리스너 제거
      playerRef.current.off('error');
      playerRef.current.off('loadeddata');
      
      // 새로운 소스 설정 - 타입 자동 감지
      const videoType = (() => {
        if (videoUrl.includes('.mp4')) return 'video/mp4';
        if (videoUrl.includes('.webm')) return 'video/webm';
        if (videoUrl.includes('.ogg')) return 'video/ogg';
        if (videoUrl.includes('.mov')) return 'video/quicktime';
        return 'video/mp4'; // 기본값
      })();
      
      playerRef.current.src({ 
        type: videoType, 
        src: videoUrl 
      });
      
      // 소스 로드 후 에러 체크
      playerRef.current.one('loadeddata', () => {
        console.log('[VideoJsPlayer] Video loaded successfully');
      });
      
      playerRef.current.one('error', (e) => {
        const error = playerRef.current.error();
        console.error('[VideoJsPlayer] Video load error:', {
          code: error?.code,
          message: error?.message,
          url: videoUrl
        });
        
        // 에러 발생 시 네이티브 비디오 엘리먼트로 직접 시도
        if (videoRef.current && error?.code === 4) {
          console.log('[VideoJsPlayer] Trying direct video element load');
          const videoElement = videoRef.current;
          videoElement.src = videoUrl;
          videoElement.load();
        }
      });
    }
  }, [videoUrl])

  console.log('[VideoJsPlayer] Rendering with videoUrl:', videoUrl);
  
  // 비디오 요소가 렌더링된 후 플레이어 상태 확인
  useEffect(() => {
    if (videoRef.current) {
      console.log('[VideoJsPlayer] Video element mounted:', videoRef.current);
      console.log('[VideoJsPlayer] Video element dimensions:', {
        offsetWidth: videoRef.current.offsetWidth,
        offsetHeight: videoRef.current.offsetHeight,
        clientWidth: videoRef.current.clientWidth,
        clientHeight: videoRef.current.clientHeight
      });
    }
  }, [videoRef.current]);
  
  return (
    <div className="video-js-player-wrapper">
      <div data-vjs-player style={{ width: '100%', height: '100%' }}>
        <video
          ref={videoRef}
          className="video-js vjs-theme-default vjs-big-play-centered"
          playsInline
          style={{ width: '100%', height: '100%' }}
        >
          {/* 브라우저가 Video.js를 사용하지 않는 경우를 위한 폴백 */}
          {videoUrl && <source src={videoUrl} type="video/mp4" />}
        </video>
      </div>
    </div>
  )
})

VideoJsPlayer.displayName = 'VideoJsPlayer'

export default VideoJsPlayer