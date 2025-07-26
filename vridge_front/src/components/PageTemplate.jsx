
import cx from 'classnames'
import { useRouter } from '../util/nextNavigation'

// Next.js에서는 public 폴더의 이미지를 직접 경로로 참조
const logo = '/images/Common/w_logo02.svg'
const profile = '/images/Cms/profie_sample.png'
import Header from './Header'
import LoginIntro from './LoginIntro'
import { useEffect } from 'react'
import { checkSession } from '../util/util'
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
  const { navigate } = useRouter()
  const { nickname, user, profileImage } = useSelector((s) => s.ProjectStore)

  // 인증 체크를 각 페이지에서 처리하도록 변경
  // useEffect(() => {
  //   if (!noLogin) {
  //     const session = checkSession()
  //     if (!session) {
  //       navigate('/Login', { replace: true })
  //     }
  //   }
  // }, [noLogin])

  // if (rightItems === undefined)
  //   rightItems = [
  //     {
  //       type: 'img',
  //       src: profile.src || profile,
  //       className: 'profile',
  //     },
  //   ]
  if (leftItems === undefined) {
    leftItems = [
      {
        type: 'img',
        src: logo,
        className: 'logo',
      },
    ]
  }
  if (nickname) {
    rightItems = [
      {
        type: 'avatar',
        profileImage: profileImage,
        name: nickname,
        className: 'profile-avatar',
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
