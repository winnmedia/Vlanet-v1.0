import { axiosOpts, axiosCredentials } from 'util/util'

// 이메일 회원가입
export function SignUp(data) {
  return axiosOpts(
    'post',
    `/users/signup`,
    data,
  )
}

// 닉네임 중복 확인
export function CheckNickname(nickname) {
  return axiosOpts(
    'post',
    `/users/check_nickname`,
    { nickname },
  )
}

// 이메일 중복 확인
export function CheckEmail(email) {
  return axiosOpts(
    'post',
    `/users/check_email`,
    { email },
  )
}

// 이메일 로그인
export function SignIn(data) {
  return axiosOpts(
    'post',
    `/users/login`,
    data,
  )
}

// 이메일 인증번호 보내기
export function SendAuthNumber(data, types) {
  return axiosOpts(
    'post',
    `/users/send_authnumber/${types}`,
    data,
  )
}

// 인증번호 확인
export function EmailAuth(data, types) {
  return axiosOpts(
    'post',
    `/users/signup_emailauth/${types}`,
    data,
  )
}

// 패스워드 리셋
export function ResetPassword(data) {
  return axiosOpts(
    'post',
    `/users/password_reset`,
    data,
  )
}

// 카카오 로그인
export function KakaoLoginAPI(data) {
  return axiosOpts(
    'post',
    `/users/login/kakao`,
    data,
  )
}

// 네이버 로그인
export function NaverLoginAPI(data) {
  return axiosOpts(
    'post',
    `/users/login/naver`,
    data,
  )
}

// 구글 로그인
export function GoogleLoginAPI(data) {
  return axiosOpts(
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

// ===== 새로운 이메일 인증 회원가입 API =====

// Step 1: 회원가입 이메일 인증 요청
export function SignUpRequest(email) {
  return axiosOpts(
    'post',
    `/users/signup/request`,
    { email },
  )
}

// Step 2: 회원가입 인증번호 확인
export function SignUpVerify(data) {
  return axiosOpts(
    'post',
    `/users/signup/verify`,
    data,
  )
}

// Step 3: 회원가입 완료
export function SignUpComplete(data) {
  return axiosOpts(
    'post',
    `/users/signup/complete`,
    data,
  )
}
