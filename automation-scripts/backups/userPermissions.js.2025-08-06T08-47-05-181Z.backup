// 사용자 권한 관련 유틸리티 함수

/**
 * 프로젝트 관리자인지 확인
 * @param {string} userEmail - 현재 사용자 이메일
 * @param {Object} project - 프로젝트 객체
 * @returns {boolean}
 */
export const isProjectAdmin = (userEmail, project) => {
  if (!project || !userEmail) return false
  
  // 프로젝트 소유자인 경우
  if (userEmail === project.owner_email) return true
  
  // 매니저 권한이 있는 멤버인 경우
  if (project.member_list && Array.isArray(project.member_list)) {
    return project.member_list.some(member => 
      member.email === userEmail && member.rating === 'manager'
    )
  }
  
  return false
}

/**
 * 콘텐츠 소유자인지 확인
 * @param {string} userEmail - 현재 사용자 이메일
 * @param {Object} content - 피드백/코멘트 객체
 * @returns {boolean}
 */
export const isContentOwner = (userEmail, content) => {
  if (!content || !userEmail) return false
  
  return (
    content.user_email === userEmail ||
    content.email === userEmail ||
    content.owner === userEmail ||
    content.created_by === userEmail
  )
}

/**
 * 사용자 표시 이름 가져오기
 * @param {Object} content - 피드백/코멘트 객체
 * @returns {string}
 */
export const getDisplayName = (content) => {
  if (!content) return '익명'
  
  // 익명 모드
  if (content.secret || content.security || content.display_mode === 'anonymous') {
    return '익명'
  }
  
  // 닉네임 모드
  if (content.display_mode === 'nickname' && content.nickname) {
    return content.nickname
  }
  
  // 닉네임이 있는 경우
  if (content.nickname || content.user_nickname) {
    return content.nickname || content.user_nickname
  }
  
  // 이메일만 있는 경우
  if (content.user_email || content.email) {
    const email = content.user_email || content.email
    return email.split('@')[0]
  }
  
  return '익명'
}

/**
 * 사용자 역할 라벨 가져오기
 * @param {string} userEmail - 사용자 이메일
 * @param {Object} project - 프로젝트 객체
 * @returns {Object} { label: string, className: string }
 */
export const getUserRoleLabel = (userEmail, project) => {
  if (isProjectAdmin(userEmail, project)) {
    return { label: '관리자', className: 'admin' }
  }
  return { label: '일반', className: 'basic' }
}