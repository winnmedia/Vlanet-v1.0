import { axiosCredentials } from 'util/util'

// 알림 목록 조회
export function GetNotifications(unreadOnly = false, limit = 20) {
  return axiosCredentials(
    'get',
    `/api/users/notifications/?unread_only=${unreadOnly}&limit=${limit}`,
  )
}

// 읽지 않은 알림 개수
export function GetUnreadNotificationCount() {
  return axiosCredentials(
    'get',
    `/api/users/notifications/unread-count/`
  )
}

// 특정 알림 읽음 처리
export function MarkNotificationAsRead(notificationId) {
  return axiosCredentials(
    'post',
    `/api/users/notifications/`,
    { notification_id: notificationId }
  )
}

// 여러 알림 읽음 처리
export function MarkNotificationsAsRead(notificationIds) {
  return axiosCredentials(
    'post',
    `/api/users/notifications/mark-read/`,
    { notification_ids: notificationIds }
  )
}

// 모든 알림 읽음 처리
export function MarkAllNotificationsAsRead() {
  return axiosCredentials(
    'post',
    `/api/users/notifications/`,
    { mark_all_read: true }
  )
}

// 알림 삭제
export function DeleteNotification(notificationId) {
  return axiosCredentials(
    'delete',
    `/api/users/notifications/${notificationId}/`,
  )
}