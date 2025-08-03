import React, { useState, useEffect } from 'react'
import styles from './PlanningWizard.module.scss'
import { showInfo, showSuccess, showError } from '../Toast'
import axios from '../../config/axios'

const PlanningWizard = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // 기본 정보
    projectType: '', // 유튜브, 기업홍보, 광고, 다큐멘터리 등
    duration: '', // 30초, 1분, 3분, 5분, 10분 이상
    targetAudience: '', // 10대, 20-30대, 40-50대, 전연령 등
    
    // AI 프롬프트를 위한 핵심 정보
    mainTopic: '', // 주제/콘셉트
    keyMessage: '', // 핵심 메시지
    desiredMood: '', // 원하는 분위기
    
    // 프로 옵션 (선택사항)
    enableProOptions: false,
    colorTone: 'natural', // natural, warm, cool, cinematic, vibrant
    aspectRatio: '16:9', // 16:9, 9:16, 1:1, 21:9
    cameraType: 'dslr', // dslr, cinema, smartphone, drone
    lensType: '35mm', // 24mm, 35mm, 50mm, 85mm, zoom
    cameraMovement: 'static' // static, pan, tilt, dolly, handheld
  })
  
  const [loading, setLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState(null)
  
  // 프로젝트 타입별 프리셋
  const projectPresets = {
    youtube: {
      duration: '10분 이상',
      aspectRatio: '16:9',
      colorTone: 'vibrant',
      cameraType: 'dslr',
      defaultMood: '친근하고 재미있는'
    },
    corporate: {
      duration: '3분',
      aspectRatio: '16:9',
      colorTone: 'natural',
      cameraType: 'cinema',
      defaultMood: '전문적이고 신뢰감 있는'
    },
    advertisement: {
      duration: '30초',
      aspectRatio: '16:9',
      colorTone: 'cinematic',
      cameraType: 'cinema',
      defaultMood: '임팩트 있고 감동적인'
    },
    documentary: {
      duration: '10분 이상',
      aspectRatio: '16:9',
      colorTone: 'natural',
      cameraType: 'cinema',
      defaultMood: '진실되고 몰입감 있는'
    }
  }
  
  // 프로젝트 타입 선택 시 프리셋 적용
  const handleProjectTypeChange = (type) => {
    const preset = projectPresets[type]
    if (preset) {
      setFormData({
        ...formData,
        projectType: type,
        duration: preset.duration,
        aspectRatio: preset.aspectRatio,
        colorTone: preset.colorTone,
        cameraType: preset.cameraType,
        desiredMood: preset.defaultMood
      })
    } else {
      setFormData({ ...formData, projectType: type })
    }
  }
  
  // AI 추천 생성
  const generateAISuggestions = async () => {
    setLoading(true)
    try {
      const response = await axios.post('/api/video-planning/ai/quick-suggestions/', {
        project_type: formData.projectType,
        main_topic: formData.mainTopic,
        target_audience: formData.targetAudience,
        duration: formData.duration
      })
      
      if (response.data.status === 'success') {
        setAiSuggestions(response.data.suggestions)
        showSuccess('AI 추천이 생성되었습니다!')
      }
    } catch (error) {
      console.error('AI 추천 생성 실패:', error)
      showError('AI 추천 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }
  
  // 단계별 유효성 검사
  const validateStep = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return formData.projectType && formData.duration && formData.targetAudience
      case 2:
        return formData.mainTopic && formData.keyMessage && formData.desiredMood
      case 3:
        return true // 프로 옵션은 선택사항
      default:
        return true
    }
  }
  
  // 다음 단계로
  const handleNext = () => {
    if (!validateStep(step)) {
      showError('모든 필수 항목을 입력해주세요.')
      return
    }
    
    if (step === 2 && !aiSuggestions) {
      generateAISuggestions()
    }
    
    if (step < 3) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
  }
  
  // 완료 처리
  const handleComplete = async () => {
    setLoading(true)
    try {
      // 전체 기획안 생성
      const planningData = {
        ...formData,
        ai_suggestions: aiSuggestions,
        quick_mode: true // 30초 기획 모드
      }
      
      const response = await axios.post('/api/video-planning/ai/generate-full-planning/', planningData)
      
      if (response.data.status === 'success') {
        showSuccess('기획안이 성공적으로 생성되었습니다!')
        onComplete(response.data.planning)
      }
    } catch (error) {
      console.error('기획안 생성 실패:', error)
      showError('기획안 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className={styles.wizardOverlay}>
      <div className={styles.wizardContainer}>
        <div className={styles.wizardHeader}>
          <h2>🎯 30초 AI 기획 마법사</h2>
          <p>3가지 질문만 답하면 완벽한 기획안이 자동 생성됩니다</p>
          <button className={styles.closeBtn} onClick={onCancel}>✕</button>
        </div>
        
        {/* 진행률 표시 */}
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
        
        <div className={styles.wizardContent}>
          {step === 1 && (
            <div className={styles.stepContent}>
              <h3>1단계: 기본 정보</h3>
              
              <div className={styles.formGroup}>
                <label>프로젝트 유형</label>
                <div className={styles.buttonGrid}>
                  {[
                    { value: 'youtube', label: '🎬 유튜브', desc: '브이로그, 리뷰, 튜토리얼' },
                    { value: 'corporate', label: '🏢 기업홍보', desc: '회사소개, 제품소개' },
                    { value: 'advertisement', label: '📺 광고', desc: 'TV광고, 온라인광고' },
                    { value: 'documentary', label: '🎥 다큐멘터리', desc: '인터뷰, 르포' }
                  ].map(type => (
                    <button
                      key={type.value}
                      className={`${styles.typeButton} ${formData.projectType === type.value ? styles.selected : ''}`}
                      onClick={() => handleProjectTypeChange(type.value)}
                    >
                      <div className={styles.typeIcon}>{type.label}</div>
                      <div className={styles.typeDesc}>{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>영상 길이</label>
                <div className={styles.radioGroup}>
                  {['30초', '1분', '3분', '5분', '10분 이상'].map(duration => (
                    <label key={duration} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="duration"
                        value={duration}
                        checked={formData.duration === duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      />
                      <span>{duration}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>타겟 시청자</label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className={styles.select}
                >
                  <option value="">선택하세요</option>
                  <option value="10대">10대</option>
                  <option value="20-30대">20-30대</option>
                  <option value="40-50대">40-50대</option>
                  <option value="60대 이상">60대 이상</option>
                  <option value="전연령">전연령</option>
                  <option value="기업/B2B">기업/B2B</option>
                </select>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className={styles.stepContent}>
              <h3>2단계: 핵심 내용</h3>
              
              <div className={styles.formGroup}>
                <label>주제/콘셉트</label>
                <input
                  type="text"
                  value={formData.mainTopic}
                  onChange={(e) => setFormData({ ...formData, mainTopic: e.target.value })}
                  placeholder="예: 친환경 제품 소개, 여행 브이로그, 신제품 런칭"
                  className={styles.input}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>핵심 메시지</label>
                <textarea
                  value={formData.keyMessage}
                  onChange={(e) => setFormData({ ...formData, keyMessage: e.target.value })}
                  placeholder="시청자에게 전달하고 싶은 가장 중요한 메시지를 입력하세요"
                  className={styles.textarea}
                  rows={3}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>원하는 분위기</label>
                <input
                  type="text"
                  value={formData.desiredMood}
                  onChange={(e) => setFormData({ ...formData, desiredMood: e.target.value })}
                  placeholder="예: 밝고 경쾌한, 감동적인, 전문적인, 재미있는"
                  className={styles.input}
                />
              </div>
              
              {/* AI 추천 표시 */}
              {aiSuggestions && (
                <div className={styles.aiSuggestions}>
                  <h4>💡 AI 추천사항</h4>
                  <div className={styles.suggestionContent}>
                    {aiSuggestions.structure && (
                      <div className={styles.suggestionItem}>
                        <strong>추천 구성:</strong> {aiSuggestions.structure}
                      </div>
                    )}
                    {aiSuggestions.keywords && (
                      <div className={styles.suggestionItem}>
                        <strong>키워드:</strong> {aiSuggestions.keywords.join(', ')}
                      </div>
                    )}
                    {aiSuggestions.tips && (
                      <div className={styles.suggestionItem}>
                        <strong>팁:</strong> {aiSuggestions.tips}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {step === 3 && (
            <div className={styles.stepContent}>
              <h3>3단계: 프로 옵션 (선택사항)</h3>
              
              <div className={styles.proToggle}>
                <label className={styles.switchLabel}>
                  <input
                    type="checkbox"
                    checked={formData.enableProOptions}
                    onChange={(e) => setFormData({ ...formData, enableProOptions: e.target.checked })}
                  />
                  <span className={styles.switch}></span>
                  <span>프로 옵션 사용하기</span>
                </label>
              </div>
              
              {formData.enableProOptions && (
                <div className={styles.proOptions}>
                  <div className={styles.formGroup}>
                    <label>컬러톤</label>
                    <select
                      value={formData.colorTone}
                      onChange={(e) => setFormData({ ...formData, colorTone: e.target.value })}
                      className={styles.select}
                    >
                      <option value="natural">내추럴</option>
                      <option value="warm">따뜻한</option>
                      <option value="cool">차가운</option>
                      <option value="cinematic">시네마틱</option>
                      <option value="vibrant">비비드</option>
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>화면 비율</label>
                    <select
                      value={formData.aspectRatio}
                      onChange={(e) => setFormData({ ...formData, aspectRatio: e.target.value })}
                      className={styles.select}
                    >
                      <option value="16:9">16:9 (일반)</option>
                      <option value="9:16">9:16 (세로형)</option>
                      <option value="1:1">1:1 (정사각형)</option>
                      <option value="21:9">21:9 (시네마)</option>
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>카메라 종류</label>
                    <select
                      value={formData.cameraType}
                      onChange={(e) => setFormData({ ...formData, cameraType: e.target.value })}
                      className={styles.select}
                    >
                      <option value="dslr">DSLR</option>
                      <option value="cinema">시네마 카메라</option>
                      <option value="smartphone">스마트폰</option>
                      <option value="drone">드론</option>
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>렌즈 종류</label>
                    <select
                      value={formData.lensType}
                      onChange={(e) => setFormData({ ...formData, lensType: e.target.value })}
                      className={styles.select}
                    >
                      <option value="24mm">24mm (광각)</option>
                      <option value="35mm">35mm (준광각)</option>
                      <option value="50mm">50mm (표준)</option>
                      <option value="85mm">85mm (인물)</option>
                      <option value="zoom">줌렌즈</option>
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>카메라 워킹</label>
                    <select
                      value={formData.cameraMovement}
                      onChange={(e) => setFormData({ ...formData, cameraMovement: e.target.value })}
                      className={styles.select}
                    >
                      <option value="static">고정</option>
                      <option value="pan">팬</option>
                      <option value="tilt">틸트</option>
                      <option value="dolly">달리</option>
                      <option value="handheld">핸드헬드</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className={styles.wizardFooter}>
          <button 
            className={styles.backBtn} 
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1 || loading}
          >
            이전
          </button>
          <button 
            className={styles.nextBtn}
            onClick={handleNext}
            disabled={loading || !validateStep(step)}
          >
            {loading ? '처리중...' : step === 3 ? '완료' : '다음'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlanningWizard