import { axiosOpts, axiosCredentials } from 'util/util'

// 이메일 회원가입
export function SignUp(data) {
  // Railway 백엔드 복구 전까지 임시 처리
  if (process.env.NODE_ENV === 'production' && window.location.hostname === 'vlanet.net') {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 간단한 검증
        if (!data.email || !data.nickname || !data.password) {
          reject({ response: { status: 400, data: { message: '모든 필드를 입력해주세요.' } } });
        } else {
          // 임시 토큰 생성
          const mockToken = btoa(`mock-token-${data.email}-${Date.now()}`);
          resolve({ 
            status: 201, 
            data: { 
              message: 'success',
              vridge_session: mockToken,
              user: data.email,
              nickname: data.nickname
            } 
          });
        }
      }, 1000);
    });
  }
  
  return axiosOpts(
    'post',
    `/users/signup`,
    data,
  )
}

// 닉네임 중복 확인
export function CheckNickname(nickname) {
  // Railway 백엔드 복구 전까지 임시 처리
  if (process.env.NODE_ENV === 'production' && window.location.hostname === 'vlanet.net') {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 테스트를 위해 일부 닉네임은 중복으로 처리
        if (['admin', 'test', '관리자'].includes(nickname)) {
          reject({ response: { status: 409, data: { message: '이미 사용 중인 닉네임입니다.' } } });
        } else {
          resolve({ status: 200, data: { message: '사용 가능한 닉네임입니다.' } });
        }
      }, 500);
    });
  }
  
  return axiosOpts(
    'post',
    `/users/check_nickname`,
    { nickname },
  )
}

// 이메일 중복 확인
export function CheckEmail(email) {
  // Railway 백엔드 복구 전까지 임시 처리
  if (process.env.NODE_ENV === 'production' && window.location.hostname === 'vlanet.net') {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 테스트를 위해 일부 이메일은 중복으로 처리
        if (['admin@test.com', 'test@test.com', 'demo1@videoplanet.com'].includes(email)) {
          reject({ response: { status: 409, data: { message: '이미 사용 중인 이메일입니다.' } } });
        } else {
          resolve({ status: 200, data: { message: '사용 가능한 이메일입니다.' } });
        }
      }, 500);
    });
  }
  
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
