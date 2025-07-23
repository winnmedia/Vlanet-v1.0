import React, { useState, useEffect } from 'react'
import { useRouter } from '../../util/nextNavigation'
import { useSelector } from 'react-redux'
import classNames from 'classnames'
import Badge from '../ui/Badge'

export default function EnhancedSidebar({ activeTab, activeMenu }) {
  const { navigate } = useRouter()
  const { project_list, user } = useSelector((s) => s.ProjectStore)
  const [collapsed, setCollapsed] = useState(false)
  const [expandedProjects, setExpandedProjects] = useState(true)
  
  // 활성 프로젝트 수 계산
  const activeProjectCount = project_list?.filter(p => !p.completed)?.length || 0
  
  const menuItems = [
    {
      id: 'home',
      label: '대시보드',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
      path: '/cmshome',
      badge: null
    },
    {
      id: 'calendar',
      label: '전체 일정',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
      path: '/calendar',
      badge: null
    },
    {
      id: 'planning',
      label: '영상 기획',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
        </svg>
      ),
      path: '/videoplanning',
      badge: 'AI',
      badgeVariant: 'info'
    },
    {
      id: 'create',
      label: '프로젝트 생성',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      ),
      path: '/project/create',
      badge: null
    }
  ]
  
  const bottomMenuItems = [
    {
      id: 'mypage',
      label: '마이페이지',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      path: '/mypage',
      badge: null
    }
  ]
  
  const handleNavigation = (path) => {
    navigate(path)
  }
  
  const handleProjectClick = (projectId) => {
    navigate(`/feedback/${projectId}`)
  }
  
  return (
    <aside className={classNames('enhanced-sidebar', { collapsed })}>
      {/* 로고 영역 */}
      <div className="sidebar-header">
        <div className="logo-wrapper" onClick={() => navigate('/cmshome')}>
          <img src="/images/logo.svg" alt="VideoPlanet" className="logo" />
          {!collapsed && <span className="logo-text">VideoPlanet</span>}
        </div>
        <button 
          className="collapse-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed ? (
              <polyline points="9 18 15 12 9 6"></polyline>
            ) : (
              <polyline points="15 18 9 12 15 6"></polyline>
            )}
          </svg>
        </button>
      </div>
      
      {/* 메인 메뉴 */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map(item => (
            <li key={item.id}>
              <button
                className={classNames('nav-item', { active: activeTab === item.id })}
                onClick={() => handleNavigation(item.path)}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    {item.badge && (
                      <Badge variant={item.badgeVariant || 'primary'} size="sm">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* 프로젝트 섹션 */}
      <div className="sidebar-projects">
        <div className="projects-header">
          {!collapsed && (
            <>
              <h3 className="projects-title">프로젝트</h3>
              <Badge variant="light" size="sm">{activeProjectCount}</Badge>
            </>
          )}
          <button
            className="projects-toggle"
            onClick={() => setExpandedProjects(!expandedProjects)}
            title={expandedProjects ? '프로젝트 접기' : '프로젝트 펼치기'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points={expandedProjects ? "6 9 12 15 18 9" : "9 18 15 12 9 6"}></polyline>
            </svg>
          </button>
        </div>
        
        {expandedProjects && !collapsed && (
          <ul className="projects-list">
            {project_list?.slice(0, 5).map(project => (
              <li key={project.id}>
                <button
                  className={classNames('project-item', { active: activeMenu === project.id })}
                  onClick={() => handleProjectClick(project.id)}
                >
                  <span 
                    className="project-color" 
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="project-name">{project.name}</span>
                  {project.feedback_count > 0 && (
                    <Badge variant="primary" size="sm">
                      {project.feedback_count}
                    </Badge>
                  )}
                </button>
              </li>
            ))}
            {project_list?.length > 5 && (
              <li>
                <button 
                  className="view-all-projects"
                  onClick={() => navigate('/projects')}
                >
                  모든 프로젝트 보기
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
      
      {/* 하단 메뉴 */}
      <div className="sidebar-footer">
        <ul className="nav-list">
          {bottomMenuItems.map(item => (
            <li key={item.id}>
              <button
                className={classNames('nav-item', { active: activeTab === item.id })}
                onClick={() => handleNavigation(item.path)}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
        
        {/* 사용자 정보 */}
        {user && !collapsed && (
          <div className="user-info">
            <div className="user-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}