
import PageTemplate from '../../components/PageTemplate'
import queryString from 'query-string'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from '../../util/nextNavigation'
import { checkSession, refetchProject } from '../../util/util'
import { useDispatch } from 'react-redux'

import logo from '../../images/Common/logo.svg'
import { AcceptInvite } from '../../api/project'

export default function EmailCheck() {
  const { navigate } = useRouter()
  const dispatch = useDispatch()
  const [param] = useSearchParams()
  const { uid, token } = queryString.parse(param.toString())
  const [result, SetResult] = useState('')

  useEffect(() => {
    console.log('[EmailCheck] Component loaded with params:', { uid, token })
    console.log('[EmailCheck] Full URL:', typeof window !== 'undefined' && window.location.href)
    console.log('[EmailCheck] Search params:', param.toString())
    
    if (checkSession()) {
      if (uid && token) {
        console.log('[EmailCheck] Calling AcceptInvite API with:', { uid, token })
        AcceptInvite(uid, token)
          .then((res) => {
            console.log('[EmailCheck] AcceptInvite success:', res)
            SetResult('success')
          })
          .catch((err) => {
            console.error('[EmailCheck] AcceptInvite error:', err)
            console.error('[EmailCheck] Error response:', err.response)
            console.error('[EmailCheck] Error status:', err.response?.status)
            console.error('[EmailCheck] Error data:', err.response?.data)
            
            if (err.response?.status === 404) {
              console.error('[EmailCheck] 404 Error - API endpoint not found')
              console.error('[EmailCheck] Request URL:', err.config?.url)
            }
            
            SetResult('fail')
          })
      }
    } else {
      console.log('[EmailCheck] No session, redirecting to login')
      navigate(`/login?uid=${uid}&token=${token}`)
    }
  }, [])

  return (
    <PageTemplate auth={true} noLogin={true}>
      <div className="Auth_Form bg">
        <div className="form_wrap">
          <div className="emailcheck">
            <div className="logo">
              <img src={logo.src || logo} />
            </div>
            {/* 인증o */}
            {result === 'success' ? (
              <>
                <div className="ment">
                  안녕하세요, <br />
                  <span className="en">vlanet</span>를 함께 사용하도록
                  초대받으셨습니다.
                </div>
                <button
                  onClick={() => {
                    refetchProject(dispatch, navigate)
                    navigate('/cmshome')
                  }}
                  className="submit"
                >
                  시작하기
                </button>
              </>
            ) : result === 'fail' ? (
              // 인증 x
              <div className="ment">
                죄송합니다,
                <br />
                계정 이메일과 초대받은 이메일이
                <br />
                <span className="un">일치하지 않습니다.</span>
              </div>
            ) : (
              <div className="ment">이메일 확인중...</div>
            )}
          </div>
        </div>
      </div>
    </PageTemplate>
  )
}
