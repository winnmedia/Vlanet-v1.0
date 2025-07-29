import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { MediaPlayer, MediaProvider } from '@vidstack/react';

const VidstackPlayer = forwardRef(({
  videoUrl,
  onTimeUpdate,
  onError,
  onFeedbackClick,
  initialTime = 0,
  feedbacks = [],
  autoplay = false,
  muted = false
}, ref) => {
  const playerRef = useRef(null);

  // 부모 컴포넌트에서 사용할 수 있는 메서드들
  useImperativeHandle(ref, () => ({
    seekTo: (time) => {
      if (playerRef.current) {
        playerRef.current.currentTime = time;
      }
    },
    play: () => {
      if (playerRef.current) {
        playerRef.current.play();
      }
    },
    pause: () => {
      if (playerRef.current) {
        playerRef.current.pause();
      }
    },
    getCurrentTime: () => {
      return playerRef.current ? playerRef.current.currentTime : 0;
    },
    getDuration: () => {
      return playerRef.current ? playerRef.current.duration : 0;
    }
  }));

  // 초기 시간 설정
  useEffect(() => {
    if (playerRef.current && initialTime > 0) {
      playerRef.current.addEventListener('loadedmetadata', () => {
        playerRef.current.currentTime = initialTime;
      }, { once: true });
    }
  }, [initialTime]);

  // 피드백 마커 렌더링 (추후 구현)
  const renderFeedbackMarkers = () => {
    // Vidstack의 마커 시스템을 활용한 피드백 표시
    return feedbacks.map((feedback, index) => {
      if (feedback.time_position) {
        // 마커 구현
        return null;
      }
      return null;
    });
  };

  const handleError = (event) => {
    
    if (onError) {
      onError(event);
    }
  };

  const handleTimeUpdate = (event) => {
    if (onTimeUpdate) {
      onTimeUpdate({
        currentTime: event.detail.currentTime,
        duration: event.detail.duration
      });
    }
  };

  // 클릭 이벤트 처리 (피드백 추가)
  const handleClick = (event) => {
    if (onFeedbackClick && playerRef.current) {
      const rect = playerRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width * 100;
      const y = (event.clientY - rect.top) / rect.height * 100;
      onFeedbackClick(playerRef.current.currentTime, x, y);
    }
  };

  return (
    <div className="vidstack-player-wrapper" onClick={handleClick}>
      <MediaPlayer
        ref={playerRef}
        title="Video Player"
        src={videoUrl}
        crossorigin="anonymous"
        playsinline
        autoplay={autoplay}
        muted={muted}
        onError={handleError}
        onTimeUpdate={handleTimeUpdate}
        onCanPlay={(e) => undefined}
        onLoadedMetadata={(e) => undefined}
        onPlay={(e) => undefined}
        onPause={(e) => undefined}
        onSeeking={(e) => undefined}
        onSeeked={(e) => undefined}
        className="vidstack-player">

        <MediaProvider />
      </MediaPlayer>
      
      <style jsx>{`
        .vidstack-player-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          background-color: #000;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .vidstack-player {
          width: 100%;
          height: 100%;
          aspect-ratio: 16 / 9;
        }
        
        /* 성능 최적화를 위한 GPU 가속 */
        .vidstack-player video {
          transform: translateZ(0);
          will-change: transform;
        }
        
        /* 모바일 최적화 */
        @media (max-width: 768px) {
          .vidstack-player {
            aspect-ratio: 16 / 9;
          }
        }
      `}</style>
    </div>);

});

VidstackPlayer.displayName = 'VidstackPlayer';

export default VidstackPlayer;