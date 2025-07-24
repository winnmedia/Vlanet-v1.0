import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import PageTemplate from '../../components/PageTemplate'
import SideBar from '../../components/SideBar'
import LoadingAnimation from '../../components/LoadingAnimation'

export default function VideoPlanning() {
  const router = useRouter()
  const user = useSelector((state) => state.user)
  const [loading, setLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Redux 상태가 로드되지 않았으면 대기
    if (user === undefined) {
      return;
    }
    
    // 상태가 로드되면 초기화 완료로 표시
    setIsInitialized(true);
    
    // 로그인되지 않은 경우에만 리다이렉트
    if (user === null || (user && !user.email)) {
      console.log('[VideoPlanning] User not logged in, redirecting to login');
      router.push('/login');
    }
  }, [user, router])

  // 초기화 중이면 로딩 표시
  if (!isInitialized) {
    return (
      <PageTemplate>
        <div className="contents">
          <SideBar />
          <main className="main">
            <LoadingAnimation message="페이지 로딩 중..." />
          </main>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate>
      <div className="contents">
        <SideBar />
        <main className="main">
          <div className="video-planning-page">
            <div className="page-header">
              <h1>🎬 영상 기획</h1>
              <p>AI를 활용한 영상 기획 도구입니다.</p>
            </div>
            
            <div className="planning-container">
              <div className="feature-cards">
                <div className="feature-card">
                  <div className="card-icon">🤖</div>
                  <h3>AI 기획 생성</h3>
                  <p>인공지능이 영상 기획안을 자동으로 생성합니다.</p>
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      // AI 기획 생성 기능
                      alert('AI 기획 생성 기능은 곧 활성화됩니다.')
                    }}
                  >
                    시작하기
                  </button>
                </div>
                
                <div className="feature-card">
                  <div className="card-icon">📝</div>
                  <h3>템플릿 활용</h3>
                  <p>다양한 영상 템플릿을 활용해 빠르게 기획하세요.</p>
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      alert('템플릿 기능은 곧 활성화됩니다.')
                    }}
                  >
                    템플릿 보기
                  </button>
                </div>
                
                <div className="feature-card">
                  <div className="card-icon">📊</div>
                  <h3>기획안 관리</h3>
                  <p>생성된 기획안을 관리하고 수정할 수 있습니다.</p>
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      alert('기획안 관리 기능은 곧 활성화됩니다.')
                    }}
                  >
                    관리하기
                  </button>
                </div>
              </div>
              
              <div className="recent-plannings">
                <h2>최근 기획안</h2>
                <div className="planning-list">
                  <div className="empty-state">
                    <p>아직 생성된 기획안이 없습니다.</p>
                    <p>위의 'AI 기획 생성' 버튼을 클릭하여 시작하세요.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {loading && <LoadingAnimation message="로딩 중..." />}
        </main>
      </div>
      
      <style jsx>{`
        .video-planning-page {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .page-header {
          margin-bottom: 32px;
        }
        
        .page-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #212529;
          margin-bottom: 8px;
        }
        
        .page-header p {
          font-size: 16px;
          color: #6c757d;
        }
        
        .planning-container {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        
        .feature-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }
        
        .feature-card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        
        .card-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .feature-card h3 {
          font-size: 20px;
          font-weight: 600;
          color: #212529;
          margin-bottom: 8px;
        }
        
        .feature-card p {
          font-size: 14px;
          color: #6c757d;
          margin-bottom: 24px;
          line-height: 1.6;
        }
        
        .btn-primary, .btn-secondary {
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #1631F8 0%, #0F23C9 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(22, 49, 248, 0.25);
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(22, 49, 248, 0.4);
        }
        
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        
        .btn-secondary:hover {
          background: #5a6268;
          transform: translateY(-1px);
        }
        
        .recent-plannings h2 {
          font-size: 24px;
          font-weight: 600;
          color: #212529;
          margin-bottom: 24px;
        }
        
        .planning-list {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 48px;
        }
        
        .empty-state {
          text-align: center;
          color: #6c757d;
        }
        
        .empty-state p {
          margin-bottom: 8px;
        }
      `}</style>
    </PageTemplate>
  )
}