import React, { useState, useEffect } from 'react'
import axios from 'config/axios'
import './ExportModal.scss'

export default function ExportModal({ isOpen, onClose, planningData }) {
  const [exportFormats, setExportFormats] = useState([])
  const [selectedFormat, setSelectedFormat] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState(null)
  const [exportSuccess, setExportSuccess] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchExportFormats()
    }
  }, [isOpen])

  const fetchExportFormats = async () => {
    try {
      const response = await axios.get('/api/video-planning/export/formats/')
      if (response.data.status === 'success') {
        setExportFormats(response.data.data.formats)
      }
    } catch (error) {
      console.error('내보내기 형식 조회 실패:', error)
    }
  }

  const handleExport = async () => {
    if (!selectedFormat) return

    setIsExporting(true)
    setExportError(null)
    setExportSuccess(null)

    try {
      // 기획 데이터 준비
      const exportData = {
        title: planningData.planningTitle || '영상 기획안',
        planning_text: planningData.planning,
        tone: planningData.planningOptions?.tone,
        genre: planningData.planningOptions?.genre,
        concept: planningData.planningOptions?.concept,
        target: planningData.planningOptions?.target,
        purpose: planningData.planningOptions?.purpose,
        duration: planningData.planningOptions?.duration,
        stories: planningData.stories,
        scenes: planningData.scenes,
        shots: planningData.shots,
        storyboards: planningData.storyboards
      }

      if (selectedFormat === 'pdf_full' || selectedFormat === 'pdf_storyboard') {
        // PDF 내보내기
        const response = await axios.post(
          '/api/video-planning/export/pdf/',
          {
            planning_data: exportData,
            export_type: selectedFormat === 'pdf_storyboard' ? 'storyboard_only' : 'full'
          },
          {
            responseType: 'blob'
          }
        )

        // 파일 다운로드
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        
        // 파일명 추출
        const contentDisposition = response.headers['content-disposition']
        let filename = '영상기획안.pdf'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '')
          }
        }
        
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        setExportSuccess('PDF 파일이 다운로드되었습니다.')
      } else if (selectedFormat === 'google_slides') {
        // Google Slides 내보내기
        const response = await axios.post(
          '/api/video-planning/export/google-slides/',
          {
            planning_data: exportData
          }
        )

        if (response.data.status === 'success') {
          const { url } = response.data.data
          setExportSuccess(
            <div>
              Google Slides가 생성되었습니다! 
              <a href={url} target="_blank" rel="noopener noreferrer" style={{color: '#4318FF', marginLeft: '8px'}}>
                📊 열어보기
              </a>
            </div>
          )
        } else {
          setExportError(response.data.message || 'Google Slides 생성에 실패했습니다.')
        }
      } else if (selectedFormat === 'ai_proposal') {
        // 새로운 AI 기반 기획안 내보내기
        const response = await axios.post(
          '/api/video-planning/proposals/export/',
          {
            planning_text: exportData.planning_text,
            export_format: 'google_slides',
            title: exportData.title
          }
        )

        if (response.data.success) {
          const { presentation } = response.data
          if (presentation) {
            setExportSuccess(
              <div>
                🚀 AI 기획안이 생성되었습니다! 
                <a href={presentation.url} target="_blank" rel="noopener noreferrer" style={{color: '#4318FF', marginLeft: '8px'}}>
                  📊 Google Slides 열어보기
                </a>
                <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                  슬라이드 {presentation.slide_count}개 생성됨
                </div>
              </div>
            )
          } else {
            setExportSuccess('AI 기획안 구조화가 완료되었습니다. 수동으로 Google Slides를 생성할 수 있습니다.')
          }
        } else {
          setExportError(response.data.message || 'AI 기획안 생성에 실패했습니다.')
        }
      } else {
        setExportError('지원하지 않는 내보내기 형식입니다.')
      }
    } catch (error) {
      console.error('내보내기 오류:', error)
      setExportError(error.response?.data?.message || '내보내기 중 오류가 발생했습니다.')
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal" onClick={e => e.stopPropagation()}>
        <div className="export-modal-header">
          <h3>기획안 내보내기</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="export-modal-content">
          {exportFormats.length === 0 ? (
            <div className="loading">내보내기 옵션을 불러오는 중...</div>
          ) : (
            <>
              <div className="format-selection">
                <h4>내보내기 형식 선택</h4>
                <div className="format-options">
                  <div 
                    className={`format-option ${selectedFormat === 'ai_proposal' ? 'selected' : ''}`}
                    onClick={() => setSelectedFormat('ai_proposal')}
                  >
                    <div className="format-icon">🤖</div>
                    <div className="format-info">
                      <h5>AI 기반 기획안</h5>
                      <p>Google Gemini로 구조화된 전문 프레젠테이션</p>
                      <small>⚡ 5-10분 소요, A4 최적화</small>
                    </div>
                  </div>
                  
                  {exportFormats.map(format => (
                    <div 
                      key={format.id}
                      className={`format-option ${selectedFormat === format.id ? 'selected' : ''}`}
                      onClick={() => setSelectedFormat(format.id)}
                    >
                      <div className="format-icon">{format.icon}</div>
                      <div className="format-info">
                        <h5>{format.name}</h5>
                        <p>{format.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {exportError && (
                <div className="export-error">
                  ❌ {exportError}
                </div>
              )}

              {exportSuccess && (
                <div className="export-success">
                  ✅ {exportSuccess}
                </div>
              )}
            </>
          )}
        </div>

        <div className="export-modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            취소
          </button>
          <button 
            className="export-btn" 
            onClick={handleExport}
            disabled={!selectedFormat || isExporting}
          >
            {isExporting ? '내보내는 중...' : '내보내기'}
          </button>
        </div>
      </div>
    </div>
  )
}