import { axiosOpts, axiosCredentials } from 'util/util'

// 프로젝트 리스트
export function ProjectList() {
  console.log('[API] ProjectList called at:', new Date().toISOString())
  console.trace('[API] Call stack:')
  return axiosCredentials(
    'get',
    `/api/projects/project_list/`,
  )
}

// 프로젝트 들고오기
export function GetProject(project_id) {
  return axiosCredentials(
    'get',
    `/api/projects/detail/${project_id}/`,
  )
}

// 원자적 프로젝트 생성 (개선된 멱등성 키)
export function CreateProjectAPI(data) {
  // 더 안전한 멱등성 키 생성 (사용자 데이터 기반)
  const userKey = `${data.name}_${data.manager}_${Date.now()}`
  const idempotencyKey = btoa(userKey).replace(/[/+=]/g, '').substring(0, 32)
  
  console.log('[API] Atomic CreateProject called:', data.name)
  console.log('[API] Idempotency key:', idempotencyKey)
  
  return axiosCredentials(
    'post',
    `/api/projects/atomic-create/`,
    data,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
    },
  )
}

// 프로젝트 업데이트
export function UpdateProjectAPI(data, project_id) {
  return axiosCredentials(
    'post',
    `/api/projects/detail/${project_id}/`,
    data,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )
}

// 프로젝트 삭제
export function DeleteProjectAPI(project_id) {
  return axiosCredentials(
    'delete',
    `/api/projects/detail/${project_id}/`,
  )
}

// 프로젝트 멤버 초대
export function InviteProject(data, id) {
  return axiosCredentials(
    'post',
    `/projects/invite_project/${id}`,
    data,
  )
}

// 프로젝트 멤버 초대 취소
export function InviteCancel(data, id) {
  return axiosCredentials(
    'delete',
    `/projects/invite_project/${id}`,
    data,
  )
}

// 프로젝트 파일 삭제
export function FileDeleteAPI(id) {
  return axiosCredentials(
    'delete',
    `/projects/file/delete/${id}`,
  )
}

// 프로젝트 파일 삭제
export function AcceptInvite(uid, token) {
  return axiosCredentials(
    'get',
    `/projects/invite/${uid}/${token}`,
  )
}

// 프로젝트 메모 작성
export function WriteMemo(data, id) {
  return axiosCredentials(
    'post',
    `/projects/memo/${id}`,
    data,
  )
}

// 프로젝트 메모 삭제
export function DeleteMemo(data, id) {
  return axiosCredentials(
    'delete',
    `/projects/memo/${id}`,
    data,
  )
}

// 프로젝트 기간 변경
export function UpdateDate(data, id) {
  return axiosCredentials(
    'post',
    `/projects/date_update/${id}`,
    data,
  )
}
