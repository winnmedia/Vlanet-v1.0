import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './MyPage.scss'
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'
import { checkSession } from 'util/util'

export default function MyPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const session = checkSession()
    if (!session) {
      navigate('/Login', { replace: true })
    }
  }, [navigate])

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar />
        <main className="mypage">
          <div className="title">마이페이지</div>
          <div className="content">
            <p>마이페이지 기능은 준비 중입니다.</p>
          </div>
        </main>
      </div>
    </PageTemplate>
  )
}