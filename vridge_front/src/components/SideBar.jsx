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
  const [isAdmin, setIsAdmin] = useState(false)
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

  // 관리자 권한 확인 (임시 비활성화)
  useEffect(() => {
    // TODO: 백엔드 API 연동 후 활성화
    // const checkAdminStatus = async () => {
    //   if (checkSession()) {
    //     try {
    //       const response = await axios.get('/users/profile')
    //       if (response.data.status === 'success' && response.data.profile.is_staff) {
    //         setIsAdmin(true)
    //       }
    //     } catch (error) {
    //       console.error('Failed to check admin status:', error)
    //     }
    //   }
    // }
    // checkAdminStatus()
    setIsAdmin(false) // 임시로 false 설정
  }, [user])

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
    } else if (path === '/MyPage') {
      // 마이페이지로 이동 시 서브메뉴 닫기
      SetSubMenu(false)
    }
  }, [path])

  // 경로 변경 시 서브메뉴 닫기 (홈, 전체 일정, 마이페이지로 이동 시)
  useEffect(() => {
    if (path === '/CmsHome' || path === '/Calendar' || path === '/MyPage') {
      SetSubMenu(false)
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
              className={cx({ active: path === '/VideoPlanning' && !SubMenu })}
              onClick={() => {
                SetSubMenu(false)
                navigate('/VideoPlanning')
              }}
            >
              영상 기획
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
              <span>{project_list ? project_list.length : 0}</span>
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
            {isAdmin && (
              <li
                className={cx({ active: path === '/AdminDashboard' && !SubMenu })}
                onClick={() => {
                  SetSubMenu(false)
                  navigate('/AdminDashboard')
                }}
              >
                관리자
              </li>
            )}
          </ul>
        </nav>
        <div
          className={cx('mypage', { active: path === '/MyPage' })}
          onClick={() => {
            SetSubMenu(false)
            navigate('/MyPage')
          }}
        >
          마이페이지
        </div>
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
