import axios from '../config/axios'

// 프레임워크 목록 조회
export const GetFrameworks = () => {
  return axios.get('/api/projects/frameworks/')
}

// 프레임워크 상세 조회
export const GetFramework = (id) => {
  return axios.get(`/api/projects/frameworks/${id}/`)
}

// 프레임워크 생성
export const CreateFramework = (data) => {
  return axios.post('/api/projects/frameworks/', data)
}

// 프레임워크 수정
export const UpdateFramework = (id, data) => {
  return axios.put(`/api/projects/frameworks/${id}/`, data)
}

// 프레임워크 삭제
export const DeleteFramework = (id) => {
  return axios.delete(`/api/projects/frameworks/${id}/`)
}

// 기본 프레임워크 설정
export const SetDefaultFramework = (id) => {
  return axios.post(`/api/projects/frameworks/${id}/set-default/`)
}