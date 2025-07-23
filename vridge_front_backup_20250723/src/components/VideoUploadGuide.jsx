import React from 'react';
import './VideoUploadGuide.scss';

export default function VideoUploadGuide({ onClose }) {
  return (
    <div className="video-upload-guide-overlay" onClick={onClose}>
      <div className="video-upload-guide" onClick={(e) => e.stopPropagation()}>
        <div className="guide-header">
          <h3>영상 업로드 가이드</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="guide-content">
          <div className="section">
            <h4>지원 형식</h4>
            <ul>
              <li>MP4 (권장)</li>
              <li>WebM</li>
              <li>OGG</li>
              <li>MOV</li>
              <li>AVI</li>
              <li>MKV</li>
            </ul>
          </div>
          
          <div className="section">
            <h4>권장 사양</h4>
            <ul>
              <li>해상도: 1920x1080 (Full HD) 이하</li>
              <li>비트레이트: 5-10 Mbps</li>
              <li>프레임레이트: 30fps</li>
              <li>코덱: H.264 (MP4)</li>
              <li>최대 크기: 600MB</li>
            </ul>
          </div>
          
          <div className="section">
            <h4>문제 해결</h4>
            <ul>
              <li>영상이 재생되지 않는 경우:</li>
              <li className="sub">1. 파일 형식을 확인하세요</li>
              <li className="sub">2. 파일이 손상되지 않았는지 확인하세요</li>
              <li className="sub">3. 다른 형식으로 변환 후 시도하세요</li>
              <li className="sub">4. 기존 파일을 삭제하고 다시 업로드하세요</li>
            </ul>
          </div>
          
          <div className="section warning">
            <p>⚠️ 한글 파일명은 자동으로 영문으로 변환됩니다.</p>
            <p>⚠️ 특수문자가 포함된 파일명은 피해주세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
}