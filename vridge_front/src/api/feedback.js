import { axiosOpts, axiosCredentials } from 'util/util'
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
  console.log('CreateFeedback API called with:', {
    method: 'PUT',
    url: `/api/feedbacks/${projectId}`,
    data: data
  });
  
  return axiosCredentials(
    'put',
    `/api/feedbacks/${projectId}`,
    data,
  ).then(response => {
    console.log('CreateFeedback API success:', response);
    return response;
  }).catch(error => {
    console.error('CreateFeedback API error:', error);
    throw error;
  });
}

// 피드백 update - 메시지 수정 엔드포인트 사용
export function UpdateFeedback(id, data) {
  console.log('UpdateFeedback API called with:', {
    method: 'PATCH',
    url: `/api/feedbacks/messages/${id}/`,
    data: data
  });
  
  return axiosCredentials(
    'patch',
    `/api/feedbacks/messages/${id}/`,
    data,
  ).then(response => {
    console.log('UpdateFeedback API success:', response);
    return response;
  }).catch(error => {
    console.error('UpdateFeedback API error:', error);
    throw error;
  });
}

// 피드백 delete - 메시지 삭제 엔드포인트 사용
export function DeleteFeedback(id) {
  console.log('DeleteFeedback API called with:', {
    method: 'DELETE',
    url: `/api/feedbacks/messages/${id}/`
  });
  
  return axiosCredentials(
    'delete',
    `/api/feedbacks/messages/${id}/`,
  ).then(response => {
    console.log('DeleteFeedback API success:', response);
    return response;
  }).catch(error => {
    console.error('DeleteFeedback API error:', error);
    throw error;
  });
}

// 피드백 file uploads
export function FeedbackFile(data, projectId, onUploadProgress) {
  // 직접 axios 사용하여 업로드
  const token = typeof window !== 'undefined' && localStorage.getItem('VGID')?.replace(/"/g, '');
  
  console.log('File upload token:', token);
  console.log('Axios base URL:', axios.defaults.baseURL);
  
  const config = {
    method: 'post',
    url: `/api/projects/${projectId}/feedback/upload/`,  // baseURL을 사용하도록 상대 경로로 변경
    data: data,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      // Content-Type은 FormData가 자동으로 설정하므로 명시하지 않음
    },
    onUploadProgress: onUploadProgress,
    timeout: 300000, // 5분 타임아웃
    withCredentials: true,
  };
  
  console.log('Upload config:', config);
  console.log('Full upload URL:', axios.defaults.baseURL + config.url);
  
  return axios(config);
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

// 피드백 반응 추가/변경/제거
export function UpdateFeedbackReaction(messageId, reaction) {
  console.log('UpdateFeedbackReaction API called with:', {
    method: 'PATCH',
    url: `/api/feedbacks/messages/${messageId}/reaction/`,
    data: { reaction }
  });
  
  return axiosCredentials(
    'patch',
    `/api/feedbacks/messages/${messageId}/reaction/`,
    { reaction },
  ).then(response => {
    console.log('UpdateFeedbackReaction API success:', response);
    return response;
  }).catch(error => {
    console.error('UpdateFeedbackReaction API error:', error);
    throw error;
  });
}

// 피드백 반응 조회
export function GetFeedbackReactions(messageId) {
  return axiosCredentials(
    'get',
    `/api/feedbacks/messages/${messageId}/reaction/`,
  )
}