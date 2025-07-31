import React, { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import { ko } from 'date-fns/locale'
import { format, addDays, differenceInDays } from 'date-fns'
import { setDefaultTime } from 'utils/dateUtils'

const PROJECT_TEMPLATES = {
  quick: {
    name: '빠른 프로젝트',
    duration: 14,
    description: '2주 완성 (기본 영상 제작)',
    icon: '⚡'
  },
  standard: {
    name: '표준 프로젝트',
    duration: 30,
    description: '1개월 완성 (고품질 영상 제작)',  
    icon: '🎯'
  },
  extended: {
    name: '대규모 프로젝트',
    duration: 60,
    description: '2개월 완성 (전문 영상 제작)',
    icon: '🚀'
  }
}

const Step2CoreSchedule = ({ process, set_process, onValidationChange }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [projectStart, setProjectStart] = useState(null)
  const [projectEnd, setProjectEnd] = useState(null)
  const [showCustomDates, setShowCustomDates] = useState(false)

  // 프로젝트 전체 시작/종료일 계산
  const getProjectDates = () => {
    const validDates = process
      .filter(p => p.startDate && p.endDate)
      .flatMap(p => [new Date(p.startDate), new Date(p.endDate)])
    
    if (validDates.length === 0) return { start: null, end: null }
    
    return {
      start: new Date(Math.min(...validDates)),
      end: new Date(Math.max(...validDates))
    }
  }

  // 템플릿 적용
  const applyTemplate = (templateKey) => {
    const template = PROJECT_TEMPLATES[templateKey]
    const startDate = setDefaultTime(new Date(), 9, 0)
    const endDate = setDefaultTime(addDays(startDate, template.duration), 18, 0)
    
    setProjectStart(startDate)
    setProjectEnd(endDate)
    setSelectedTemplate(templateKey)
    
    // 프로세스 날짜 자동 분배
    const updatedProcess = [...process]
    const totalDays = template.duration
    const processCount = updatedProcess.length
    const daysPerProcess = Math.ceil(totalDays / processCount)
    
    let currentDate = new Date(startDate)
    
    updatedProcess.forEach((proc, index) => {
      proc.startDate = new Date(currentDate)
      
      if (index === processCount - 1) {
        // 마지막 프로세스는 프로젝트 종료일에 맞춤
        proc.endDate = new Date(endDate)
      } else {
        const procEndDate = addDays(currentDate, daysPerProcess - 1)
        proc.endDate = setDefaultTime(procEndDate, 18, 0)
        currentDate = addDays(procEndDate, 1)
      }
    })
    
    set_process(updatedProcess)
  }

  // 커스텀 날짜 적용
  const applyCustomDates = () => {
    if (!projectStart || !projectEnd) return
    
    const updatedProcess = [...process]
    const totalDays = differenceInDays(projectEnd, projectStart) + 1
    const processCount = updatedProcess.length
    const daysPerProcess = Math.ceil(totalDays / processCount)
    
    let currentDate = new Date(projectStart)
    
    updatedProcess.forEach((proc, index) => {
      proc.startDate = new Date(currentDate)
      
      if (index === processCount - 1) {
        proc.endDate = new Date(projectEnd)
      } else {
        const procEndDate = addDays(currentDate, daysPerProcess - 1)
        proc.endDate = setDefaultTime(procEndDate, 18, 0)
        currentDate = addDays(procEndDate, 1)
      }
    })
    
    set_process(updatedProcess)
  }

  // 유효성 검사
  useEffect(() => {
    const dates = getProjectDates()
    const isValid = dates.start && dates.end
    onValidationChange(isValid)
  }, [process, onValidationChange])

  const projectDates = getProjectDates()
  const projectDuration = projectDates.start && projectDates.end ? 
    differenceInDays(projectDates.end, projectDates.start) + 1 : 0

  return (
    <div className="step2-core-schedule">
      <div className="step-header">
        <h2>프로젝트 일정을 설정해주세요</h2>
        <p>템플릿을 선택하거나 직접 날짜를 지정할 수 있습니다</p>
      </div>

      {/* 템플릿 선택 */}
      <div className="template-section">
        <h3>빠른 설정 (추천)</h3>
        <div className="template-grid">
          {Object.entries(PROJECT_TEMPLATES).map(([key, template]) => (
            <div
              key={key}
              className={`template-card ${selectedTemplate === key ? 'selected' : ''}`}
              onClick={() => applyTemplate(key)}
            >
              <div className="template-icon">{template.icon}</div>
              <div className="template-content">
                <div className="template-name">{template.name}</div>
                <div className="template-duration">{template.duration}일</div>
                <div className="template-description">{template.description}</div>
              </div>
              {selectedTemplate === key && (
                <div className="selected-check">✓</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 구분선 */}
      <div className="divider">
        <span>또는</span>
      </div>

      {/* 커스텀 날짜 설정 */}
      <div className="custom-section">
        <div className="custom-header">
          <h3>직접 날짜 설정</h3>
          <button
            type="button"
            className="toggle-custom"
            onClick={() => setShowCustomDates(!showCustomDates)}
          >
            {showCustomDates ? '접기' : '펼치기'}
          </button>
        </div>
        
        {showCustomDates && (
          <div className="custom-dates">
            <div className="date-inputs">
              <div className="date-input-group">
                <label>프로젝트 시작일</label>
                <DatePicker
                  locale={ko}
                  selected={projectStart}
                  onChange={(date) => setProjectStart(date)}
                  dateFormat="yyyy년 MM월 dd일"
                  placeholderText="시작일 선택"
                  className="date-input"
                  minDate={new Date()}
                />
              </div>
              
              <div className="date-arrow">→</div>
              
              <div className="date-input-group">
                <label>프로젝트 종료일</label>
                <DatePicker
                  locale={ko}
                  selected={projectEnd}
                  onChange={(date) => setProjectEnd(date)}
                  dateFormat="yyyy년 MM월 dd일"
                  placeholderText="종료일 선택"
                  className="date-input"
                  minDate={projectStart || new Date()}
                />
              </div>
            </div>
            
            {projectStart && projectEnd && (
              <div className="date-summary">
                <div className="summary-item">
                  총 기간: {differenceInDays(projectEnd, projectStart) + 1}일
                </div>
                <button
                  type="button"
                  className="btn-apply-custom"
                  onClick={applyCustomDates}
                >
                  일정 적용
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 현재 설정된 일정 요약 */}
      {projectDates.start && projectDates.end && (
        <div className="schedule-summary">
          <h3>설정된 일정</h3>
          <div className="summary-card">
            <div className="summary-main">
              <div className="date-range">
                <span className="start-date">
                  {format(projectDates.start, 'yyyy년 MM월 dd일')}
                </span>
                <span className="separator">~</span>
                <span className="end-date">
                  {format(projectDates.end, 'yyyy년 MM월 dd일')}
                </span>
              </div>
              <div className="duration-info">
                <span className="duration">총 {projectDuration}일</span>
                <span className="weeks">({Math.ceil(projectDuration / 7)}주)</span>
              </div>
            </div>
            
            {selectedTemplate && (
              <div className="template-badge">
                {PROJECT_TEMPLATES[selectedTemplate].icon} {PROJECT_TEMPLATES[selectedTemplate].name}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="step-info">
        <div className="info-box">
          <div className="info-icon">📅</div>
          <div className="info-content">
            <strong>자동 일정 분배</strong>
            <p>선택한 기간에 맞춰 8단계 작업 프로세스가 자동으로 배분됩니다.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .step2-core-schedule {
          max-width: 700px;
          margin: 0 auto;
        }
        
        .step-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .step-header h2 {
          font-size: 28px;
          font-weight: 700;
          color: #1631F8;
          margin-bottom: 8px;
        }
        
        .step-header p {
          font-size: 16px;
          color: #666;
        }
        
        .template-section {
          margin-bottom: 30px;
        }
        
        .template-section h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #333;
        }
        
        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        
        .template-card {
          position: relative;
          padding: 20px;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #fff;
        }
        
        .template-card:hover {
          border-color: #1631F8;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(22, 49, 248, 0.15);
        }
        
        .template-card.selected {
          border-color: #1631F8;
          background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
        }
        
        .template-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        
        .template-name {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }
        
        .template-duration {
          font-size: 14px;
          color: #1631F8;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .template-description {
          font-size: 12px;
          color: #666;
          line-height: 1.4;
        }
        
        .selected-check {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 24px;
          height: 24px;
          background: #1631F8;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
        }
        
        .divider {
          text-align: center;
          margin: 40px 0;
          position: relative;
        }
        
        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e9ecef;
        }
        
        .divider span {
          background: #fff;
          padding: 0 20px;
          color: #666;
          font-size: 14px;
        }
        
        .custom-section {
          margin-bottom: 30px;
        }
        
        .custom-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .custom-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }
        
        .toggle-custom {
          padding: 8px 16px;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          background: #fff;
          color: #666;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        
        .toggle-custom:hover {
          border-color: #1631F8;
          color: #1631F8;
        }
        
        .custom-dates {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        
        .date-inputs {
          display: flex;
          align-items: end;
          gap: 20px;
          margin-bottom: 16px;
        }
        
        .date-input-group {
          flex: 1;
        }
        
        .date-input-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }
        
        .date-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 16px;
        }
        
        .date-arrow {
          font-size: 18px;
          color: #666;
          margin-bottom: 6px;
        }
        
        .date-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #e9ecef;
        }
        
        .summary-item {
          font-weight: 600;
          color: #333;
        }
        
        .btn-apply-custom {
          padding: 10px 20px;
          background: linear-gradient(135deg, #1631F8 0%, #0F23C9 100%);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: transform 0.2s ease;
        }
        
        .btn-apply-custom:hover {
          transform: translateY(-1px);
        }
        
        .schedule-summary {
          margin-bottom: 30px;
        }
        
        .schedule-summary h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #333;
        }
        
        .summary-card {
          padding: 24px;
          background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
          border: 2px solid #1631F8;
          border-radius: 12px;
          position: relative;
        }
        
        .summary-main {
          text-align: center;
        }
        
        .date-range {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .start-date, .end-date {
          font-size: 16px;
          font-weight: 600;
          color: #1631F8;
        }
        
        .separator {
          color: #666;
          font-size: 18px;
        }
        
        .duration-info {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }
        
        .duration {
          font-size: 20px;
          font-weight: 700;
          color: #333;
        }
        
        .weeks {
          font-size: 14px;
          color: #666;
        }
        
        .template-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 6px 12px;
          background: #1631F8;
          color: white;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .step-info {
          margin-top: 30px;
        }
        
        .info-box {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: #f0f7ff;
          border: 1px solid #b8daff;
          border-radius: 8px;
        }
        
        .info-icon {
          font-size: 20px;
          flex-shrink: 0;
        }
        
        .info-content strong {
          display: block;
          color: #1631F8;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .info-content p {
          color: #666;
          font-size: 14px;
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .template-grid {
            grid-template-columns: 1fr;
          }
          
          .date-inputs {
            flex-direction: column;
            gap: 16px;
          }
          
          .date-arrow {
            transform: rotate(90deg);
            align-self: center;
          }
          
          .date-summary {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
          
          .date-range {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  )
}

export default Step2CoreSchedule