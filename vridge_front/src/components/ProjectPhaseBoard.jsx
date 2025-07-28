import React, { useState, useMemo, useEffect } from 'react'
import './ProjectPhaseBoard.scss'

import moment from 'moment'
import 'moment/locale/ko'

export default function ProjectPhaseBoard({ projects, onPhaseUpdate, projectCounts, showTitle = false }) {
  // 토글 상태 추가
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all') // all, active, delayed
  
  // 모든 프로젝트를 기본적으로 펼친 상태로 설정
  const [expandedProjects, setExpandedProjects] = useState(() => {
    const initial = {}
    projects?.forEach(project => {
      initial[project.id] = true
    })
    return initial
  })
  
  // 프로젝트 목록이 변경될 때 새 프로젝트도 자동으로 펼치기
  useEffect(() => {
    projects?.forEach(project => {
      if (expandedProjects[project.id] === undefined) {
        setExpandedProjects(prev => ({ ...prev, [project.id]: true }))
      }
    })
  }, [projects])
  
  const phases = [
    { key: 'basic_plan', name: '기초기획안' },
    { key: 'story_board', name: '스토리보드' },
    { key: 'filming', name: '촬영' },
    { key: 'video_edit', name: '편집' },
    { key: 'post_work', name: '후반작업' },
    { key: 'video_preview', name: '시사' },
    { key: 'confirmation', name: '컨펌' },
    { key: 'video_delivery', name: '납품' }
  ]
  
  // 단계 상태 계산
  const getPhaseStatus = (phase, projectEndDate) => {
    if (!phase || !phase.start_date) return 'pending'
    
    const today = moment()
    const startDate = moment(phase.start_date)
    const endDate = moment(phase.end_date)
    const projectEnd = moment(projectEndDate)
    
    if (endDate.isBefore(today) && phase.completed) {
      return 'completed'
    } else if (endDate.isBefore(today) && !phase.completed) {
      return 'delayed'
    } else if (startDate.isSameOrBefore(today) && endDate.isSameOrAfter(today)) {
      return 'in_progress'
    } else if (startDate.isAfter(today)) {
      return 'pending'
    }
    
    return 'pending'
  }
  
  // 프로젝트 진행률 계산
  const getProjectProgress = (project) => {
    let completedPhases = 0
    let totalPhases = 0
    
    phases.forEach(phase => {
      if (project[phase.key] && project[phase.key].start_date) {
        totalPhases++
        const status = getPhaseStatus(project[phase.key], project.end_date)
        if (status === 'completed') {
          completedPhases++
        }
      }
    })
    
    return totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0
  }
  
  // 프로젝트 상태별 분류
  const projectsByStatus = useMemo(() => {
    const grouped = {
      all: [],
      active: [],
      delayed: [],
      completed: []
    }
    
    projects.forEach(project => {
      const progress = getProjectProgress(project)
      const hasDelayed = phases.some(phase => 
        getPhaseStatus(project[phase.key], project.end_date) === 'delayed'
      )
      
      if (progress === 100) {
        grouped.completed.push(project)
      } else if (hasDelayed) {
        grouped.delayed.push(project)
        grouped.all.push(project)
      } else {
        grouped.active.push(project)
        grouped.all.push(project)
      }
    })
    
    return grouped
  }, [projects])
  
  if (!projects || projects.length === 0) {
    return null
  }
  
  const toggleProject = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }))
  }
  
  const statusColors = {
    completed: '#4CAF50',
    in_progress: '#2196F3',
    pending: '#9E9E9E',
    delayed: '#F44336'
  }
  
  const statusNames = {
    completed: '완료',
    in_progress: '진행중',
    pending: '대기',
    delayed: '지연'
  }
  
  return (
    <>
      {showTitle && (
        <div className="phase-board-header">
          <h2 className="phase-board-title">프로젝트 진행 현황</h2>
          <div className="phase-board-controls">
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${selectedFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('all')}
              >
                전체
                <span className="count">{projectsByStatus.all.length}</span>
              </button>
              <button 
                className={`filter-tab ${selectedFilter === 'active' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('active')}
              >
                진행중
                <span className="count">{projectsByStatus.active.length}</span>
              </button>
              <button 
                className={`filter-tab ${selectedFilter === 'delayed' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('delayed')}
              >
                지연
                <span className="count delayed">{projectsByStatus.delayed.length}</span>
              </button>
            </div>
            <button 
              className={`collapse-btn ${isCollapsed ? 'collapsed' : ''}`}
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? '펼치기' : '접기'}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path 
                  d={isCollapsed ? 
                    'M7 8L10 11L13 8' : 
                    'M7 12L10 9L13 12'
                  } 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <div className="project-phase-board">
        {!showTitle && (
          <div className="board-header">
            <button 
              className={`collapse-btn ${isCollapsed ? 'collapsed' : ''}`}
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{ marginBottom: '20px' }}
            />
          </div>
        )}
        
        {!isCollapsed && (
          <div className="board-content">
            <div className="projects-container">
              {projectsByStatus[selectedFilter].map(project => (
                <ProjectPhaseCard
                  key={project.id}
                  project={project}
                  phases={phases}
                  getPhaseStatus={getPhaseStatus}
                  getProjectProgress={getProjectProgress}
                  expandedProjects={expandedProjects}
                  toggleProject={toggleProject}
                  statusColors={statusColors}
                  statusNames={statusNames}
                  onPhaseUpdate={onPhaseUpdate}
                />
              ))}
              {projectsByStatus[selectedFilter].length === 0 && (
                <div className="empty-state">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="32" fill="#F8F9FA"/>
                    <path d="M22 28H42M22 36H42" stroke="#DEE2E6" strokeWidth="2" strokeLinecap="round"/>
                    <rect x="18" y="20" width="28" height="24" rx="2" stroke="#DEE2E6" strokeWidth="2" fill="none"/>
                  </svg>
                  <p>해당하는 프로젝트가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// 프로젝트 단계 카드 컴포넌트
function ProjectPhaseCard({ 
  project, 
  phases, 
  getPhaseStatus, 
  getProjectProgress,
  expandedProjects,
  toggleProject,
  statusColors,
  statusNames,
  onPhaseUpdate
}) {
  const progress = getProjectProgress(project)
  const isExpanded = expandedProjects[project.id]
  const hasDelayed = phases.some(phase => 
    getPhaseStatus(project[phase.key], project.end_date) === 'delayed'
  )
  
  // 단계 완료 처리
  const handlePhaseComplete = (phase) => {
    if (onPhaseUpdate) {
      const phaseData = project[phase.key]
      if (phaseData && phaseData.start_date) {
        // 완료 상태를 토글
        const completed = !phaseData.completed
        // 백엔드 API 호출을 위해 시작일과 종료일을 함께 전달
        onPhaseUpdate(project.id, phase.key, phaseData.start_date, phaseData.end_date, completed)
      }
    }
  }
  
  return (
    <div className={`project-card ${hasDelayed ? 'has-delayed' : ''}`} data-expanded={isExpanded}>
      {/* 프로젝트 헤더 */}
      <div className="project-header" onClick={() => toggleProject(project.id)}>
        <div className="project-main-info">
          <div className="project-title-row">
            <h3 className="project-name">{project.name}</h3>
            {hasDelayed && (
              <span className="delay-indicator" title="지연된 단계가 있습니다">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2V8L11 11" stroke="#dc3545" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="8" cy="8" r="7" stroke="#dc3545" strokeWidth="2" fill="none"/>
                </svg>
              </span>
            )}
          </div>
          <div className="project-details">
            <span className="project-dates">
              {moment(project.start_date).format('MM.DD')} - {moment(project.end_date).format('MM.DD')}
            </span>
            <span className="project-duration">
              {moment(project.end_date).diff(moment(project.start_date), 'days')}일
            </span>
          </div>
        </div>
        <div className="project-actions">
          <div className="progress-indicator">
            <svg className="progress-ring" width="48" height="48" viewBox="0 0 48 48">
              <circle 
                cx="24" 
                cy="24" 
                r="20" 
                fill="none" 
                stroke="#E9ECEF" 
                strokeWidth="3"
              />
              <circle 
                cx="24" 
                cy="24" 
                r="20" 
                fill="none" 
                stroke={hasDelayed ? '#dc3545' : '#1631F8'}
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                transform="rotate(-90 24 24)"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <span className="progress-text">{progress}%</span>
          </div>
          <button className="expand-toggle">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path 
                d={isExpanded ? 'M6 12L10 8L14 12' : 'M6 8L10 12L14 8'} 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
      
      {/* 단계 타임라인 - 펼쳐진 경우에만 표시 */}
      {isExpanded && (
        <div className="phases-timeline">
          {phases.map((phase, index) => {
            const phaseData = project[phase.key]
            const status = getPhaseStatus(phaseData, project.end_date)
            const hasData = phaseData && phaseData.start_date
            
            return (
              <div key={phase.key} className={`phase-item ${status} ${!hasData ? 'no-data' : ''}`}>
                <div className="phase-dot">
                  {status === 'completed' && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {status === 'in_progress' && (
                    <div className="pulse-dot"></div>
                  )}
                </div>
                {index < phases.length - 1 && <div className="phase-line"></div>}
                <div className="phase-content">
                  <div className="phase-header">
                    <span className="phase-name">{phase.name}</span>
                    {hasData && status !== 'pending' && (
                      <button 
                        className={`complete-btn ${phaseData.completed ? 'completed' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePhaseComplete(phase)
                        }}
                        title={phaseData.completed ? '완료 취소' : '완료 처리'}
                      >
                        {phaseData.completed ? (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  {hasData ? (
                    <div className="phase-dates">
                      <span className="date-range">
                        {moment(phaseData.start_date).format('MM.DD')} - {moment(phaseData.end_date).format('MM.DD')}
                      </span>
                      {status === 'delayed' && (
                        <span className="delay-badge">
                          {moment().diff(moment(phaseData.end_date), 'days')}일 지연
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="no-data-message">일정 미정</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      
    </div>
  )
}