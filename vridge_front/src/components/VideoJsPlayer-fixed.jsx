import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react'
import UnifiedModal from './unified/UnifiedModal';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import styles from './VideoJsPlayer.module.scss';

// 한국어 설정
videojs.addLanguage('ko', {
  Play: '재생',
  Pause: '일시정지',
  'Current Time': '현재 시간',
  Duration: '전체 시간',
  'Remaining Time': '남은 시간',
  'Stream Type': '스트림 유형',
  LIVE: '라이브',
  Loaded: '로드됨',
  Progress: '진행',
  Fullscreen: '전체화면',
  'Non-Fullscreen': '전체화면 해제',
  Mute: '음소거',
  Unmute: '음소거 해제',
  'Playback Rate': '재생 속도',
  Subtitles: '자막',
  'subtitles off': '자막 끄기',
  Captions: '자막',
  'captions off': '자막 끄기',
  Chapters: '챕터',
  'Close Modal Dialog': '모달 창 닫기',
  Descriptions: '설명',
  'descriptions off': '설명 끄기',
  'Audio Track': '오디오 트랙',
  'Volume Level': '볼륨 레벨',
  'You aborted the media playback': '미디어 재생을 중단했습니다',
  'A network error caused the media download to fail part-way.': '네트워크 오류로 인해 미디어 다운로드가 실패했습니다.',
  'The media could not be loaded, either because the server or network failed or because the format is not supported.': '서버 또는 네트워크 오류나 지원되지 않는 형식으로 인해 미디어를 로드할 수 없습니다.',
  'The media playback was aborted due to a corruption problem or because the media used features your browser did not support.': '미디어 재생이 손상 문제나 브라우저가 지원하지 않는 기능 사용으로 인해 중단되었습니다.',
  'No compatible source was found for this media.': '이 미디어에 대한 호환 가능한 소스를 찾을 수 없습니다.'
});

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
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const pauseIconTimeoutRef = useRef(null);

  // 부모 컴포넌트에서 사용할 수 있는 메서드들
  useImperativeHandle(ref, () => ({
    seekTo: (time) => {
      if (playerRef.current && playerRef.current.readyState() >= 2) {
        playerRef.current.currentTime(time);
      }
    },
    play: () => {
      if (playerRef.current) {
        const promise = playerRef.current.play();
        if (promise !== undefined) {
          promise.catch((e) => undefined);
        }
        return true;
      }
      return false;
    },
    pause: () => {
      if (playerRef.current) {
        playerRef.current.pause();
        return true;
      }
      return false;
    },
    getPlayer: () => playerRef.current,
    getCurrentTime: () => playerRef.current ? playerRef.current.currentTime() : 0,
    getDuration: () => playerRef.current ? playerRef.current.duration() : 0
  }));

  // 플레이어 초기화
  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;

    // 비디오 타입 자동 감지
    const getVideoType = (url) => {
      if (!url) return 'video/mp4';
      const ext = url.split('.').pop().toLowerCase().split('?')[0];
      const typeMap = {
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'ogg': 'video/ogg',
        'mov': 'video/quicktime',
        'm3u8': 'application/x-mpegURL',
        'mpd': 'application/dash+xml'
      };
      return typeMap[ext] || 'video/mp4';
    };

    // 플레이어 옵션
    const options = {
      autoplay: false, // 나중에 수동으로 제어
      controls: true,
      responsive: true,
      fluid: true,
      language: 'ko',
      languages: {
        ko: {
          Play: '재생'
        }
      },
      playbackRates,
      html5: {
        vhs: {
          overrideNative: true
        },
        nativeVideoTracks: false,
        nativeAudioTracks: false,
        nativeTextTracks: false
      },
      sources: [{
        src: videoUrl,
        type: getVideoType(videoUrl)
      }],
      controlBar: {
        children: [
        'playToggle',
        'volumePanel',
        'currentTimeDisplay',
        'timeDivider',
        'durationDisplay',
        'progressControl',
        'remainingTimeDisplay',
        'playbackRateMenuButton',
        'fullscreenToggle'],

        volumePanel: {
          inline: false
        }
      }
    };

    // 기존 플레이어 제거
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    // 새 플레이어 생성
    const player = videojs(videoRef.current, options, function onPlayerReady() {

      setIsPlayerReady(true);

      // 초기 시간 설정
      if (initialTime > 0) {
        this.currentTime(initialTime);
      }

      // 에러 핸들링
      this.on('error', function (e) {
        const error = this.error();
        
        if (onError) {
          onError(error);
        }
      });

      // 로드 성공
      this.on('loadeddata', function () {});

      // 클릭 이벤트로 재생/일시정지
      this.on('click', function (e) {
        // 컨트롤바가 아닌 비디오 영역 클릭 시
        if (!e.target.closest('.vjs-control-bar')) {
          if (this.paused()) {
            this.play();
          } else {
            this.pause();
            // 일시정지 아이콘 표시
            setShowPauseIcon(true);

            // 기존 타이머 제거
            if (pauseIconTimeoutRef.current) {
              clearTimeout(pauseIconTimeoutRef.current);
            }

            // 1초 후 아이콘 숨기기
            pauseIconTimeoutRef.current = setTimeout(() => {
              setShowPauseIcon(false);
            }, 1000);
          }
        }
      });

      // 시간 클릭 이벤트
      if (onTimeClick) {
        this.on('timeupdate', function () {

          // 필요한 경우 시간 업데이트 전달
        });}});

    playerRef.current = player;

    // 비디오 화면 클릭 시 play/pause 토글
    player.tech_.on('click', function (e) {
      // 컨트롤바 클릭은 무시
      if (e.target.closest('.vjs-control-bar')) return;

      if (player.paused()) {
        player.play();
      } else {
        player.pause();
      }
    });

    // 자동 재생 처리
    if (autoplay && player.readyState() >= 2) {
      setTimeout(() => {
        const promise = player.play();
        if (promise !== undefined) {
          promise.catch((e) => undefined);
        }
      }, 100);
    }

    // 클린업
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
        setIsPlayerReady(false);
      }
      if (pauseIconTimeoutRef.current) {
        clearTimeout(pauseIconTimeoutRef.current);
      }
    };
  }, [videoUrl]); // videoUrl 변경 시에만 재초기화

  // 비디오 URL이 없을 때
  if (!videoUrl) {
    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '16px'
        }}>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📹</div>
          <div>비디오가 준비되지 않았습니다</div>
        </div>
      </div>);

  }

  return (
    <div
      ref={containerRef}
      className={styles.videoJsPlayerWrapper}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>

      <div data-vjs-player style={{ width: '100%', height: '100%' }}>
        <video
          ref={videoRef}
          className="video-js vjs-default-skin vjs-big-play-centered"
          style={{
            width: '100%',
            height: '100%'
          }} />

      </div>
      
      {/* 일시정지 아이콘 오버레이 */}
      {showPauseIcon &&
      <div
        className={styles.pauseIconOverlay}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80px',
          height: '80px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 100,
          animation: 'fadeInOut 1s ease-out'
        }}>

          <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">

            <rect x="6" y="4" width="4" height="16" rx="1" fill="white" />
            <rect x="14" y="4" width="4" height="16" rx="1" fill="white" />
          </svg>
        </div>
      }
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          80% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
        }
      ` }} />
    </div>);

});

VideoJsPlayer.displayName = 'VideoJsPlayer';

export default VideoJsPlayer;