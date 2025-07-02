import { axiosCredentials, axiosFormData } from 'util/util'

// 마이페이지 종합 정보 조회
export function getMyPageInfo() {
  return axiosCredentials(
    'get',
    `/api/users/mypage`
  )
}

// 사용자 활동 내역 조회
export function getUserActivity(days = 30) {
  return axiosCredentials(
    'get',
    `/api/users/mypage/activity?days=${days}`
  )
}

// 사용자 설정 조회
export function getUserPreferences() {
  return axiosCredentials(
    'get',
    `/api/users/mypage/preferences`
  )
}

// 사용자 설정 업데이트
export function updateUserPreferences(data) {
  return axiosCredentials(
    'post',
    `/api/users/mypage/preferences`,
    data
  )
}

// 프로필 이미지 업로드
export function uploadProfileImage(formData) {
  return axiosFormData(
    'post',
    `/api/users/profile/upload-image`,
    formData
  )
}

// 프로필 이미지 삭제
export function deleteProfileImage() {
  return axiosCredentials(
    'delete',
    `/api/users/profile/upload-image`
  )
}

// 프로필 정보 업데이트
export function updateProfile(data) {
  return axiosCredentials(
    'post',
    `/api/users/profile/update`,
    data
  )
}

// 기존 프로필 조회 (호환성 유지)
export function getProfile() {
  return axiosCredentials(
    'get',
    `/api/users/profile`
  )
}

// 비밀번호 변경
export function changePassword(data) {
  return axiosCredentials(
    'post',
    `/api/users/profile/change-password`,
    data
  )
}

// 계정 삭제
export function deleteAccount(data) {
  return axiosCredentials(
    'post',
    `/api/users/profile/delete-account`,
    data
  )
}