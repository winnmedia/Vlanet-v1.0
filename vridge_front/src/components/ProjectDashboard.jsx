import React, { useState, useEffect, useMemo } from 'react'
import styles from './ProjectDashboard.module.scss'
import { useRouter } from '../util/nextNavigation'
import moment from 'moment'
import 'moment/locale/ko'
import { Progress, Tag, Tooltip } from 'antd'
import { 
  CalendarOutlined, 
  TeamOutlined, 
  FolderOutlined,
  FolderOpenOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'

export default function ProjectDashboard({ projects }) {
  const { navigate } = useRouter()
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
    <div className={styles.projectCards}>
      {filteredProjects.map(project => (
        <div 
          key={project.id} 
          className={`${styles.projectCard} ${styles[project.status]}`}
          onClick={() => navigate(`/ProjectView/${project.id}`)}
        >
          <div className={styles.cardHeader}>
            <h3 style={{ borderLeft: `4px solid ${project.color}`, paddingLeft: '12px' }}>
              {project.name}
            </h3>
            {getStatusTag(project.status)}
          </div>
          
          <div className={styles.cardBody}>
            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <span>진행률</span>
                <span>{project.progress.toFixed(0)}%</span>
              </div>
              <Progress 
                percent={project.progress} 
                strokeColor={project.isDelayed ? '#ff4d4f' : project.color}
                showInfo={false}
              />
              {project.currentPhase && (
                <div className={styles.currentPhase}>
                  현재: {phaseNames[project.currentPhase]}
                </div>
              )}
            </div>
            
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <CalendarOutlined />
                <span>
                  {project.daysUntilDeadline > 0 
                    ? `D-${project.daysUntilDeadline}` 
                    : project.daysUntilDeadline === 0 
                    ? 'D-Day' 
                    : `D+${Math.abs(project.daysUntilDeadline)}`}
                </span>
              </div>
              <div className={styles.infoItem}>
                <TeamOutlined />
                <span>{project.member_list?.length || 0}명</span>
              </div>
              <div className={styles.infoItem}>
                <FolderOutlined />
                <span>{project.files?.length || 0}개</span>
              </div>
            </div>
            
            <div className={styles.cardFooter}>
              <div className={styles.customer}>고객사: {project.consumer}</div>
              <div className={styles.manager}>담당자: {project.manager}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
  
  const renderListView = () => (
    <div className={styles.projectList}>
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
              className={styles[project.status]}
            >
              <td>
                <div className={styles.projectName} style={{ borderLeft: `4px solid ${project.color}` }}>
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
      <div className={styles.kanbanView}>
        {Object.entries(columns).map(([key, col]) => (
          <div key={key} className={styles.kanbanColumn}>
            <div className={styles.columnHeader}>
              <h3>{col.title}</h3>
              <span className={styles.count}>{kanbanData[key]?.length || 0}</span>
            </div>
            <div className={styles.columnBody}>
              {kanbanData[key]?.map(project => (
                <div 
                  key={project.id} 
                  className={`${styles.kanbanCard} ${styles[project.status]}`}
                  onClick={() => navigate(`/ProjectView/${project.id}`)}
                  style={{ borderTop: `3px solid ${project.color}` }}
                >
                  <h4>{project.name}</h4>
                  <div className={styles.kanbanInfo}>
                    <Progress 
                      percent={project.progress} 
                      size="small" 
                      strokeColor={project.isDelayed ? '#ff4d4f' : project.color}
                    />
                    <div className={styles.meta}>
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
  
  // 프로젝트가 없을 때 빈 상태 표시
  if (!projects || projects.length === 0) {
    return (
      <div className={styles.projectDashboard}>
        <div className={styles.emptyState}>
          <FolderOpenOutlined style={{ fontSize: 48, color: '#bfbfbf', marginBottom: 16 }} />
          <h3>프로젝트가 없습니다</h3>
          <p>새 프로젝트를 생성하여 시작해보세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.projectDashboard}>
      <div className={styles.dashboardHeader}>
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.total}`}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>전체 프로젝트</div>
          </div>
          <div className={`${styles.statCard} ${styles.active}`}>
            <div className={styles.statValue}>{stats.active}</div>
            <div className={styles.statLabel}>진행중</div>
          </div>
          <div className={`${styles.statCard} ${styles.delayed}`}>
            <div className={styles.statValue}>{stats.delayed}</div>
            <div className={styles.statLabel}>지연</div>
          </div>
          <div className={`${styles.statCard} ${styles.completed}`}>
            <div className={styles.statValue}>{stats.completed}</div>
            <div className={styles.statLabel}>완료</div>
          </div>
          <div className={`${styles.statCard} ${styles.average}`}>
            <div className={styles.statValue}>{stats.avgProgress.toFixed(0)}%</div>
            <div className={styles.statLabel}>평균 진행률</div>
          </div>
        </div>
      </div>
      
      <div className={styles.dashboardControls}>
        <div className={styles.filterControls}>
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
        
        <div className={styles.viewControls}>
          <button 
            className={viewMode === 'card' ? styles.active : ''} 
            onClick={() => setViewMode('card')}
          >
            카드
          </button>
          <button 
            className={viewMode === 'list' ? styles.active : ''} 
            onClick={() => setViewMode('list')}
          >
            리스트
          </button>
          <button 
            className={viewMode === 'kanban' ? styles.active : ''} 
            onClick={() => setViewMode('kanban')}
          >
            칸반
          </button>
        </div>
      </div>
      
      <div className={styles.dashboardContent}>
        {viewMode === 'card' && renderCardView()}
        {viewMode === 'list' && renderListView()}
        {viewMode === 'kanban' && renderKanbanView()}
      </div>
    </div>
  )
}