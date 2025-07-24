import React, { useState, useEffect } from 'react'

export default function LoadingAnimationV2({ message = '로딩 중...', variant = 'default' }) {
  const [dots, setDots] = useState('')
  
  // 점 애니메이션
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  // variant별 스타일
  const variants = {
    default: {
      icon: '⏳',
      color: '#1631F8',
      bgColor: 'rgba(22, 49, 248, 0.05)'
    },
    project: {
      icon: '📁',
      color: '#1631F8',
      bgColor: 'rgba(22, 49, 248, 0.05)'
    },
    video: {
      icon: '🎬',
      color: '#9b59b6',
      bgColor: 'rgba(155, 89, 182, 0.05)'
    },
    saving: {
      icon: '💾',
      color: '#27ae60',
      bgColor: 'rgba(39, 174, 96, 0.05)'
    }
  };
  
  const currentVariant = variants[variant] || variants.default;
  
  return (
    <div className="loading-animation-v2">
      <div className="loading-content">
        <div className="loading-icon" style={{ color: currentVariant.color }}>
          {currentVariant.icon}
        </div>
        <div className="loading-text">
          <p className="loading-message">{message}{dots}</p>
        </div>
        <div className="loading-bar">
          <div className="loading-bar-fill" style={{ background: currentVariant.color }}></div>
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
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          z-index: 9999;
          animation: fadeIn 0.3s ease;
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
          background: white;
          border-radius: 16px;
          padding: 48px 64px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          text-align: center;
          min-width: 320px;
          position: relative;
          overflow: hidden;
        }
        
        .loading-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: ${currentVariant.color};
        }
        
        .loading-icon {
          font-size: 48px;
          margin-bottom: 24px;
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
        
        .loading-text {
          margin-bottom: 24px;
        }
        
        .loading-message {
          font-size: 16px;
          color: #2c3e50;
          font-weight: 500;
          margin: 0;
          min-height: 24px;
        }
        
        .loading-bar {
          width: 200px;
          height: 4px;
          background: #ecf0f1;
          border-radius: 2px;
          overflow: hidden;
          margin: 0 auto;
          position: relative;
        }
        
        .loading-bar-fill {
          height: 100%;
          border-radius: 2px;
          position: absolute;
          left: -100%;
          width: 100%;
          animation: slide 1.5s ease-in-out infinite;
        }
        
        @keyframes slide {
          0% {
            left: -100%;
          }
          50% {
            left: 0;
          }
          100% {
            left: 100%;
          }
        }
        
        /* 반응형 디자인 */
        @media (max-width: 768px) {
          .loading-content {
            padding: 32px 48px;
            min-width: 280px;
          }
          
          .loading-icon {
            font-size: 40px;
          }
          
          .loading-message {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}