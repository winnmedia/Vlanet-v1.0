import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from '../../util/nextNavigation'
import { AcceptInvitation, DeclineInvitation } from '../../api/invitation'
import { checkSession } from '../../util/util'
import axios from '../../config/axios'
import moment from 'moment'
import 'moment/locale/ko'
import { useNavigationFlow } from '../../hooks/useNavigationFlow'
import { debug404 } from '../../utils/debug404'

export default function InvitationAccept() {
  const { token, uid } = useParams()
  const { navigate } = useRouter()
  const { startFlow, navigateInFlow, navigateSafely, handleNotFound } = useNavigationFlow()
  
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        console.log('[InvitationAccept] Parameters:', { token, uid })
        
        // 새로운 초대 시스템 (토큰만 사용)
        if (token && !uid) {
          const apiUrl = `/api/projects/invitations/token/${token}/`
          console.log('[InvitationAccept] API URL:', apiUrl)
          
          // 토큰으로 초대 정보 조회
          const response = await axios.get(apiUrl)
          console.log('[InvitationAccept] API Response:', response.data)
          
          if (response.data.status === 'success') {
            setInvitation(response.data.invitation)
          } else {
            setError(response.data.message || '초대 정보를 찾을 수 없습니다.')
          }
        } 
        // 기존 초대 시스템 (uid와 token 사용) - 하위 호환성
        else if (uid && token) {
          console.log('[InvitationAccept] Legacy URL detected:', { uid, token })
          // 기존 방식의 초대는 지원 중단 메시지 표시
          setError('이 초대 링크는 더 이상 유효하지 않습니다. 새로운 초대를 요청해주세요.')
        } else {
          console.log('[InvitationAccept] Invalid parameters:', { token, uid })
          setError('잘못된 초대 링크입니다.')
        }
      } catch (error) {
        console.error('[InvitationAccept] 초대 정보 조회 실패:', error)
        console.error('[InvitationAccept] Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        })
        
        // 404 디버깅 정보 추가
        debug404.analyzeError(error)
        
        if (error.response?.status === 404) {
          setError('유효하지 않은 초대 링크입니다.')
        } else if (error.response?.status === 400) {
          setError(error.response.data.message || '만료되거나 처리된 초대입니다.')
        } else {
          setError('초대 정보를 불러오는 중 오류가 발생했습니다.')
        }
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchInvitation()
    } else {
      setError('잘못된 초대 링크입니다.')
      setLoading(false)
    }
  }, [token, uid])

  const handleResponse = async (action) => {
    // 로그인 확인
    const session = checkSession()
    if (!session) {
      // 비회원이 수락하려는 경우 회원가입으로 유도
      if (action === 'accept') {
        alert('프로젝트에 참여하려면 회원가입이 필요합니다.')
        
        // 초대 플로우 시작
        startFlow('invitation', {
          token: token,
          invitationId: invitation.id,
          projectId: invitation.project.id,
          projectName: invitation.project.name,
          inviterName: invitation.inviter.nickname
        })
        
        // 회원가입 페이지로 이동
        navigate('/signup', { 
          state: { 
            invitationToken: token,
            invitationId: invitation.id,
            projectId: invitation.project.id,
            projectName: invitation.project.name,
            inviterName: invitation.inviter.nickname,
            returnUrl: `/Feedback/${invitation.project.id}`,
            message: `${invitation.inviter.nickname}님이 "${invitation.project.name}" 프로젝트에 초대했습니다.`
          }
        })
      } else {
        // 거절은 로그인 없이도 가능
        setProcessing(true)
        try {
          await DeclineInvitation(invitation.id)
          alert('초대를 거절했습니다.')
          navigateSafely('/')
        } catch (error) {
          console.error('초대 거절 실패:', error)
          alert(error.response?.data?.message || '초대 처리 중 오류가 발생했습니다.')
        } finally {
          setProcessing(false)
        }
      }
      return
    }

    setProcessing(true)
    
    try {
      if (action === 'accept') {
        // 초대 플로우 시작 (로그인된 사용자)
        startFlow('invitation', {
          projectId: invitation.project.id
        })
        
        await AcceptInvitation(invitation.id)
        alert('초대를 수락했습니다! 피드백 페이지로 이동합니다.')
        
        // 안전한 네비게이션으로 피드백 페이지로 이동
        navigateSafely(`/Feedback/${invitation.project.id}`, {
          projectId: invitation.project.id
        })
      } else {
        await DeclineInvitation(invitation.id)
        alert('초대를 거절했습니다.')
        navigateSafely('/')
      }
    } catch (error) {
      console.error('초대 처리 실패:', error)
      
      if (error.response?.status === 404) {
        alert('프로젝트를 찾을 수 없습니다.')
        handleNotFound(error)
      } else {
        alert(error.response?.data?.message || '초대 처리 중 오류가 발생했습니다.')
      }
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
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
          <p style={{ fontSize: '18px', color: '#666' }}>초대 정보를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #ff7eb3 0%, #ff758c 100%)'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px', color: '#dc3545' }}>!</div>
          <h2 style={{ color: '#dc3545', marginBottom: '16px' }}>초대 확인 실패</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>{error}</p>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            홈으로 이동
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '50px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        maxWidth: '600px',
        width: '100%'
      }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            color: '#1631F8',
            fontWeight: 'bold'
          }}>VP</div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1631F8',
            marginBottom: '8px'
          }}>
            VideoPlanet 초대
          </h1>
          <p style={{ color: '#6c757d', fontSize: '16px' }}>
            새로운 영상 프로젝트에 초대되었습니다!
          </p>
        </div>

        {/* 초대 정보 */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '30px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#212529',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
{invitation.project.name}
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ color: '#495057' }}>초대자:</strong>
            <span style={{ marginLeft: '8px', color: '#6c757d' }}>
              {invitation.inviter.nickname} ({invitation.inviter.email})
            </span>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ color: '#495057' }}>초대일:</strong>
            <span style={{ marginLeft: '8px', color: '#6c757d' }}>
              {moment(invitation.created).format('YYYY년 MM월 DD일')}
            </span>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ color: '#495057' }}>만료일:</strong>
            <span style={{ marginLeft: '8px', color: '#dc3545' }}>
              {moment(invitation.expires_at).format('YYYY년 MM월 DD일')}
            </span>
          </div>

          {invitation.project.description && (
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: '#495057' }}>프로젝트 설명:</strong>
              <p style={{ 
                marginTop: '8px', 
                color: '#6c757d',
                lineHeight: '1.5',
                background: 'white',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                {invitation.project.description}
              </p>
            </div>
          )}

          {invitation.message && (
            <div>
              <strong style={{ color: '#495057' }}>초대 메시지:</strong>
              <p style={{ 
                marginTop: '8px', 
                color: '#6c757d',
                lineHeight: '1.5',
                background: '#fff3cd',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ffeaa7',
                fontStyle: 'italic'
              }}>
                "{invitation.message}"
              </p>
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => handleResponse('decline')}
            disabled={processing}
            style={{
              background: 'white',
              color: '#dc3545',
              border: '2px solid #dc3545',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: processing ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: processing ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!processing) {
                e.target.style.background = '#dc3545'
                e.target.style.color = 'white'
              }
            }}
            onMouseLeave={(e) => {
              if (!processing) {
                e.target.style.background = 'white'
                e.target.style.color = '#dc3545'
              }
            }}
          >
            {processing ? '처리 중...' : '거절하기'}
          </button>
          
          <button
            onClick={() => handleResponse('accept')}
            disabled={processing}
            style={{
              background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
              color: 'white',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: processing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(22, 49, 248, 0.3)',
              transition: 'all 0.3s ease',
              opacity: processing ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!processing) {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 16px rgba(22, 49, 248, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!processing) {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 12px rgba(22, 49, 248, 0.3)'
              }
            }}
          >
            {processing ? '처리 중...' : '수락하기'}
          </button>
        </div>

        {/* 하단 정보 */}
        <div style={{
          marginTop: '40px',
          textAlign: 'center',
          color: '#6c757d',
          fontSize: '14px'
        }}>
          <p>
            VideoPlanet에서 팀원들과 함께<br />
            영상 프로젝트를 효율적으로 관리하세요!
          </p>
        </div>
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