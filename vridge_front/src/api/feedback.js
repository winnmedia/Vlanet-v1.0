import { axiosOpts, axiosCredentials } from 'util/util'
import axios from 'axios'
import axiosInstance from '../config/axios'
import { handleApiError } from '../utils/errorHandler'

// 피드백 detail - feedbacks 엔드포인트 사용 (기존과 동일하게 유지)
export function GetFeedBack(projectId) {
  return axiosCredentials(
    'get',
    `/api/feedbacks/${projectId}`,
  )
}

// 피드백 목록 조회
export function GetFeedbacks(projectId) {
  return axiosCredentials(
    'get',
    `/api/feedbacks/project/${projectId}`,
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
    handleApiError(error, {
      409: '이미 해당 시간에 피드백이 존재합니다.',
      400: '피드백 내용을 입력해주세요.'
    });
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
    handleApiError(error, {
      404: '수정할 피드백을 찾을 수 없습니다.',
      403: '자신의 피드백만 수정할 수 있습니다.'
    });
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
    handleApiError(error, {
      404: '삭제할 피드백을 찾을 수 없습니다.',
      403: '자신의 피드백만 삭제할 수 있습니다.'
    });
    throw error;
  });
}

// 피드백 file uploads
export function FeedbackFile(data, projectId, onUploadProgress) {
  // axiosInstance를 사용하여 업로드 (토큰 자동 포함)
  const config = {
    method: 'post',
    url: `/api/projects/${projectId}/feedback/upload/`,
    data: data,
    onUploadProgress: onUploadProgress,
    timeout: 300000, // 5분 타임아웃
    headers: {
      // FormData의 경우 Content-Type 자동 설정되므로 추가 헤더 불필요
    }
  };
  
  console.log('Upload config:', config);
  console.log('Axios instance base URL:', axiosInstance.defaults.baseURL);
  
  return axiosInstance(config).catch(error => {
    console.error('FeedbackFile upload error:', error);
    console.error('Error response:', error.response);
    
    handleApiError(error, {
      413: '파일 크기가 너무 큽니다. 600MB 이하의 파일만 업로드 가능합니다.',
      400: '지원하지 않는 파일 형식입니다.',
      401: '인증이 필요합니다. 다시 로그인해주세요.',
      500: '파일 업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    });
    throw error;
  });
}


// 피드백 file delete
export function DeleteFeedbackFile(id) {
  return axiosCredentials(
    'delete',
    `/api/feedbacks/file/${id}`,
  ).catch(error => {
    console.error('DeleteFeedbackFile API error:', error);
    handleApiError(error, {
      404: '삭제할 파일을 찾을 수 없습니다.',
      403: '파일을 삭제할 권한이 없습니다.'
    });
    throw error;
  });
}

// 비디오 인코딩 상태 확인
export function GetEncodingStatus(projectId) {
  return axiosCredentials(
    'get',
    `/api/projects/${projectId}/feedback/encoding-status/`,
  ).catch(error => {
    console.error('GetEncodingStatus API error:', error);
    handleApiError(error, {
      404: '인코딩 상태를 확인할 수 없습니다.'
    });
    throw error;
  });
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
    handleApiError(error, {
      404: '피드백을 찾을 수 없습니다.',
      403: '반응을 추가할 권한이 없습니다.'
    });
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

// 그리기 데이터 저장
export function SaveDrawingData(projectId, feedbackId, drawingData) {
  return axiosInstance.post(`/api/projects/${projectId}/feedback/${feedbackId}/drawings/`, {
    drawing_data: drawingData
  }).catch(error => {
    handleApiError(error, {
      400: '그리기 데이터 저장 실패',
      401: '인증이 필요합니다.',
      404: '피드백을 찾을 수 없습니다.',
      500: '서버 오류가 발생했습니다.'
    });
    throw error;
  });
}

// 그리기 데이터 목록 조회
export function GetDrawingsList(projectId, feedbackId) {
  return axiosInstance.get(`/api/projects/${projectId}/feedback/${feedbackId}/drawings/`)
    .catch(error => {
      handleApiError(error, {
        401: '인증이 필요합니다.',
        404: '피드백을 찾을 수 없습니다.',
        500: '서버 오류가 발생했습니다.'
      });
      throw error;
    });
}