'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from 'antd'
// import Image from 'next/image'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // 프로덕션 환경에서 Next.js App loaded 확인용 콘솔
    console.log('[VideoPlanet Next.js] App loaded at:', new Date().toISOString())
  }, [])

  const handleLoginClick = () => {
    router.push('/login')
  }

  const handleSignupClick = () => {
    router.push('/signup')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 */}
      <header className="w-full p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-600">VP</div>
            <span className="text-xl font-semibold text-gray-800">VideoPlanet</span>
          </div>
          <div className="space-x-4">
            <Button onClick={handleLoginClick}>로그인</Button>
            <Button type="primary" onClick={handleSignupClick}>
              회원가입
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 섹션 */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center space-y-8">
          <h1 className="text-5xl font-bold text-gray-900 leading-tight">
            영상 제작의 새로운 협업 경험
            <br />
            <span className="text-blue-600">VideoPlanet</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            팀원들과 함께 영상 프로젝트를 효율적으로 관리하고, 
            실시간 피드백으로 더 나은 결과물을 만들어보세요.
          </p>

          <div className="flex justify-center space-x-6 pt-8">
            <Button 
              type="primary" 
              size="large" 
              onClick={handleSignupClick}
              className="px-8 py-4 h-auto text-lg"
            >
              무료로 시작하기
            </Button>
            <Button 
              size="large" 
              onClick={() => router.push('/demo')}
              className="px-8 py-4 h-auto text-lg"
            >
              데모 보기
            </Button>
          </div>
        </div>

        {/* 기능 소개 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-6 bg-white rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold mb-3">실시간 피드백</h3>
            <p className="text-gray-600">
              영상에 직접 코멘트를 남기고 팀원들과 실시간으로 소통하세요.
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-3">프로젝트 관리</h3>
            <p className="text-gray-600">
              체계적인 프로젝트 관리로 일정과 진행상황을 한눈에 파악하세요.
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold mb-3">효율적 협업</h3>
            <p className="text-gray-600">
              팀원 초대부터 최종 승인까지, 원활한 협업 환경을 제공합니다.
            </p>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-50 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="text-xl font-bold text-blue-600">VP</div>
            <span className="text-lg font-semibold text-gray-800">VideoPlanet</span>
          </div>
          <p className="text-gray-600">
            © 2025 VideoPlanet. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
