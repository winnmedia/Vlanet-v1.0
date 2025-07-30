import React, { useState, useCallback } from 'react'
import UnifiedModal from './unified/UnifiedModal';
import { UnifiedButton } from './unified/UnifiedButton';
import { UnifiedInput } from './unified/UnifiedInput';
import Cropper from 'react-easy-crop';

const createImage = (url) =>
new Promise((resolve, reject) => {
  const image = new Image();
  image.addEventListener('load', () => resolve(image));
  image.addEventListener('error', (error) => reject(error));
  image.setAttribute('crossOrigin', 'anonymous');
  image.src = url;
});

function getRadianAngle(degreeValue) {
  return degreeValue * Math.PI / 180;
}

async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * (maxSize / 2 * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  const onCropAreaChange = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropComplete = useCallback(async () => {
    try {
      setLoading(true);
      const croppedImageBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        0
      );
      onCropComplete(croppedImageBlob);
    } catch (e) {

      alert('이미지 크롭 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [imageSrc, croppedAreaPixels, onCropComplete]);

  return (
    <UnifiedModal open={true} onClose={() => {}} className="image-cropper-modal" role="dialog" aria-modal="true">
      <div className="cropper-container">
        <div className="cropper-header">
          <h3>프로필 사진 편집</h3>
          <p>원하는 영역을 선택하세요</p>
        </div>
        
        <div className="cropper-wrapper">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onCropComplete={onCropAreaChange}
            onZoomChange={onZoomChange} />

        </div>

        <div className="cropper-controls">
          <div className="zoom-control">
            <span>확대/축소</span>
            <UnifiedInput
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              className="zoom-slider" />

          </div>
        </div>

        <div className="cropper-actions">
          <UnifiedButton 
            variant="secondary" 
            onClick={onCancel} 
            onKeyDown={(e) => e.key === 'Enter' && onCancel} 
            disabled={loading} 
            aria-label="취소"
          >
            취소
          </UnifiedButton>
          <UnifiedButton 
            onClick={handleCropComplete} 
            onKeyDown={(e) => e.key === 'Enter' && handleCropComplete} 
            disabled={loading} 
            aria-label="적용"
          >
            {loading ? '처리 중...' : '적용'}
          </UnifiedButton>
        </div>
      </div>
    </UnifiedModal>
  );
}