import React, { useState, useEffect, useMemo } from 'react'
import './ProjectDashboard.scss'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import 'moment/locale/ko'
import { Progress, Tag, Tooltip } from 'antd'
import { 
  CalendarOutlined, 
  TeamOutlined, 
  FolderOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'

export default function ProjectDashboard({ projects }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all') // all, active, delayed, completed
  const [sortBy, setSortBy] = useState('deadline') // deadline, name, progress
  const [viewMode, setViewMode] = useState('card') // card, list, kanban
  
  // Calculate project metrics
  const projectMetrics = useMemo(() => {
    const now = moment()
    
    return projects.map(project => {
      const phases = [
        'basic_plan', 'story_board', 'filming', 'video_edit',
        'post_work', 'video_preview', 'confirmation', 'video_delivery'
      ]
      
      // Calculate progress
      let completedPhases = 0
      let currentPhase = null
      let isDelayed = false
      
      phases.forEach(phase => {
        if (project[phase] && project[phase].end_date) {
          const endDate = moment(project[phase].end_date)
          if (endDate.isBefore(now)) {
            completedPhases++
          } else if (!currentPhase) {
            currentPhase = phase
            // Check if current phase is delayed
            if (project[phase].start_date && moment(project[phase].start_date).isBefore(now)) {
              const plannedDuration = endDate.diff(moment(project[phase].start_date), 'days')
              const actualDuration = now.diff(moment(project[phase].start_date), 'days')
              if (actualDuration > plannedDuration * 0.8) {
                isDelayed = true
              }
            }
          }
        }
      })
      
      const progress = (completedPhases / phases.length) * 100
      const deadline = project.video_delivery?.end_date || project.end_date
      const daysUntilDeadline = moment(deadline).diff(now, 'days')
      
      return {
        ...project,
        progress,
        completedPhases,
        currentPhase,
        isDelayed,
        daysUntilDeadline,
        status: progress === 100 ? 'completed' : (isDelayed ? 'delayed' : 'active')
      }
    })
  }, [projects])
  
  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projectMetrics
    
    if (filter !== 'all') {
      filtered = filtered.filter(p => p.status === filter)
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return a.daysUntilDeadline - b.daysUntilDeadline
        case 'name':
          return a.name.localeCompare(b.name)
        case 'progress':
          return b.progress - a.progress
        default:
          return 0
      }
    })
  }, [projectMetrics, filter, sortBy])
  
  // Statistics
  const stats = useMemo(() => {
    const total = projectMetrics.length
    const active = projectMetrics.filter(p => p.status === 'active').length
    const delayed = projectMetrics.filter(p => p.status === 'delayed').length
    const completed = projectMetrics.filter(p => p.status === 'completed').length
    const avgProgress = projectMetrics.reduce((sum, p) => sum + p.progress, 0) / total || 0
    
    return { total, active, delayed, completed, avgProgress }
  }, [projectMetrics])
  
  const phaseNames = {
    basic_plan: '기초기획안',
    story_board: '스토리보드',
    filming: '촬영',
    video_edit: '편집',
    post_work: '후반작업',
    video_preview: '시사',
    confirmation: '컨펌',
    video_delivery: '납품'
  }
  
  const getStatusTag = (status) => {
    switch (status) {
      case 'completed':
        return <Tag color="success" icon={<CheckCircleOutlined />}>완료</Tag>
      case 'delayed':
        return <Tag color="error" icon={<ExclamationCircleOutlined />}>지연</Tag>
      case 'active':
        return <Tag color="processing" icon={<ClockCircleOutlined />}>진행중</Tag>
      default:
        return null
    }
  }
  
  const renderCardView = () => (
    <div className="project-cards">
      {filteredProjects.map(project => (
        <div 
          key={project.id} 
          className={`project-card ${project.status}`}
          onClick={() => navigate(`/ProjectView/${project.id}`)}
        >
          <div className="card-header">
            <h3 style={{ borderLeft: `4px solid ${project.color}`, paddingLeft: '12px' }}>
              {project.name}
            </h3>
            {getStatusTag(project.status)}
          </div>
          
          <div className="card-body">
            <div className="progress-section">
              <div className="progress-header">
                <span>진행률</span>
                <span>{project.progress.toFixed(0)}%</span>
              </div>
              <Progress 
                percent={project.progress} 
                strokeColor={project.isDelayed ? '#ff4d4f' : project.color}
                showInfo={false}
              />
              {project.currentPhase && (
                <div className="current-phase">
                  현재: {phaseNames[project.currentPhase]}
                </div>
              )}
            </div>
            
            <div className="info-grid">
              <div className="info-item">
                <CalendarOutlined />
                <span>
                  {project.daysUntilDeadline > 0 
                    ? `D-${project.daysUntilDeadline}` 
                    : project.daysUntilDeadline === 0 
                    ? 'D-Day' 
                    : `D+${Math.abs(project.daysUntilDeadline)}`}
                </span>
              </div>
              <div className="info-item">
                <TeamOutlined />
                <span>{project.member_list?.length || 0}명</span>
              </div>
              <div className="info-item">
                <FolderOutlined />
                <span>{project.files?.length || 0}개</span>
              </div>
            </div>
            
            <div className="card-footer">
              <div className="customer">고객사: {project.consumer}</div>
              <div className="manager">담당자: {project.manager}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
  
  const renderListView = () => (
    <div className="project-list">
      <table>
        <thead>
          <tr>
            <th>프로젝트명</th>
            <th>상태</th>
            <th>진행률</th>
            <th>현재 단계</th>
            <th>마감일</th>
            <th>담당자</th>
            <th>고객사</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map(project => (
            <tr 
              key={project.id} 
              onClick={() => navigate(`/ProjectView/${project.id}`)}
              className={project.status}
            >
              <td>
                <div className="project-name" style={{ borderLeft: `4px solid ${project.color}` }}>
                  {project.name}
                </div>
              </td>
              <td>{getStatusTag(project.status)}</td>
              <td>
                <Progress 
                  percent={project.progress} 
                  size="small" 
                  strokeColor={project.isDelayed ? '#ff4d4f' : project.color}
                />
              </td>
              <td>{project.currentPhase ? phaseNames[project.currentPhase] : '-'}</td>
              <td>
                <Tooltip title={moment(project.end_date).format('YYYY-MM-DD')}>
                  {project.daysUntilDeadline > 0 
                    ? `D-${project.daysUntilDeadline}` 
                    : project.daysUntilDeadline === 0 
                    ? 'D-Day' 
                    : `D+${Math.abs(project.daysUntilDeadline)}`}
                </Tooltip>
              </td>
              <td>{project.manager}</td>
              <td>{project.consumer}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
  
  const renderKanbanView = () => {
    const columns = {
      planning: { title: '기획', phases: ['basic_plan', 'story_board'] },
      production: { title: '제작', phases: ['filming', 'video_edit', 'post_work'] },
      review: { title: '검토', phases: ['video_preview', 'confirmation'] },
      complete: { title: '완료', phases: ['video_delivery'] }
    }
    
    const getProjectColumn = (project) => {
      if (project.progress === 100) return 'complete'
      if (project.currentPhase) {
        for (const [key, col] of Object.entries(columns)) {
          if (col.phases.includes(project.currentPhase)) return key
        }
      }
      return 'planning'
    }
    
    const kanbanData = Object.keys(columns).reduce((acc, col) => {
      acc[col] = filteredProjects.filter(p => getProjectColumn(p) === col)
      return acc
    }, {})
    
    return (
      <div className="kanban-view">
        {Object.entries(columns).map(([key, col]) => (
          <div key={key} className="kanban-column">
            <div className="column-header">
              <h3>{col.title}</h3>
              <span className="count">{kanbanData[key]?.length || 0}</span>
            </div>
            <div className="column-body">
              {kanbanData[key]?.map(project => (
                <div 
                  key={project.id} 
                  className={`kanban-card ${project.status}`}
                  onClick={() => navigate(`/ProjectView/${project.id}`)}
                  style={{ borderTop: `3px solid ${project.color}` }}
                >
                  <h4>{project.name}</h4>
                  <div className="kanban-info">
                    <Progress 
                      percent={project.progress} 
                      size="small" 
                      strokeColor={project.isDelayed ? '#ff4d4f' : project.color}
                    />
                    <div className="meta">
                      <span>{project.manager}</span>
                      <span>
                        {project.daysUntilDeadline > 0 
                          ? `D-${project.daysUntilDeadline}` 
                          : project.daysUntilDeadline === 0 
                          ? 'D-Day' 
                          : `D+${Math.abs(project.daysUntilDeadline)}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <div className="project-dashboard">
      <div className="dashboard-header">
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">전체 프로젝트</div>
          </div>
          <div className="stat-card active">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">진행중</div>
          </div>
          <div className="stat-card delayed">
            <div className="stat-value">{stats.delayed}</div>
            <div className="stat-label">지연</div>
          </div>
          <div className="stat-card completed">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">완료</div>
          </div>
          <div className="stat-card average">
            <div className="stat-value">{stats.avgProgress.toFixed(0)}%</div>
            <div className="stat-label">평균 진행률</div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-controls">
        <div className="filter-controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">모든 프로젝트</option>
            <option value="active">진행중</option>
            <option value="delayed">지연</option>
            <option value="completed">완료</option>
          </select>
          
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="deadline">마감일순</option>
            <option value="name">이름순</option>
            <option value="progress">진행률순</option>
          </select>
        </div>
        
        <div className="view-controls">
          <button 
            className={viewMode === 'card' ? 'active' : ''} 
            onClick={() => setViewMode('card')}
          >
            카드
          </button>
          <button 
            className={viewMode === 'list' ? 'active' : ''} 
            onClick={() => setViewMode('list')}
          >
            리스트
          </button>
          <button 
            className={viewMode === 'kanban' ? 'active' : ''} 
            onClick={() => setViewMode('kanban')}
          >
            칸반
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        {viewMode === 'card' && renderCardView()}
        {viewMode === 'list' && renderListView()}
        {viewMode === 'kanban' && renderKanbanView()}
      </div>
    </div>
  )
}