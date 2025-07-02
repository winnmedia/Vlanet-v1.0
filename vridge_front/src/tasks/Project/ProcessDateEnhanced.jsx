import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ko } from 'date-fns/esm/locale'
import { format, addDays, differenceInDays, addHours, isValid } from 'date-fns'
import moment from 'moment'
import { setDefaultTime } from 'utils/dateUtils'
import './ProcessDateEnhanced.scss'

// 아이콘 컴포넌트
const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
)

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
)

// 프로젝트 템플릿
const PROJECT_TEMPLATES = {
  quick: {
    name: '빠른 프로젝트 (2주)',
    duration: {
      basic_plan: 2,
      story_board: 2,
      filming: 3,
      video_edit: 3,
      post_work: 2,
      video_preview: 1,
      confirmation: 1,
      video_delivery: 0
    }
  },
  standard: {
    name: '표준 프로젝트 (1개월)',
    duration: {
      basic_plan: 3,
      story_board: 4,
      filming: 7,
      video_edit: 7,
      post_work: 4,
      video_preview: 2,
      confirmation: 2,
      video_delivery: 1
    }
  },
  extended: {
    name: '대규모 프로젝트 (2개월)',
    duration: {
      basic_plan: 5,
      story_board: 7,
      filming: 14,
      video_edit: 14,
      post_work: 7,
      video_preview: 3,
      confirmation: 3,
      video_delivery: 1
    }
  }
}

