import { axiosOpts, axiosCredentials } from 'util/util'

// 피드백 detail
export function GetFeedBack(id) {
  return axiosCredentials(
    'get',
    `${process.env.REACT_APP_BACKEND_API_URL}/feedbacks/${id}`,
  )
}

// 피드백 create
export function CreateFeedback(data, id) {
  return axiosCredentials(
    'put',
    `${process.env.REACT_APP_BACKEND_API_URL}/feedbacks/${id}`,
    data,
  )
}

// 피드백 create
export function DeleteFeedback(id) {
  return axiosCredentials(
    'delete',
    `${process.env.REACT_APP_BACKEND_API_URL}/feedbacks/${id}`,
  )
}

// 피드백 file uploads
export function FeedbackFile(data, id, onUploadProgress) {
  return axiosCredentials(
    'post',
    `${process.env.REACT_APP_BACKEND_API_URL}/feedbacks/${id}`,
    data,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onUploadProgress,
      timeout: 300000, // 5분 타임아웃
    },
  )
}


// 피드백 file delete
export function DeleteFeedbackFile(id) {
  return axiosCredentials(
    'delete',
    `${process.env.REACT_APP_BACKEND_API_URL}/feedbacks/file/${id}`,
  )
}