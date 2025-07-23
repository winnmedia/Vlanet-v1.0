/**
 * 브라우저에서 비디오 압축하기
 * FFmpeg.wasm을 사용한 클라이언트 사이드 압축
 */

export const compressVideo = async (file, onProgress) => {
  // 브라우저 기본 API를 사용한 간단한 압축
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  return new Promise((resolve, reject) => {
    video.onloadedmetadata = async () => {
      // 비디오 크기 조정 (최대 720p)
      const maxWidth = 1280;
      const maxHeight = 720;
      let { videoWidth: width, videoHeight: height } = video;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // MediaRecorder를 사용한 재인코딩
      const stream = canvas.captureStream(30); // 30 fps
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webm'), {
          type: 'video/webm'
        });
        resolve(compressedFile);
      };
      
      // 비디오 재생 및 캔버스에 그리기
      mediaRecorder.start();
      video.play();
      
      const drawFrame = () => {
        if (!video.ended) {
          ctx.drawImage(video, 0, 0, width, height);
          requestAnimationFrame(drawFrame);
          
          // 진행률 계산
          if (onProgress) {
            const progress = (video.currentTime / video.duration) * 100;
            onProgress(Math.round(progress));
          }
        } else {
          mediaRecorder.stop();
        }
      };
      
      drawFrame();
    };
    
    video.onerror = reject;
    video.src = URL.createObjectURL(file);
  });
};

/**
 * 파일 크기 체크 및 압축 필요 여부 판단
 */
export const shouldCompressVideo = (file) => {
  const maxSizeInMB = 100; // 100MB 이상이면 압축
  const fileSizeInMB = file.size / (1024 * 1024);
  return fileSizeInMB > maxSizeInMB;
};

/**
 * 비디오 메타데이터 추출
 */
export const getVideoMetadata = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    
    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        fileSize: file.size
      });
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = reject;
    video.src = URL.createObjectURL(file);
  });
};