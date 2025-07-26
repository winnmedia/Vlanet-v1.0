import { axiosCredentials } from '../util/util'

// 친구 목록 조회
export function GetFriends() {
  return axiosCredentials(
    'get',
    `/api/users/friends/`
  )
}

// 친구 요청 보내기
export function SendFriendRequest(friendEmail) {
  return axiosCredentials(
    'post',
    `/api/users/friends/`,
    { friend_email: friendEmail }
  )
}

// 받은 친구 요청 목록
export function GetFriendRequests() {
  return axiosCredentials(
    'get',
    `/api/users/friends/requests/`
  )
}

// 친구 요청 응답 (수락/거절)
export function RespondToFriendRequest(friendshipId, action) {
  return axiosCredentials(
    'post',
    `/api/users/friends/${friendshipId}/response/`,
    { action: action } // 'accept' or 'decline'
  )
}

// 친구 검색
export function SearchFriends(query) {
  return axiosCredentials(
    'get',
    `/api/users/friends/search/?q=${encodeURIComponent(query)}`
  )
}

// 최근 초대한 사람 목록
export function GetRecentInvitations(limit = 10) {
  return axiosCredentials(
    'get',
    `/api/users/recent-invitations/?limit=${limit}`
  )
}

// 친구 삭제
export function DeleteFriend(friendEmail) {
  return axiosCredentials(
    'delete',
    `/api/users/friends/`,
    { friend_email: friendEmail }
  )
}

// 친구 차단
export function BlockFriend(friendEmail) {
  return axiosCredentials(
    'post',
    `/api/users/friends/block/`,
    { friend_email: friendEmail }
  )
}

// 친구 차단 해제
export function UnblockFriend(friendEmail) {
  return axiosCredentials(
    'delete',
    `/api/users/friends/block/`,
    { friend_email: friendEmail }
  )
}