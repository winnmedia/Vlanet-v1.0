import moment from 'moment'

/**
 * 프로젝트 단계 완료 시 후속 단계들의 일정을 자동으로 조정하는 함수
 * @param {Object} project - 프로젝트 전체 데이터
 * @param {string} completedPhaseKey - 완료된 단계의 키 (예: 'basic_plan')
 * @param {Date} actualCompletionDate - 실제 완료 날짜
 * @returns {Object} 조정된 프로젝트 일정 데이터
 */
export function adjustScheduleOnPhaseComplete(project, completedPhaseKey, actualCompletionDate = new Date()) {
  const phases = [
    'basic_plan',
    'story_board', 
    'filming',
    'video_edit',
    'post_work',
    'video_preview',
    'confirmation',
    'video_delivery'
  ]
  
  // 완료된 단계의 인덱스 찾기
  const completedIndex = phases.indexOf(completedPhaseKey)
  if (completedIndex === -1 || completedIndex === phases.length - 1) {
    // 잘못된 단계이거나 마지막 단계인 경우 조정 불필요
    return project
  }
  
  // 완료된 단계의 원래 종료일과 실제 완료일 비교
  const completedPhase = project[completedPhaseKey]
  if (!completedPhase || !completedPhase.end_date) {
    return project
  }
  
  const originalEndDate = moment(completedPhase.end_date)
  const actualEndDate = moment(actualCompletionDate)
  
  // 지연 또는 단축된 일수 계산 (양수: 지연, 음수: 단축)
  const daysDiff = actualEndDate.diff(originalEndDate, 'days')
  
  if (daysDiff === 0) {
    // 예정대로 완료된 경우 조정 불필요
    return project
  }
  
  // 조정된 일정 데이터 생성
  const adjustedSchedule = {}
  
  // 후속 단계들의 일정 조정
  for (let i = completedIndex + 1; i < phases.length; i++) {
    const phaseKey = phases[i]
    const phase = project[phaseKey]
    
    if (phase && phase.start_date && phase.end_date) {
      // 원래 일정에서 daysDiff만큼 이동
      adjustedSchedule[phaseKey] = {
        start_date: moment(phase.start_date).add(daysDiff, 'days').format('YYYY-MM-DD HH:mm'),
        end_date: moment(phase.end_date).add(daysDiff, 'days').format('YYYY-MM-DD HH:mm')
      }
    }
  }
  
  return adjustedSchedule
}

/**
 * 단계 간 일정 충돌이나 겹침을 확인하고 자동으로 조정하는 함수
 * @param {Array} phases - 모든 단계의 일정 배열
 * @returns {Array} 조정된 일정 배열
 */
export function resolveScheduleConflicts(phases) {
  const sortedPhases = [...phases].sort((a, b) => 
    moment(a.start_date).valueOf() - moment(b.start_date).valueOf()
  )
  
  const adjustedPhases = []
  
  for (let i = 0; i < sortedPhases.length; i++) {
    const currentPhase = { ...sortedPhases[i] }
    
    if (i > 0) {
      const prevPhase = adjustedPhases[i - 1]
      const prevEnd = moment(prevPhase.end_date)
      const currentStart = moment(currentPhase.start_date)
      
      // 이전 단계가 끝나기 전에 현재 단계가 시작하는 경우
      if (currentStart.isBefore(prevEnd)) {
        // 현재 단계를 이전 단계 종료 다음날로 이동
        const newStartDate = prevEnd.clone().add(1, 'day').hours(9).minutes(0)
        const duration = moment(currentPhase.end_date).diff(moment(currentPhase.start_date), 'days')
        
        currentPhase.start_date = newStartDate.format('YYYY-MM-DD HH:mm')
        currentPhase.end_date = newStartDate.clone().add(duration, 'days').hours(18).minutes(0).format('YYYY-MM-DD HH:mm')
      }
    }
    
    adjustedPhases.push(currentPhase)
  }
  
  return adjustedPhases
}

/**
 * 실제 소요 시간을 기반으로 향후 프로젝트의 예상 일정을 계산하는 함수
 * @param {Object} historicalData - 과거 프로젝트의 실제 소요 시간 데이터
 * @param {Date} projectStartDate - 새 프로젝트의 시작일
 * @returns {Object} 예상 일정
 */
export function calculateEstimatedSchedule(historicalData, projectStartDate) {
  const phases = [
    { key: 'basic_plan', defaultDays: 2 },
    { key: 'story_board', defaultDays: 2 },
    { key: 'filming', defaultDays: 3 },
    { key: 'video_edit', defaultDays: 3 },
    { key: 'post_work', defaultDays: 2 },
    { key: 'video_preview', defaultDays: 1 },
    { key: 'confirmation', defaultDays: 1 },
    { key: 'video_delivery', defaultDays: 0 }
  ]
  
  const schedule = {}
  let currentDate = moment(projectStartDate).hours(9).minutes(0)
  
  phases.forEach(phase => {
    // 과거 데이터가 있으면 평균값 사용, 없으면 기본값 사용
    const estimatedDays = historicalData[phase.key]?.averageDays || phase.defaultDays
    
    schedule[phase.key] = {
      start_date: currentDate.format('YYYY-MM-DD HH:mm'),
      end_date: currentDate.clone().add(estimatedDays, 'days').hours(18).minutes(0).format('YYYY-MM-DD HH:mm'),
      estimatedDays
    }
    
    // 다음 단계는 다음날부터 시작
    currentDate = currentDate.add(estimatedDays + 1, 'days').hours(9).minutes(0)
  })
  
  return schedule
}