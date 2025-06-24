import { axiosOpts, axiosCredentials } from 'util/util'

// 프로젝트 리스트
export function ProjectList() {
  return axiosCredentials(
    'get',
    `${process.env.REACT_APP_BACKEND_API_URL}/projects/project_list`,
  )
}

// 프로젝트 들고오기
export function GetProject(project_id) {
  return axiosCredentials(
    'get',
    `${process.env.REACT_APP_BACKEND_API_URL}/projects/detail/${project_id}`,
  )
}

// 프로젝트 생성
export function CreateProjectAPI(data) {
  return axiosCredentials(
    'post',
    `${process.env.REACT_APP_BACKEND_API_URL}/projects/create`,
    data,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )
}

// 프로젝트 업데이트
export function UpdateProjectAPI(data, project_id) {
  return axiosCredentials(
    'post',
    `${process.env.REACT_APP_BACKEND_API_URL}/projects/detail/${project_id}`,
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
    `${process.env.REACT_APP_BACKEND_API_URL}/projects/detail/${project_id}`,
  )
}

// 프로젝트 멤버 초대
export function InviteProject(data, id) {
  return axiosCredentials(
    'post',
    `${process.env.REACT_APP_BACKEND_API_URL}/projects/invite_project/${id}`,
    data,
  )
}

// 프로젝트 멤버 초대 취소
export function InviteCancel(data, id) {
  return axiosCredentials(
    'delete',
    `${process.env.REACT_APP_BACKEND_API_URL}/projects/invite_project/${id}`,
    data,
  )
}

// 프로젝트 파일 삭제
export function FileDeleteAPI(id) {
  return axiosCredentials(
    'delete',
    `${process.env.REACT_APP_BACKEND_API_URL}/projects/file/delete/${id}`,
  )
}

// 프로젝트 파일 삭제
export function AcceptInvite(uid, token) {
  return axiosCredentials(
    'get',
    `${process.env.REACT_APP_BACKEND_API_URL}/projects/invite/${uid}/${token}`,
  )
}

// 프로젝트 메모 작성
export function WriteMemo(data, id) {
  return axiosCredentials(
    'post',
    `${process.env.REACT_APP_BACKEND_API_URL}/projects/memo/${id}`,
    data,
  )
}

// 프로젝트 메모 삭제
export function DeleteMemo(data, id) {
  return axiosCredentials(
    'delete',
    `${process.env.REACT_APP_BACKEND_API_URL}/projects/memo/${id}`,
    data,
  )
}

// 프로젝트 기간 변경
export function UpdateDate(data, id) {
  return axiosCredentials(
    'post',
    `${process.env.REACT_APP_BACKEND_API_URL}/projects/date_update/${id}`,
    data,
  )
}
