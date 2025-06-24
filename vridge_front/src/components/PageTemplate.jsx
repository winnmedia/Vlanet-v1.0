import './PageTemplate.scss'
import cx from 'classnames'
import { useNavigate } from 'react-router-dom'

import logo from 'images/Common/b_logo.svg'
import profile from 'images/Cms/profie_sample.png'
import Header from './Header'
import LoginIntro from './LoginIntro'
import { useEffect } from 'react'
import { checkSession } from 'util/util'
import { useSelector } from 'react-redux'

export default function PageTemplate({
  // 초기값 지정
  leftItems,
  rightItems = [],
  header = true,
  footer = false,
  navigation = true,
  children,
  auth,
  props,
  noLogin,
}) {
  const navigate = useNavigate()
  const { nickname, user } = useSelector((s) => s.ProjectStore)

  useEffect(() => {
    if (!noLogin) {
      const session = checkSession()
      if (!session) {
        navigate('/Login', { replace: true })
      }
    }
  }, [])

  // if (rightItems === undefined)
  //   rightItems = [
  //     {
  //       type: 'img',
  //       src: profile,
  //       className: 'profile',
  //     },
  //   ]
  if (leftItems === undefined)
    leftItems = [
      {
        type: 'img',
        src: logo,
        className: 'logo',
      },
    ]
  if (nickname) {
    rightItems = [
      {
        type: 'string',
        className: 'nick',
        text: nickname.substr(0, 1),
      },
      {
        type: 'string',
        className: 'mail',
        text: user ? user : nickname,
      },
    ]
  }

  return (
    <div className={cx('PageTemplate', { auth: auth })}>
      {auth ? (
        <>
          <LoginIntro />
          {children}
        </>
      ) : (
        <>
          {header && <Header leftItems={leftItems} rightItems={rightItems} />}
          {children}
        </>
      )}
    </div>
  )
}
