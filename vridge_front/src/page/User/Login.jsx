import 'css/User/Auth.scss'
import PageTemplate from 'components/PageTemplate'
import queryString from 'query-string'
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { SignIn, KakaoLoginAPI, NaverLoginAPI, GoogleLoginAPI } from 'api/auth'
import { checkSession, refetchProject } from 'util/util'

import KakaoLogin from 'react-kakao-login'
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const initial_input = {
    email: '',
    password: '',
  }
  const [inputs, set_inputs] = useState(initial_input)
  const { email, password } = inputs
  const [login_message, SetLoginMessage] = useState('')
  const [param] = useSearchParams()
  const { uid, token, code, state } = queryString.parse(param.toString())

  const NAVER_AUTH_URL = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${process.env.REACT_APP_NAVER_CLIENT_ID}&state=${process.env.REACT_APP_NAVER_STATE}&redirect_uri=${process.env.REACT_APP_NAVER_REDIRECT_URI}`

  const OnChange = (e) => {
    const { value, name } = e.target
    set_inputs({
      ...inputs,
      [name]: value,
    })
  }

  useEffect(() => {
    const session = checkSession()
    if (session) {
      if (uid && token) {
        navigate(`/EmailCheck?uid=${uid}&token=${token}`)
      } else {
        navigate('/CmsHome')
      }
    }
  }, [])

  const [naver_info, set_naver_info] = useState({ code: '', state: '' })
  useEffect(() => {
    // 0.5초 interval로 로그인 체크
    let intervalId
    intervalId = setInterval(() => {
      if (code && state) {
        clearInterval(intervalId) // Naver
        set_naver_info({ code: code, state: state })
      }
    }, 500)

    // 로그인 페이지 벗어나면 interval 지우기
    return () => {
      clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (naver_info.code && naver_info.state) {
      NaverLoginAPI(naver_info)
        .then((res) => {
          CommonLoginSuccess(res.data.vridge_session)
        })
        .catch((err) => {
          navigate('/login')
          CommonErrorMessage(err)
        })
    }
  }, [naver_info])

  const CommonLoginSuccess = (jwt) => {
    window.localStorage.setItem('VGID', JSON.stringify(jwt))
    refetchProject(dispatch, navigate)
    if (uid && token) {
      // 초대 링크 처리 페이지
      navigate(`/EmailCheck?uid=${uid}&token=${token}`)
    } else {
      navigate('/CmsHome', { replace: true })
    }
  }

  const CommonErrorMessage = (err) => {
    if (err.response && err.response.data && err.response.data.message) {
      window.alert(err.response.data.message)
    }
  }

  function Login() {
    if (email.length > 0 && password.length > 0) {
      SignIn(inputs)
        .then((res) => {
          CommonLoginSuccess(res.data.vridge_session)
        })
        .catch((err) => {
          // console.log(err.response.data.message)
          SetLoginMessage('이메일 또는 비밀번호가 일치하지 않습니다.')
        })
    } else {
      if (email.length === 0) SetLoginMessage('아이디를 입력해주세요.')
      else SetLoginMessage('비밀번호를 입력해주세요.')
    }
  }

  return (
    <PageTemplate auth={true} noLogin={true}>
      <div className="Auth_Form">
        <div className="form_wrap">
          <div className="title">로그인</div>
          <input
            type="text"
            name="email"
            placeholder="이메일"
            className="ty01 mt50"
            value={email}
            onChange={OnChange}
          />

          <input
            type="password"
            name="password"
            placeholder="비밀번호"
            className="ty01 mt10"
            value={password}
            onChange={OnChange}
          />
          {login_message && <div className="error">{login_message}</div>}
          <div className="find_link tr" onClick={() => navigate('/ResetPw')}>
            비밀번호 찾기
          </div>
          <button className="submit mt20" onClick={Login}>
            로그인
          </button>
          <div className="mt20 signup_link">
            브이릿지가 처음이신가요?{' '}
            <span onClick={() => navigate('/Signup')}>간편 가입하기</span>
          </div>
          <div className="line"></div>
          <div className="sns_login">
            <ul>
              <KakaoLogin
                token={process.env.REACT_APP_KAKAO_API_KEY}
                onSuccess={(json) => {
                  KakaoLoginAPI({ access_token: json.response.access_token })
                    .then((res) => {
                      CommonLoginSuccess(res.data.vridge_session)
                    })
                    .catch((err) => {
                      CommonErrorMessage(err)
                    })
                }}
                onFail={console.error}
                onLogout={console.info}
                useLoginForm
                render={({ onClick }) => {
                  return (
                    <li
                      onClick={(e) => {
                        onClick()
                      }}
                      className="kakao"
                    >
                      카카오 로그인
                    </li>
                  )
                }}
              />

              <li
                onClick={useGoogleLogin({
                  onSuccess: (res) => {
                    // console.log(res)
                    GoogleLoginAPI(res)
                      .then((res) => {
                        console.log(res)
                        CommonLoginSuccess(res.data.vridge_session)
                      })
                      .catch((err) => {
                        CommonErrorMessage(err)
                      })
                  },
                  onError: (err) => console.log(err),
                  scope:
                    'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
                  state: String(Math.floor(Math.random() * 10000)),
                  include_granted_scopes: true,
                })}
                className="google"
              >
                구글 로그인
              </li>
              {/* <li>
                <GoogleLogin
                  onSuccess={(res) => {
                    console.log(res)

                    GoogleLoginAPI(res)
                      .then((res) => {
                        console.log(res)
                        // CommonLoginSuccess(res.data.vridge_session)
                      })
                      .catch((err) => {
                        CommonErrorMessage(err)
                      })
                  }}
                  onFailure={(err) => {
                    console.log(err)
                  }}
                  type="icon"
                  shape="circle"
                  size="large"
                  width="400px"
                />
              </li> */}
              <li
                onClick={() => {
                  window.location.href = NAVER_AUTH_URL
                }}
                className="naver"
              >
                네이버 로그인
              </li>
            </ul>
          </div>
        </div>
      </div>
    </PageTemplate>
  )
}
