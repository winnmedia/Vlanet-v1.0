import React, { useState, useRef, useEffect } from 'react'
import './CalendarEnhanced.scss'
import moment from 'moment'
import 'moment/locale/ko'

export default function CalendarEnhanced({ 
  projects, 
  phases, 
  onPhaseUpdate, 
  onMemoAdd,
  isAdmin,
  initialViewMode = 'timeline',
  initialSearchTerm = '',
  initialSelectedPhase = 'all'
}) {
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverDate, setDragOverDate] = useState(null)
  const [selectedPhase, setSelectedPhase] = useState(initialSelectedPhase)
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [viewMode, setViewMode] = useState(initialViewMode) // month, timeline, gantt
  
  const phaseColors = {
    basic_plan: '#4A90E2',
    story_board: '#50E3C2',
    filming: '#F5A623',
    video_edit: '#7ED321',
    post_work: '#BD10E0',
    video_preview: '#9013FE',
    confirmation: '#B8E986',
    video_delivery: '#FA7252'
  }
  
  const phaseNames = {
    basic_plan: '기초기획안 작성',
    story_board: '스토리보드 작성',
    filming: '촬영',
    video_edit: '비디오 편집',
    post_work: '후반 작업',
    video_preview: '비디오 시사',
    confirmation: '최종 컨펌',
    video_delivery: '영상 납품'
  }
  
  // Filter projects based on search and phase
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPhase = selectedPhase === 'all' || 
      (project[selectedPhase] && project[selectedPhase].start_date)
    return matchesSearch && matchesPhase
  })
  
  // Drag and drop handlers
  const handleDragStart = (e, project, phase) => {
    if (!isAdmin) return
    
    setDraggedItem({ project, phase })
    e.dataTransfer.effectAllowed = 'move'
    e.target.style.opacity = '0.5'
  }
  
  const handleDragEnd = (e) => {
    e.target.style.opacity = '1'
    setDraggedItem(null)
    setDragOverDate(null)
  }
  
  const handleDragOver = (e, date) => {
    e.preventDefault()
    if (!isAdmin || !draggedItem) return
    
    e.dataTransfer.dropEffect = 'move'
    setDragOverDate(date)
  }
  
  const handleDrop = (e, dropDate) => {
    e.preventDefault()
    if (!isAdmin || !draggedItem) return
    
    const { project, phase } = draggedItem
    const phaseData = project[phase]
    if (!phaseData) return
    
    const duration = moment(phaseData.end_date).diff(moment(phaseData.start_date), 'days')
    const newStartDate = moment(dropDate).format('YYYY-MM-DD')
    const newEndDate = moment(dropDate).add(duration, 'days').format('YYYY-MM-DD')
    
    onPhaseUpdate(project.id, phase, newStartDate, newEndDate)
    
    setDraggedItem(null)
    setDragOverDate(null)
  }
  
  // Quick add event
  const handleQuickAdd = (date) => {
    if (!isAdmin) return
    
    const memo = prompt(`${moment(date).format('YYYY년 MM월 DD일')} 메모 추가:`)
    if (memo) {
      onMemoAdd(date, memo)
    }
  }
  
  // Timeline view renderer
  const renderTimelineView = () => {
    return (
      <div className="timeline-view">
        <div className="timeline-header">
          <div className="project-column">프로젝트</div>
          <div className="timeline-dates">
            {/* Generate date headers for current month */}
            {Array.from({ length: 31 }, (_, i) => (
              <div key={i} className="timeline-date">
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        
        <div className="timeline-body">
          {filteredProjects.map(project => (
            <div key={project.id} className="timeline-row">
              <div className="project-name" style={{ borderLeft: `4px solid ${project.color}` }}>
                {project.name}
              </div>
              <div className="timeline-phases">
                {Object.entries(phaseNames).map(([phaseKey, phaseName]) => {
                  const phase = project[phaseKey]
                  if (!phase || !phase.start_date) return null
                  
                  const startDay = moment(phase.start_date).date()
                  const duration = moment(phase.end_date).diff(moment(phase.start_date), 'days') + 1
                  
                  return (
                    <div
                      key={phaseKey}
                      className={`timeline-phase phase-${phaseKey}`}
                      style={{
                        left: `${(startDay - 1) * 3.2}%`,
                        width: `${duration * 3.2}%`,
                        backgroundColor: phaseColors[phaseKey]
                      }}
                      draggable={isAdmin}
                      onDragStart={(e) => handleDragStart(e, project, phaseKey)}
                      onDragEnd={handleDragEnd}
                      title={`${phaseName}: ${moment(phase.start_date).format('MM/DD')} - ${moment(phase.end_date).format('MM/DD')}`}
                    >
                      <span className="phase-label">{phaseName}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Gantt chart view renderer
  const renderGanttView = () => {
    const allDates = []
    filteredProjects.forEach(project => {
      Object.entries(project).forEach(([key, value]) => {
        if (value && value.start_date && value.end_date) {
          allDates.push(moment(value.start_date))
          allDates.push(moment(value.end_date))
        }
      })
    })
    
    const minDate = moment.min(allDates)
    const maxDate = moment.max(allDates)
    const totalDays = maxDate.diff(minDate, 'days') + 1
    
    return (
      <div className="gantt-view">
        <div className="gantt-header">
          <div className="phase-column">단계</div>
          <div className="gantt-timeline">
            {Array.from({ length: totalDays }, (_, i) => {
              const date = moment(minDate).add(i, 'days')
              return (
                <div key={i} className="gantt-date">
                  {date.date() === 1 || i === 0 ? date.format('MM/DD') : date.format('DD')}
                </div>
              )
            })}
          </div>
        </div>
        
        <div className="gantt-body">
          {filteredProjects.map(project => (
            <div key={project.id} className="gantt-project">
              <div className="project-header" style={{ backgroundColor: project.color }}>
                {project.name}
              </div>
              {Object.entries(phaseNames).map(([phaseKey, phaseName]) => {
                const phase = project[phaseKey]
                if (!phase || !phase.start_date) return null
                
                const startOffset = moment(phase.start_date).diff(minDate, 'days')
                const duration = moment(phase.end_date).diff(moment(phase.start_date), 'days') + 1
                
                return (
                  <div key={phaseKey} className="gantt-row">
                    <div className="phase-name">{phaseName}</div>
                    <div className="gantt-bars">
                      <div
                        className={`gantt-bar phase-${phaseKey}`}
                        style={{
                          left: `${(startOffset / totalDays) * 100}%`,
                          width: `${(duration / totalDays) * 100}%`,
                          backgroundColor: phaseColors[phaseKey]
                        }}
                        draggable={isAdmin}
                        onDragStart={(e) => handleDragStart(e, project, phaseKey)}
                        onDragEnd={handleDragEnd}
                      >
                        <span className="duration">{duration}일</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="calendar-enhanced">
      <div className="calendar-content">
        {viewMode === 'timeline' && renderTimelineView()}
        {viewMode === 'gantt' && renderGanttView()}
      </div>
      
      {/* Phase color legend */}
      <div className="phase-legend">
        {Object.entries(phaseNames).map(([key, name]) => (
          <div key={key} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: phaseColors[key] }}
            />
            <span className="legend-name">{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}