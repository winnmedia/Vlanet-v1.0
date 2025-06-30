import { axiosOpts, axiosCredentials } from 'util/util'

// 이메일 회원가입
export function SignUp(data) {
  return axiosCredentials(
    'post',
    `/users/signup`,
    data,
  )
}

// 이메일 로그인
export function SignIn(data) {
  return axiosCredentials(
    'post',
    `/users/login`,
    data,
  )
}

// 이메일 인증번호 보내기
export function SendAuthNumber(data, types) {
  return axiosCredentials(
    'post',
    `/users/send_authnumber/${types}`,
    data,
  )
}

// 인증번호 확인
export function EmailAuth(data, types) {
  return axiosCredentials(
    'post',
    `/users/signup_emailauth/${types}`,
    data,
  )
}

// 패스워드 리셋
export function ResetPassword(data) {
  return axiosCredentials(
    'post',
    `/users/password_reset`,
    data,
  )
}

// 카카오 로그인
export function KakaoLoginAPI(data) {
  return axiosCredentials(
    'post',
    `/users/login/kakao`,
    data,
  )
}

// 네이버 로그인
export function NaverLoginAPI(data) {
  return axiosCredentials(
    'post',
    `/users/login/naver`,
    data,
  )
}

// 구글 로그인
export function GoogleLoginAPI(data) {
  return axiosCredentials(
    'post',
    `/users/login/google`,
    data,
  )
}

// 유저 메모 작성
export function WriteUserMemo(data) {
  return axiosCredentials(
    'post',
    `/users/memo`,
    data,
  )
}

// 유저 메모 삭제
export function DeleteUserMemo(id) {
  return axiosCredentials(
    'delete',
    `/users/memo/${id}`,
  )
}
