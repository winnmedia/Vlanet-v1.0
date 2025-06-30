import './SideBar.scss'
import cx from 'classnames'
import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { checkSession } from 'util/util'

export default function SideBar({ tab, on_menu }) {
  const navigate = useNavigate()
  const path = useLocation().pathname
  const { project_list, user } = useSelector((s) => s.ProjectStore)
  const [SubMenu, SetSubMenu] = useState(false)
  const [tab_name, set_tab_name] = useState('')
  const [SortProject, SetSortProject] = useState([])
  const submenuRef = useRef(null)
  const sidebarRef = useRef(null)

  useEffect(() => {
    if (project_list) {
      const projects = [...project_list]
      projects.sort((a, b) => {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
      })
      // projects.sort((a, b) => {
      //   return new Date(b.created) - new Date(a.created)
      // })
      SetSortProject(projects)
    }
  }, [project_list])

  useEffect(() => {
    if (on_menu === true) {
      SetSubMenu(true)
    } else {
      SetSubMenu(false)
    }
    set_tab_name(tab)
  }, [on_menu, tab])
  
  // 경로에 따라 tab_name 설정
  useEffect(() => {
    if (path.includes('/Feedback')) {
      set_tab_name('feedback')
    } else if (path.includes('/ProjectView') || path.includes('/ProjectEdit') || path.includes('/ProjectCreate')) {
      set_tab_name('project')
    }
  }, [path])

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event) {
      if (SubMenu && 
          submenuRef.current && 
          !submenuRef.current.contains(event.target) &&
          sidebarRef.current &&
          !sidebarRef.current.contains(event.target)) {
        SetSubMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [SubMenu])

  return (
    <>
      <aside className="SideBar" ref={sidebarRef}>
        <nav>
          <ul>
            <li
              className={cx({ active: path === '/CmsHome' && !SubMenu })}
              onClick={() => {
                SetSubMenu(false)
                navigate('/CmsHome')
              }}
            >
              홈
            </li>
            <li
              className={cx({ active: path === '/Calendar' && !SubMenu })}
              onClick={() => {
                SetSubMenu(false)
                navigate('/Calendar')
              }}
            >
              전체 일정
            </li>
            <li
              className={cx('menu_project', {
                active:
                  path.includes('/ProjectView') ||
                  (SubMenu && tab_name === 'project'),
              })}
              onClick={() => {
                if (tab_name === 'feedback') {
                  SetSubMenu(true)
                } else {
                  SetSubMenu(!SubMenu)
                }
                set_tab_name('project')
                // navigate('/ProjectView')
              }}
            >
              프로젝트 관리
              <span>{project_list.length}</span>
            </li>
            <li
              className={cx({
                active:
                  path.includes('/Feedback') ||
                  (SubMenu && tab_name === 'feedback'),
              })}
              onClick={() => {
                if (tab_name === 'project') {
                  SetSubMenu(true)
                } else {
                  SetSubMenu(!SubMenu)
                }
                set_tab_name('feedback')
                // navigate('/Feedback')
              }}
            >
              영상 피드백
            </li>
            <li
              className={cx({ active: path === '/Elearning' && !SubMenu })}
              onClick={() => {
                SetSubMenu(false)
                navigate('/Elearning')
              }}
            >
              콘텐츠
            </li>
          </ul>
        </nav>
        <div
          className="logout"
          onClick={() => {
            if (checkSession()) {
              window.localStorage.removeItem('VGID')
            }
            navigate('/login', { replace: true })
          }}
        >
          로그아웃
        </div>
      </aside>

      <div 
        ref={submenuRef}
        className={SubMenu ? 'Submenu active' : 'Submenu'}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="etc">
          <div className="ss_title">
            {tab_name === 'feedback' ? '영상 피드백' : '프로젝트 관리'}
          </div>
          <ul>
            {tab_name === 'project' && SortProject.length > 0 && (
              <li 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/ProjectCreate');
                }} 
                className="plus"
              >
                +
              </li>
            )}
            <li 
              onClick={(e) => {
                e.stopPropagation();
                SetSubMenu(false);
              }} 
              className="close"
            >
              x
            </li>
          </ul>
        </div>
        {/* 2차메뉴 있을때 */}
        <nav>
          <ul>
            {SortProject.map((item, index) => (
              <li
                onClick={(e) => {
                  e.stopPropagation();
                  if (tab_name === 'project') {
                    navigate(`/ProjectView/${item.id}`)
                  } else {
                    navigate(`/Feedback/${item.id}`)
                  }
                  SetSubMenu(false);
                }}
                key={index}
              >
                {item.name}
              </li>
            ))}
          </ul>
        </nav>
        {/* 2차메뉴 없을때 */}
        {SortProject.length === 0 && (
          <div className="empty">
            등록된 <br />
            프로젝트가 없습니다
            <button
              onClick={() => navigate('/ProjectCreate')}
              className="submit"
            >
              프로젝트 등록
            </button>
          </div>
        )}
      </div>
    </>
  )
}
React.memo(SideBar)
