import React from 'react'

export default function LoadingSpinner({ message = "로딩 중..." }) {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner-content">
        <div className="spinner-wrapper">
          <div className="spinner"></div>
        </div>
        {message && (
          <div className="loading-message">{message}</div>
        )}
      </div>
    </div>
  )
}