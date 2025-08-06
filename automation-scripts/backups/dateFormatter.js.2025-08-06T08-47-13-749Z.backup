import moment from 'moment'
import 'moment/locale/ko'

// 한국어 로케일 설정
moment.locale('ko')

/**
 * 날짜를 그룹화용 문자열로 변환
 * @param {Date|string} date - 날짜
 * @returns {string} YYYY.MM.DD.dd 형식
 */
export const formatDateForGroup = (date) => {
  return moment(date).format('YYYY.MM.DD.dd')
}

/**
 * 짧은 날짜 시간 형식
 * @param {Date|string} date - 날짜
 * @returns {string} MM.DD HH:mm 형식
 */
export const formatShortDateTime = (date) => {
  return moment(date).format('MM.DD HH:mm')
}

/**
 * 전체 날짜 시간 형식
 * @param {Date|string} date - 날짜
 * @returns {string} YYYY.MM.DD HH:mm 형식
 */
export const formatFullDateTime = (date) => {
  return moment(date).format('YYYY.MM.DD HH:mm')
}

/**
 * 날짜만 표시
 * @param {Date|string} date - 날짜
 * @returns {string} YYYY.MM.DD 형식
 */
export const formatDate = (date) => {
  return moment(date).format('YYYY.MM.DD')
}

/**
 * 상대 시간 표시 (예: 3분 전, 2시간 전)
 * @param {Date|string} date - 날짜
 * @returns {string}
 */
export const formatRelativeTime = (date) => {
  return moment(date).fromNow()
}

/**
 * 시간을 MM:SS 형식으로 변환
 * @param {number} seconds - 초 단위 시간
 * @returns {string} MM:SS 형식
 */
export const formatTimeCode = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * MM:SS 형식을 초로 변환
 * @param {string} timeCode - MM:SS 형식 문자열
 * @returns {number} 초 단위 시간
 */
export const parseTimeCode = (timeCode) => {
  if (!timeCode) return 0
  const parts = timeCode.split(':')
  const minutes = parseInt(parts[0]) || 0
  const seconds = parseInt(parts[1]) || 0
  return minutes * 60 + seconds
}