import { axiosCredentials } from 'util/util'

// 채팅 메시지 목록 조회
export function GetChatMessages(feedbackId) {
  return axiosCredentials(
    'get',
    `/api/feedbacks/${feedbackId}/messages/`,
  )
}

// 채팅 메시지 전송
export function SendChatMessage(feedbackId, data) {
  return axiosCredentials(
    'post',
    `/api/feedbacks/${feedbackId}/messages/`,
    data,
  )
}

// 채팅 메시지 삭제
export function DeleteChatMessage(feedbackId, messageId) {
  return axiosCredentials(
    'delete',
    `/api/feedbacks/${feedbackId}/messages/${messageId}/`,
  )
}