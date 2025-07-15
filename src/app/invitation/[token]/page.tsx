'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Spin } from 'antd'
import axios from 'axios'

interface Invitation {
  id: number
  project: {
    id: number
    name: string
    description?: string
  }
  inviter: {
    nickname: string
    email: string
  }
  message?: string
  created: string
  expires_at: string
}

export default function InvitationAcceptPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        console.log('[InvitationAccept] Next.js Token:', token)
        
        if (!token) {
          setError('잘못된 초대 링크입니다.')
          return
        }

        // Next.js API 프록시를 통해 백엔드 호출
        const apiUrl = `/api/projects/invitations/token/${token}/`
        console.log('[InvitationAccept] Next.js API URL:', apiUrl)
        
        const response = await axios.get(apiUrl)
        console.log('[InvitationAccept] Next.js API Response:', response.data)
        
        if (response.data.status === 'success') {
          setInvitation(response.data.invitation)
        } else {
          setError(response.data.message || '초대 정보를 찾을 수 없습니다.')
        }
      } catch (error: unknown) {
        console.error('[InvitationAccept] Next.js 초대 정보 조회 실패:', error)
        
        const axiosError = error as { response?: { status: number; data: { message?: string } } }
        if (axiosError.response?.status === 404) {
          setError('유효하지 않은 초대 링크입니다.')
        } else if (axiosError.response?.status === 400) {
          setError(axiosError.response.data.message || '만료되거나 처리된 초대입니다.')
        } else {
          setError('초대 정보를 불러오는 중 오류가 발생했습니다.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [token])

  const handleResponse = async (action: 'accept' | 'decline') => {
    if (!invitation) return

    setProcessing(true)
    
    try {
      // 로그인 확인은 여기서 구현 필요
      // 현재는 회원가입 페이지로 리다이렉트
      if (action === 'accept') {
        alert('프로젝트에 참여하려면 회원가입이 필요합니다.')
        router.push(`/signup?invitation=${token}&project=${invitation.project.id}`)
      } else {
        // 거절 처리
        await axios.post(`/api/projects/invitations/${invitation.id}/decline/`)
        alert('초대를 거절했습니다.')
        router.push('/')
      }
    } catch (error: unknown) {
      console.error('초대 처리 실패:', error)
      const axiosError = error as { response?: { data: { message?: string } } }
      alert(axiosError.response?.data?.message || '초대 처리 중 오류가 발생했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">초대 정보를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-4">초대 확인 실패</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button type="primary" onClick={() => router.push('/')}>
            홈으로 이동
          </Button>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-blue-600 mb-2">VP</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">VideoPlanet 초대</h1>
          <p className="text-gray-600">새로운 영상 프로젝트에 초대되었습니다!</p>
        </div>

        {/* 초대 정보 */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-100">
          <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
            🎬 {invitation.project.name}
          </h3>
          
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">초대자:</span>
              <span className="ml-2 text-gray-600">
                {invitation.inviter.nickname} ({invitation.inviter.email})
              </span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">초대일:</span>
              <span className="ml-2 text-gray-600">
                {new Date(invitation.created).toLocaleDateString('ko-KR')}
              </span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">만료일:</span>
              <span className="ml-2 text-red-600">
                {new Date(invitation.expires_at).toLocaleDateString('ko-KR')}
              </span>
            </div>

            {invitation.project.description && (
              <div>
                <span className="font-medium text-gray-700">프로젝트 설명:</span>
                <div className="mt-2 p-3 bg-white rounded border">
                  {invitation.project.description}
                </div>
              </div>
            )}

            {invitation.message && (
              <div>
                <span className="font-medium text-gray-700">초대 메시지:</span>
                <div className="mt-2 p-3 bg-yellow-50 rounded border border-yellow-200 italic">
                  &ldquo;{invitation.message}&rdquo;
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 기능 소개 */}
        <div className="mb-8">
          <h4 className="font-medium text-gray-800 mb-4 text-center">
            VideoPlanet에서 이런 것들을 할 수 있어요
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-4 rounded text-center">
              <div className="text-blue-600 text-lg mb-2">■</div>
              <div className="font-medium">실시간 피드백</div>
              <div className="text-gray-600">영상에 직접 코멘트 작성</div>
            </div>
            <div className="bg-gray-50 p-4 rounded text-center">
              <div className="text-blue-600 text-lg mb-2">●</div>
              <div className="font-medium">일정 관리</div>
              <div className="text-gray-600">체계적인 프로젝트 관리</div>
            </div>
            <div className="bg-gray-50 p-4 rounded text-center">
              <div className="text-blue-600 text-lg mb-2">▲</div>
              <div className="font-medium">팀 협업</div>
              <div className="text-gray-600">효율적인 협업 환경</div>
            </div>
            <div className="bg-gray-50 p-4 rounded text-center">
              <div className="text-blue-600 text-lg mb-2">◆</div>
              <div className="font-medium">진행 현황</div>
              <div className="text-gray-600">한눈에 보는 프로젝트</div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => handleResponse('decline')}
            disabled={processing}
            size="large"
            className="px-8"
          >
            {processing ? '처리 중...' : '거절하기'}
          </Button>
          
          <Button
            type="primary"
            onClick={() => handleResponse('accept')}
            disabled={processing}
            size="large"
            className="px-8"
          >
            {processing ? '처리 중...' : '수락하기'}
          </Button>
        </div>

        {/* 하단 정보 */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            VideoPlanet에서 팀원들과 함께<br />
            영상 프로젝트를 효율적으로 관리하세요!
          </p>
        </div>
      </div>
    </div>
  )
}