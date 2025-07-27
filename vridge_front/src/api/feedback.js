import { axiosOpts, axiosCredentials } from '../util/util'
import axios from 'axios'

// 피드백 detail - feedbacks 엔드포인트 사용 (기존과 동일하게 유지)
export function GetFeedBack(projectId) {
  return axiosCredentials(
    'get',
    `/api/feedbacks/${projectId}`,
  )
}

// 피드백 create
export function CreateFeedback(data, projectId) {
  // 보안: API 호출 로깅 시 데이터 제외
  // console.log('CreateFeedback API called:', `/api/feedbacks/${projectId}`);
  
  return axiosCredentials(
    'put',
    `/api/feedbacks/${projectId}`,
    data,
  ).then(response => {
    // console.log('CreateFeedback API success');
    return response;
  }).catch(error => {
    // console.error('CreateFeedback API error:', error.message);
    throw error;
  });
}

// 피드백 update
export function UpdateFeedback(id, data) {
  return axiosCredentials(
    'patch',
    `/api/feedbacks/${id}`,
    data,
  )
}

// 피드백 delete
export function DeleteFeedback(id) {
  return axiosCredentials(
    'delete',
    `/api/feedbacks/${id}`,
  )
}

// 게스트 세션 생성
export function CreateGuestSession(invitationId, guestName) {
  return axios.post('/api/feedbacks/guest/session/create/', {
    invitation_id: invitationId,
    guest_name: guestName
  })
}

// 게스트 피드백 작성
export function CreateGuestFeedback(feedbackId, sessionId, data) {
  return axios.put(`/api/feedbacks/guest/${feedbackId}`, {
    session_id: sessionId,
    ...data
  })
}

// 피드백 file uploads
export function FeedbackFile(data, projectId, onUploadProgress) {
  // axios 인스턴스 import 또는 기본 axios 사용
  const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    withCredentials: true,
  });
  
  // 토큰 가져오기 - 쿠키 우선, localStorage 폴백
  let token = null;
  if (typeof window !== 'undefined') {
    // 쿠키에서 토큰 확인
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'vridge_session') {
        token = value;
        break;
      }
    }
    
    // 쿠키에 없으면 localStorage 확인
    if (!token) {
      token = localStorage.getItem('VGID')?.replace(/"/g, '');
    }
  }
  
  const config = {
    method: 'post',
    url: `/api/projects/${projectId}/feedback/upload/`,
    data: data,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      // Content-Type은 FormData가 자동으로 설정하므로 명시하지 않음
    },
    onUploadProgress: onUploadProgress,
    timeout: 300000, // 5분 타임아웃
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  };
  
  return axiosInstance(config);
}


// 피드백 file delete
export function DeleteFeedbackFile(id) {
  return axiosCredentials(
    'delete',
    `/api/feedbacks/file/${id}`,
  )
}

// 비디오 인코딩 상태 확인
export function GetEncodingStatus(projectId) {
  return axiosCredentials(
    'get',
    `/api/projects/${projectId}/feedback/encoding-status/`,
  )
}

// 피드백에 답글 추가
export function CreateFeedbackReply(feedbackId, data) {
  return axiosCredentials(
    'post',
    `/api/feedbacks/${feedbackId}/replies`,
    data,
  )
}

// 피드백 답글 삭제
export function DeleteFeedbackReply(feedbackId, replyId) {
  return axiosCredentials(
    'delete',
    `/api/feedbacks/${feedbackId}/replies/${replyId}`,
  )
}

// 피드백 중요표시 토글
export function ToggleFeedbackImportant(feedbackId) {
  return axiosCredentials(
    'post',
    `/api/feedbacks/${feedbackId}/toggle-important`,
  )
}

// 피드백 반응 추가/변경
export function UpdateFeedbackReaction(feedbackId, reactionType) {
  return axiosCredentials(
    'post',
    `/api/feedbacks/${feedbackId}/reaction`,
    { reaction: reactionType }
  )
}