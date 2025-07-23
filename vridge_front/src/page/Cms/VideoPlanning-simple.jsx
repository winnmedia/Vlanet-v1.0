import React from 'react'
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'

export default function VideoPlanning() {
  return (
    <PageTemplate>
      <div className="contents">
        <SideBar />
        <div className="main">
          <div className="video-planning-page">
            <h1>비디오 기획</h1>
            <p>임시 페이지입니다. 빌드 테스트 중...</p>
          </div>
        </div>
      </div>
    </PageTemplate>
  )
}