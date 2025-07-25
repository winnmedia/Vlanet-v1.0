import React from 'react'

export default function UnifiedLoading({ 
  message = '로딩 중...', 
  variant = 'default',
  fullScreen = true,
  size = 'medium' 
}) {
  const sizeStyles = {
    small: { dotSize: 8, gap: 6, fontSize: 14 },
    medium: { dotSize: 12, gap: 8, fontSize: 16 },
    large: { dotSize: 16, gap: 10, fontSize: 18 }
  }
  
  const currentSize = sizeStyles[size] || sizeStyles.medium
  
  const loadingContent = (
    <div className="unified-loading-content">
      <div className="unified-loading-spinner">
        <div className="spinner-dot"></div>
        <div className="spinner-dot"></div>
        <div className="spinner-dot"></div>
      </div>
      {message && (
        <div className="unified-loading-text">
          <p className="unified-loading-message">{message}</p>
        </div>
      )}
    </div>
  )
  
  return (
    <>
      {fullScreen ? (
        <div className="unified-loading-overlay">
          {loadingContent}
        </div>
      ) : (
        <div className="unified-loading-inline">
          {loadingContent}
        </div>
      )}
      
      <style jsx>{`
        .unified-loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          z-index: 999999;
          animation: fadeIn 0.2s ease;
        }
        
        .unified-loading-inline {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          min-height: 100px;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .unified-loading-content {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        }
        
        .unified-loading-inline .unified-loading-content {
          padding: 20px;
          background: transparent;
          box-shadow: none;
        }
        
        .unified-loading-spinner {
          display: flex;
          justify-content: center;
          gap: ${currentSize.gap}px;
          margin-bottom: 20px;
        }
        
        .spinner-dot {
          width: ${currentSize.dotSize}px;
          height: ${currentSize.dotSize}px;
          border-radius: 50%;
          background: #1631F8;
          animation: unifiedBounce 1.4s ease-in-out infinite both;
        }
        
        .spinner-dot:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .spinner-dot:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        @keyframes unifiedBounce {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .unified-loading-message {
          font-size: ${currentSize.fontSize}px;
          color: #2c3e50;
          font-weight: 500;
          margin: 0;
          letter-spacing: -0.3px;
        }
        
        /* 반응형 디자인 */
        @media (max-width: 768px) {
          .unified-loading-content {
            padding: 32px;
          }
          
          .unified-loading-inline .unified-loading-content {
            padding: 16px;
          }
        }
      `}</style>
    </>
  )
}