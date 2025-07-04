import { axiosOpts, axiosCredentials } from 'util/util'
import axios from 'axios'

// 피드백 detail
export function GetFeedBack(id) {
  return axiosCredentials(
    'get',
    `/api/feedbacks/${id}`,
  )
}

// 피드백 create
export function CreateFeedback(data, id) {
  return axiosCredentials(
    'put',
    `/api/feedbacks/${id}`,
    data,
  )
}

// 피드백 update
export function UpdateFeedback(id, data) {
  return axiosCredentials(
    'patch',
    `/api/feedbacks/${id}`,
    data,
  )
}

// 피드백 create
export function DeleteFeedback(id) {
  return axiosCredentials(
    'delete',
    `/api/feedbacks/${id}`,
  )
}

// 피드백 file uploads
export function FeedbackFile(data, id, onUploadProgress) {
  // 직접 axios 사용하여 업로드
  const token = localStorage.getItem('VGID')?.replace(/"/g, '');
  
  console.log('File upload token:', token);
  
  const config = {
    method: 'post',
    url: `${process.env.REACT_APP_BACKEND_API_URL}/api/feedbacks/${id}/`,
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
  
  return axios(config);
}


// 피드백 file delete
export function DeleteFeedbackFile(id) {
  return axiosCredentials(
    'delete',
    `${process.env.REACT_APP_BACKEND_API_URL}/feedbacks/file/${id}`,
  )
}

// 비디오 인코딩 상태 확인
export function GetEncodingStatus(id) {
  return axiosCredentials(
    'get',
    `${process.env.REACT_APP_BACKEND_API_URL}/feedbacks/encoding-status/${id}`,
  )
}