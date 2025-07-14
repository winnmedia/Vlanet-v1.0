import { axiosCredentials } from 'util/util'

// 프로젝트 멤버 초대
export function InviteProjectMember(projectId, data) {
  return axiosCredentials(
    'post',
    `/api/projects/invite_project/${projectId}`,
    data,
  )
}

// 특정 프로젝트의 초대 목록 조회
export function GetProjectInvitations(projectId) {
  return axiosCredentials(
    'get',
    `/api/projects/${projectId}/invitations/`,
  )
}

// 사용자의 모든 초대 조회 (보낸 초대 + 받은 초대)
export function GetMyInvitations() {
  return axiosCredentials(
    'get',
    `/api/projects/invitations/`,
  )
}

// 초대 수락
export function AcceptInvitation(invitationId) {
  return axiosCredentials(
    'post',
    `/api/projects/invitations/${invitationId}/response/`,
    { action: 'accept' }
  )
}

// 초대 거절
export function DeclineInvitation(invitationId) {
  return axiosCredentials(
    'post',
    `/api/projects/invitations/${invitationId}/response/`,
    { action: 'decline' }
  )
}

// 초대 취소
export function CancelInvitation(projectId, invitationId) {
  return axiosCredentials(
    'delete',
    `/api/projects/${projectId}/invitations/`,
    { invitation_id: invitationId }
  )
}