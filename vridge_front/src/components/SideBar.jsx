
import styles from './SideBar.module.scss';
import cx from 'classnames';
import React, { useEffect, useState, useMemo, useRef, useCallback, memo } from 'react';
import { useRouter, useLocation } from '../util/nextNavigation';
import { useSelector } from 'react-redux';
import { checkSession } from '../util/util';
import { Button } from './unified/Button';

const SideBar = memo(function SideBar({ tab, on_menu }) {
  const { navigate } = useRouter();
  const path = useLocation().pathname;
  const { project_list, user } = useSelector((s) => s.ProjectStore);
  const [SubMenu, SetSubMenu] = useState(false);
  const [tab_name, set_tab_name] = useState('');
  const [SortProject, SetSortProject] = useState([]);
  const submenuRef = useRef(null);
  const sidebarRef = useRef(null);

  const sortedProjects = useMemo(() => {
    if (project_list) {
      const projects = [...project_list];
      projects.sort((a, b) => {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
      });
      return projects;
    }
    return [];
  }, [project_list]);

  useEffect(() => {
    if (sortedProjects.length > 0) {
      SetSortProject(sortedProjects);

      // Project list updated
    } else {
      SetSortProject([]);
    }
  }, [sortedProjects]);

  useEffect(() => {
    if (on_menu === true) {
      SetSubMenu(true);
    } else {
      SetSubMenu(false);
    }
    set_tab_name(tab);
  }, [on_menu, tab]);

  // 경로에 따라 tab_name 설정
  useEffect(() => {
    if (path.includes('/Feedback')) {
      set_tab_name('feedback');
    } else if (path.includes('/ProjectView') || path.includes('/ProjectEdit') || path.includes('/ProjectCreate')) {
      set_tab_name('project');
    } else if (path === '/MyPage') {
      // 마이페이지로 이동 시 서브메뉴 닫기
      SetSubMenu(false);
    }
  }, [path]);

  // 경로 변경 시 서브메뉴 닫기 (홈, 전체 일정, 마이페이지로 이동 시)
  useEffect(() => {
    if (path === '/CmsHome' || path === '/Calendar' || path === '/MyPage') {
      SetSubMenu(false);
    }
  }, [path]);

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event) {
      if (SubMenu &&
      submenuRef.current &&
      !submenuRef.current.contains(event.target) &&
      sidebarRef.current &&
      !sidebarRef.current.contains(event.target)) {
        SetSubMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [SubMenu]);

  return (
    <>
      <aside className={styles.SideBar} ref={sidebarRef}>
        <nav aria-label="Main navigation">
          <ul>
            <li
              className={cx({ [styles.active]: path === '/CmsHome' && !SubMenu })}
              onClick={() => {
                SetSubMenu(false);
                navigate('/CmsHome');
              }} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  SetSubMenu(false);
                  navigate('/CmsHome');
                }
              }}>

              홈
            </li>
            <li
              className={cx({ [styles.active]: path === '/videoplanning' && !SubMenu })}
              onClick={() => {
                SetSubMenu(false);
                navigate('/videoplanning');
              }} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  SetSubMenu(false);
                  navigate('/videoplanning');
                }
              }}>

              영상 기획
            </li>
            <li
              className={cx({ [styles.active]: path === '/calendar' && !SubMenu })}
              onClick={() => {
                SetSubMenu(false);
                navigate('/calendar');
              }} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  SetSubMenu(false);
                  navigate('/calendar');
                }
              }}>

              전체 일정
            </li>
            <li
              className={cx(styles.menu_project, styles['has-toggle'], {
                [styles.active]:
                path.includes('/project') ||
                SubMenu && tab_name === 'project'
              })}
              onClick={() => {
                if (tab_name === 'feedback') {
                  SetSubMenu(true);
                } else {
                  SetSubMenu(!SubMenu);
                }
                set_tab_name('project');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (tab_name === 'feedback') {
                    SetSubMenu(true);
                  } else {
                    SetSubMenu(!SubMenu);
                  }
                  set_tab_name('project');
                }
              }}>

              프로젝트 관리 <span>{project_list ? project_list.length : 0}</span>
            </li>
            <li
              className={cx(styles['has-toggle'], {
                [styles.active]:
                path.includes('/feedback') ||
                SubMenu && tab_name === 'feedback'
              })}
              onClick={() => {
                if (tab_name === 'project') {
                  SetSubMenu(true);
                } else {
                  SetSubMenu(!SubMenu);
                }
                set_tab_name('feedback');
                // navigate('/Feedback')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (tab_name === 'project') {
                    SetSubMenu(true);
                  } else {
                    SetSubMenu(!SubMenu);
                  }
                  set_tab_name('feedback');
                }
              }}>

              영상 피드백
            </li>
          </ul>
        </nav>
        <div
          className={cx(styles.mypage, { [styles.active]: path === '/mypage' })}
          onClick={() => {
            SetSubMenu(false);
            navigate('/mypage');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              SetSubMenu(false);
              navigate('/mypage');
            }
          }}>

          마이페이지
        </div>
        <div
          className={styles.logout}
          onClick={() => {
            if (typeof window !== 'undefined') {
              // 로그아웃 처리
              localStorage.removeItem('VGID');
              localStorage.removeItem('token');
              localStorage.removeItem('userInfo');
              document.cookie = 'vridge_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

              // 로그인 페이지로 이동 (소문자로 통일)
              window.location.href = '/login';
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (typeof window !== 'undefined') {
                // 로그아웃 처리
                localStorage.removeItem('VGID');
                localStorage.removeItem('token');
                localStorage.removeItem('userInfo');
                document.cookie = 'vridge_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

                // 로그인 페이지로 이동 (소문자로 통일)
                window.location.href = '/login';
              }
            }
          }}>

          로그아웃
        </div>
      </aside>

      <div
        ref={submenuRef}
        className={SubMenu ? `${styles.Submenu} ${styles.active}` : styles.Submenu}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.stopPropagation();
          }
        }}>

        <div className={styles.etc}>
          <div className={styles.ss_title}>
            {tab_name === 'feedback' ? '영상 피드백' : '프로젝트 관리'}
          </div>
          <ul>
            {tab_name === 'project' && SortProject.length > 0 &&
            <li
              onClick={(e) => {
                e.stopPropagation();
                navigate('/ProjectCreate');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  navigate('/ProjectCreate');
                }
              }}
              className={styles.plus}>

                +
              </li>
            }
            <li
              onClick={(e) => {
                e.stopPropagation();
                SetSubMenu(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  SetSubMenu(false);
                }
              }}
              className={styles.close}>

              x
            </li>
          </ul>
        </div>
        {/* 2차메뉴 있을때 */}
        <nav aria-label="Main navigation">
          <ul>
            {SortProject.map((item, index) =>
            <li
              onClick={(e) => {
                e.stopPropagation();

                // 프로젝트 ID 유효성 검사
                if (!item.id) {
                  return;
                }

                if (tab_name === 'project') {
                  navigate(`/project/${item.id}`);
                } else {
                  // Navigating to feedback
                  navigate(`/feedback/${item.id}`);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();

                  // 프로젝트 ID 유효성 검사
                  if (!item.id) {
                    return;
                  }

                  if (tab_name === 'project') {
                    navigate(`/project/${item.id}`);
                  } else {
                    // Navigating to feedback
                    navigate(`/feedback/${item.id}`);
                  }
                  SetSubMenu(false);
                }
              }}
              key={index}>

                {item.name}
              </li>
            )}
          </ul>
        </nav>
        {/* 2차메뉴 없을때 */}
        {SortProject.length === 0 &&
        <div className="empty">
            등록된 <br />
            프로젝트가 없습니다
            <Button
            onClick={() => navigate('/ProjectCreate')} 
            variant="primary">

              프로젝트 등록
            </Button>
          </div>
        }
      </div>
    </>);

});

export default SideBar;