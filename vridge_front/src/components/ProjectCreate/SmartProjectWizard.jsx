import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SmartFormField from './SmartFormField'
import AIProjectSuggestion from './AIProjectSuggestion'
import TemplateSelector from './TemplateSelector'

export default function SmartProjectWizard({ onComplete }) {
  const [currentPhase, setCurrentPhase] = useState('smart-input') // 'smart-input', 'ai-suggestion', 'template', 'confirm'
  const [projectData, setProjectData] = useState({
    name: '',
    type: '',
    duration: '',
    team_size: '',
    description: ''
  })
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // AI 기반 프로젝트 제안 생성 (기존 30분 → 2분으로 단축)
  const generateSmartSuggestions = useCallback(async () => {
    setIsGenerating(true)
    
    try {
      // AI API 호출로 프로젝트 구조, 일정, 팀 구성 자동 제안
      const response = await fetch('/api/ai/project-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectType: projectData.type,
          description: projectData.description,
          duration: projectData.duration,
          teamSize: projectData.team_size
        })
      })
      
      const suggestions = await response.json()
      setAiSuggestions(suggestions)
      setCurrentPhase('ai-suggestion')
      
    } catch (error) {
      console.error('AI 제안 생성 실패:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [projectData])

  const phaseConfig = {
    'smart-input': {
      title: '프로젝트 정보를 알려주세요',
      subtitle: 'AI가 최적의 구조를 제안해드립니다',
      progress: 25,
      component: (
        <SmartInputForm 
          data={projectData}
          onChange={setProjectData}
          onNext={generateSmartSuggestions}
          isLoading={isGenerating}
        />
      )
    },
    'ai-suggestion': {
      title: 'AI 추천 프로젝트 구조',
      subtitle: '아래 제안을 확인하고 수정하세요',
      progress: 50,
      component: (
        <AIProjectSuggestion
          suggestions={aiSuggestions}
          onAccept={(acceptedSuggestion) => {
            setProjectData({ ...projectData, ...acceptedSuggestion })
            setCurrentPhase('template')
          }}
          onModify={() => setCurrentPhase('smart-input')}
        />
      )
    },
    'template': {
      title: '템플릿 선택',
      subtitle: '업계 모범 사례 기반 템플릿',
      progress: 75,
      component: (
        <TemplateSelector
          projectType={projectData.type}
          onSelect={(template) => {
            setProjectData({ ...projectData, template })
            setCurrentPhase('confirm')
          }}
        />
      )
    },
    'confirm': {
      title: '프로젝트 생성 완료',
      subtitle: '모든 설정이 자동으로 적용됩니다',
      progress: 100,
      component: (
        <ProjectConfirmation
          projectData={projectData}
          onConfirm={() => onComplete(projectData)}
        />
      )
    }
  }

  const currentConfig = phaseConfig[currentPhase]

  return (
    <div className="smart-wizard-container">
      {/* 진행률 표시 - 시각적 피드백 강화 */}
      <div className="progress-header">
        <div className="progress-bar">
          <motion.div 
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${currentConfig.progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="progress-info">
          <h1>{currentConfig.title}</h1>
          <p>{currentConfig.subtitle}</p>
        </div>
      </div>

      {/* 단계별 컨텐츠 - 부드러운 전환 애니메이션 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhase}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="phase-content"
        >
          {currentConfig.component}
        </motion.div>
      </AnimatePresence>

      <style jsx>{`
        .smart-wizard-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          min-height: 600px;
        }

        .progress-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: #f1f3f5;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #1631F8 0%, #0F23C9 100%);
          border-radius: 3px;
        }

        .progress-info h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1631F8;
          margin-bottom: 8px;
        }

        .progress-info p {
          font-size: 18px;
          color: #6c757d;
          margin: 0;
        }

        .phase-content {
          background: white;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
        }
      `}</style>
    </div>
  )
}

// 스마트 입력 폼 - 실시간 검증 및 AI 도움말
function SmartInputForm({ data, onChange, onNext, isLoading }) {
  const handleInputChange = (field, value) => {
    onChange({ ...data, [field]: value })
  }

  const isValid = data.name && data.type && data.description

  return (
    <div className="smart-input-form">
      <div className="form-grid">
        <SmartFormField
          label="프로젝트 이름"
          value={data.name}
          onChange={(value) => handleInputChange('name', value)}
          placeholder="예: 브랜드 홍보 영상 제작"
          aiHelp="명확하고 구체적인 이름이 좋습니다"
          required
        />
        
        <SmartFormField
          label="프로젝트 유형"
          type="select"
          value={data.type}
          onChange={(value) => handleInputChange('type', value)}
          options={[
            { value: 'brand', label: '브랜드 영상' },
            { value: 'product', label: '제품 소개' },
            { value: 'corporate', label: '기업 홍보' },
            { value: 'education', label: '교육 콘텐츠' },
            { value: 'commercial', label: '광고 영상' }
          ]}
          required
        />

        <SmartFormField
          label="예상 기간"
          type="select"
          value={data.duration}
          onChange={(value) => handleInputChange('duration', value)}
          options={[
            { value: '1week', label: '1주일' },
            { value: '2weeks', label: '2주일' },
            { value: '1month', label: '1개월' },
            { value: '2months', label: '2개월' },
            { value: '3months', label: '3개월 이상' }
          ]}
        />

        <SmartFormField
          label="팀 규모"
          type="select"
          value={data.team_size}
          onChange={(value) => handleInputChange('team_size', value)}
          options={[
            { value: 'solo', label: '1인 (본인만)' },
            { value: 'small', label: '2-3명' },
            { value: 'medium', label: '4-7명' },
            { value: 'large', label: '8명 이상' }
          ]}
        />

        <SmartFormField
          label="프로젝트 설명"
          type="textarea"
          value={data.description}
          onChange={(value) => handleInputChange('description', value)}
          placeholder="프로젝트의 목표와 주요 내용을 간단히 설명해주세요"
          rows={4}
          required
        />
      </div>

      <div className="form-actions">
        <motion.button
          className="btn-smart-next"
          onClick={onNext}
          disabled={!isValid || isLoading}
          whileHover={{ scale: isValid ? 1.02 : 1 }}
          whileTap={{ scale: isValid ? 0.98 : 1 }}
        >
          {isLoading ? (
            <>
              <div className="spinner" />
              AI가 분석 중...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              AI 제안 받기
            </>
          )}
        </motion.button>
      </div>

      <style jsx>{`
        .smart-input-form {
          width: 100%;
        }

        .form-grid {
          display: grid;
          gap: 24px;
          margin-bottom: 40px;
        }

        .form-actions {
          display: flex;
          justify-content: center;
        }

        .btn-smart-next {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 32px;
          background: linear-gradient(135deg, #1631F8 0%, #0F23C9 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          min-width: 200px;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .btn-smart-next:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}