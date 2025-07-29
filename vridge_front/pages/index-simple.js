import { useRouter } from 'next/router'
import { UnifiedButton } from '../src/components/unified/UnifiedButton';
import dynamic from 'next/dynamic';
import { useEffect } from 'react'

export default function SimpleHome() {
  const router = useRouter()
  
  useEffect(() => {
    // 세션 체크 후 리다이렉트
    const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null
    if (token) {
      router.push('/cmshome')
    }
  }, [router])
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#212529' }}>
        VideoPlanet
      </h1>
      <p style={{ fontSize: '24px', marginBottom: '40px', color: '#6c757d' }}>
        영상 콘텐츠 협업의 신세계
      </p>
      <div style={{ display: 'flex', gap: '20px' }}>
        <UnifiedButton
          onClick={() => router.push('/login')}
          style={{
            padding: '12px 32px',
            fontSize: '18px',
            backgroundColor: '#1631F8',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          로그인
        </UnifiedButton>
        <UnifiedButton
          onClick={() => router.push('/signup')}
          style={{
            padding: '12px 32px',
            fontSize: '18px',
            backgroundColor: 'white',
            color: '#1631F8',
            border: '2px solid #1631F8',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          회원가입
        </UnifiedButton>
      </div>
    </div>
  )
}