import moment from 'moment'

/**
 * 날짜를 백엔드가 기대하는 형식으로 포맷팅
 * @param {Date|string|null} date - 날짜 객체 또는 문자열
 * @returns {string|null} - 포맷된 날짜 문자열 또는 null
 */
export const formatDateForBackend = (date) => {
  if (!date) return null
  
  try {
    // moment 객체로 변환
    const momentDate = moment(date)
    
    // 유효한 날짜인지 확인
    if (!momentDate.isValid()) {
      console.warn('Invalid date:', date)
      return null
    }
    
    // YYYY-MM-DD HH:mm 형식으로 반환
    return momentDate.format('YYYY-MM-DD HH:mm')
  } catch (error) {
    console.error('Date formatting error:', error)
    return null
  }
}

/**
 * 프로세스 배열의 날짜들을 백엔드 형식으로 변환
 * @param {Array} processArray - 프로세스 배열
 * @returns {Array} - 포맷된 프로세스 배열
 */
export const formatProcessDatesForBackend = (processArray) => {
  return processArray.map(item => ({
    key: item.key,
    startDate: formatDateForBackend(item.startDate),
    endDate: formatDateForBackend(item.endDate)
  }))
}

/**
 * 날짜가 유효한지 확인
 * @param {any} date - 확인할 날짜
 * @returns {boolean} - 유효 여부
 */
export const isValidDate = (date) => {
  if (!date) return false
  const momentDate = moment(date)
  return momentDate.isValid()
}

/**
 * 두 날짜 사이의 일수 계산
 * @param {Date|string} startDate - 시작일
 * @param {Date|string} endDate - 종료일
 * @returns {number} - 일수 차이
 */
export const getDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0
  
  const start = moment(startDate).startOf('day')
  const end = moment(endDate).startOf('day')
  
  return end.diff(start, 'days') + 1
}

/**
 * 날짜를 사용자 친화적인 형식으로 표시
 * @param {Date|string} date - 날짜
 * @returns {string} - 포맷된 날짜 문자열
 */
export const formatDateForDisplay = (date) => {
  if (!date) return ''
  
  const momentDate = moment(date)
  if (!momentDate.isValid()) return ''
  
  return momentDate.format('YYYY년 MM월 DD일 HH시 mm분')
}

/**
 * 기본 시간을 설정한 날짜 생성
 * @param {Date|string} date - 날짜
 * @param {number} hour - 시간 (기본값: 9)
 * @param {number} minute - 분 (기본값: 0)
 * @returns {Date} - 시간이 설정된 날짜 객체
 */
export const setDefaultTime = (date, hour = 9, minute = 0) => {
  if (!date) return null
  
  const momentDate = moment(date)
  if (!momentDate.isValid()) return null
  
  return momentDate
    .hour(hour)
    .minute(minute)
    .second(0)
    .millisecond(0)
    .toDate()
}