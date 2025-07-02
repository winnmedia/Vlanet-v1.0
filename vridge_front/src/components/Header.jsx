import cx from 'classnames'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import './Header.scss'

export default function Header({
  // 초기값 지정
  leftItems = [],
  rightItems = [],
  children,
  props,
}) {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const left = makeHtml(leftItems, navigate)
  const right = makeHtml(rightItems, navigate, () => setShowDropdown(!showDropdown))

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/Login', { replace: true })
  }

  return (
    <div className="Header">
      <div>{left}</div>
      <div className="profile-wrapper" ref={dropdownRef}>
        <div className="profile" onClick={() => setShowDropdown(!showDropdown)}>
          {right}
        </div>
        {showDropdown && (
          <div className="dropdown-menu">
            <div className="dropdown-item" onClick={() => {
              setShowDropdown(false)
              navigate('/MyPage')
            }}>
              <span className="dropdown-icon">👤</span>
              마이페이지
            </div>
            <div className="dropdown-item" onClick={() => {
              setShowDropdown(false)
              navigate('/CmsHome')
            }}>
              <span className="dropdown-icon">🏠</span>
              홈으로
            </div>
            <div className="dropdown-divider"></div>
            <div className="dropdown-item logout" onClick={handleLogout}>
              <span className="dropdown-icon">🚪</span>
              로그아웃
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// type에 따라서 헤더의 html을 만들어주는 함수
function makeHtml(items = [], navigate, onProfileClick) {
  return items.map((item, i) => {
    if (item.type === 'img') {
      const button = (
        <div key={i} className={item.className}>
          <img
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/CmsHome')}
            alt={`img_${i}`}
            src={item.src}
          />
        </div>
      )
      return button
    } else if (item.type === 'string') {
      const element = (
        <div 
          key={i} 
          className={cx(item.className, { clickable: item.className === 'nick' })}
          style={item.className === 'nick' ? { cursor: 'pointer' } : {}}
        >
          {item.text}
        </div>
      )
      return element
    }
  })
}