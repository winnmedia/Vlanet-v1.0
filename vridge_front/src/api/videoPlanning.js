import { axiosOpts, axiosCredentials } from 'util/util'
import axios from 'axios'

// 비디오 기획 조회
export function GetVideoPlanning(projectId) {
  return axiosCredentials(
    'get',
    `/api/video-planning/${projectId}`,
  )
}

// 비디오 기획 저장
export function SaveVideoPlanning(data, projectId) {
  return axiosCredentials(
    'post',
    `/api/video-planning/${projectId}`,
    data,
  )
}

// 비디오 기획 업데이트
export function UpdateVideoPlanning(data, projectId) {
  return axiosCredentials(
    'put',
    `/api/video-planning/${projectId}`,
    data,
  )
}

// AI 기획 생성
export function GenerateAIPlanning(data, projectId) {
  return axiosCredentials(
    'post',
    `/api/video-planning/${projectId}/ai-generate`,
    data,
  )
}

// PDF 내보내기
export function ExportPlanningPDF(data, projectId) {
  return axiosCredentials(
    'post',
    `/api/video-planning/${projectId}/export-pdf`,
    data,
  )
}

// 비디오 기획 삭제
export function DeleteVideoPlanning(planningId) {
  return axiosCredentials(
    'delete',
    `/api/video-planning/delete/${planningId}/`,
  )
}