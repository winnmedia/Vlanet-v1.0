// 워크플로우 상태 관리
const initialState = {
  // 현재 활성 워크플로우
  activeWorkflow: null,
  
  // 워크플로우 단계 정보
  stages: {
    planning: {
      id: 'planning',
      name: '기획',
      status: 'pending', // pending, in_progress, completed
      progress: 0,
      tasks: []
    },
    schedule: {
      id: 'schedule',
      name: '일정',
      status: 'pending',
      progress: 0,
      tasks: []
    },
    feedback: {
      id: 'feedback',
      name: '피드백',
      status: 'pending',
      progress: 0,
      tasks: []
    }
  },
  
  // 워크플로우 전체 진행률
  overallProgress: 0,
  
  // 워크플로우 히스토리
  history: [],
  
  // 알림 및 이벤트
  notifications: [],
  
  // 로딩 상태
  loading: false,
  error: null
}

// 액션 타입
const SET_ACTIVE_WORKFLOW = 'workflow/SET_ACTIVE_WORKFLOW'
const UPDATE_STAGE_STATUS = 'workflow/UPDATE_STAGE_STATUS'
const UPDATE_STAGE_PROGRESS = 'workflow/UPDATE_STAGE_PROGRESS'
const ADD_STAGE_TASK = 'workflow/ADD_STAGE_TASK'
const UPDATE_TASK_STATUS = 'workflow/UPDATE_TASK_STATUS'
const CALCULATE_OVERALL_PROGRESS = 'workflow/CALCULATE_OVERALL_PROGRESS'
const ADD_NOTIFICATION = 'workflow/ADD_NOTIFICATION'
const CLEAR_NOTIFICATIONS = 'workflow/CLEAR_NOTIFICATIONS'
const ADD_HISTORY = 'workflow/ADD_HISTORY'
const SET_LOADING = 'workflow/SET_LOADING'
const SET_ERROR = 'workflow/SET_ERROR'

// 액션 생성자
export const setActiveWorkflow = (projectId) => ({
  type: SET_ACTIVE_WORKFLOW,
  payload: projectId
})

export const updateStageStatus = (stageId, status) => ({
  type: UPDATE_STAGE_STATUS,
  payload: { stageId, status }
})

export const updateStageProgress = (stageId, progress) => ({
  type: UPDATE_STAGE_PROGRESS,
  payload: { stageId, progress }
})

export const addStageTask = (stageId, task) => ({
  type: ADD_STAGE_TASK,
  payload: { stageId, task }
})

export const updateTaskStatus = (stageId, taskId, status) => ({
  type: UPDATE_TASK_STATUS,
  payload: { stageId, taskId, status }
})

export const calculateOverallProgress = () => ({
  type: CALCULATE_OVERALL_PROGRESS
})

export const addNotification = (notification) => ({
  type: ADD_NOTIFICATION,
  payload: notification
})

export const clearNotifications = () => ({
  type: CLEAR_NOTIFICATIONS
})

export const addHistory = (entry) => ({
  type: ADD_HISTORY,
  payload: entry
})

export const setLoading = (loading) => ({
  type: SET_LOADING,
  payload: loading
})

export const setError = (error) => ({
  type: SET_ERROR,
  payload: error
})

// 리듀서
export default function workflowReducer(state = initialState, action) {
  switch (action.type) {
    case SET_ACTIVE_WORKFLOW:
      return {
        ...state,
        activeWorkflow: action.payload
      }
      
    case UPDATE_STAGE_STATUS:
      return {
        ...state,
        stages: {
          ...state.stages,
          [action.payload.stageId]: {
            ...state.stages[action.payload.stageId],
            status: action.payload.status
          }
        }
      }
      
    case UPDATE_STAGE_PROGRESS:
      return {
        ...state,
        stages: {
          ...state.stages,
          [action.payload.stageId]: {
            ...state.stages[action.payload.stageId],
            progress: action.payload.progress
          }
        }
      }
      
    case ADD_STAGE_TASK:
      return {
        ...state,
        stages: {
          ...state.stages,
          [action.payload.stageId]: {
            ...state.stages[action.payload.stageId],
            tasks: [...state.stages[action.payload.stageId].tasks, action.payload.task]
          }
        }
      }
      
    case UPDATE_TASK_STATUS:
      return {
        ...state,
        stages: {
          ...state.stages,
          [action.payload.stageId]: {
            ...state.stages[action.payload.stageId],
            tasks: state.stages[action.payload.stageId].tasks.map(task =>
              task.id === action.payload.taskId
                ? { ...task, status: action.payload.status }
                : task
            )
          }
        }
      }
      
    case CALCULATE_OVERALL_PROGRESS:
      const stages = Object.values(state.stages)
      const totalProgress = stages.reduce((sum, stage) => sum + stage.progress, 0)
      const overallProgress = Math.round(totalProgress / stages.length)
      
      return {
        ...state,
        overallProgress
      }
      
    case ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, {
          ...action.payload,
          id: Date.now(),
          timestamp: new Date().toISOString()
        }]
      }
      
    case CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: []
      }
      
    case ADD_HISTORY:
      return {
        ...state,
        history: [...state.history, {
          ...action.payload,
          timestamp: new Date().toISOString()
        }]
      }
      
    case SET_LOADING:
      return {
        ...state,
        loading: action.payload
      }
      
    case SET_ERROR:
      return {
        ...state,
        error: action.payload
      }
      
    default:
      return state
  }
}

// Thunk 액션 - 워크플로우 초기화
export const initializeWorkflow = (projectId) => (dispatch, getState) => {
  dispatch(setActiveWorkflow(projectId))
  
  // 프로젝트 데이터에서 현재 상태 분석
  const { ProjectStore } = getState()
  const project = ProjectStore.project_list?.find(p => p.id === parseInt(projectId))
  
  if (project) {
    // 기획 단계 상태 업데이트
    if (project.video_planning_count > 0) {
      dispatch(updateStageStatus('planning', 'completed'))
      dispatch(updateStageProgress('planning', 100))
    }
    
    // 일정 단계 상태 업데이트
    if (project.process && project.process.length > 0) {
      dispatch(updateStageStatus('schedule', 'completed'))
      dispatch(updateStageProgress('schedule', 100))
    }
    
    // 피드백 단계 상태 업데이트
    if (project.feedback_count > 0) {
      dispatch(updateStageStatus('feedback', 'in_progress'))
      dispatch(updateStageProgress('feedback', 50))
    }
    
    // 전체 진행률 계산
    dispatch(calculateOverallProgress())
    
    // 히스토리 추가
    dispatch(addHistory({
      action: 'workflow_initialized',
      projectId,
      projectName: project.name
    }))
  }
}

// 워크플로우 단계 완료 처리
export const completeStage = (stageId) => (dispatch, getState) => {
  dispatch(updateStageStatus(stageId, 'completed'))
  dispatch(updateStageProgress(stageId, 100))
  
  // 다음 단계 활성화
  const stageOrder = ['planning', 'schedule', 'feedback']
  const currentIndex = stageOrder.indexOf(stageId)
  
  if (currentIndex < stageOrder.length - 1) {
    const nextStage = stageOrder[currentIndex + 1]
    dispatch(updateStageStatus(nextStage, 'in_progress'))
    
    // 알림 추가
    dispatch(addNotification({
      type: 'stage_completed',
      title: `${getState().workflow.stages[stageId].name} 단계 완료`,
      message: `${getState().workflow.stages[nextStage].name} 단계로 진행하세요.`,
      level: 'success'
    }))
  }
  
  dispatch(calculateOverallProgress())
}