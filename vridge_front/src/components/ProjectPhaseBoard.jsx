import React, { useState, useMemo, useEffect } from 'react'
import './ProjectPhaseBoard.scss'
import moment from 'moment'
import 'moment/locale/ko'

export default function ProjectPhaseBoard({ projects, onPhaseUpdate }) {
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
    { key: 'basic_plan', name: '기초기획안', icon: '📋' },
    { key: 'story_board', name: '스토리보드', icon: '🎬' },
    { key: 'filming', name: '촬영', icon: '📹' },
    { key: 'video_edit', name: '편집', icon: '✂️' },
    { key: 'post_work', name: '후반작업', icon: '🎨' },
    { key: 'video_preview', name: '시사', icon: '👁️' },
    { key: 'confirmation', name: '컨펌', icon: '✅' },
    { key: 'video_delivery', name: '납품', icon: '📦' }
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
    <div className="project-phase-board">
      <div className="board-header">
        <h3>프로젝트 진행 현황</h3>
        <div className="status-legend">
          {Object.entries(statusNames).map(([key, name]) => (
            <div key={key} className="legend-item">
              <span 
                className="status-dot" 
                style={{ backgroundColor: statusColors[key] }}
              />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="project-sections">
        {/* 진행중인 프로젝트 */}
        {projectsByStatus.active.length > 0 && (
          <div className="project-section">
            <h4 className="section-title">
              <span className="icon">🚀</span>
              진행중 ({projectsByStatus.active.length})
            </h4>
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
              <span className="icon">⚠️</span>
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
              <span className="icon">✅</span>
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
    </div>
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
                  <span className="phase-icon">{phase.icon}</span>
                  <span className="phase-name">{phase.name}</span>
                  <span 
                    className="phase-status"
                    style={{ backgroundColor: statusColors[status] }}
                  >
                    {status === 'completed' ? '✓' : 
                     status === 'in_progress' ? '●' :
                     status === 'delayed' ? '!' : '○'}
                  </span>
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