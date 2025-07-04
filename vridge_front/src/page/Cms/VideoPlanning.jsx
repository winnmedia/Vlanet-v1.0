import React, { useState } from 'react'
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'
import LoadingAnimation from 'components/LoadingAnimation'
import 'css/Cms/CmsCommon.scss'
import './VideoPlanning.scss'
import axios from 'config/axios'
import { checkSession } from 'util/util'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function VideoPlanning() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [planningData, setPlanningData] = useState({
    planning: '',
    stories: [],
    scenes: [],
    shots: [],
    storyboards: []
  })
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0)
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0)
  const [selectedShotIndex, setSelectedShotIndex] = useState(0)
  const [planningHistory, setPlanningHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null)
  const [planningTitle, setPlanningTitle] = useState('')
  const [planningOptions, setPlanningOptions] = useState({
    tone: '',
    genre: '',
    concept: ''
  })
  const [storyboardStyle, setStoryboardStyle] = useState('minimal')

  useEffect(() => {
    const session = checkSession()
    if (!session) {
      navigate('/Login', { replace: true })
    } else {
      fetchPlanningHistory()
    }
  }, [navigate])

  // API_BASE_URL 제거 - axios 기본 설정 사용

  const fetchPlanningHistory = async () => {
    try {
      const response = await axios.get(`/api/video-planning/library/`)
      if (response.data.status === 'success') {
        setPlanningHistory(response.data.data.plannings || [])
      }
    } catch (err) {
      console.error('히스토리 로드 실패:', err)
    }
  }

  const loadHistoryItem = async (planningId) => {
    try {
      const response = await axios.get(`/api/video-planning/library/${planningId}/`)
      if (response.data.status === 'success') {
        const planning = response.data.data.planning
        setPlanningData({
          planning: planning.planning_text,
          stories: planning.stories || [],
          scenes: planning.scenes || [],
          shots: planning.shots || [],
          storyboards: planning.storyboards || []
        })
        setPlanningTitle(planning.title)
        setCurrentStep(1)
        setShowHistory(false)
      }
    } catch (err) {
      setError('기획안을 불러오는데 실패했습니다.')
    }
  }

  const savePlanning = async () => {
    if (!planningTitle.trim()) {
      setError('기획안 제목을 입력해주세요.')
      return
    }

    try {
      const response = await axios.post(
        `/api/video-planning/library/`,
        {
          title: planningTitle,
          planning_text: planningData.planning,
          stories: planningData.stories,
          scenes: planningData.scenes,
          shots: planningData.shots,
          storyboards: planningData.storyboards
        }
      )

      if (response.data.status === 'success') {
        setSuccessMessage('기획안이 저장되었습니다.')
        fetchPlanningHistory()
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err) {
      setError(err.response?.data?.message || '저장에 실패했습니다.')
    }
  }

  const generateStories = async () => {
    if (!planningData.planning.trim()) {
      setError('기획안을 입력해주세요.')
      return
    }

    // 이미 스토리가 있으면 재생성하지 않고 단계만 이동
    if (planningData.stories && planningData.stories.length > 0) {
      setCurrentStep(2)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await axios.post(
        `/api/video-planning/generate/story/`,
        { 
          planning_text: planningData.planning,
          tone: planningOptions.tone,
          genre: planningOptions.genre,
          concept: planningOptions.concept
        }
      )

      if (response.data.status === 'success') {
        setLoadingProgress(80)
        setLoadingMessage('기승전결 스토리 생성 완료!')
        
        setTimeout(() => {
          setPlanningData(prev => ({
            ...prev,
            stories: response.data.data.stories || []
          }))
          setCurrentStep(2)
          setLoadingProgress(100)
        }, 500)
      } else {
        setError(response.data.message || '스토리 생성에 실패했습니다.')
      }
    } catch (err) {
      setError(err.response?.data?.message || '서버 오류가 발생했습니다.')
    } finally {
      setTimeout(() => {
        setLoading(false)
        setLoadingMessage('')
        setLoadingProgress(0)
      }, 600)
    }
  }

  const generateScenes = async () => {
    // 이미 씬이 있으면 재생성하지 않고 단계만 이동
    if (planningData.scenes && planningData.scenes.length > 0) {
      setCurrentStep(3)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 모든 스토리에 대해 씬 생성 (기승전결 각각 3개씩 = 총 12개)
      let allScenes = []
      
      for (let i = 0; i < planningData.stories.length; i++) {
        const response = await axios.post(
          `/api/video-planning/generate/scenes/`,
          { story_data: planningData.stories[i] }
        )
        
        if (response.data.status === 'success') {
          const scenes = response.data.data.scenes || []
          // 각 씬에 스토리 정보 추가
          const scenesWithStoryInfo = scenes.map(scene => ({
            ...scene,
            story_stage: planningData.stories[i].stage,
            story_stage_name: planningData.stories[i].stage_name,
            story_title: planningData.stories[i].title
          }))
          allScenes = [...allScenes, ...scenesWithStoryInfo]
        }
      }

      if (allScenes.length > 0) {
        setPlanningData(prev => ({
          ...prev,
          scenes: allScenes
        }))
        setCurrentStep(3)
      } else {
        setError('씬 생성에 실패했습니다.')
      }
    } catch (err) {
      setError(err.response?.data?.message || '서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const generateShots = async () => {
    setLoading(true)
    setError(null)

    try {
      const selectedScene = planningData.scenes[selectedSceneIndex]
      const response = await axios.post(
        `/api/video-planning/generate/shots/`,
        { scene_data: selectedScene }
      )

      if (response.data.status === 'success') {
        setPlanningData(prev => ({
          ...prev,
          shots: response.data.data.shots || []
        }))
        setCurrentStep(4)
      } else {
        setError(response.data.message || '숏 생성에 실패했습니다.')
      }
    } catch (err) {
      setError(err.response?.data?.message || '서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const generateStoryboards = async () => {
    setLoading(true)
    setError(null)

    try {
      const selectedShot = planningData.shots[selectedShotIndex]
      const response = await axios.post(
        `/api/video-planning/generate/storyboards/`,
        { shot_data: selectedShot }
      )

      if (response.data.status === 'success') {
        setPlanningData(prev => ({
          ...prev,
          storyboards: response.data.data.storyboards || []
        }))
        setCurrentStep(5)
      } else {
        setError(response.data.message || '콘티 생성에 실패했습니다.')
      }
    } catch (err) {
      setError(err.response?.data?.message || '서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const generateSceneStoryboard = async (sceneIndex) => {
    setLoading(true)
    setLoadingMessage(`씬 ${sceneIndex + 1}의 콘티를 생성하고 있습니다...`)
    setLoadingProgress(30)
    setError(null)

    try {
      const scene = planningData.scenes[sceneIndex]
      
      // 씬에서 가상의 샷 데이터 생성 (씬 정보 기반)
      const shotData = {
        shot_number: 1,
        shot_type: "와이드샷",
        description: scene.action || scene.description,
        camera_angle: "아이레벨",
        camera_movement: "고정",
        duration: "5초",
        scene_info: scene
      }
      
      setLoadingMessage('스토리보드 프레임 생성 중...')
      setLoadingProgress(50)
      
      const response = await axios.post(
        `/api/video-planning/generate/storyboards/`,
        { 
          shot_data: shotData,
          style: storyboardStyle
        }
      )

      if (response.data.status === 'success') {
        setLoadingProgress(80)
        setLoadingMessage('콘티 생성 완료!')
        
        // 씬에 스토리보드 정보 추가
        const updatedScenes = [...planningData.scenes]
        updatedScenes[sceneIndex] = {
          ...updatedScenes[sceneIndex],
          storyboard: response.data.data.storyboards[0] || {}
        }
        
        setTimeout(() => {
          setPlanningData(prev => ({
            ...prev,
            scenes: updatedScenes
          }))
          setLoadingProgress(100)
        }, 500)
      } else {
        setError(response.data.message || '콘티 생성에 실패했습니다.')
      }
    } catch (err) {
      setError(err.response?.data?.message || '서버 오류가 발생했습니다.')
    } finally {
      setTimeout(() => {
        setLoading(false)
        setLoadingMessage('')
        setLoadingProgress(0)
      }, 600)
    }
  }

  const regenerateStoryboardImage = async (sceneIndex) => {
    setLoading(true)
    setLoadingMessage('콘티 이미지를 재생성하고 있습니다...')
    setError(null)

    try {
      const scene = planningData.scenes[sceneIndex]
      const frameData = scene.storyboard || {
        frame_number: 1,
        visual_description: scene.action || scene.description,
        title: scene.scene_title,
        composition: "미디엄샷",
        lighting: "자연광"
      }

      const response = await axios.post(
        `/api/video-planning/regenerate-image/`,
        { 
          frame_data: frameData,
          style: storyboardStyle
        }
      )

      if (response.data.status === 'success') {
        // 씬의 스토리보드 이미지 업데이트
        const updatedScenes = [...planningData.scenes]
        updatedScenes[sceneIndex] = {
          ...updatedScenes[sceneIndex],
          storyboard: {
            ...updatedScenes[sceneIndex].storyboard,
            image_url: response.data.data.image_url
          }
        }

        setPlanningData(prev => ({
          ...prev,
          scenes: updatedScenes
        }))
        setSuccessMessage('콘티 이미지가 재생성되었습니다.')
      } else {
        setError(response.data.message || '이미지 재생성에 실패했습니다.')
      }
    } catch (err) {
      setError(err.response?.data?.message || '서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      setLoadingMessage('')
    }
  }

  const downloadStoryboardImage = async (imageUrl, fileName) => {
    try {
      // Base64 이미지인 경우 직접 다운로드
      if (imageUrl.startsWith('data:image')) {
        const link = document.createElement('a')
        link.href = imageUrl
        link.download = `${fileName}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // URL 이미지인 경우 서버를 통해 다운로드
        const response = await axios.post(
          `/api/video-planning/download/storyboard-image/`,
          { 
            image_url: imageUrl,
            frame_title: fileName
          },
          {
            responseType: 'blob'
          }
        )
        
        const blob = new Blob([response.data], { type: 'image/png' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${fileName}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('이미지 다운로드 실패:', err)
      alert('이미지 다운로드에 실패했습니다.')
    }
  }

  const resetPlanning = () => {
    setCurrentStep(1)
    setPlanningData({
      planning: '',
      stories: [],
      scenes: [],
      shots: [],
      storyboards: []
    })
    setError(null)
    setSelectedStoryIndex(0)
    setSelectedSceneIndex(0)
    setSelectedShotIndex(0)
  }

  const goToStep = (step) => {
    if (step === 1) {
      setCurrentStep(1)
    } else if (step === 2 && planningData.stories.length > 0) {
      setCurrentStep(2)
    } else if (step === 3 && planningData.scenes.length > 0) {
      setCurrentStep(3)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h3>1단계: 기획안 입력</h3>
            <p className="step-description">
              제작하고자 하는 영상의 기획안을 입력해주세요. AI가 이를 바탕으로 여러 개의 스토리를 생성합니다.
            </p>
            
            {/* 최근 시나리오 섹션 */}
            {planningHistory.length > 0 && (
              <div className="recent-scenarios">
                <h4>최근 시나리오</h4>
                <div className="recent-scenarios-list">
                  {planningHistory.slice(0, 5).map((item) => (
                    <div 
                      key={item.id} 
                      className="recent-scenario-item"
                      onClick={() => loadHistoryItem(item.id)}
                    >
                      <div className="scenario-title">{item.title}</div>
                      <div className="scenario-date">
                        {new Date(item.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 톤앤매너/장르/콘셉트 선택 */}
            <div className="planning-options">
              <div className="option-group">
                <label>톤앤매너</label>
                <select 
                  value={planningOptions.tone} 
                  onChange={(e) => setPlanningOptions(prev => ({ ...prev, tone: e.target.value }))}
                >
                  <option value="">선택하세요</option>
                  <option value="professional">전문적이고 신뢰감 있는</option>
                  <option value="friendly">친근하고 따뜻한</option>
                  <option value="dynamic">역동적이고 에너지 넘치는</option>
                  <option value="emotional">감성적이고 감동적인</option>
                  <option value="humorous">유머러스하고 재미있는</option>
                  <option value="minimal">미니멀하고 세련된</option>
                </select>
              </div>
              
              <div className="option-group">
                <label>장르</label>
                <select 
                  value={planningOptions.genre} 
                  onChange={(e) => setPlanningOptions(prev => ({ ...prev, genre: e.target.value }))}
                >
                  <option value="">선택하세요</option>
                  <option value="promotional">홍보/프로모션</option>
                  <option value="documentary">다큐멘터리</option>
                  <option value="educational">교육/설명</option>
                  <option value="narrative">내러티브/스토리</option>
                  <option value="interview">인터뷰/증언</option>
                  <option value="product">제품 소개</option>
                  <option value="corporate">기업 소개</option>
                </select>
              </div>
              
              <div className="option-group">
                <label>콘셉트</label>
                <select 
                  value={planningOptions.concept} 
                  onChange={(e) => setPlanningOptions(prev => ({ ...prev, concept: e.target.value }))}
                >
                  <option value="">선택하세요</option>
                  <option value="innovation">혁신과 변화</option>
                  <option value="tradition">전통과 신뢰</option>
                  <option value="lifestyle">라이프스타일</option>
                  <option value="solution">문제 해결</option>
                  <option value="experience">경험과 체험</option>
                  <option value="community">커뮤니티와 소통</option>
                </select>
              </div>
            </div>
            
            <textarea
              className="planning-input"
              value={planningData.planning}
              onChange={(e) => setPlanningData(prev => ({ ...prev, planning: e.target.value }))}
              placeholder="예시: 신제품 런칭을 위한 프로모션 영상을 제작하려고 합니다. 타겟은 20-30대 직장인이며, 제품의 혁신성과 실용성을 강조하고 싶습니다..."
              rows={10}
            />
            <div className="planning-actions">
              <input
                type="text"
                className="planning-title-input"
                placeholder="기획안 제목을 입력하세요"
                value={planningTitle}
                onChange={(e) => setPlanningTitle(e.target.value)}
              />
              <div className="button-group">
                <button
                  className="generate-btn"
                  onClick={generateStories}
                  disabled={loading || !planningData.planning.trim()}
                >
                  {loading ? '생성 중...' : '스토리 생성'}
                </button>
                {planningData.stories.length > 0 && (
                  <button
                    className="save-btn"
                    onClick={savePlanning}
                    disabled={loading || !planningTitle.trim()}
                  >
                    기획안 저장
                  </button>
                )}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="step-content">
            <h3>2단계: 스토리 확인 (기승전결)</h3>
            <p className="step-description">
              기획안을 기승전결 4개의 스토리로 나누었습니다. 각 스토리마다 3개의 씬이 생성됩니다.
            </p>
            <div className="stories-container">
              {planningData.stories.map((story, index) => (
                <div 
                  key={index} 
                  className="story-card"
                  style={{ cursor: 'default' }}
                >
                  <div className="story-stage-badge">
                    <span className="stage-label">{story.stage}</span>
                    <span className="stage-name">{story.stage_name}</span>
                  </div>
                  <p className="story-title">{story.title}</p>
                  <p className="story-summary">{story.summary}</p>
                  <div className="story-meta">
                    <span>핵심: {story.key_content || story.message}</span>
                  </div>
                  <div className="story-characters">
                    <small>등장인물: {story.characters?.join(', ')}</small>
                  </div>
                </div>
              ))}
            </div>
            <div className="button-group">
              <button className="back-btn" onClick={() => goToStep(1)}>
                기획안 수정
              </button>
              <button
                className="generate-btn"
                onClick={generateScenes}
                disabled={loading}
              >
                {loading ? '씬 생성 중...' : '씬 생성'}
              </button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="step-content">
            <h3>3단계: 씬 구성 및 콘티 (총 12개)</h3>
            <p className="step-description">
              기승전결 4개 스토리에서 각각 3개씩 생성된 총 12개의 씬입니다. 각 씬마다 콘티를 생성할 수 있습니다.
            </p>
            
            {/* 콘티 스타일 선택 */}
            <div className="storyboard-style-selector">
              <label>콘티 그림 스타일</label>
              <div className="style-options">
                <button 
                  className={`style-option ${storyboardStyle === 'minimal' ? 'active' : ''}`}
                  onClick={() => setStoryboardStyle('minimal')}
                >
                  미니멀
                </button>
                <button 
                  className={`style-option ${storyboardStyle === 'realistic' ? 'active' : ''}`}
                  onClick={() => setStoryboardStyle('realistic')}
                >
                  사실적
                </button>
                <button 
                  className={`style-option ${storyboardStyle === 'sketch' ? 'active' : ''}`}
                  onClick={() => setStoryboardStyle('sketch')}
                >
                  스케치
                </button>
                <button 
                  className={`style-option ${storyboardStyle === 'cartoon' ? 'active' : ''}`}
                  onClick={() => setStoryboardStyle('cartoon')}
                >
                  만화풍
                </button>
                <button 
                  className={`style-option ${storyboardStyle === 'cinematic' ? 'active' : ''}`}
                  onClick={() => setStoryboardStyle('cinematic')}
                >
                  영화적
                </button>
              </div>
            </div>
            
            <div className="scenes-with-storyboards-container">
              {planningData.scenes.map((scene, index) => (
                <div key={index} className="scene-with-storyboard">
                  {/* 왼쪽: 콘티 */}
                  <div className="storyboard-section">
                    {scene.storyboard ? (
                      <div className="storyboard-content">
                        {scene.storyboard.image_url && scene.storyboard.image_url !== 'generated_image_placeholder' ? (
                          <img 
                            src={scene.storyboard.image_url} 
                            alt={`씬 ${index + 1} 콘티`}
                            className="storyboard-image"
                          />
                        ) : (
                          <div className="storyboard-placeholder">
                            <span>콘티 이미지</span>
                          </div>
                        )}
                        <div className="storyboard-info">
                          <p>{scene.storyboard.visual_description || scene.storyboard.description}</p>
                          {scene.storyboard.image_url && scene.storyboard.image_url !== 'generated_image_placeholder' && (
                            <div className="storyboard-actions">
                              <button 
                                className="regenerate-storyboard-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  regenerateStoryboardImage(index);
                                }}
                                disabled={loading}
                                title="이미지 재생성"
                              >
                                🔄 재생성
                              </button>
                              <button 
                                className="download-storyboard-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadStoryboardImage(scene.storyboard.image_url, `씬${index + 1}_콘티`);
                                }}
                              >
                                📥 다운로드
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="storyboard-empty">
                        <button 
                          className="generate-storyboard-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateSceneStoryboard(index);
                          }}
                          disabled={loading}
                        >
                          콘티 생성
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* 오른쪽: 씬 정보 */}
                  <div 
                    className={`scene-card ${selectedSceneIndex === index ? 'selected' : ''}`}
                    onClick={() => setSelectedSceneIndex(index)}
                  >
                    <div className="scene-header">
                      <h4>씬 {index + 1}: {scene.location}</h4>
                      <span className="scene-time">{scene.time || scene.time_of_day}</span>
                      {scene.story_stage && (
                        <span className="scene-stage">{scene.story_stage} - {scene.story_stage_name}</span>
                      )}
                    </div>
                    <p className="scene-description">{scene.description || scene.action}</p>
                    <div className="scene-details">
                      {scene.dialogue && <p><strong>대사:</strong> {scene.dialogue}</p>}
                      {scene.purpose && <p><strong>목적:</strong> {scene.purpose}</p>}
                      {scene.characters && <p><strong>등장인물:</strong> {scene.characters.join(', ')}</p>}
                      {scene.mood && <p><strong>분위기:</strong> {scene.mood}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="button-group">
              <button className="back-btn" onClick={() => goToStep(2)}>
                스토리 다시 선택
              </button>
              <button className="new-btn" onClick={resetPlanning}>
                새로운 기획 시작
              </button>
            </div>
          </div>
        )


      default:
        return null
    }
  }

  return (
    <PageTemplate>
      <div className="cms_wrap">
        <SideBar />
        <main>
          <div className="title">영상 기획</div>
          <div className="content video-planning">
            <div className="planning-header">
              <h2>영상의 씨앗을 심어보세요 🎬</h2>
              <p>당신의 아이디어가 AI와 만나 완성된 영상 기획으로 피어납니다.</p>
            </div>

            {planningHistory.length > 0 && (
              <div className="planning-history-section">
                <div className="history-header">
                  <h3>나의 기획 보관함</h3>
                  <span className="history-count">{planningHistory.length}/5</span>
                </div>
                <div className="history-list">
                  {planningHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className="history-item"
                      onClick={() => loadHistoryItem(item.id)}
                    >
                      <div className="history-title">{item.title}</div>
                      <div className="history-date">
                        {new Date(item.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="planning-navigation">
              <div 
                className={`nav-step ${currentStep >= 1 ? 'active' : ''} ${currentStep === 1 ? 'current' : ''}`}
                onClick={() => goToStep(1)}
              >
                <span className="step-number">1</span>
                <span className="step-name">기획안</span>
              </div>
              <div 
                className={`nav-step ${currentStep >= 2 ? 'active' : ''} ${currentStep === 2 ? 'current' : ''} ${planningData.stories.length === 0 ? 'disabled' : ''}`}
                onClick={() => goToStep(2)}
              >
                <span className="step-number">2</span>
                <span className="step-name">스토리</span>
              </div>
              <div 
                className={`nav-step ${currentStep >= 3 ? 'active' : ''} ${currentStep === 3 ? 'current' : ''} ${planningData.scenes.length === 0 ? 'disabled' : ''}`}
                onClick={() => goToStep(3)}
              >
                <span className="step-number">3</span>
                <span className="step-name">씬 & 콘티</span>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button 
                  className="close-error" 
                  onClick={() => setError(null)}
                  aria-label="닫기"
                >
                  ×
                </button>
              </div>
            )}
            
            {successMessage && (
              <div className="success-message">
                <p>{successMessage}</p>
                <button 
                  className="close-success" 
                  onClick={() => setSuccessMessage(null)}
                  aria-label="닫기"
                >
                  ×
                </button>
              </div>
            )}

            {renderStepContent()}
            
            {loading && (
              <LoadingAnimation 
                message={loadingMessage} 
                progress={loadingProgress} 
              />
            )}
          </div>
        </main>
      </div>
    </PageTemplate>
  )
}