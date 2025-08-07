import React, { useCallback, useRef, forwardRef, useImperativeHandle, useState } from 'react'
import ReactPlayer from 'react-player';
import styles from './ReactVideoPlayer.module.scss';

const ReactVideoPlayer = forwardRef(({ 
  videoUrl, 
  onTimeClick, 
  initialTime = 0, 
  onError, 
  onFeedbackClick,
  feedbacks = [],
  autoplay = false,
  muted = false,
  controls = true,
  playbackRates = [0.5, 1, 1.5, 2],
  width = '100%',
  height = '100%',
  style = {},
  onReady,
  onProgress,
  onDuration,
  onPlay,
  onPause,
  onEnded
}, ref) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [playing, setPlaying] = useState(autoplay);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // 부모 컴포넌트에서 사용할 수 있는 메서드들
  useImperativeHandle(ref, () => ({
    seekTo: (time) => {
      if (playerRef.current) {
        playerRef.current.seekTo(time);
      }
    },
    play: () => {
      setPlaying(true);
      return true;
    },
    pause: () => {
      setPlaying(false);
      return true;
    },
    getPlayer: () => playerRef.current,
    getCurrentTime: () => {
      if (playerRef.current) {
        return playerRef.current.getCurrentTime();
      }
      return 0;
    },
    getDuration: () => {
      if (playerRef.current) {
        return playerRef.current.getDuration();
      }
      return 0;
    },
    el: () => containerRef.current,
    getInternalPlayer: () => {
      if (playerRef.current) {
        return playerRef.current.getInternalPlayer();
      }
      return null;
    }
  }));

  const handleReady = useCallback(() => {
    console.log('[ReactVideoPlayer] Player is ready');
    setIsReady(true);
    
    // 초기 시간 설정
    if (initialTime > 0 && playerRef.current) {
      playerRef.current.seekTo(initialTime);
    }
    
    if (onReady) {
      onReady();
    }
  }, [initialTime, onReady]);

  const handleError = useCallback((error) => {
    console.error('[ReactVideoPlayer] Error:', error);
    if (onError) {
      onError(error);
    }
  }, [onError]);

  const handleProgress = useCallback((state) => {
    setCurrentTime(state.playedSeconds);
    if (onProgress) {
      onProgress(state);
    }
  }, [onProgress]);

  const handleDuration = useCallback((duration) => {
    setDuration(duration);
    if (onDuration) {
      onDuration(duration);
    }
  }, [onDuration]);

  const handlePlayPause = useCallback(() => {
    setPlaying(prev => !prev);
  }, []);

  const handlePlay = useCallback(() => {
    if (onPlay) {
      onPlay();
    }
  }, [onPlay]);

  const handlePause = useCallback(() => {
    if (onPause) {
      onPause();
    }
  }, [onPause]);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    if (onEnded) {
      onEnded();
    }
  }, [onEnded]);

  // 비디오 URL이 없을 때
  if (!videoUrl) {
    return (
      <div 
        ref={containerRef}
        className={styles.emptyState}
        style={style}
      >
        <div className={styles.emptyContent}>
          <div className={styles.emptyIcon}>📹</div>
          <div className={styles.emptyText}>비디오가 준비되지 않았습니다</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={styles.playerWrapper}
      style={{
        width,
        height,
        ...style
      }}
    >
      <div className={styles.playerContainer}>
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          width="100%"
          height="100%"
          playing={playing}
          muted={muted}
          controls={controls}
          playbackRate={playbackRate}
          onReady={handleReady}
          onError={handleError}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload'
              }
            }
          }}
          progressInterval={100}
        />
        
        {/* 커스텀 오버레이 (필요시) */}
        {!controls && isReady && (
          <div 
            className={styles.customOverlay} 
            onClick={handlePlayPause}
          >
            {!playing && (
              <div className={styles.playButton}>
                <svg width="60" height="60" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

ReactVideoPlayer.displayName = 'ReactVideoPlayer';

export default ReactVideoPlayer;
