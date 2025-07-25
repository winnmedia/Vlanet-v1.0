import React from 'react'

export default function LoadingAnimationV2({ message = '로딩 중...', variant = 'default' }) {
  // variant별 스타일
  const variants = {
    default: {
      color: '#1631F8',
      bgColor: 'rgba(22, 49, 248, 0.05)'
    },
    project: {
      color: '#1631F8',
      bgColor: 'rgba(22, 49, 248, 0.05)'
    },
    video: {
      color: '#9b59b6',
      bgColor: 'rgba(155, 89, 182, 0.05)'
    },
    saving: {
      color: '#27ae60',
      bgColor: 'rgba(39, 174, 96, 0.05)'
    }
  };
  
  const currentVariant = variants[variant] || variants.default;
  
  return (
    <div className="loading-animation-v2">
      <div className="loading-content">
        <div className="loading-spinner">
          <div className="spinner-dot" style={{ background: currentVariant.color }}></div>
          <div className="spinner-dot" style={{ background: currentVariant.color }}></div>
          <div className="spinner-dot" style={{ background: currentVariant.color }}></div>
        </div>
        <div className="loading-text">
          <p className="loading-message">{message}</p>
        </div>
      </div>
      
      <style jsx>{`
        .loading-animation-v2 {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.95);
          z-index: 999999;
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .loading-content {
          text-align: center;
          padding: 40px;
        }
        
        .loading-spinner {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 24px;
        }
        
        .spinner-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: bounce 1.4s ease-in-out infinite both;
        }
        
        .spinner-dot:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .spinner-dot:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .loading-message {
          font-size: 16px;
          color: #2c3e50;
          font-weight: 400;
          margin: 0;
          letter-spacing: -0.3px;
        }
        
        /* 반응형 디자인 */
        @media (max-width: 768px) {
          .loading-content {
            padding: 32px;
          }
          
          .spinner-dot {
            width: 10px;
            height: 10px;
          }
          
          .loading-message {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}