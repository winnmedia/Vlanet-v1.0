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
              <p>Google Slides가 생성되었습니다!</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="slides-link">
                프레젠테이션 열기
              </a>
            </div>
          )
        } else {
          throw new Error(response.data.message || '내보내기 실패')
        }
      }
    } catch (error) {
      console.error('내보내기 실패:', error)
      setExportError(error.response?.data?.message || '내보내기 중 오류가 발생했습니다.')
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>기획안 내보내기</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="format-list">
            {exportFormats.map((format) => (
              <div
                key={format.id}
                className={`format-item ${selectedFormat === format.id ? 'selected' : ''} ${!format.available ? 'disabled' : ''}`}
                onClick={() => format.available && setSelectedFormat(format.id)}
              >
                <div className="format-icon">
                  {format.id === 'pdf_full' && '📄'}
                  {format.id === 'pdf_storyboard' && '🖼️'}
                  {format.id === 'google_slides' && '📊'}
                </div>
                <div className="format-info">
                  <h3>{format.name}</h3>
                  <p>{format.description}</p>
                  {!format.available && <span className="unavailable">현재 사용 불가</span>}
                </div>
              </div>
            ))}
          </div>

          {exportError && (
            <div className="export-message error">
              ⚠️
              {exportError}
            </div>
          )}

          {exportSuccess && (
            <div className="export-message success">
              ✅
              {exportSuccess}
            </div>
          )}
        </div>

        <div className="modal-footer">
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