import React, { useState } from 'react'
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'
import LoadingAnimation from 'components/LoadingAnimation'
import ExportModal from 'components/ExportModal'
import 'css/Cms/CmsCommon.scss'
import './VideoPlanning.scss'
import axios from 'config/axios'
import { checkSession } from 'util/util'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { getProxyImageUrl, handleImageError } from 'utils/imageProxy'

// 이미지 생성 시 텍스트 중심 결과를 유발하는 금지 단어 필터링
const filterForbiddenWords = (text) => {
  const forbiddenWords = [
    'storyboard', 'frame', 'scene description',
    'text box', 'textbox', 'caption', 'label',
    'write', 'written', 'explained', 'annotated',
    'comic panel with narration', 'comic panel',
    'diagram', 'layout', 'template',
    'slide', 'presentation', 'whiteboard'
  ];
  
  let filteredText = text;
  forbiddenWords.forEach(word => {
    const regex = new RegExp('\\b' + word + '\\b', 'gi');
    filteredText = filteredText.replace(regex, '');
  });
  
  // 연속된 공백 제거
  return filteredText.replace(/\s+/g, ' ').trim();
};

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
  const [recentPlannings, setRecentPlannings] = useState([])
  const [planningOptions, setPlanningOptions] = useState({
    tone: '',
    genre: '',
    concept: '',
    target: '',
    purpose: '',
    duration: '',
    toneCustom: '',
    genreCustom: '',
    conceptCustom: '',
    targetCustom: '',
    purposeCustom: '',
    durationCustom: '',
    storyFramework: 'classic',  // 기본값: 클래식 기승전결
    developmentLevel: 'balanced', // 기본값: 균형잡힌 전개
    characterName: '',
    characterDescription: '',
    characterImage: null
  })
  const [showCustomTone, setShowCustomTone] = useState(false)
  const [showCustomGenre, setShowCustomGenre] = useState(false)
  const [showCustomConcept, setShowCustomConcept] = useState(false)
  const [showCustomTarget, setShowCustomTarget] = useState(false)
  const [showCustomPurpose, setShowCustomPurpose] = useState(false)
  const [showCustomDuration, setShowCustomDuration] = useState(false)
  const [storyboardStyle, setStoryboardStyle] = useState('quick_draft')
  const [editingStoryIndex, setEditingStoryIndex] = useState(null)
  const [editingStoryContent, setEditingStoryContent] = useState('')
  const [editingStoryboardIndex, setEditingStoryboardIndex] = useState(null)
  const [editingStoryboardText, setEditingStoryboardText] = useState('')
  const [showPlanningDetail, setShowPlanningDetail] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  useEffect(() => {
    const session = checkSession()
    if (!session) {
      navigate('/Login', { replace: true })
    } else {
      // 로그인 후 약간의 지연을 두고 API 호출
      setTimeout(() => {
        fetchPlanningHistory()
        fetchRecentPlannings()
      }, 100)
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

  const fetchRecentPlannings = async (retryCount = 0) => {
    try {
      console.log('최근 기획 로드 시작...')
      const response = await axios.get(`/api/video-planning/recent/`)
      console.log('최근 기획 응답:', response.data)
      if (response.data.status === 'success') {
        setRecentPlannings(response.data.data.planning_logs || [])
        console.log(`최근 기획 ${response.data.data.planning_logs?.length || 0}개 로드 성공`)
      }
    } catch (err) {
      console.error(`최근 기획 로드 실패 (${retryCount + 1}회차):`, err)
      
      // 401 에러인 경우 재시도
      if (err.response?.status === 401 && retryCount < 2) {
        console.log('인증 토큰이 아직 준비되지 않았을 수 있음. 재시도...')
        setTimeout(() => {
          fetchRecentPlannings(retryCount + 1)
        }, 1000) // 1초 후 재시도
      } else {
        // 에러가 발생해도 빈 배열로 설정하여 UI가 깨지지 않도록 함
        setRecentPlannings([])
        
        if (err.response?.status === 401) {
          console.error('인증 오류: 로그인이 필요합니다')
          // 로그인 페이지로 리다이렉트는 axios 인터셉터에서 처리됨
        } else if (err.response?.status === 500) {
          console.error('서버 내부 오류:', err.response.data?.message)
        } else {
          console.error('알 수 없는 오류:', err.message)
        }
      }
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
          tone: planningOptions.tone === 'custom' ? planningOptions.toneCustom : planningOptions.tone,
          genre: planningOptions.genre === 'custom' ? planningOptions.genreCustom : planningOptions.genre,
          concept: planningOptions.concept === 'custom' ? planningOptions.conceptCustom : planningOptions.concept,
          target: planningOptions.target === 'custom' ? planningOptions.targetCustom : planningOptions.target,
          purpose: planningOptions.purpose === 'custom' ? planningOptions.purposeCustom : planningOptions.purpose,
          duration: planningOptions.duration === 'custom' ? planningOptions.durationCustom : planningOptions.duration,
          story_framework: planningOptions.storyFramework,
          development_level: planningOptions.developmentLevel,
          character_name: planningOptions.characterName,
          character_description: planningOptions.characterDescription,
          character_image: planningOptions.characterImage
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
          
          // 최근 기획 로그 업데이트
          fetchRecentPlannings()
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
          { 
            story_data: planningData.stories[i],
            planning_options: planningOptions
          }
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
        { 
          scene_data: selectedScene,
          planning_options: planningOptions
        }
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
        { 
          shot_data: selectedShot,
          planning_options: planningOptions
        }
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
    setLoadingMessage(`씬 ${sceneIndex + 1}의 콘티를 생성하고 있습니다... (약 1-2분 소요)`)
    setLoadingProgress(30)
    setError(null)

    try {
      const scene = planningData.scenes[sceneIndex]
      
      // 씬에서 가상의 샷 데이터 생성 (씬 정보 기반) - 러프 스케치 버전
      const shotData = {
        shot_number: 1,
        shot_type: "와이드샷",
        description: `rough sketch, quick drawing, ${scene.action || scene.description}`,
        camera_angle: "아이레벨",
        camera_movement: "고정",
        duration: "5초",
        scene_info: scene,
        planning_options: planningOptions,  // planning_options 추가
        style_modifier: "rough sketch, black and white, simple lines", // 빠른 생성을 위한 스타일
        quality: "draft" // 품질 설정을 드래프트로
      }
      
      setLoadingMessage('AI 이미지 생성 중... 잠시만 기다려주세요')
      setLoadingProgress(50)
      
      // 10초 후 추가 안내 메시지
      setTimeout(() => {
        if (loading) {
          setLoadingMessage('고품질 이미지 생성을 위해 시간이 걸립니다... (최대 2분)')
          setLoadingProgress(60)
        }
      }, 10000)
      
      // 30초 후 추가 안내
      setTimeout(() => {
        if (loading) {
          setLoadingMessage('거의 완료되었습니다... 조금만 더 기다려주세요')
          setLoadingProgress(70)
        }
      }, 30000)
      
      const response = await axios.post(
        `/api/video-planning/generate/storyboards/`,
        { 
          shot_data: shotData,
          style: storyboardStyle,
          speed_optimized: storyboardStyle === 'quick_draft' // 빠른 드래프트일 때만 속도 최적화
        },
        {
          timeout: 120000, // 2분 타임아웃
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setLoadingProgress(Math.min(50 + progress * 0.3, 70));
          }
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
      console.error('스토리보드 생성 오류:', err)
      
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('이미지 생성에 시간이 오래 걸리고 있습니다. 잠시 후 다시 시도해주세요.')
      } else if (err.response?.status === 500) {
        setError(`서버 오류: ${err.response.data?.message || '콘티 생성 중 문제가 발생했습니다.'}`)
      } else if (!err.response) {
        setError('네트워크 연결을 확인해주세요.')
      } else {
        setError(err.response?.data?.message || '콘티 생성에 실패했습니다.')
      }
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
        `/api/video-planning/regenerate/storyboard-image/`,
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

  const generateAllStoryboards = async () => {
    setLoading(true)
    setLoadingMessage(`모든 콘티를 생성하고 있습니다... (총 ${planningData.scenes.length}개)`)
    setLoadingProgress(10)
    setError(null)

    try {
      // planning_options를 포함한 씬 데이터 준비
      const scenesWithOptions = planningData.scenes.map(scene => ({
        ...scene,
        planning_options: planningOptions
      }))

      const response = await axios.post(
        `/api/video-planning/generate/all-storyboards/`,
        { 
          scenes: scenesWithOptions,
          style: storyboardStyle,
          speed_optimized: storyboardStyle === 'quick_draft' // 빠른 드래프트일 때만 속도 최적화
        },
        {
          timeout: storyboardStyle === 'quick_draft' ? 180000 : 300000, // 빠른 드래프트: 3분, 일반: 5분
        }
      )

      if (response.data.status === 'success') {
        const { storyboards: results, success_count, error_count } = response.data.data
        
        // 씬 데이터 업데이트
        const updatedScenes = [...planningData.scenes]
        
        results.forEach((result) => {
          if (result.storyboard && !result.error) {
            updatedScenes[result.scene_index] = {
              ...updatedScenes[result.scene_index],
              storyboard: result.storyboard
            }
          }
        })

        setPlanningData(prev => ({
          ...prev,
          scenes: updatedScenes
        }))

        // 결과 메시지 표시
        if (error_count > 0) {
          setSuccessMessage(`콘티 생성 완료! 성공: ${success_count}개, 실패: ${error_count}개`)
        } else {
          setSuccessMessage(`모든 콘티가 성공적으로 생성되었습니다! (총 ${success_count}개)`)
        }
        
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        setError(response.data.message || '콘티 생성에 실패했습니다.')
      }
    } catch (err) {
      console.error('모든 스토리보드 생성 오류:', err)
      
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('이미지 생성에 시간이 오래 걸리고 있습니다. 개별적으로 생성해주세요.')
      } else if (err.response?.status === 500) {
        setError(`서버 오류: ${err.response.data?.message || '콘티 생성 중 문제가 발생했습니다.'}`)
      } else if (!err.response) {
        setError('네트워크 연결을 확인해주세요.')
      } else {
        setError(err.response?.data?.message || '콘티 생성에 실패했습니다.')
      }
    } finally {
      setLoading(false)
      setLoadingMessage('')
      setLoadingProgress(0)
    }
  }

  const startEditingStoryboard = (sceneIndex) => {
    const scene = planningData.scenes[sceneIndex]
    if (scene && scene.storyboard) {
      setEditingStoryboardIndex(sceneIndex)
      setEditingStoryboardText(scene.storyboard.description_kr || scene.storyboard.visual_description || '')
    }
  }

  const saveEditedStoryboard = async (sceneIndex) => {
    try {
      const updatedScenes = [...planningData.scenes]
      updatedScenes[sceneIndex] = {
        ...updatedScenes[sceneIndex],
        storyboard: {
          ...updatedScenes[sceneIndex].storyboard,
          description_kr: editingStoryboardText,
          visual_description: editingStoryboardText // visual_description도 업데이트
        }
      }
      
      setPlanningData(prev => ({
        ...prev,
        scenes: updatedScenes
      }))
      
      setEditingStoryboardIndex(null)
      setEditingStoryboardText('')
      setSuccessMessage('콘티 설명이 수정되었습니다.')
      
      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err) {
      setError('콘티 수정에 실패했습니다.')
    }
  }

  const cancelEditingStoryboard = () => {
    setEditingStoryboardIndex(null)
    setEditingStoryboardText('')
  }

  const startEditingStory = (storyIndex) => {
    const story = planningData.stories[storyIndex]
    setEditingStoryIndex(storyIndex)
    setEditingStoryContent(story.summary)
  }

  const saveStoryEdit = async (storyIndex) => {
    try {
      const updatedStories = [...planningData.stories]
      updatedStories[storyIndex] = {
        ...updatedStories[storyIndex],
        summary: editingStoryContent
      }
      setPlanningData(prev => ({
        ...prev,
        stories: updatedStories
      }))
      setEditingStoryIndex(null)
      setEditingStoryContent('')
      setSuccessMessage('스토리가 수정되었습니다.')
      
      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err) {
      setError('스토리 수정에 실패했습니다.')
    }
  }

  const cancelStoryEdit = () => {
    setEditingStoryIndex(null)
    setEditingStoryContent('')
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
    // 스텝 1은 항상 접근 가능
    if (step === 1) {
      setCurrentStep(1)
      return
    }
    
    // 스텝 2는 스토리가 있을 때만 접근 가능
    if (step === 2) {
      if (planningData.stories.length > 0) {
        setCurrentStep(2)
      } else {
        // 스토리가 없으면 스텝 1로 이동하고 사용자에게 알림
        setCurrentStep(1)
        setError('먼저 스토리를 생성해주세요.')
        setTimeout(() => setError(null), 3000)
      }
      return
    }
    
    // 스텝 3은 씬이 있을 때만 접근 가능
    if (step === 3) {
      if (planningData.scenes.length > 0) {
        setCurrentStep(3)
      } else if (planningData.stories.length > 0) {
        // 씬이 없지만 스토리가 있으면 스텝 2로 이동
        setCurrentStep(2)
        setError('먼저 씬을 생성해주세요.')
        setTimeout(() => setError(null), 3000)
      } else {
        // 스토리와 씬이 모두 없으면 스텝 1로 이동
        setCurrentStep(1)
        setError('먼저 기획안과 스토리를 생성해주세요.')
        setTimeout(() => setError(null), 3000)
      }
      return
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content-with-sidebar">
            <div className="step-content">
              <h3>1단계: 기획안 입력</h3>
              <p className="step-description">
                제작하고자 하는 영상의 기획안을 입력해주세요. AI가 이를 바탕으로 여러 개의 스토리를 생성합니다.
              </p>
            
            {/* 톤앤매너/장르/콘셉트 선택 */}
            <div className="planning-options">
              <div className="option-group">
                <label>톤앤매너</label>
                <div className="custom-select-wrapper">
                  {!showCustomTone ? (
                    <select 
                      value={planningOptions.tone} 
                      onChange={(e) => {
                        if (e.target.value === '직접입력') {
                          setShowCustomTone(true)
                          setPlanningOptions(prev => ({ ...prev, tone: '' }))
                        } else {
                          setPlanningOptions(prev => ({ ...prev, tone: e.target.value }))
                        }
                      }}
                    >
                      <option value="">선택하세요</option>
                      <optgroup label="기본 톤">
                        <option value="밝고 경쾌한">밝고 경쾌한</option>
                        <option value="진중하고 차분한">진중하고 차분한</option>
                        <option value="감성적이고 따뜻한">감성적이고 따뜻한</option>
                        <option value="역동적이고 활기찬">역동적이고 활기찬</option>
                        <option value="모던하고 세련된">모던하고 세련된</option>
                      </optgroup>
                      <optgroup label="정서적 톤">
                        <option value="웅장하고 장대한">웅장하고 장대한</option>
                        <option value="서정적이고 아름다운">서정적이고 아름다운</option>
                        <option value="신비롭고 몽환적인">신비롭고 몽환적인</option>
                        <option value="친근하고 편안한">친근하고 편안한</option>
                        <option value="향수를 불러일으키는">향수를 불러일으키는</option>
                      </optgroup>
                      <optgroup label="스타일리시 톤">
                        <option value="미니멀하고 깔끔한">미니멀하고 깔끔한</option>
                        <option value="럭셔리하고 고급스러운">럭셔리하고 고급스러운</option>
                        <option value="아티스틱하고 예술적인">아티스틱하고 예술적인</option>
                        <option value="솔직하고 진정성 있는">솔직하고 진정성 있는</option>
                        <option value="레트로하고 빈티지한">레트로하고 빈티지한</option>
                      </optgroup>
                      <optgroup label="특별한 톤">
                        <option value="재미있고 유쾌한">재미있고 유쾌한</option>
                        <option value="긴장감 있고 스릴 넘치는">긴장감 있고 스릴 넘치는</option>
                        <option value="차분하고 명상적인">차분하고 명상적인</option>
                        <option value="테크놀로지컬하고 미래적인">테크놀로지컬하고 미래적인</option>
                        <option value="자연친화적이고 에코">자연친화적이고 에코</option>
                      </optgroup>
                      <option value="직접입력" style={{fontWeight: 'bold'}}>✅ 직접입력</option>
                    </select>
                  ) : (
                    <div className="custom-input-wrapper">
                      <input
                        type="text"
                        placeholder="원하시는 톤앤매너를 자유롭게 입력해주세요"
                        value={planningOptions.toneCustom}
                        onChange={(e) => setPlanningOptions(prev => ({ ...prev, toneCustom: e.target.value, tone: 'custom' }))}
                        className="ty01"
                      />
                    </div>
                  )}
                  {showCustomTone && (
                    <button 
                      className="cancel-custom-btn"
                      onClick={() => {
                        setShowCustomTone(false)
                        setPlanningOptions(prev => ({ ...prev, tone: '', toneCustom: '' }))
                      }}
                    >
                      선택목록으로
                    </button>
                  )}
                </div>
              </div>
              
              <div className="option-group">
                <label>장르</label>
                <div className="custom-select-wrapper">
                  {!showCustomGenre ? (
                    <select 
                      value={planningOptions.genre} 
                      onChange={(e) => {
                        if (e.target.value === '직접입력') {
                          setShowCustomGenre(true)
                          setPlanningOptions(prev => ({ ...prev, genre: '' }))
                        } else {
                          setPlanningOptions(prev => ({ ...prev, genre: e.target.value }))
                        }
                      }}
                    >
                      <option value="">선택하세요</option>
                      <optgroup label="기업/비즈니스">
                        <option value="기업 홍보">기업 홍보</option>
                        <option value="제품 소개">제품 소개</option>
                        <option value="브랜드 필름">브랜드 필름</option>
                        <option value="브랜드 스토리">브랜드 스토리</option>
                        <option value="IR/투자 설명">IR/투자 설명</option>
                        <option value="채용 홍보">채용 홍보</option>
                      </optgroup>
                      <optgroup label="다큐/교육">
                        <option value="다큐멘터리">다큐멘터리</option>
                        <option value="교육/강의">교육/강의</option>
                        <option value="튜토리얼">튜토리얼</option>
                        <option value="하우투(How-to)">하우투(How-to)</option>
                        <option value="온라인 코스">온라인 코스</option>
                      </optgroup>
                      <optgroup label="엔터테인먼트">
                        <option value="뮤직비디오">뮤직비디오</option>
                        <option value="웹드라마">웹드라마</option>
                        <option value="예능/방송">예능/방송</option>
                        <option value="트레일러">트레일러</option>
                        <option value="티저">티저</option>
                      </optgroup>
                      <optgroup label="마케팅/광고">
                        <option value="광고 CF">광고 CF</option>
                        <option value="소셜 미디어 콘텐츠">소셜 미디어 콘텐츠</option>
                        <option value="리뷰/언박싱">리뷰/언박싱</option>
                        <option value="이벤트 프로모션">이벤트 프로모션</option>
                        <option value="캠페인 영상">캠페인 영상</option>
                      </optgroup>
                      <optgroup label="기타">
                        <option value="예술 작품">예술 작품</option>
                        <option value="개인 브이로그">개인 브이로그</option>
                        <option value="여행 브이로그">여행 브이로그</option>
                        <option value="푸드 콘텐츠">푸드 콘텐츠</option>
                        <option value="부동산 투어">부동산 투어</option>
                      </optgroup>
                      <option value="직접입력" style={{fontWeight: 'bold'}}>✅ 직접입력</option>
                    </select>
                  ) : (
                    <div className="custom-input-wrapper">
                      <input
                        type="text"
                        placeholder="원하시는 장르를 자유롭게 입력해주세요"
                        value={planningOptions.genreCustom}
                        onChange={(e) => setPlanningOptions(prev => ({ ...prev, genreCustom: e.target.value, genre: 'custom' }))}
                        className="ty01"
                      />
                    </div>
                  )}
                  {showCustomGenre && (
                    <button 
                      className="cancel-custom-btn"
                      onClick={() => {
                        setShowCustomGenre(false)
                        setPlanningOptions(prev => ({ ...prev, genre: '', genreCustom: '' }))
                      }}
                    >
                      선택목록으로
                    </button>
                  )}
                </div>
              </div>
              
              <div className="option-group">
                <label>콘셉트</label>
                <div className="custom-select-wrapper">
                  {!showCustomConcept ? (
                    <select 
                      value={planningOptions.concept} 
                      onChange={(e) => {
                        if (e.target.value === '직접입력') {
                          setShowCustomConcept(true)
                          setPlanningOptions(prev => ({ ...prev, concept: '' }))
                        } else {
                          setPlanningOptions(prev => ({ ...prev, concept: e.target.value }))
                        }
                      }}
                    >
                      <option value="">선택하세요</option>
                      <optgroup label="스토리텔링 방식">
                        <option value="스토리텔링">스토리텔링</option>
                        <option value="인터뷰/대담">인터뷰/대담</option>
                        <option value="모큐멘터리">모큐멘터리</option>
                        <option value="내레이션">내레이션</option>
                        <option value="다큐멘터리">다큐멘터리</option>
                      </optgroup>
                      <optgroup label="시각적 스타일">
                        <option value="모션그래픽">모션그래픽</option>
                        <option value="2D 애니메이션">2D 애니메이션</option>
                        <option value="3D 애니메이션">3D 애니메이션</option>
                        <option value="실사 촬영">실사 촬영</option>
                        <option value="혼합 기법">혼합 기법</option>
                      </optgroup>
                      <optgroup label="표현 방식">
                        <option value="캐릭터 중심">캐릭터 중심</option>
                        <option value="타입아웃">타입아웃</option>
                        <option value="인포그래픽">인포그래픽</option>
                        <option value="타임랩스">타임랩스</option>
                        <option value="브이로그 스타일">브이로그 스타일</option>
                      </optgroup>
                      <optgroup label="특수 기법">
                        <option value="드론 촬영">드론 촬영</option>
                        <option value="VR/360도">VR/360도</option>
                        <option value="원테이크">원테이크</option>
                        <option value="타임라인">타임라인</option>
                        <option value="페이크 다큐">페이크 다큐</option>
                      </optgroup>
                      <option value="직접입력" style={{fontWeight: 'bold'}}>✅ 직접입력</option>
                    </select>
                  ) : (
                    <div className="custom-input-wrapper">
                      <input
                        type="text"
                        placeholder="원하시는 콘셉트를 자유롭게 입력해주세요"
                        value={planningOptions.conceptCustom}
                        onChange={(e) => setPlanningOptions(prev => ({ ...prev, conceptCustom: e.target.value, concept: 'custom' }))}
                        className="ty01"
                      />
                    </div>
                  )}
                  {showCustomConcept && (
                    <button 
                      className="cancel-custom-btn"
                      onClick={() => {
                        setShowCustomConcept(false)
                        setPlanningOptions(prev => ({ ...prev, concept: '', conceptCustom: '' }))
                      }}
                    >
                      선택목록으로
                    </button>
                  )}
                </div>
              </div>
              
              <div className="option-group">
                <label>타겟</label>
                <div className="custom-select-wrapper">
                  {!showCustomTarget ? (
                    <select 
                      value={planningOptions.target} 
                      onChange={(e) => {
                        if (e.target.value === '직접입력') {
                          setShowCustomTarget(true)
                          setPlanningOptions(prev => ({ ...prev, target: '' }))
                        } else {
                          setPlanningOptions(prev => ({ ...prev, target: e.target.value }))
                        }
                      }}
                    >
                      <option value="">선택하세요</option>
                      <optgroup label="연령대별">
                        <option value="10대 청소년">10대 청소년</option>
                        <option value="20대 청년">20대 청년</option>
                        <option value="30대 직장인">30대 직장인</option>
                        <option value="40대 중년">40대 중년</option>
                        <option value="50대 이상">50대 이상</option>
                        <option value="전 연령">전 연령</option>
                      </optgroup>
                      <optgroup label="성별">
                        <option value="남성">남성</option>
                        <option value="여성">여성</option>
                        <option value="성별무관">성별무관</option>
                      </optgroup>
                      <optgroup label="특정 그룹">
                        <option value="학생">학생</option>
                        <option value="직장인">직장인</option>
                        <option value="주부">주부</option>
                        <option value="부모">부모</option>
                        <option value="기업 담당자">기업 담당자</option>
                        <option value="투자자">투자자</option>
                      </optgroup>
                      <optgroup label="관심사별">
                        <option value="테크 얼리어답터">테크 얼리어답터</option>
                        <option value="라이프스타일 관심층">라이프스타일 관심층</option>
                        <option value="교육 관심층">교육 관심층</option>
                        <option value="건강/웰빙 관심층">건강/웰빙 관심층</option>
                        <option value="문화예술 관심층">문화예술 관심층</option>
                      </optgroup>
                      <option value="직접입력" style={{fontWeight: 'bold'}}>✅ 직접입력</option>
                    </select>
                  ) : (
                    <div className="custom-input-wrapper">
                      <input
                        type="text"
                        placeholder="타겟 오디언스를 자유롭게 입력해주세요"
                        value={planningOptions.targetCustom}
                        onChange={(e) => setPlanningOptions(prev => ({ ...prev, targetCustom: e.target.value, target: 'custom' }))}
                        className="ty01"
                      />
                    </div>
                  )}
                  {showCustomTarget && (
                    <button 
                      className="cancel-custom-btn"
                      onClick={() => {
                        setShowCustomTarget(false)
                        setPlanningOptions(prev => ({ ...prev, target: '', targetCustom: '' }))
                      }}
                    >
                      선택목록으로
                    </button>
                  )}
                </div>
              </div>
              
              <div className="option-group">
                <label>영상 목적</label>
                <div className="custom-select-wrapper">
                  {!showCustomPurpose ? (
                    <select 
                      value={planningOptions.purpose} 
                      onChange={(e) => {
                        if (e.target.value === '직접입력') {
                          setShowCustomPurpose(true)
                          setPlanningOptions(prev => ({ ...prev, purpose: '' }))
                        } else {
                          setPlanningOptions(prev => ({ ...prev, purpose: e.target.value }))
                        }
                      }}
                    >
                      <option value="">선택하세요</option>
                      <optgroup label="비즈니스 목적">
                        <option value="브랜드 인지도 향상">브랜드 인지도 향상</option>
                        <option value="제품 판매 촉진">제품 판매 촉진</option>
                        <option value="서비스 홍보">서비스 홍보</option>
                        <option value="기업 이미지 개선">기업 이미지 개선</option>
                        <option value="투자 유치">투자 유치</option>
                        <option value="인재 채용">인재 채용</option>
                      </optgroup>
                      <optgroup label="마케팅 목적">
                        <option value="신제품 런칭">신제품 런칭</option>
                        <option value="이벤트 프로모션">이벤트 프로모션</option>
                        <option value="캠페인 확산">캠페인 확산</option>
                        <option value="바이럴 마케팅">바이럴 마케팅</option>
                        <option value="SNS 콘텐츠">SNS 콘텐츠</option>
                      </optgroup>
                      <optgroup label="교육/정보 목적">
                        <option value="정보 전달">정보 전달</option>
                        <option value="교육 및 훈련">교육 및 훈련</option>
                        <option value="사용법 안내">사용법 안내</option>
                        <option value="인식 개선">인식 개선</option>
                        <option value="사회 공헌">사회 공헌</option>
                      </optgroup>
                      <optgroup label="엔터테인먼트 목적">
                        <option value="재미와 감동">재미와 감동</option>
                        <option value="예술적 표현">예술적 표현</option>
                        <option value="팬 소통">팬 소통</option>
                        <option value="이야기 전달">이야기 전달</option>
                      </optgroup>
                      <option value="직접입력" style={{fontWeight: 'bold'}}>✅ 직접입력</option>
                    </select>
                  ) : (
                    <div className="custom-input-wrapper">
                      <input
                        type="text"
                        placeholder="영상의 목적을 자유롭게 입력해주세요"
                        value={planningOptions.purposeCustom}
                        onChange={(e) => setPlanningOptions(prev => ({ ...prev, purposeCustom: e.target.value, purpose: 'custom' }))}
                        className="ty01"
                      />
                    </div>
                  )}
                  {showCustomPurpose && (
                    <button 
                      className="cancel-custom-btn"
                      onClick={() => {
                        setShowCustomPurpose(false)
                        setPlanningOptions(prev => ({ ...prev, purpose: '', purposeCustom: '' }))
                      }}
                    >
                      선택목록으로
                    </button>
                  )}
                </div>
              </div>
              
              <div className="option-group">
                <label>영상 길이</label>
                <div className="custom-select-wrapper">
                  {!showCustomDuration ? (
                    <select 
                      value={planningOptions.duration} 
                      onChange={(e) => {
                        if (e.target.value === '직접입력') {
                          setShowCustomDuration(true)
                          setPlanningOptions(prev => ({ ...prev, duration: '' }))
                        } else {
                          setPlanningOptions(prev => ({ ...prev, duration: e.target.value }))
                        }
                      }}
                    >
                      <option value="">선택하세요</option>
                      <optgroup label="숏폼 콘텐츠">
                        <option value="15초 이하">15초 이하</option>
                        <option value="30초">30초</option>
                        <option value="1분">1분</option>
                        <option value="1-3분">1-3분</option>
                      </optgroup>
                      <optgroup label="일반 콘텐츠">
                        <option value="3-5분">3-5분</option>
                        <option value="5-10분">5-10분</option>
                        <option value="10-15분">10-15분</option>
                        <option value="15-20분">15-20분</option>
                      </optgroup>
                      <optgroup label="롱폼 콘텐츠">
                        <option value="20-30분">20-30분</option>
                        <option value="30-45분">30-45분</option>
                        <option value="45-60분">45-60분</option>
                        <option value="60분 이상">60분 이상</option>
                      </optgroup>
                      <option value="직접입력" style={{fontWeight: 'bold'}}>✅ 직접입력</option>
                    </select>
                  ) : (
                    <div className="custom-input-wrapper">
                      <input
                        type="text"
                        placeholder="원하시는 영상 길이를 입력해주세요 (예: 2분 30초)"
                        value={planningOptions.durationCustom}
                        onChange={(e) => setPlanningOptions(prev => ({ ...prev, durationCustom: e.target.value, duration: 'custom' }))}
                        className="ty01"
                      />
                    </div>
                  )}
                  {showCustomDuration && (
                    <button 
                      className="cancel-custom-btn"
                      onClick={() => {
                        setShowCustomDuration(false)
                        setPlanningOptions(prev => ({ ...prev, duration: '', durationCustom: '' }))
                      }}
                    >
                      선택목록으로
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* 스토리 전개 강도 - 전개 방식 위로 이동 */}
            <div className="development-level">
              <label>스토리 전개 강도</label>
              <div className="level-buttons">
                <button
                  className={`level-btn ${planningOptions.developmentLevel === 'minimal' ? 'active' : ''}`}
                  onClick={() => setPlanningOptions(prev => ({ ...prev, developmentLevel: 'minimal' }))}
                >
                  <span className="level-name">그대로</span>
                  <span className="level-desc">원본 그대로 유지</span>
                </button>
                <button
                  className={`level-btn ${planningOptions.developmentLevel === 'light' ? 'active' : ''}`}
                  onClick={() => setPlanningOptions(prev => ({ ...prev, developmentLevel: 'light' }))}
                >
                  <span className="level-name">가벼움</span>
                  <span className="level-desc">적당한 설명</span>
                </button>
                <button
                  className={`level-btn ${planningOptions.developmentLevel === 'balanced' ? 'active' : ''}`}
                  onClick={() => setPlanningOptions(prev => ({ ...prev, developmentLevel: 'balanced' }))}
                >
                  <span className="level-name">균형</span>
                  <span className="level-desc">균형잡힌 전개</span>
                </button>
                <button
                  className={`level-btn ${planningOptions.developmentLevel === 'detailed' ? 'active' : ''}`}
                  onClick={() => setPlanningOptions(prev => ({ ...prev, developmentLevel: 'detailed' }))}
                >
                  <span className="level-name">상세</span>
                  <span className="level-desc">풍부한 묘사</span>
                </button>
              </div>
            </div>
            
            {/* 스토리 프레임워크 선택 */}
            <div className="story-framework-section">
              <h4>스토리 전개 방식</h4>
              <div className="framework-options">
                <div 
                  className={`framework-card ${planningOptions.storyFramework === 'classic' ? 'active' : ''}`}
                  onClick={() => setPlanningOptions(prev => ({ ...prev, storyFramework: 'classic' }))}
                >
                  <h5>클래식 기승전결</h5>
                  <p>전통적인 4단계 구성으로 안정적이고 균형잡힌 전개</p>
                  <span className="framework-stages">기 → 승 → 전 → 결</span>
                </div>
                <div 
                  className={`framework-card ${planningOptions.storyFramework === 'pixar' ? 'active' : ''}`}
                  onClick={() => setPlanningOptions(prev => ({ ...prev, storyFramework: 'pixar' }))}
                >
                  <h5>픽사 스토리텔링</h5>
                  <p>Once upon a time... 공식으로 만드는 매력적인 이야기</p>
                  <span className="framework-stages">옛날에 → 매일 → 어느날 → 그래서 → 결국</span>
                </div>
                <div 
                  className={`framework-card ${planningOptions.storyFramework === 'save_the_cat' ? 'active' : ''}`}
                  onClick={() => setPlanningOptions(prev => ({ ...prev, storyFramework: 'save_the_cat' }))}
                >
                  <h5>Save the Cat</h5>
                  <p>할리우드식 3막 구조로 관객을 사로잡는 스토리</p>
                  <span className="framework-stages">오프닝 이미지 → 테마 제시 → 촉매제 → 논쟁 → 2막 전환</span>
                </div>
                <div 
                  className={`framework-card ${planningOptions.storyFramework === 'star_moment' ? 'active' : ''}`}
                  onClick={() => setPlanningOptions(prev => ({ ...prev, storyFramework: 'star_moment' }))}
                >
                  <h5>스타 모멘트</h5>
                  <p>하나의 강렬한 순간을 중심으로 전후를 구성하는 임팩트 스토리</p>
                  <span className="framework-stages">빌드업 → 결정적 순간 → 반전/깨달음 → 새로운 시작</span>
                </div>
              </div>
              
              {/* 주인공 설정 섹션 */}
              <div className="character-settings">
                <label>주인공 설정</label>
                <div className="character-settings-content">
                  <div className="character-input-group">
                    <input
                      type="text"
                      placeholder="주인공 이름 (예: 김철수, 영희)"
                      value={planningOptions.characterName}
                      onChange={(e) => setPlanningOptions(prev => ({ ...prev, characterName: e.target.value }))}
                      className="character-name-input"
                    />
                    <textarea
                      placeholder="주인공 묘사 (예: 30대 초반의 프리랜서 디자이너, 긍정적이고 창의적인 성격)"
                      value={planningOptions.characterDescription}
                      onChange={(e) => setPlanningOptions(prev => ({ ...prev, characterDescription: e.target.value }))}
                      className="character-description-input"
                      rows={3}
                    />
                  </div>
                  <div className="character-image-upload">
                    <label className="image-upload-label">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setPlanningOptions(prev => ({ 
                                ...prev, 
                                characterImage: reader.result 
                              }))
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                      <div className="upload-button">
                        {planningOptions.characterImage ? (
                          <div className="image-preview">
                            <img src={planningOptions.characterImage} alt="Character" />
                            <span className="change-image">이미지 변경</span>
                          </div>
                        ) : (
                          <>
                            <span className="upload-text">캐릭터 이미지 업로드</span>
                          </>
                        )}
                      </div>
                    </label>
                    {planningOptions.characterImage && (
                      <button
                        className="remove-image-btn"
                        onClick={() => setPlanningOptions(prev => ({ ...prev, characterImage: null }))}
                      >
                        이미지 제거
                      </button>
                    )}
                  </div>
                </div>
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
          
          {/* 최근 기획 로그 사이드바 */}
          <div className="recent-plannings-sidebar">
            <h4>최근 생성한 기획</h4>
            {recentPlannings.length > 0 ? (
              <div className="recent-plannings-list">
                {recentPlannings.map((planning, index) => (
                  <div key={planning.id} className="recent-planning-item">
                    <div className="planning-number">{index + 1}</div>
                    <div className="planning-info">
                      <div className="planning-title">{planning.title}</div>
                      <div className="planning-meta">
                        <span className="planning-date">{planning.created_at}</span>
                        {planning.planning_options && (
                          <div className="planning-tags">
                            {planning.planning_options.tone && (
                              <span className="tag tone">{planning.planning_options.tone}</span>
                            )}
                            {planning.planning_options.genre && (
                              <span className="tag genre">{planning.planning_options.genre}</span>
                            )}
                            {planning.planning_options.target && (
                              <span className="tag target">{planning.planning_options.target}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="planning-status">
                        <span className={`step-indicator step-${planning.current_step}`}>
                          {planning.current_step === 1 && '스토리'}
                          {planning.current_step === 2 && '씬'}
                          {planning.current_step === 3 && '숏'}
                          {planning.current_step === 4 && '콘티'}
                          {planning.current_step === 5 && '완료'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-recent-plannings">
                <p>아직 생성한 기획이 없습니다.</p>
                <p className="hint">새로운 기획을 시작해보세요!</p>
              </div>
            )}
          </div>
        </div>
        )

      case 2:
        return (
          <div className="step-content">
            <h3>2단계: 스토리 확인</h3>
            <p className="step-description">
              기획안을 기승전결 4개의 스토리로 나누었습니다. 각 스토리마다 3개의 씬이 생성됩니다.
            </p>
            
            
            <div className="stories-container">
              {planningData.stories.map((story, index) => (
                <div 
                  key={index} 
                  className="story-card"
                >
                  <div className="story-card-header">
                    <div className="story-stage-badge">
                      <span className="stage-label">{story.stage}</span>
                      <span className="stage-name">{story.stage_name}</span>
                    </div>
                    <button 
                      className="edit-story-btn"
                      onClick={() => startEditingStory(index)}
                      disabled={editingStoryIndex === index}
                    >
                      ✏️ 편집
                    </button>
                  </div>
                  <p className="story-title">{story.title}</p>
                  <div className="story-summary">
                    {editingStoryIndex === index ? (
                      <div className="edit-story-form">
                        <textarea
                          value={editingStoryContent}
                          onChange={(e) => setEditingStoryContent(e.target.value)}
                          className="edit-story-textarea"
                          placeholder="스토리 내용을 수정하세요..."
                          rows="6"
                        />
                        <div className="edit-story-buttons">
                          <button 
                            className="save-story-btn"
                            onClick={() => saveStoryEdit(index)}
                          >
                            저장
                          </button>
                          <button 
                            className="cancel-story-btn"
                            onClick={cancelStoryEdit}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p>{story.summary}</p>
                        {story.detailed_content && (
                          <div className="detailed-content">
                            <h5>상세 내용:</h5>
                            <p>{story.detailed_content}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
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
              <label htmlFor="storyboard-style">콘티 그림 스타일</label>
              <select 
                id="storyboard-style"
                className="style-select"
                value={storyboardStyle}
                onChange={(e) => setStoryboardStyle(e.target.value)}
              >
                <option value="quick_draft">🚀 빠른 드래프트 - 신속 생성 (추천)</option>
                <option value="minimal">미니멀 - 깔끔한 라인아트</option>
                <option value="sketch">스케치 - 연필 드로잉</option>
                <option value="realistic">사실적 - 포토리얼리스틱</option>
                <option value="cartoon">만화풍 - 애니메이션 스타일</option>
                <option value="cinematic">영화적 - 시네마틱 느와르</option>
                <option value="watercolor">수채화 - 부드러운 수채화</option>
                <option value="digital">디지털아트 - 모던 디지털</option>
                <option value="noir">느와르 - 흑백 대비</option>
                <option value="pastel">파스텔 - 부드러운 색감</option>
                <option value="comic">코믹북 - 미국 만화 스타일</option>
              </select>
            </div>
            
            {/* 모든 콘티 생성 버튼 추가 */}
            <div className="batch-actions">
              <button
                className="generate-all-btn"
                onClick={generateAllStoryboards}
                disabled={loading || planningData.scenes.length === 0}
              >
                {loading ? '생성 중...' : '🎨 모든 콘티 한번에 생성'}
              </button>
              <span className="batch-info">
                총 {planningData.scenes.length}개 씬 / 
                생성된 콘티: {planningData.scenes.filter(scene => scene.storyboard?.image_url).length}개
              </span>
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
                            src={getProxyImageUrl(scene.storyboard.image_url)} 
                            alt={`씬 ${index + 1} 콘티`}
                            className="storyboard-image"
                            onError={(e) => handleImageError(e, scene.storyboard.image_url, (newUrl) => {
                              // 이미지 URL 업데이트
                              const updatedScenes = [...planningData.scenes]
                              updatedScenes[index].storyboard.image_url = newUrl
                              setPlanningData(prev => ({ ...prev, scenes: updatedScenes }))
                            })}
                          />
                        ) : null}
                        <div className="storyboard-placeholder" style={{display: scene.storyboard.image_url && scene.storyboard.image_url !== 'generated_image_placeholder' ? 'none' : 'flex'}}>
                          <span>콘티 이미지 생성 중...</span>
                          {scene.storyboard.image_error && (
                            <p className="error-message">{scene.storyboard.image_error}</p>
                          )}
                        </div>
                        <div className="storyboard-info">
                          {editingStoryboardIndex === index ? (
                            <div className="storyboard-edit-mode">
                              <textarea
                                className="storyboard-edit-input"
                                value={editingStoryboardText}
                                onChange={(e) => setEditingStoryboardText(e.target.value)}
                                placeholder="콘티 설명을 입력하세요"
                                rows="3"
                              />
                              <div className="edit-actions">
                                <button 
                                  className="save-edit-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveEditedStoryboard(index);
                                  }}
                                >
                                  저장
                                </button>
                                <button 
                                  className="cancel-edit-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cancelEditingStoryboard();
                                  }}
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="storyboard-description-kr">
                                {scene.storyboard.description_kr ? 
                                  (scene.storyboard.description_kr.length > 50 ? 
                                    scene.storyboard.description_kr.substring(0, 50) + '...' : 
                                    scene.storyboard.description_kr) :
                                  (scene.storyboard.visual_description || scene.storyboard.description || '').substring(0, 50) + '...'}
                              </p>
                              {scene.storyboard.image_url && scene.storyboard.image_url !== 'generated_image_placeholder' && (
                                <div className="storyboard-actions">
                                  <button 
                                    className="edit-storyboard-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditingStoryboard(index);
                                    }}
                                    title="설명 수정"
                                  >
                                    수정
                                  </button>
                                  <button 
                                    className="regenerate-storyboard-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      regenerateStoryboardImage(index);
                                    }}
                                    disabled={loading}
                                    title="이미지 재생성"
                                  >
                                    재생성
                                  </button>
                                  <button 
                                    className="download-storyboard-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadStoryboardImage(scene.storyboard.image_url, `씬${index + 1}_콘티`);
                                    }}
                                  >
                                    다운로드
                                  </button>
                                </div>
                              )}
                            </>
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
              <button className="export-btn" onClick={() => setShowExportModal(true)}>
                내보내기
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
              <h2>영상의 씨앗을 심어보세요</h2>
              <p>당신의 아이디어가 AI와 만나 완성된 영상 기획으로 피어납니다.</p>
            </div>

            {/* 최근 기획안 기록 표시 */}
            {recentPlannings.length > 0 && (
              <div className="recent-plannings-section">
                <div className="recent-header">
                  <h3>📋 최근 기획안</h3>
                  <span className="recent-count">최근 {recentPlannings.length}개</span>
                </div>
                <div className="recent-list">
                  {recentPlannings.map((planning, index) => (
                    <div 
                      key={planning.id} 
                      className="recent-item"
                      onClick={() => loadHistoryItem(planning.id)}
                    >
                      <div className="recent-number">{index + 1}</div>
                      <div className="recent-info">
                        <div className="recent-title">{planning.title}</div>
                        <div className="recent-meta">
                          <span className="recent-date">{planning.created_at}</span>
                          {planning.planning_options && (
                            <div className="recent-tags">
                              {planning.planning_options.tone && (
                                <span className="tag tone">{planning.planning_options.tone}</span>
                              )}
                              {planning.planning_options.genre && (
                                <span className="tag genre">{planning.planning_options.genre}</span>
                              )}
                              <span className={`tag step step-${planning.current_step}`}>
                                {planning.current_step === 1 ? '기획' : 
                                 planning.current_step === 2 ? '스토리' : 
                                 planning.current_step === 3 ? '씬' : 
                                 planning.current_step === 4 ? '숏' : 
                                 planning.current_step === 5 ? '콘티' : '진행중'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  goToStep(1)
                }}
                style={{ cursor: 'pointer' }}
              >
                <span className="step-number">1</span>
                <span className="step-name">기획안</span>
              </div>
              <div 
                className={`nav-step ${currentStep >= 2 ? 'active' : ''} ${currentStep === 2 ? 'current' : ''} ${planningData.stories.length === 0 ? 'disabled' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (planningData.stories.length === 0) {
                    setError('먼저 스토리를 생성해주세요.')
                    setTimeout(() => setError(null), 3000)
                    return
                  }
                  goToStep(2)
                }}
                style={{ cursor: planningData.stories.length === 0 ? 'not-allowed' : 'pointer' }}
              >
                <span className="step-number">2</span>
                <span className="step-name">스토리</span>
              </div>
              <div 
                className={`nav-step ${currentStep >= 3 ? 'active' : ''} ${currentStep === 3 ? 'current' : ''} ${planningData.scenes.length === 0 ? 'disabled' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (planningData.scenes.length === 0) {
                    if (planningData.stories.length === 0) {
                      setError('먼저 기획안과 스토리를 생성해주세요.')
                    } else {
                      setError('먼저 씬을 생성해주세요.')
                    }
                    setTimeout(() => setError(null), 3000)
                    return
                  }
                  goToStep(3)
                }}
                style={{ cursor: planningData.scenes.length === 0 ? 'not-allowed' : 'pointer' }}
              >
                <span className="step-number">3</span>
                <span className="step-name">씬 & 콘티</span>
              </div>
            </div>

            {/* 단계별 내용 미리보기 */}
            {(planningData.planning || planningData.stories.length > 0 || planningData.scenes.length > 0) && (
              <div className="step-preview-section">
                {/* 기획안 미리보기 */}
                {planningData.planning && (
                  <div className={`step-preview ${currentStep === 1 ? 'active' : ''}`}>
                    <div className="preview-header">
                      <h4>기획안</h4>
                    </div>
                    <div className="preview-content">
                      {showPlanningDetail ? (
                        <div className="full-content">
                          <p style={{ whiteSpace: 'pre-wrap' }}>{planningData.planning}</p>
                          {planningOptions && (
                            <div className="planning-options-display">
                              <h5>설정된 옵션:</h5>
                              <div className="options-grid">
                                {planningOptions.tone && <span className="option-tag">톤: {planningOptions.tone === 'custom' ? planningOptions.toneCustom : planningOptions.tone}</span>}
                                {planningOptions.genre && <span className="option-tag">장르: {planningOptions.genre === 'custom' ? planningOptions.genreCustom : planningOptions.genre}</span>}
                                {planningOptions.concept && <span className="option-tag">콘셉트: {planningOptions.concept === 'custom' ? planningOptions.conceptCustom : planningOptions.concept}</span>}
                                {planningOptions.target && <span className="option-tag">타겟: {planningOptions.target === 'custom' ? planningOptions.targetCustom : planningOptions.target}</span>}
                                {planningOptions.purpose && <span className="option-tag">목적: {planningOptions.purpose === 'custom' ? planningOptions.purposeCustom : planningOptions.purpose}</span>}
                                {planningOptions.duration && <span className="option-tag">길이: {planningOptions.duration === 'custom' ? planningOptions.durationCustom : planningOptions.duration}</span>}
                                {planningOptions.storyFramework && <span className="option-tag">스토리: {planningOptions.storyFramework}</span>}
                                {planningOptions.developmentLevel && <span className="option-tag">전개: {planningOptions.developmentLevel}</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p>{planningData.planning.substring(0, 150)}{planningData.planning.length > 150 ? '...' : ''}</p>
                      )}
                      {currentStep !== 1 && (
                        <button 
                          className="view-detail-btn" 
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            goToStep(1)
                          }}
                        >
                          이 단계로 이동 →
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 스토리 미리보기 */}
                {planningData.stories.length > 0 && (
                  <div className={`step-preview ${currentStep === 2 ? 'active' : ''}`}>
                    <div className="preview-header">
                      <h4>스토리 (기승전결 {planningData.stories.length}개)</h4>
                    </div>
                    <div className="preview-content">
                      {selectedStoryIndex !== null && 
                       selectedStoryIndex >= 0 && selectedStoryIndex < planningData.stories.length && 
                       planningData.stories[selectedStoryIndex] ? (
                        <>
                          <h5>{planningData.stories[selectedStoryIndex].title}</h5>
                          <p className="story-stage">{planningData.stories[selectedStoryIndex].stage} - {planningData.stories[selectedStoryIndex].stage_name}</p>
                          <p>{planningData.stories[selectedStoryIndex].summary?.substring(0, 100)}...</p>
                        </>
                      ) : (
                        <>
                          <h5>{planningData.stories[0]?.title || '스토리 1'}</h5>
                          <p className="story-stage">{planningData.stories[0]?.stage} - {planningData.stories[0]?.stage_name}</p>
                          <p>{planningData.stories[0]?.summary?.substring(0, 100)}...</p>
                        </>
                      )}
                      {currentStep !== 2 && (
                        <button 
                          className="view-detail-btn" 
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            goToStep(2)
                          }}
                        >
                          이 단계로 이동 →
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 씬 미리보기 */}
                {planningData.scenes.length > 0 && (
                  <div className={`step-preview ${currentStep === 3 ? 'active' : ''}`}>
                    <div className="preview-header">
                      <h4>🎬 씬 & 콘티 ({planningData.scenes.length}개)</h4>
                    </div>
                    <div className="preview-content">
                      {selectedSceneIndex !== null ? (
                        <div className="full-content scenes-full">
                          {planningData.scenes.map((scene, index) => (
                            <div key={index} className="scene-preview-full">
                              <div className="scene-header-full">
                                <h5>씬 {index + 1}: {scene.location}</h5>
                                <span className="scene-time">{scene.time || scene.time_of_day}</span>
                                {scene.story_stage && (
                                  <span className="scene-stage-tag">{scene.story_stage}</span>
                                )}
                              </div>
                              <p className="scene-description">{scene.description || scene.action}</p>
                              {scene.dialogue && <p className="scene-dialogue"><strong>대사:</strong> {scene.dialogue}</p>}
                              {scene.purpose && <p className="scene-purpose"><strong>목적:</strong> {scene.purpose}</p>}
                              {scene.characters && scene.characters.length > 0 && (
                                <p className="scene-characters"><strong>등장인물:</strong> {scene.characters.join(', ')}</p>
                              )}
                              {scene.storyboard?.image_url && (
                                <div className="scene-storyboard-preview">
                                  <img 
                                    src={getProxyImageUrl(scene.storyboard.image_url)} 
                                    alt={`씬 ${index + 1} 콘티`}
                                    onError={(e) => handleImageError(e, scene.storyboard.image_url)}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="scenes-preview">
                          {planningData.scenes.slice(0, 3).map((scene, index) => (
                            <div key={index} className="scene-preview-item">
                              <span className="scene-number">씬 {index + 1}</span>
                              <span className="scene-location">{scene.location}</span>
                              {scene.storyboard?.image_url && (
                                <span className="has-storyboard">✓ 콘티</span>
                              )}
                            </div>
                          ))}
                          {planningData.scenes.length > 3 && (
                            <div className="more-scenes">+{planningData.scenes.length - 3}개 더...</div>
                          )}
                        </div>
                      )}
                      {currentStep !== 3 && (
                        <button 
                          className="view-detail-btn" 
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            goToStep(3)
                          }}
                        >
                          이 단계로 이동 →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

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
      
      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        planningData={{
          ...planningData,
          planningTitle,
          planningOptions
        }}
      />
    </PageTemplate>
  )
}