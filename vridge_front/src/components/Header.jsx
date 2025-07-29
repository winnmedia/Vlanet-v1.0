import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
import cx from 'classnames'
import Link from 'next/link'
import { useRouter } from '../util/nextNavigation'
import { GetNotifications, MarkNotificationAsRead, MarkAllNotificationsAsRead } from '../api/notification'
import moment from 'moment'
import 'moment/locale/ko'
import UserAvatar from './UserAvatar'
import styles from './Header.module.scss'
import { UnifiedButton } from './unified/UnifiedButton'

const Header = memo(function Header({
  // 초기값 지정
  leftItems = [],
  rightItems = [],
  children,
  props,
}) {
  const { navigate } = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const dropdownRef = useRef(null)
  const notificationRef = useRef(null)
  const mobileMenuRef = useRef(null)

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 알림 로드
  const loadNotifications = useCallback(async () => {
    try {
      const response = await GetNotifications()
      setNotifications(response.data.notifications || [])
      setUnreadCount(response.data.unread_count || 0)
    } catch (error) {}
  }, [])

  // 알림 읽음 처리
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await MarkNotificationAsRead(notification.id)
        setUnreadCount(prev => Math.max(0, prev - 1))
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        )
      } catch (error) {}
    }

    // 알림과 관련된 페이지로 이동
    if (notification.project_id) {
      navigate(`/feedback/${notification.project_id}`)
    }
    setShowNotifications(false)
  }

  // 모든 알림 읽음 처리
  const handleMarkAllAsRead = async () => {
    try {
      await MarkAllNotificationsAsRead()
      setUnreadCount(0)
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      )
    } catch (error) {}
  }

  // 컴포넌트 마운트 시 알림 로드
  useEffect(() => {
    loadNotifications()
    
    // Page Visibility API를 사용하여 백그라운드에서는 polling 중지
    let interval
    
    const startPolling = () => {
      interval = setInterval(loadNotifications, 60000) // 30초 → 60초로 증가
    }
    
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        loadNotifications() // 포그라운드로 돌아올 때 즉시 로드
        startPolling()
      }
    }
    
    // 초기 시작
    if (!document.hidden) {
      startPolling()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loadNotifications])

  const left = makeHtml(leftItems, navigate)
  const right = makeHtml(rightItems, navigate, () => setShowDropdown(!showDropdown))

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('VGID')
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.Header}>
      {/* 모바일 햄버거 메뉴 버튼 */}
      <UnifiedButton 
        className={styles['mobile-menu-btn']}
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        onKeyDown={(e) => e.key === 'Enter' && setShowMobileMenu(!showMobileMenu)}
        aria-label="메뉴 열기"
        type="button"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </UnifiedButton>

      <div className={styles['desktop-left']}>{left}</div>
      
      {/* 우측 영역: 알림 아이콘 + 프로필 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* 알림 아이콘 */}
        <div className={styles['notification-wrapper']} ref={notificationRef}>
          <div 
            className={styles['notification-icon']} 
            onClick={() => setShowNotifications(!showNotifications)} 
            onKeyDown={(e) => e.key === 'Enter' && setShowNotifications(!showNotifications)}
            style={{
              position: 'relative',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* 벨 아이콘 (SVG) */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            
            {/* 읽지 않은 알림 개수 배지 */}
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                backgroundColor: '#e74c3c',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '11px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '18px'
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>

          {/* 알림 드롭다운 */}
          {showNotifications && (
            <div className={styles['notification-dropdown']} style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              backgroundColor: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              width: '350px',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 1000
            }}>
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #e9ecef',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                  알림
                </h4>
                {unreadCount > 0 && (
                  <UnifiedButton 
                    variant="link"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    onKeyDown={(e) => e.key === 'Enter' && handleMarkAllAsRead}
                    style={{
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                    aria-label="모두 읽음"
                    type="button"
                  >
                    모두 읽음
                  </UnifiedButton>
                )}
              </div>
              
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notification)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: index < notifications.length - 1 ? '1px solid #f8f9fa' : 'none',
                        cursor: 'pointer',
                        backgroundColor: notification.is_read ? 'white' : '#f8f9fa',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f0f0f0'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = notification.is_read ? 'white' : '#f8f9fa'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px'
                      }}>
                        {!notification.is_read && (
                          <div style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: '#1631F8',
                            borderRadius: '50%',
                            marginTop: '6px',
                            flexShrink: 0
                          }} />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: notification.is_read ? '400' : '600',
                            color: '#333',
                            marginBottom: '4px'
                          }}>
                            {notification.title}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: '#666',
                            marginBottom: '4px',
                            lineHeight: '1.4'
                          }}>
                            {notification.message}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: '#999'
                          }}>
                            {moment(notification.created).fromNow()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    새 알림이 없습니다
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 프로필 */}
        <div className={styles['profile-wrapper']} ref={dropdownRef}>
          <div className={styles.profile} onClick={() => setShowDropdown(!showDropdown)} onKeyDown={(e) => e.key === 'Enter' && setShowDropdown(!showDropdown)}>
            {right}
          </div>
          {showDropdown && (
            <div className={styles['dropdown-menu']}>
              <div className={styles['dropdown-item']} onClick={() => {
                setShowDropdown(false)
                navigate('/mypage')
              }} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowDropdown(false)
                  navigate('/mypage')
                }
              }}>
                마이페이지
              </div>
              <div className={styles['dropdown-item']} 
                onClick={() => {
                  setShowDropdown(false)
                  navigate('/cmshome')
                }} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setShowDropdown(false)
                    navigate('/cmshome')
                  }
                }}>
                홈으로
              </div>
              <div className={styles['dropdown-divider']}></div>
              <div className={cx(styles['dropdown-item'], styles.logout)} onClick={handleLogout} onKeyDown={(e) => e.key === 'Enter' && handleLogout}>
                로그아웃
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 모바일 메뉴 */}
      {showMobileMenu && (
        <div className={styles['mobile-menu']} ref={mobileMenuRef}>
          <div className={styles['mobile-menu-overlay']} onClick={() => setShowMobileMenu(false)} onKeyDown={(e) => e.key === 'Enter' && setShowMobileMenu(false)} />
          <div className={styles['mobile-menu-content']}>
            <div className={styles['mobile-menu-header']}>
              <h2>메뉴</h2>
              <UnifiedButton onClick={() => setShowMobileMenu(false)} onKeyDown={(e) => e.key === 'Enter' && setShowMobileMenu(false)} aria-label="메뉴 닫기" type="button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </UnifiedButton>
            </div>
            <nav className={styles['mobile-menu-nav']} aria-label="Main navigation">
              {leftItems.map((item, index) => (
                <a key={index} href={item.link} onClick={() => setShowMobileMenu(false)} onKeyDown={(e) => e.key === 'Enter' && setShowMobileMenu(false)} aria-label={item.label || item.text}>
                  {item.label || item.text}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  )
})

// type에 따라서 헤더의 html을 만들어주는 함수
function makeHtml(items = [], navigate, onProfileClick) {
  return items.map((item, i) => {
    if (item.type === 'img') {
      const button = (
        <div key={i} className={styles[item.className]}>
          <img
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/cmshome')} 
            onKeyDown={(e) => e.key === 'Enter' && navigate('/cmshome')}
            loading="lazy"
            alt={`img_${i}`}
            src={item.src}
          />
        </div>
      )
      return button
    } else if (item.type === 'avatar') {
      return (
        <UserAvatar
          key={i}
          profileImage={item.profileImage}
          name={item.name}
          size={40}
          showBorder={true}
          className={item.className}
          onClick={onProfileClick} onKeyDown={(e) => e.key === 'Enter' && onProfileClick}
        />
      )
    } else if (item.type === 'string') {
      const element = (
        <div 
          key={i} 
          className={cx(styles[item.className], { [styles.clickable]: item.className === 'nick' })}
          style={item.className === 'nick' ? { cursor: 'pointer' } : {}}
        >
          {item.text}
        </div>
      )
      return element
    }
  })
}
export default Header