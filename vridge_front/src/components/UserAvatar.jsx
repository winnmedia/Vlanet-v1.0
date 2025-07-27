import React from 'react'
import styles from './UserAvatar.module.scss'

/**
 * 사용자 아바타 컴포넌트
 * - 프로필 이미지가 있으면 이미지 표시
 * - 없으면 이름의 첫 글자 표시
 * - 원형 프레임에 맞춰서 이미지 표시
 * 
 * @param {Object} props
 * @param {string} props.profileImage - 프로필 이미지 URL
 * @param {string} props.name - 사용자 이름 (이니셜 표시용)
 * @param {number} props.size - 아바타 크기 (기본값: 40)
 * @param {string} props.className - 추가 CSS 클래스
 * @param {boolean} props.showBorder - 테두리 표시 여부
 * @param {function} props.onClick - 클릭 이벤트 핸들러
 */
const UserAvatar = ({ 
  profileImage, 
  name = '', 
  size = 40, 
  className = '', 
  showBorder = true,
  onClick 
}) => {
  // 이름에서 이니셜 추출
  const getInitial = (name) => {
    if (!name) return '?'
    // 한글 이름인 경우 첫 글자
    if (/[가-힣]/.test(name)) {
      return name.charAt(0)
    }
    // 영문 이름인 경우 첫 글자 대문자
    return name.charAt(0).toUpperCase()
  }

  // 프로필 이미지 URL 처리
  const getImageUrl = (url) => {
    if (!url) return null
    
    // 상대 경로인 경우 API URL 추가
    if (url.startsWith('/')) {
      return `${process.env.NEXT_PUBLIC_API_URL}${url}`
    }
    
    // 절대 경로인 경우 그대로 사용
    return url
  }

  const imageUrl = getImageUrl(profileImage)
  const initial = getInitial(name)
  
  // 사이즈별 폰트 크기 계산
  const fontSize = Math.floor(size * 0.4)

  return (
    <div
      className={`${styles['user-avatar']} ${className} ${showBorder ? styles['with-border'] : ''} ${onClick ? styles.clickable : ''}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      <div 
        className={styles['user-avatar-initial']}
        style={{ 
          fontSize: `${fontSize}px`,
          display: 'flex'
        }}
      >
        {initial}
      </div>
      
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={name}
          className={styles['user-avatar-image']}
          onError={(e) => {
            // 이미지 로드 실패 시 숨김
            e.target.style.display = 'none'
          }}
          style={{ display: 'block' }}
        />
      )}
    </div>
  )
}

export default UserAvatar