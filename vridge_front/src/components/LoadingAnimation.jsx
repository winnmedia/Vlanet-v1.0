import React from 'react'
import './LoadingAnimation.scss'

export default function LoadingAnimation({ message, progress }) {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        
        {message && (
          <div className="loading-message">{message}</div>
        )}
        
        {progress !== undefined && progress > 0 && (
          <div className="loading-progress">
            <div className="progress-track">
              <div 
                className="progress-bar" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}