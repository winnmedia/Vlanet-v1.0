import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminDashboard.scss'
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'
import { checkSession } from 'util/util'

export default function AdminDashboard() {
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
        <main className="admin-dashboard">
          <div className="title">관리자 대시보드</div>
          <div className="content">
            <p>관리자 대시보드 기능은 준비 중입니다.</p>
          </div>
        </main>
      </div>
    </PageTemplate>
  )
}