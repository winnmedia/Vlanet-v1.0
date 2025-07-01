import React, { useState, useMemo, useEffect } from 'react'
import './ProjectPhaseBoard.scss'
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
      } else {
        grouped.active.push(project)
      }
    })
    
    return grouped
  }, [projects])
  
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
        <div className="title" style={{ marginTop: '40px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          프로젝트 진행 현황
          <button 
            className={`collapse-btn ${isCollapsed ? 'collapsed' : ''}`}
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#1631F8',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#0F23C9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1631F8';
            }}
          >
            <svg 
              width="10" 
              height="10" 
              viewBox="0 0 10 10" 
              fill="white"
              style={{
                transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}
            >
              <path d="M5 7L1 3h8L5 7z"/>
            </svg>
          </button>
        </div>
      )}
      <div className="project-phase-board" style={{ marginTop: showTitle ? 0 : '32px' }}>
        {!showTitle && (
          <div className="board-header">
            <button 
              className={`collapse-btn ${isCollapsed ? 'collapsed' : ''}`}
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#1631F8',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                flexShrink: 0,
                marginBottom: '20px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0F23C9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1631F8';
              }}
            >
              <svg 
                width="10" 
                height="10" 
                viewBox="0 0 10 10" 
                fill="white"
                style={{
                  transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}
              >
                <path d="M5 7L1 3h8L5 7z"/>
              </svg>
            </button>
          </div>
        )}
      
      {!isCollapsed && projectCounts && (
        <div className="project-counts-section">
          <ul className="schedule">
            <li>
              전체 <br />
              프로젝트 <span>{projectCounts.total}</span>
            </li>
            <li>
              이번 달 <br />
              프로젝트 <span>{projectCounts.thisMonth}</span>
            </li>
            <li>
              다음 달 <br />
              프로젝트 <span>{projectCounts.nextMonth}</span>
            </li>
          </ul>
        </div>
      )}
      
      {!isCollapsed && (
        <div className="project-sections">
          {/* 진행중인 프로젝트 */}
          {projectsByStatus.active.length > 0 && (
          <div className="project-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 className="section-title" style={{ margin: 0 }}>
                진행중 ({projectsByStatus.active.length})
              </h4>
              <div className="status-legend" style={{ display: 'flex', gap: '16px' }}>
                {Object.entries(statusNames).map(([key, name]) => (
                  <div key={key} className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span 
                      className="status-dot" 
                      style={{ 
                        backgroundColor: statusColors[key],
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        display: 'inline-block'
                      }}
                    />
                    <span style={{ fontSize: '13px', color: '#495057' }}>{name}</span>
                  </div>
                ))}
              </div>
            </div>
            {projectsByStatus.active.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                phases={phases}
                expanded={expandedProjects[project.id]}
                onToggle={() => toggleProject(project.id)}
                getPhaseStatus={getPhaseStatus}
                getProjectProgress={getProjectProgress}
                statusColors={statusColors}
                onPhaseUpdate={onPhaseUpdate}
              />
            ))}
          </div>
        )}
        
        {/* 지연된 프로젝트 */}
        {projectsByStatus.delayed.length > 0 && (
          <div className="project-section delayed-section">
            <h4 className="section-title">
              지연됨 ({projectsByStatus.delayed.length})
            </h4>
            {projectsByStatus.delayed.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                phases={phases}
                expanded={expandedProjects[project.id]}
                onToggle={() => toggleProject(project.id)}
                getPhaseStatus={getPhaseStatus}
                getProjectProgress={getProjectProgress}
                statusColors={statusColors}
                onPhaseUpdate={onPhaseUpdate}
              />
            ))}
          </div>
        )}
        
        {/* 완료된 프로젝트 */}
        {projectsByStatus.completed.length > 0 && (
          <div className="project-section completed-section">
            <h4 className="section-title">
              완료됨 ({projectsByStatus.completed.length})
            </h4>
            {projectsByStatus.completed.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                phases={phases}
                expanded={expandedProjects[project.id]}
                onToggle={() => toggleProject(project.id)}
                getPhaseStatus={getPhaseStatus}
                getProjectProgress={getProjectProgress}
                statusColors={statusColors}
                onPhaseUpdate={onPhaseUpdate}
              />
            ))}
          </div>
        )}
        </div>
      )}
      </div>
    </>
  )
}

// 프로젝트 카드 컴포넌트
function ProjectCard({ 
  project, 
  phases, 
  expanded, 
  onToggle, 
  getPhaseStatus, 
  getProjectProgress,
  statusColors,
  onPhaseUpdate 
}) {
  const progress = getProjectProgress(project)
  
  // 단계 완료 처리 함수
  const handlePhaseComplete = (phase) => {
    if (onPhaseUpdate) {
      const phaseData = project[phase.key]
      if (phaseData && phaseData.start_date) {
        // 완료 상태를 토글
        const updatedPhase = {
          ...phaseData,
          completed: !phaseData.completed
        }
        onPhaseUpdate(project.id, phase.key, updatedPhase.start_date, updatedPhase.end_date, updatedPhase.completed)
      }
    }
  }
  
  return (
    <div className="project-card">
      <div className="project-header">
        <div className="project-info">
          <div 
            className="project-color-bar" 
            style={{ backgroundColor: project.color }}
          />
          <h5 className="project-name">{project.name}</h5>
          <span className="project-consumer">({project.consumer})</span>
        </div>
        <div className="project-meta">
          <div className="progress-info">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: progress === 100 ? statusColors.completed : statusColors.in_progress
                }}
              />
            </div>
            <span className="progress-text">{progress}%</span>
          </div>
        </div>
      </div>
      
      <div className="project-phases">
          {phases.map(phase => {
            const phaseData = project[phase.key]
            const status = getPhaseStatus(phaseData, project.end_date)
            
            return (
              <div key={phase.key} className={`phase-item ${status}`}>
                <div className="phase-header">
                  <span className="phase-name">{phase.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {phaseData && phaseData.start_date && status !== 'pending' && (
                      <button
                        onClick={() => handlePhaseComplete(phase)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: '500',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          backgroundColor: phaseData.completed ? '#43A047' : '#e0e0e0',
                          color: phaseData.completed ? 'white' : '#666'
                        }}
                        onMouseEnter={(e) => {
                          if (!phaseData.completed) {
                            e.target.style.backgroundColor = '#bdbdbd';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!phaseData.completed) {
                            e.target.style.backgroundColor = '#e0e0e0';
                          }
                        }}
                      >
                        {phaseData.completed ? '완료됨' : '완료'}
                      </button>
                    )}
                    <span 
                      className="phase-status"
                      style={{ backgroundColor: statusColors[status] }}
                    >
                      {status === 'completed' ? '✓' : 
                       status === 'in_progress' ? '●' :
                       status === 'delayed' ? '!' : '○'}
                    </span>
                  </div>
                </div>
                {phaseData && phaseData.start_date && (
                  <div className="phase-dates">
                    <span className="date-range">
                      {moment(phaseData.start_date).format('MM/DD')} - 
                      {moment(phaseData.end_date).format('MM/DD')}
                    </span>
                    {status === 'delayed' && (
                      <span className="delay-days">
                        ({moment().diff(moment(phaseData.end_date), 'days')}일 지연)
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
    </div>
  )
}