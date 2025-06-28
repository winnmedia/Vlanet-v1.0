import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import 'css/Cms/Cms.scss'
import 'css/Cms/ContentModern.scss'

/* 상단 이미지 - 샘플, 기본 */
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'

// VLANET 공식 유튜브 채널 비디오 목록
const VLANET_VIDEOS = [
  {
    id: '1',
    title: '프로틴도넛 소개 영상',
    videoId: 'dQw4w9WgXcQ', // 실제 비디오 ID로 교체 필요
    thumbnail: '',
  },
  {
    id: '2',
    title: 'VLANET 브랜드 스토리',
    videoId: 'dQw4w9WgXcQ', // 실제 비디오 ID로 교체 필요
    thumbnail: '',
  },
  {
    id: '3',
    title: '프로틴도넛 제조 과정',
    videoId: 'dQw4w9WgXcQ', // 실제 비디오 ID로 교체 필요
    thumbnail: '',
  },
  {
    id: '4',
    title: '건강한 디저트의 새로운 기준',
    videoId: 'dQw4w9WgXcQ', // 실제 비디오 ID로 교체 필요
    thumbnail: '',
  },
  {
    id: '5',
    title: 'VLANET 고객 후기',
    videoId: 'dQw4w9WgXcQ', // 실제 비디오 ID로 교체 필요
    thumbnail: '',
  },
  {
    id: '6',
    title: '프로틴도넛 Q&A',
    videoId: 'dQw4w9WgXcQ', // 실제 비디오 ID로 교체 필요
    thumbnail: '',
  },
];

export default function Elearning() {
  const navigate = useNavigate()
  const [videos, setVideos] = useState(VLANET_VIDEOS)
  const [loading, setLoading] = useState(false)

  // YouTube 채널 URL
  const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@VLANET_official'

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar />
        <main>
          <div className="title">
            VLANET 콘텐츠
            <span>YouTube 공식 채널 영상</span>
          </div>
          
          <div className="content elearning">
            <div className="channel-link">
              <a 
                href={YOUTUBE_CHANNEL_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="youtube-channel-btn"
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                YouTube 채널 방문
              </a>
            </div>
            
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>영상을 불러오는 중...</p>
              </div>
            ) : (
              <ul className="oc">
                {videos.map((video) => (
                  <li key={video.id}>
                    <div className="video-wrapper">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${video.videoId}`}
                        title={video.title}
                        frameBorder={0}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="lazy"
                      ></iframe>
                    </div>
                    <div className="video-title">{video.title}</div>
                  </li>
                ))}
              </ul>
            )}
            
            {videos.length === 0 && !loading && (
              <div className="empty-state">
                <p>표시할 콘텐츠가 없습니다.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </PageTemplate>
  )
}