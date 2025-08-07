import React, { useCallback, useRef, forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import styles from './EnhancedVideoPlayer.module.scss';
import { message } from 'antd'

const NativeVideoPlayer = forwardRef(({ 
  videoUrl, 
  onTimeClick, 
  initialTime = 0, 
  onError, 
  onFeedbackClick,
  feedbacks = [],
  autoplay = false,
  muted = false,
  width = '100%',
  height = '100%',
  className = '',
  onReady,
  onProgress,
  onDuration,
  onPlay,
  onPause,
  onEnded,
  aspectRatio = '16:9'
}, ref) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  
  const [isReady, setIsReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(muted ? 0 : 0.8);
  const [mute, setMute] = useState(muted);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [showOverlay, setShowOverlay] = useState(!autoplay);
  const [buffering, setBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showRateMenu, setShowRateMenu] = useState(false);

  // 부모 컴포넌트에서 사용할 수 있는 메서드들
  useImperativeHandle(ref, () => ({
    seekTo: (time) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
    play: () => {
      if (videoRef.current) {
        videoRef.current.play().catch(e => {
          console.error('[NativeVideoPlayer] Play failed:', e);
        });
        setPlaying(true);
        setShowOverlay(false);
      }
      return true;
    },
    pause: () => {
      if (videoRef.current) {
        videoRef.current.pause();
        setPlaying(false);
      }
      return true;
    },
    getPlayer: () => videoRef.current,
    getCurrentTime: () => currentTime,
    getDuration: () => duration,
    toggleMute: () => {
      setMute(!mute);
    },
    setVolume: (vol) => {
      setVolume(vol);
      setMute(vol === 0);
    },
    toggleFullscreen: () => {
      handleFullscreen();
    }
  }));

  // 비디오 메타데이터 로드 완료
  const handleLoadedMetadata = useCallback(() => {
    console.log('[NativeVideoPlayer] Metadata loaded');
    const video = videoRef.current;
    if (!video) return;

    setDuration(video.duration);
    setIsReady(true);
    setHasError(false);
    setBuffering(false);
    
    if (initialTime > 0) {
      video.currentTime = initialTime;
    }
    
    onReady?.();
    onDuration?.(video.duration);
  }, [initialTime, onReady, onDuration]);

  // 재생 진행 상태 업데이트
  useEffect(() => {
    if (playing && videoRef.current) {
      progressIntervalRef.current = setInterval(() => {
        if (videoRef.current && !seeking) {
          const time = videoRef.current.currentTime;
          setCurrentTime(time);
          onProgress?.({
            played: time / duration,
            playedSeconds: time,
            loaded: videoRef.current.buffered.length > 0 
              ? videoRef.current.buffered.end(0) / duration 
              : 0,
            loadedSeconds: videoRef.current.buffered.length > 0 
              ? videoRef.current.buffered.end(0) 
              : 0
          });
        }
      }, 100);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [playing, seeking, duration, onProgress]);

  // 볼륨 변경
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = mute;
    }
  }, [volume, mute]);

  // 재생 속도 변경
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // 재생/일시정지 토글
  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (playing) {
      video.pause();
      setPlaying(false);
      onPause?.();
    } else {
      try {
        await video.play();
        setPlaying(true);
        setShowOverlay(false);
        onPlay?.();
      } catch (error) {
        console.error('[NativeVideoPlayer] Play failed:', error);
        // 자동재생 정책으로 실패한 경우 음소거 후 재시도
        if (error.name === 'NotAllowedError') {
          video.muted = true;
          setMute(true);
          try {
            await video.play();
            setPlaying(true);
            setShowOverlay(false);
            onPlay?.();
          } catch (e) {
            console.error('[NativeVideoPlayer] Muted play also failed:', e);
          }
        }
      }
    }
  }, [playing, onPlay, onPause]);

  // 비디오 클릭 핸들러
  const handleVideoClick = useCallback((e) => {
    // 컨트롤바 클릭은 무시
    if (e.target.closest(`.${styles.controlsBar}`)) {
      return;
    }
    togglePlay();
  }, [togglePlay]);

  // 시간 포맷팅
  const formatTime = useCallback((seconds) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  }, []);

  // 프로그레스바 클릭
  const handleProgressClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      onTimeClick?.(newTime);
    }
  }, [duration, onTimeClick]);

  // 볼륨 변경
  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setMute(newVolume === 0);
  }, []);

  // 음소거 토글
  const toggleMute = useCallback(() => {
    if (mute) {
      setMute(false);
      setVolume(0.8);
    } else {
      setMute(true);
      setVolume(0);
    }
  }, [mute]);

  // 전체화면 토글
  const handleFullscreen = useCallback(() => {
    if (!fullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.mozRequestFullScreen) {
        containerRef.current.mozRequestFullScreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setFullscreen(!fullscreen);
  }, [fullscreen]);

  // 재생 속도 변경
  const handlePlaybackRateChange = useCallback((rate) => {
    setPlaybackRate(rate);
    setShowRateMenu(false);
  }, []);

  // 에러 처리
  const handleError = useCallback((e) => {
    const video = e.target;
    const error = video.error;
    
    console.error('[NativeVideoPlayer] Video error:', error);
    console.error('[NativeVideoPlayer] Error code:', error?.code);
    console.error('[NativeVideoPlayer] Error message:', error?.message);
    console.error('[NativeVideoPlayer] Video URL:', videoUrl);
    
    setHasError(true);
    setBuffering(false);
    onError?.(error);
  }, [onError, videoUrl]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, currentTime - 5);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(duration, currentTime + 5);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          handleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlay, currentTime, duration, volume, toggleMute, handleFullscreen]);

  // 비디오 비율에 따른 클래스 결정
  const getAspectRatioClass = () => {
    switch(aspectRatio) {
      case '16:9': return styles.landscape;
      case '9:16': return styles.portrait;
      case '1:1': return styles.square;
      default: return styles.auto;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`${styles.videoPlayerContainer} ${className} ${fullscreen ? styles.fullscreen : ''}`}
    >
      <div 
        className={`${styles.videoWrapper} ${getAspectRatioClass()}`}
        onClick={handleVideoClick}
      >
        <div className={styles.videoArea}>
          <video
            ref={videoRef}
            src={videoUrl}
            className={styles.nativeVideo}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => {
              setPlaying(true);
              onPlay?.();
            }}
            onPause={() => {
              setPlaying(false);
              onPause?.();
            }}
            onEnded={() => {
              setPlaying(false);
              onEnded?.();
            }}
            onError={handleError}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => setBuffering(false)}
            onSeeking={() => setSeeking(true)}
            onSeeked={() => setSeeking(false)}
            playsInline
            crossOrigin="anonymous"
            preload="metadata"
          />
        </div>

        {/* 클릭 가능한 투명 오버레이 */}
        <div 
          className={styles.clickableOverlay}
          onClick={handleVideoClick}
        />

        {/* 중앙 재생 버튼 오버레이 */}
        {showOverlay && !playing && (
          <div className={styles.playOverlay} onClick={togglePlay}>
            <div className={styles.playButton}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        )}

        {/* 버퍼링 인디케이터 */}
        {buffering && !hasError && (
          <div className={styles.bufferingIndicator}>
            <div className={styles.spinner}></div>
          </div>
        )}

        {/* 에러 표시 */}
        {hasError && (
          <div className={styles.errorIndicator}>
            <div className={styles.errorIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 17h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>
            <div className={styles.errorMessage}>비디오를 로드할 수 없습니다</div>
            <button 
              className={styles.errorRetryButton}
              onClick={() => {
                setHasError(false);
                setShowOverlay(true);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 피드백 마커들 */}
        <div className={styles.feedbackMarkers}>
          {feedbacks.map((feedback, index) => {
            const position = (feedback.timestamp / duration) * 100;
            return (
              <div
                key={index}
                className={styles.feedbackMarker}
                style={{ left: `${position}%` }}
                onClick={() => onFeedbackClick?.(feedback)}
                title={feedback.content}
              />
            );
          })}
        </div>
      </div>

      {/* 커스텀 컨트롤 바 */}
      <div className={styles.controlsBar}>
        <div className={styles.controlsContainer}>
          {/* 재생/일시정지 버튼 */}
          <button 
            className={styles.playPauseBtn}
            onClick={togglePlay}
            aria-label={playing ? '일시정지' : '재생'}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* 시간 표시 */}
          <div className={styles.timeDisplay}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* 프로그레스 바 */}
          <div 
            className={styles.progressBar}
            onClick={handleProgressClick}
          >
            <div 
              className={styles.progressFill}
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          {/* 볼륨 컨트롤 */}
          <div className={styles.volumeControl}>
            <button 
              className={styles.muteBtn}
              onClick={toggleMute}
              aria-label={mute ? '음소거 해제' : '음소거'}
            >
              {mute || volume === 0 ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              ) : volume > 0.5 ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className={styles.volumeSlider}
              aria-label="볼륨"
            />
          </div>

          {/* 추가 컨트롤 */}
          <div className={styles.additionalControls}>
            {/* 재생 속도 */}
            <div className={styles.playbackRateControl}>
              <button 
                className={styles.rateBtn}
                onClick={() => setShowRateMenu(!showRateMenu)}
                aria-label="재생 속도"
              >
                {playbackRate}x
              </button>
              {showRateMenu && (
                <div className={styles.rateMenu}>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                    <button
                      key={rate}
                      className={`${styles.rateOption} ${playbackRate === rate ? styles.active : ''}`}
                      onClick={() => handlePlaybackRateChange(rate)}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 전체화면 */}
            <button 
              className={styles.fullscreenBtn}
              onClick={handleFullscreen}
              aria-label="전체화면"
            >
              {fullscreen ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

NativeVideoPlayer.displayName = 'NativeVideoPlayer';

export default NativeVideoPlayer;
