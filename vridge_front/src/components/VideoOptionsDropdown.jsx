import React, { useState } from 'react'
// SCSS는 _app.js에서 글로벌로 import됨

export default function VideoOptionsDropdown({ planningOptions, setPlanningOptions }) {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    advanced: false,
    technical: false
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <div className="video-options-dropdown">
      {/* 기본 옵션 */}
      <div className="options-section">
        <div 
          className="section-header"
          onClick={() => toggleSection('basic')}
        >
          <h4>
            <span className="section-icon">🎬</span>
            기본 설정
          </h4>
          <span className={`toggle-icon ${expandedSections.basic ? 'expanded' : ''}`}>
            ▼
          </span>
        </div>
        
        {expandedSections.basic && (
          <div className="section-content">
            {/* 영상 길이 */}
            <div className="option-item">
              <label>영상 길이</label>
              <select 
                value={planningOptions.duration || ''} 
                onChange={(e) => setPlanningOptions(prev => ({ ...prev, duration: e.target.value }))}
              >
                <option value="">선택하세요</option>
                <optgroup label="숏폼 콘텐츠">
                  <option value="15초 이하">15초 이하</option>
                  <option value="30초">30초</option>
                  <option value="1분">1분</option>
                  <option value="1-3분">1-3분</option>
                </optgroup>
                <optgroup label="미드폼 콘텐츠">
                  <option value="3-5분">3-5분</option>
                  <option value="5-10분">5-10분</option>
                  <option value="10-15분">10-15분</option>
                </optgroup>
                <optgroup label="롱폼 콘텐츠">
                  <option value="15-30분">15-30분</option>
                  <option value="30분-1시간">30분-1시간</option>
                  <option value="1시간 이상">1시간 이상</option>
                </optgroup>
              </select>
            </div>

            {/* 화면 비율 */}
            <div className="option-item">
              <label>화면 비율</label>
              <select 
                value={planningOptions.aspectRatio || '16:9'} 
                onChange={(e) => setPlanningOptions(prev => ({ ...prev, aspectRatio: e.target.value }))}
              >
                <option value="16:9">16:9 (가로형 - YouTube, TV)</option>
                <option value="9:16">9:16 (세로형 - Shorts, Reels)</option>
                <option value="1:1">1:1 (정사각형 - Instagram)</option>
                <option value="4:5">4:5 (세로형 - Instagram)</option>
                <option value="21:9">21:9 (시네마틱)</option>
              </select>
            </div>

            {/* 플랫폼 */}
            <div className="option-item">
              <label>주요 플랫폼</label>
              <select 
                value={planningOptions.platform || ''} 
                onChange={(e) => setPlanningOptions(prev => ({ ...prev, platform: e.target.value }))}
              >
                <option value="">선택하세요</option>
                <option value="youtube">YouTube</option>
                <option value="youtube_shorts">YouTube Shorts</option>
                <option value="instagram_reels">Instagram Reels</option>
                <option value="instagram_feed">Instagram Feed</option>
                <option value="tiktok">TikTok</option>
                <option value="facebook">Facebook</option>
                <option value="tv_broadcast">TV 방송</option>
                <option value="cinema">극장 상영</option>
                <option value="corporate">기업 내부용</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 고급 옵션 */}
      <div className="options-section">
        <div 
          className="section-header"
          onClick={() => toggleSection('advanced')}
        >
          <h4>
            <span className="section-icon">🎨</span>
            고급 설정
          </h4>
          <span className={`toggle-icon ${expandedSections.advanced ? 'expanded' : ''}`}>
            ▼
          </span>
        </div>
        
        {expandedSections.advanced && (
          <div className="section-content">
            {/* 색감/톤 */}
            <div className="option-item">
              <label>색감/톤</label>
              <select 
                value={planningOptions.colorTone || ''} 
                onChange={(e) => setPlanningOptions(prev => ({ ...prev, colorTone: e.target.value }))}
              >
                <option value="">선택하세요</option>
                <option value="warm">따뜻한 톤</option>
                <option value="cool">차가운 톤</option>
                <option value="vibrant">선명한 컬러</option>
                <option value="pastel">파스텔 톤</option>
                <option value="monochrome">흑백</option>
                <option value="sepia">세피아</option>
                <option value="cinematic">시네마틱</option>
                <option value="natural">자연스러운</option>
              </select>
            </div>

            {/* 편집 스타일 */}
            <div className="option-item">
              <label>편집 스타일</label>
              <select 
                value={planningOptions.editingStyle || ''} 
                onChange={(e) => setPlanningOptions(prev => ({ ...prev, editingStyle: e.target.value }))}
              >
                <option value="">선택하세요</option>
                <option value="fast_cuts">빠른 컷 편집</option>
                <option value="long_takes">롱테이크</option>
                <option value="montage">몽타주</option>
                <option value="jump_cuts">점프컷</option>
                <option value="smooth_transitions">부드러운 전환</option>
                <option value="dynamic">다이나믹</option>
                <option value="minimal">미니멀</option>
              </select>
            </div>

            {/* 음악/사운드 */}
            <div className="option-item">
              <label>음악/사운드</label>
              <select 
                value={planningOptions.musicStyle || ''} 
                onChange={(e) => setPlanningOptions(prev => ({ ...prev, musicStyle: e.target.value }))}
              >
                <option value="">선택하세요</option>
                <option value="upbeat">경쾌한</option>
                <option value="emotional">감성적인</option>
                <option value="epic">웅장한</option>
                <option value="calm">차분한</option>
                <option value="energetic">에너지틱</option>
                <option value="mysterious">신비로운</option>
                <option value="no_music">음악 없음</option>
                <option value="ambient">앰비언트</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 기술 사양 */}
      <div className="options-section">
        <div 
          className="section-header"
          onClick={() => toggleSection('technical')}
        >
          <h4>
            <span className="section-icon">⚙️</span>
            기술 사양
          </h4>
          <span className={`toggle-icon ${expandedSections.technical ? 'expanded' : ''}`}>
            ▼
          </span>
        </div>
        
        {expandedSections.technical && (
          <div className="section-content">
            {/* 해상도 */}
            <div className="option-item">
              <label>해상도</label>
              <select 
                value={planningOptions.resolution || '1920x1080'} 
                onChange={(e) => setPlanningOptions(prev => ({ ...prev, resolution: e.target.value }))}
              >
                <option value="1920x1080">Full HD (1920x1080)</option>
                <option value="3840x2160">4K UHD (3840x2160)</option>
                <option value="1280x720">HD (1280x720)</option>
                <option value="854x480">SD (854x480)</option>
                <option value="7680x4320">8K UHD (7680x4320)</option>
              </select>
            </div>

            {/* 프레임레이트 */}
            <div className="option-item">
              <label>프레임레이트</label>
              <select 
                value={planningOptions.frameRate || '30fps'} 
                onChange={(e) => setPlanningOptions(prev => ({ ...prev, frameRate: e.target.value }))}
              >
                <option value="24fps">24fps (영화)</option>
                <option value="30fps">30fps (표준)</option>
                <option value="60fps">60fps (고화질)</option>
                <option value="120fps">120fps (슬로모션)</option>
                <option value="25fps">25fps (PAL)</option>
              </select>
            </div>

            {/* 코덱 */}
            <div className="option-item">
              <label>비디오 코덱</label>
              <select 
                value={planningOptions.codec || 'h264'} 
                onChange={(e) => setPlanningOptions(prev => ({ ...prev, codec: e.target.value }))}
              >
                <option value="h264">H.264 (호환성 우수)</option>
                <option value="h265">H.265/HEVC (고효율)</option>
                <option value="prores">ProRes (편집용)</option>
                <option value="dnxhd">DNxHD (방송용)</option>
                <option value="av1">AV1 (최신)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}