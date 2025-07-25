import React, { useState, useMemo, useEffect } from 'react'

import moment from 'moment'
import 'moment/locale/ko'

export default function ProjectPhaseBoard({ projects, onPhaseUpdate, projectCounts, showTitle = false }) {
  // 토글 상태 추가
  const [isCollapsed, setIsCollapsed] = useState(false)
  
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
      active: [],
      delayed: []
    }
    
    projects.forEach(project => {
      const progress = getProjectProgress(project)
      const hasDelayed = phases.some(phase => 
        getPhaseStatus(project[phase.key], project.end_date) === 'delayed'
      )
      
      // 완료된 프로젝트는 제외
      if (progress === 100) {
        return
      } else if (hasDelayed) {
        grouped.delayed.push(project)
      } else {
        grouped.active.push(project)
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
        <div className="title" style={{ 
          marginTop: '40px', 
          marginBottom: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}>
          <span style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1a1a1a',
            letterSpacing: '-0.5px'
          }}>
            프로젝트 진행 현황
          </span>
          <button 
            className={`collapse-btn ${isCollapsed ? 'collapsed' : ''}`}
            onClick={() => setIsCollapsed(!isCollapsed)}
          />
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
            {/* 지연된 프로젝트 */}
            {projectsByStatus.delayed.length > 0 && (
              <div className="status-section delayed-section">
                <div className="section-header">
                  <h4 className="section-title">
                    지연 프로젝트
                    <span className="count delayed">{projectsByStatus.delayed.length}</span>
                  </h4>
                </div>
                <div className="projects-grid">
                  {projectsByStatus.delayed.map(project => (
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
                </div>
              </div>
            )}
            
            {/* 진행중인 프로젝트 */}
            {projectsByStatus.active.length > 0 && (
              <div className="status-section active-section">
                <div className="section-header">
                  <h4 className="section-title">
                    진행중 프로젝트
                    <span className="count active">{projectsByStatus.active.length}</span>
                  </h4>
                </div>
                <div className="projects-grid">
                  {projectsByStatus.active.map(project => (
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
                </div>
              </div>
            )}
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
  
  // 단계 완료 처리
  const handlePhaseComplete = (phase) => {
    if (onPhaseUpdate) {
      const phaseData = project[phase.key]
      if (phaseData && phaseData.start_date) {
        // 완료 상태를 토글
        const updatedPhase = {
          ...phaseData,
          completed: !phaseData.completed
        }
        onPhaseUpdate(project.id, phase.key, updatedPhase)
      }
    }
  }
  
  return (
    <div className="project-card" data-expanded={isExpanded}>
      {/* 프로젝트 헤더 */}
      <div className="project-header" onClick={() => toggleProject(project.id)}>
        <div className="project-info">
          <h3 className="project-name">{project.name}</h3>
          <div className="project-meta">
            <span className="project-dates">
              {moment(project.start_date).format('YYYY.MM.DD')} - {moment(project.end_date).format('YYYY.MM.DD')}
            </span>
            <div className={`progress-badge ${progress === 100 ? 'completed' : progress >= 70 ? 'high' : progress >= 30 ? 'medium' : 'low'}`}>
              {progress}%
            </div>
          </div>
        </div>
        <button className="expand-toggle">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor">
            <path d={isExpanded ? 'M6 0l6 8H0z' : 'M6 8l6-8H0z'} />
          </svg>
        </button>
      </div>
      
      {/* 단계 그리드 - 펼쳐진 경우에만 표시 */}
      {isExpanded && (
        <div className="phases-grid">
          {phases.map(phase => {
            const phaseData = project[phase.key]
            const status = getPhaseStatus(phaseData, project.end_date)
            const hasData = phaseData && phaseData.start_date
            
            return (
              <div key={phase.key} className={`phase-item ${status} ${!hasData ? 'no-data' : ''}`}>
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
                      완료
                    </button>
                  )}
                </div>
                {hasData && (
                  <div className="phase-dates">
                    <div className="date-row">
                      <span className="label">시작:</span>
                      <span className="date">{moment(phaseData.start_date).format('MM.DD')}</span>
                    </div>
                    <div className="date-row">
                      <span className="label">종료:</span>
                      <span className="date">{moment(phaseData.end_date).format('MM.DD')}</span>
                    </div>
                  </div>
                )}
                {!hasData && (
                  <div className="no-data-message">일정 미정</div>
                )}
                <div className="status-indicator" style={{ backgroundColor: statusColors[status] }}>
                  {statusNames[status]}
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* 진행률 바 */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}