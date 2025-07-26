// Redux 관련 타입 정의
import { Project, User, Video, Feedback, Activity } from './api'
import { LoadingState, ApiError } from './common'

// Redux Store 상태 타입
export interface RootState {
  AuthStore: AuthState
  ProjectStore: ProjectState
  VideoStore: VideoState
  FeedbackStore: FeedbackState
  UIStore: UIState
  NotificationStore: NotificationState
}

// 인증 상태
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: ApiError | null
}

// 프로젝트 상태
export interface ProjectState {
  project_list: Project[] | null
  current_project: Project | null
  this_month_project: Project[] | null
  next_month_project: Project[] | null
  loading: LoadingState
  error: ApiError | null
  filters: ProjectFilters
  sort: ProjectSort
}

export interface ProjectFilters {
  status?: string[]
  phase?: string[]
  client?: string[]
  dateRange?: {
    start: string
    end: string
  }
}

export interface ProjectSort {
  field: 'name' | 'created_at' | 'updated_at' | 'deadline'
  order: 'asc' | 'desc'
}

// 비디오 상태
export interface VideoState {
  videos: Video[]
  currentVideo: Video | null
  uploadProgress: number
  loading: LoadingState
  error: ApiError | null
}

// 피드백 상태
export interface FeedbackState {
  feedbacks: Feedback[]
  selectedFeedback: Feedback | null
  filter: FeedbackFilter
  loading: LoadingState
  error: ApiError | null
}

export interface FeedbackFilter {
  status?: 'all' | 'open' | 'resolved'
  projectId?: string
  videoId?: string
}

// UI 상태
export interface UIState {
  theme: 'light' | 'dark' | 'auto'
  sidebarOpen: boolean
  modalStack: ModalState[]
  toasts: ToastState[]
  globalLoading: boolean
  breadcrumbs: BreadcrumbItem[]
}

export interface ModalState {
  id: string
  component: string
  props?: Record<string, any>
}

export interface ToastState {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface BreadcrumbItem {
  label: string
  path?: string
  icon?: string
}

// 알림 상태
export interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: ApiError | null
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
  data?: Record<string, any>
}

export type NotificationType = 
  | 'project_invite' 
  | 'feedback_received' 
  | 'video_processed' 
  | 'mention' 
  | 'deadline_reminder'

// Action 타입들
export interface Action<T = any> {
  type: string
  payload?: T
  error?: boolean
  meta?: any
}

// Auth Actions
export interface LoginAction extends Action {
  type: 'auth/login'
  payload: {
    email: string
    password: string
  }
}

export interface LoginSuccessAction extends Action {
  type: 'auth/loginSuccess'
  payload: {
    user: User
    token: string
  }
}

export interface LoginFailureAction extends Action {
  type: 'auth/loginFailure'
  payload: ApiError
}

export interface LogoutAction extends Action {
  type: 'auth/logout'
}

// Project Actions
export interface FetchProjectsAction extends Action {
  type: 'projects/fetch'
}

export interface FetchProjectsSuccessAction extends Action {
  type: 'projects/fetchSuccess'
  payload: Project[]
}

export interface FetchProjectsFailureAction extends Action {
  type: 'projects/fetchFailure'
  payload: ApiError
}

export interface UpdateProjectAction extends Action {
  type: 'projects/update'
  payload: {
    id: string
    updates: Partial<Project>
  }
}

export interface SetCurrentProjectAction extends Action {
  type: 'projects/setCurrent'
  payload: Project | null
}

export interface SetProjectFiltersAction extends Action {
  type: 'projects/setFilters'
  payload: ProjectFilters
}

// UI Actions
export interface SetThemeAction extends Action {
  type: 'ui/setTheme'
  payload: 'light' | 'dark' | 'auto'
}

export interface ToggleSidebarAction extends Action {
  type: 'ui/toggleSidebar'
}