export default function ProcessDateEnhanced({ process, set_process }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [autocalculate, setAutocalculate] = useState(true) // 기본값 true로 변경

  // 날짜 변경 핸들러
  const handleDateChange = (index, key, value) => {
    const updatedProcess = [...process]
    // DatePicker에서 받은 값이 null이 아니면 Date 객체로 확실히 변환
    let dateValue = null
    if (value) {
      // 시작일은 9시, 종료일은 18시로 기본 설정
      const hour = key === 'startDate' ? 9 : 18
      dateValue = setDefaultTime(value, hour, 0) || new Date(value)
    }
    updatedProcess[index] = { ...updatedProcess[index], [key]: dateValue }

    // 자동 계산 모드일 때
    if (autocalculate && key === 'startDate' && dateValue && index < process.length - 1) {
      // 현재 단계의 종료일을 시작일 + 기간으로 설정
      const duration = selectedTemplate ? 
        PROJECT_TEMPLATES[selectedTemplate].duration[updatedProcess[index].key] : 
        3 // 기본 3일
      
      if (duration > 0) {
        updatedProcess[index].endDate = addDays(dateValue, duration - 1)
      } else {
        updatedProcess[index].endDate = dateValue
      }

      // 다음 단계의 시작일을 현재 단계 종료일 다음날로 설정
      if (updatedProcess[index].endDate) {
        updatedProcess[index + 1].startDate = addDays(updatedProcess[index].endDate, 1)
      }
    }

    set_process(updatedProcess)
  }

  // 템플릿 적용
  const applyTemplate = (templateKey) => {
    const template = PROJECT_TEMPLATES[templateKey]
    const updatedProcess = [...process]
    let currentDate = setDefaultTime(new Date(), 9, 0) // 오전 9시부터 시작

    template.duration && Object.entries(template.duration).forEach(([key, duration], idx) => {
      const processIndex = updatedProcess.findIndex(p => p.key === key)
      if (processIndex !== -1) {
        updatedProcess[processIndex].startDate = new Date(currentDate)
        if (duration > 0) {
          const endDate = addDays(currentDate, duration - 1)
          updatedProcess[processIndex].endDate = setDefaultTime(endDate, 18, 0) // 오후 6시 종료
          currentDate = setDefaultTime(addDays(endDate, 1), 9, 0) // 다음날 오전 9시
        } else {
          updatedProcess[processIndex].endDate = setDefaultTime(currentDate, 18, 0)
        }
      }
    })

    set_process(updatedProcess)
    setSelectedTemplate(templateKey)
  }

  // 날짜 초기화
  const clearDates = () => {
    const updatedProcess = process.map(p => ({
      ...p,
      startDate: null,
      endDate: null
    }))
    set_process(updatedProcess)
    setSelectedTemplate(null)
  }

  // 전체 프로젝트 기간 계산
  const getProjectDuration = () => {
    const validDates = process
      .filter(p => p.startDate || p.endDate)
      .flatMap(p => [p.startDate, p.endDate])
      .filter(Boolean)
      .map(d => new Date(d))

    if (validDates.length === 0) return null

    const minDate = new Date(Math.min(...validDates))
    const maxDate = new Date(Math.max(...validDates))
    const days = differenceInDays(maxDate, minDate) + 1

    return {
      start: minDate,
      end: maxDate,
      days,
      weeks: Math.ceil(days / 7)
    }
  }

  const projectDuration = getProjectDuration()

  return (
    <div className="process-date-enhanced">
      {/* 헤더 섹션 */}
      <div className="header-section">
        <h3>프로젝트 일정</h3>
        
        <div className="header-actions">
          <label className="autocalc-toggle">
            <input
              type="checkbox"
              checked={autocalculate}
              onChange={(e) => setAutocalculate(e.target.checked)}
            />
            <div className="toggle-switch"></div>
            <span>자동 일정 계산</span>
          </label>
        </div>
      </div>

      {/* 프로젝트 요약 정보 */}
      {projectDuration && (
        <div className="project-summary">
          <div className="summary-item">
            <span className="label">프로젝트 기간</span>
            <span className="value">{projectDuration.days}일 ({projectDuration.weeks}주)</span>
          </div>
          <div className="summary-item">
            <span className="label">시작일</span>
            <span className="value">{format(projectDuration.start, 'yyyy년 MM월 dd일')}</span>
          </div>
          <div className="summary-item">
            <span className="label">종료일</span>
            <span className="value">{format(projectDuration.end, 'yyyy년 MM월 dd일')}</span>
          </div>
        </div>
      )}

      {/* 자동 계산 안내 */}
      {autocalculate && (
        <div className="auto-calc-info">
          <span>💡 시작일을 선택하면 다음 단계가 자동으로 설정됩니다</span>
        </div>
      )}
      
      {/* 템플릿 선택 */}
      <div className="template-section">
        <h4>빠른 설정</h4>
        <div className="template-buttons">
          {Object.entries(PROJECT_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              className={`template-btn ${selectedTemplate === key ? 'active' : ''}`}
              onClick={() => applyTemplate(key)}
            >
              {template.name}
            </button>
          ))}
          <button className="template-btn clear" onClick={clearDates}>
            초기화
          </button>
        </div>
      </div>

      {/* 타임라인 뷰는 제거 (공간 절약) */}

      {/* 날짜 선택 리스트 */}
      <div className="date-list">
        {process.map((range, index) => (
          <div key={index} className="date-item">
            <div className="process-info">
              <span className="process-number">{index + 1}</span>
              <span className="process-name">{range.text}</span>
              {range.startDate && range.endDate && (
                <span className="duration-badge">
                  {differenceInDays(new Date(range.endDate), new Date(range.startDate)) + 1}일
                </span>
              )}
            </div>
            
            <div className="date-inputs">
              <div className="date-input-group">
                <label>시작일</label>
                <div className="date-picker-wrapper">
                  <CalendarIcon />
                  <DatePicker
                    locale={ko}
                    selected={range.startDate ? new Date(range.startDate) : null}
                    onChange={(date) => handleDateChange(index, 'startDate', date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={10}
                    dateFormat="yyyy-MM-dd HH:mm"
                    placeholderText="시작일 (선택)"
                    className="date-input"
                    minDate={index > 0 && process[index - 1].endDate ? 
                      new Date(process[index - 1].endDate) : new Date()}
                    isClearable
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>
              </div>

              <div className="date-arrow">→</div>

              <div className="date-input-group">
                <label>종료일</label>
                <div className="date-picker-wrapper">
                  <CalendarIcon />
                  <DatePicker
                    locale={ko}
                    selected={range.endDate ? new Date(range.endDate) : null}
                    onChange={(date) => handleDateChange(index, 'endDate', date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={10}
                    dateFormat="yyyy-MM-dd HH:mm"
                    placeholderText="종료일 (선택)"
                    className="date-input"
                    disabled={!range.startDate && !autocalculate}
                    minDate={range.startDate ? new Date(range.startDate) : null}
                    isClearable
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>
              </div>

              {/* 빠른 기간 설정 버튼 */}
              {range.startDate && !range.endDate && (
                <div className="quick-duration">
                  <button onClick={() => {
                    const updated = [...process]
                    updated[index].endDate = setDefaultTime(new Date(range.startDate), 18, 0)
                    set_process(updated)
                  }}>당일</button>
                  <button onClick={() => {
                    const updated = [...process]
                    const endDate = addDays(new Date(range.startDate), 2)
                    updated[index].endDate = setDefaultTime(endDate, 18, 0)
                    set_process(updated)
                  }}>3일</button>
                  <button onClick={() => {
                    const updated = [...process]
                    const endDate = addDays(new Date(range.startDate), 6)
                    updated[index].endDate = setDefaultTime(endDate, 18, 0)
                    set_process(updated)
                  }}>1주</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 일정 검증 메시지 */}
      <div className="validation-messages">
        {process.some((p, idx) => 
          idx > 0 && 
          p.startDate && 
          process[idx - 1].endDate && 
          new Date(p.startDate) < new Date(process[idx - 1].endDate)
        ) && (
          <div className="warning-message">
            ⚠️ 일부 작업의 일정이 겹쳐있습니다. 확인해주세요.
          </div>
        )}
      </div>
    </div>
  )
}