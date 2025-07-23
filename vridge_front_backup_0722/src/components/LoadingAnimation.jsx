import React, { useState, useEffect } from 'react'
import './LoadingAnimation.scss'

export default function LoadingAnimation({ message, progress }) {
  const [humorousMessage, setHumorousMessage] = useState('')
  
  const messages = [
    "작가가 연필을 깎는 중...",
    "조연출이 소품을 구해오는 중...",
    "감독이 커피를 마시는 중...",
    "촬영 감독이 렌즈를 닦는 중...",
    "편집자가 키보드를 두드리는 중...",
    "음향 감독이 효과음을 찾는 중...",
    "미술 감독이 색연필을 고르는 중...",
    "PD가 예산을 계산하는 중...",
    "스태프가 도넛을 먹는 중...",
    "AI가 영감을 받는 중...",
    "카메라가 포커스를 맞추는 중...",
    "조명 감독이 전구를 갈아끼우는 중..."
  ]
  
  useEffect(() => {
    // 초기 메시지 설정
    setHumorousMessage(messages[Math.floor(Math.random() * messages.length)])
    
    // 3초마다 메시지 변경
    const interval = setInterval(() => {
      setHumorousMessage(messages[Math.floor(Math.random() * messages.length)])
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="loading-overlay">
      <div className="loading-box">
        <div className="loading-dots-container">
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>
        
        <div className="loading-text">
          <div className="humorous-message">{humorousMessage}</div>
          {message && (
            <div className="loading-message">{message}</div>
          )}
        </div>
        
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