export interface ShowModalAction extends Action {
  type: 'ui/showModal'
  payload: ModalState
}

export interface HideModalAction extends Action {
  type: 'ui/hideModal'
  payload: string // modal id
}

export interface ShowToastAction extends Action {
  type: 'ui/showToast'
  payload: Omit<ToastState, 'id'>
}

export interface HideToastAction extends Action {
  type: 'ui/hideToast'
  payload: string // toast id
}

// Thunk Action Types
export type AppThunk<ReturnType = void> = (
  dispatch: AppDispatch,
  getState: () => RootState
) => ReturnType

export type AppDispatch = (action: Action | AppThunk) => any

// Selector 타입
export type Selector<TResult> = (state: RootState) => TResult

// 유틸리티 타입
export type ActionCreator<TAction extends Action> = (...args: any[]) => TAction

export interface AsyncActionCreators<TRequest, TSuccess, TFailure> {
  request: ActionCreator<Action<TRequest>>
  success: ActionCreator<Action<TSuccess>>
  failure: ActionCreator<Action<TFailure>>
}

// Middleware 타입
export interface Middleware {
  (store: MiddlewareAPI): (
    next: Dispatch<Action>
  ) => (action: Action) => any
}

export interface MiddlewareAPI {
  dispatch: AppDispatch
  getState: () => RootState
}

export type Dispatch<TAction> = (action: TAction) => TAction

// 리듀서 타입
export type Reducer<TState = any, TAction extends Action = Action> = (
  state: TState | undefined,
  action: TAction
) => TState

// 액션 타입 상수
export const ActionTypes = {
  // Auth
  AUTH_LOGIN: 'auth/login',
  AUTH_LOGIN_SUCCESS: 'auth/loginSuccess',
  AUTH_LOGIN_FAILURE: 'auth/loginFailure',
  AUTH_LOGOUT: 'auth/logout',
  AUTH_REFRESH_TOKEN: 'auth/refreshToken',
  
  // Projects
  PROJECTS_FETCH: 'projects/fetch',
  PROJECTS_FETCH_SUCCESS: 'projects/fetchSuccess',
  PROJECTS_FETCH_FAILURE: 'projects/fetchFailure',
  PROJECTS_CREATE: 'projects/create',
  PROJECTS_UPDATE: 'projects/update',
  PROJECTS_DELETE: 'projects/delete',
  PROJECTS_SET_CURRENT: 'projects/setCurrent',
  PROJECTS_SET_FILTERS: 'projects/setFilters',
  PROJECTS_SET_SORT: 'projects/setSort',
  
  // Videos
  VIDEOS_FETCH: 'videos/fetch',
  VIDEOS_UPLOAD: 'videos/upload',
  VIDEOS_UPDATE_PROGRESS: 'videos/updateProgress',
  VIDEOS_DELETE: 'videos/delete',
  
  // Feedback
  FEEDBACK_FETCH: 'feedback/fetch',
  FEEDBACK_CREATE: 'feedback/create',
  FEEDBACK_UPDATE: 'feedback/update',
  FEEDBACK_RESOLVE: 'feedback/resolve',
  
  // UI
  UI_SET_THEME: 'ui/setTheme',
  UI_TOGGLE_SIDEBAR: 'ui/toggleSidebar',
  UI_SHOW_MODAL: 'ui/showModal',
  UI_HIDE_MODAL: 'ui/hideModal',
  UI_SHOW_TOAST: 'ui/showToast',
  UI_HIDE_TOAST: 'ui/hideToast',
  UI_SET_LOADING: 'ui/setLoading',
  UI_SET_BREADCRUMBS: 'ui/setBreadcrumbs',
  
  // Notifications
  NOTIFICATIONS_FETCH: 'notifications/fetch',
  NOTIFICATIONS_MARK_READ: 'notifications/markRead',
  NOTIFICATIONS_CLEAR: 'notifications/clear',
} as const