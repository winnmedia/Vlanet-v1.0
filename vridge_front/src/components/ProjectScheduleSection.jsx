import React, { useState, useMemo } from 'react'
import moment from 'moment'
import 'moment/locale/ko'
import styles from './ProjectScheduleSection.module.scss'

moment.locale('ko')

export default function ProjectScheduleSection({ projects }) {
  const [viewMode, setViewMode] = useState('week') // week, month
  const [selectedDate, setSelectedDate] = useState(moment())
  
  // 향후 7일/30일 내 마감 예정인 프로젝트 및 단계 계산
  const upcomingDeadlines = useMemo(() => {
    const deadlines = []
    const endDate = viewMode === 'week' 
      ? moment().add(7, 'days') 
      : moment().add(30, 'days')
    
    projects?.forEach(project => {
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
      
      phases.forEach(phase => {
        const phaseData = project[phase.key]
        if (phaseData && phaseData.end_date && !phaseData.completed) {
          const phaseDueDate = moment(phaseData.end_date)
          
          // 기간 내 마감인 경우
          if (phaseDueDate.isBetween(moment(), endDate)) {
            deadlines.push({
              projectId: project.id,
              projectName: project.name,
              projectColor: project.color,
              phase: phase.name,
              phaseKey: phase.key,
              dueDate: phaseDueDate,
              daysRemaining: phaseDueDate.diff(moment(), 'days'),
              hoursRemaining: phaseDueDate.diff(moment(), 'hours'),
              isToday: phaseDueDate.isSame(moment(), 'day'),
              isTomorrow: phaseDueDate.isSame(moment().add(1, 'day'), 'day'),
              isOverdue: phaseDueDate.isBefore(moment()),
              isUrgent: phaseDueDate.diff(moment(), 'hours') <= 48
            })
          }
        }
      })
    })
    
    // 날짜순 정렬 (가까운 것부터)
    return deadlines.sort((a, b) => a.dueDate - b.dueDate)
  }, [projects, viewMode])
  
  // 오늘의 일정
  const todaySchedule = useMemo(() => {
    return upcomingDeadlines.filter(item => item.isToday)
  }, [upcomingDeadlines])
  
  // 지연된 일정
  const overdueSchedule = useMemo(() => {
    const overdue = []
    
    projects?.forEach(project => {
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
      
      phases.forEach(phase => {
        const phaseData = project[phase.key]
        if (phaseData && phaseData.end_date && !phaseData.completed) {
          const phaseDueDate = moment(phaseData.end_date)
          
          if (phaseDueDate.isBefore(moment())) {
            overdue.push({
              projectId: project.id,
              projectName: project.name,
              projectColor: project.color,
              phase: phase.name,
              phaseKey: phase.key,
              dueDate: phaseDueDate,
              daysOverdue: moment().diff(phaseDueDate, 'days'),
              hoursOverdue: moment().diff(phaseDueDate, 'hours')
            })
          }
        }
      })
    })
    
    return overdue.sort((a, b) => b.daysOverdue - a.daysOverdue)
  }, [projects])
  
  const getDeadlineStyle = (item) => {
    if (item.isOverdue) return styles.overdue
    if (item.isToday) return styles.today
    if (item.isTomorrow) return styles.tomorrow
    if (item.isUrgent) return styles.urgent
    return styles.normal
  }
  
  return (
    <div className={styles['project-schedule-section']}>
      <div className={styles['schedule-header']}>
        <h3 className={styles['section-title']}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          프로젝트 일정
        </h3>
        
        <div className={styles['view-controls']}>
          <button 
            className={`${styles['view-btn']} ${viewMode === 'week' ? styles.active : ''}`}
            onClick={() => setViewMode('week')}
          >
            주간
          </button>
          <button 
            className={`${styles['view-btn']} ${viewMode === 'month' ? styles.active : ''}`}
            onClick={() => setViewMode('month')}
          >
            월간
          </button>
        </div>
      </div>
      
      {/* 지연된 일정 (최우선 표시) */}
      {overdueSchedule.length > 0 && (
        <div className={`${styles['schedule-alert']} ${styles['overdue-alert']}`}>
          <div className={styles['alert-header']}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span className={styles['alert-title']}>지연된 일정 ({overdueSchedule.length})</span>
          </div>
          <div className={styles['deadline-list']}>
            {overdueSchedule.slice(0, 3).map((item, idx) => (
              <div key={`overdue-${idx}`} className={`${styles['deadline-item']} ${styles.overdue}`}>
                <div className={styles['deadline-info']}>
                  <div className={styles['project-indicator']} style={{ backgroundColor: item.projectColor }}></div>
                  <div className={styles['deadline-details']}>
                    <div className={styles['project-name']}>{item.projectName}</div>
                    <div className={styles['phase-name']}>{item.phase}</div>
                  </div>
                </div>
                <div className={styles['deadline-status']}>
                  <span className={styles['overdue-days']}>{item.daysOverdue}일 지연</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 오늘의 일정 */}
      {todaySchedule.length > 0 && (
        <div className={`${styles['schedule-alert']} ${styles['today-alert']}`}>
          <div className={styles['alert-header']}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span className={styles['alert-title']}>오늘 마감 ({todaySchedule.length})</span>
          </div>
          <div className={styles['deadline-list']}>
            {todaySchedule.map((item, idx) => (
              <div key={`today-${idx}`} className={`${styles['deadline-item']} ${styles.today}`}>
                <div className={styles['deadline-info']}>
                  <div className={styles['project-indicator']} style={{ backgroundColor: item.projectColor }}></div>
                  <div className={styles['deadline-details']}>
                    <div className={styles['project-name']}>{item.projectName}</div>
                    <div className={styles['phase-name']}>{item.phase}</div>
                  </div>
                </div>
                <div className={styles['deadline-status']}>
                  <span className={styles['deadline-time']}>
                    {item.dueDate.format('HH:mm')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 예정된 일정 */}
      <div className={styles['upcoming-deadlines']}>
        <div className={styles['deadlines-header']}>
          <h4>다가오는 마감일</h4>
          <span className={styles['deadline-count']}>
            {viewMode === 'week' ? '7일' : '30일'} 내 {upcomingDeadlines.length}개
          </span>
        </div>
        
        <div className={styles['deadline-timeline']}>
          {upcomingDeadlines.length > 0 ? (
            upcomingDeadlines.slice(0, 5).map((item, idx) => (
              <div 
                key={`upcoming-${idx}`} 
                className={`${styles['deadline-item']} ${getDeadlineStyle(item)}`}
              >
                <div className={styles['deadline-date']}>
                  <div className={styles['date-day']}>{item.dueDate.format('DD')}</div>
                  <div className={styles['date-month']}>{item.dueDate.format('MMM')}</div>
                </div>
                
                <div className={styles['deadline-info']}>
                  <div className={styles['project-indicator']} style={{ backgroundColor: item.projectColor }}></div>
                  <div className={styles['deadline-details']}>
                    <div className={styles['project-name']}>{item.projectName}</div>
                    <div className={styles['phase-name']}>{item.phase}</div>
                  </div>
                </div>
                
                <div className={styles['deadline-status']}>
                  {item.isToday && <span className={`${styles['status-badge']} ${styles.today}`}>오늘</span>}
                  {item.isTomorrow && <span className={`${styles['status-badge']} ${styles.tomorrow}`}>내일</span>}
                  {item.isUrgent && !item.isToday && !item.isTomorrow && (
                    <span className={`${styles['status-badge']} ${styles.urgent}`}>긴급</span>
                  )}
                  {!item.isUrgent && !item.isToday && !item.isTomorrow && (
                    <span className={styles['days-remaining']}>D-{item.daysRemaining}</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className={styles['no-deadlines']}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 12h18m-9-9v18"/>
              </svg>
              <p>{viewMode === 'week' ? '이번 주' : '이번 달'} 예정된 마감일이 없습니다</p>
            </div>
          )}
        </div>
        
        {upcomingDeadlines.length > 5 && (
          <div className={styles['view-all-link']}>
            <a href="/calendar">전체 일정 보기 →</a>
          </div>
        )}
      </div>
    </div>
  )
}