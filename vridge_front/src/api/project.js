import { axiosOpts, axiosCredentials } from '../util/util'

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
  // 더 안전한 멱등성 키 생성 (사용자 데이터 기반) - 한글 지원
  const userKey = `${data.name}_${data.manager}_${Date.now()}`
  
  // UTF-8 문자열을 안전하게 Base64로 인코딩하는 함수
  const b64EncodeUnicode = (str) => {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    )
  }
  
  const idempotencyKey = b64EncodeUnicode(userKey).replace(/[/+=]/g, '').substring(0, 32)
  
  console.log('[API] Atomic CreateProject called:', data.name)
  console.log('[API] Idempotency key:', idempotencyKey)
  
  return axiosCredentials(
    'post',
    `/api/projects/create/`,
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
    `/api/projects/${id}/invitation/`,
    data,
  )
}

// 프로젝트 멤버 초대 취소
export function InviteCancel(data, id) {
  return axiosCredentials(
    'delete',
    `/api/projects/${id}/invitation/`,
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
  console.log('[API] AcceptInvite called with:', { uid, token })
  // URL에 trailing slash 추가 (중요!)
  const url = `/api/projects/invite/${uid}/${token}/`
  console.log('[API] AcceptInvite URL:', url)
  console.log('[API] Full URL will be:', `${process.env.NEXT_PUBLIC_API_URL}${url}`)
  
  return axiosCredentials(
    'get',
    url,
  ).catch(err => {
    console.error('[API] AcceptInvite error:', err)
    if (err.response?.status === 404) {
      console.error('[API] 404 Error Details:', {
        requestedURL: err.config?.url,
        baseURL: err.config?.baseURL,
        fullURL: err.request?.responseURL,
        response: err.response?.data
      })
    }
    throw err
  })
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
