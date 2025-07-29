import React, { useEffect, useState } from 'react'
import { useNavigationFlow } from '../hooks/useNavigationFlow'

export function SafeRoute({ children, checkResource, resourceId, resourceType = 'resource' }) {
  const { handleNotFound } = useNavigationFlow()
  const [isLoading, setIsLoading] = useState(!!checkResource)
  const [hasError, setHasError] = useState(false)
  
  useEffect(() => {
    if (checkResource && resourceId) {
      setIsLoading(true)
      
      checkResource(resourceId)
        .then(() => {
          setIsLoading(false)
          setHasError(false)
        })
        .catch((error) => {
          setIsLoading(false)
          
          if (error.response?.status === 404) {
            setHasError(true)
            // 404 에러 처리
            setTimeout(() => {
              handleNotFound(error)
            }, 1000) // 에러 메시지를 잠시 보여준 후 리다이렉트
          }
        })
    }
  }, [checkResource, resourceId, handleNotFound])
  
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8f9fa'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #1631F8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#666' }}>Loading...</p>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }
  
  if (hasError) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8f9fa'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>😕</div>
          <h2 style={{ color: '#dc3545', marginBottom: '16px' }}>
            {resourceType === 'project' && '프로젝트를 찾을 수 없습니다'}
            {resourceType === 'feedback' && '피드백 페이지를 찾을 수 없습니다'}
            {resourceType === 'invitation' && '유효하지 않은 초대 링크입니다'}
            {!['project', 'feedback', 'invitation'].includes(resourceType) && '페이지를 찾을 수 없습니다'}
          </h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            잠시 후 메인 페이지로 이동합니다...
          </p>
        </div>
      </div>
    )
  }
  
  return children
}