import React, { useState, useEffect, useRef } from 'react'
import { GetNotifications, GetUnreadNotificationCount, MarkNotificationsAsRead } from 'api/notification'
import moment from 'moment'
import 'moment/locale/ko'

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 읽지 않은 알림 개수 조회
  const fetchUnreadCount = async () => {
    try {
      const response = await GetUnreadNotificationCount()
      setUnreadCount(response.data.count || 0)
    } catch (error) {
      console.error('읽지 않은 알림 개수 조회 실패:', error)
    }
  }

  // 알림 목록 조회
  const fetchNotifications = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      const response = await GetNotifications(false, 20)
      setNotifications(response.data.notifications || [])
      
      // 읽지 않은 알림들의 ID 수집
      const unreadIds = response.data.notifications
        .filter(notif => !notif.is_read)
        .map(notif => notif.id)
      
      // 읽음 처리
      if (unreadIds.length > 0) {
        await MarkNotificationsAsRead(unreadIds)
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('알림 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 드롭다운 토글
  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications()
    }
    setIsOpen(!isOpen)
  }

  // 알림 클릭 시 해당 페이지로 이동
  const handleNotificationClick = (notification) => {
    if (notification.action_url) {
      typeof window !== 'undefined' && window.location.href = notification.action_url
    }
    setIsOpen(false)
  }

  // 컴포넌트 마운트 시 읽지 않은 알림 개수 조회
  useEffect(() => {
    fetchUnreadCount()
    
    // 30초마다 읽지 않은 알림 개수 업데이트
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <button
        className={`notification-button ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={toggleDropdown}
        title="알림"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-menu">
          <div className="notification-header">
            <h4>알림</h4>
            {notifications.length > 0 && (
              <button 
                className="mark-all-read"
                onClick={() => {
                  setUnreadCount(0)
                  fetchUnreadCount()
                }}
              >
                모두 읽음
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">
                <div className="loading-spinner"></div>
                <span>알림을 불러오는 중...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="empty-icon">🔔</div>
                <p>새로운 알림이 없습니다</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon" style={{ color: notification.color }}>
                    {notification.icon}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">
                      {moment(notification.created).fromNow()}
                    </div>
                  </div>
                  {!notification.is_read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="notification-footer">
              <button 
                className="view-all-notifications"
                onClick={() => {
                  // 전체 알림 페이지로 이동 (나중에 구현)
                  setIsOpen(false)
                }}
              >
                모든 알림 보기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}