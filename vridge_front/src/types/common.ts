// 공통 유틸리티 타입
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type Maybe<T> = T | null | undefined

// 객체 키 타입
export type KeyOf<T> = keyof T
export type ValueOf<T> = T[keyof T]

// 부분 타입
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// 읽기 전용 타입
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

// 필수 타입
export type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>
}[keyof T]

// 특정 키 제외
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

// 함수 타입
export type AsyncFunction<T = void> = () => Promise<T>
export type AsyncFunctionWithArgs<TArgs, TReturn = void> = (args: TArgs) => Promise<TReturn>

// 이벤트 핸들러
export type ChangeHandler<T = HTMLInputElement> = React.ChangeEventHandler<T>
export type ClickHandler<T = HTMLButtonElement> = React.MouseEventHandler<T>
export type FormHandler = React.FormEventHandler<HTMLFormElement>
export type KeyboardHandler<T = HTMLElement> = React.KeyboardEventHandler<T>

// 에러 타입
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp?: string
}

// 페이지네이션
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// 정렬
export interface SortOptions {
  field: string
  order: 'asc' | 'desc'
}

// 필터
export interface FilterOptions {
  [key: string]: any
}

// API 응답
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  meta?: {
    pagination?: Pagination
    timestamp?: string
  }
}

// 리스트 응답
export interface ListResponse<T> {
  items: T[]
  pagination: Pagination
}

// 상태 타입
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
  state: LoadingState
}

// 폼 타입
export interface FormField<T = string> {
  value: T
  error?: string
  touched?: boolean
  dirty?: boolean
}

export interface FormState<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  isValid: boolean
}

// 테마 타입
export type ColorScheme = 'light' | 'dark' | 'auto'
export type ThemeMode = 'light' | 'dark'

// 사이즈 타입
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type ButtonSize = 'small' | 'medium' | 'large'
export type Spacing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

// 상태 색상
export type Status = 'success' | 'warning' | 'error' | 'info'
export type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

// 위치 타입
export type Position = 'top' | 'right' | 'bottom' | 'left'
export type Alignment = 'start' | 'center' | 'end'
export type Direction = 'horizontal' | 'vertical'

// 날짜 타입
export type DateString = string // ISO 8601
export type TimeString = string // HH:mm:ss
export type DateTimeString = string // ISO 8601 with time

// 파일 타입
export interface FileInfo {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: DateTimeString
}

// 사용자 타입
export interface User {
  id: string
  email: string
  nickname: string
  profileImage?: string
  role: UserRole
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export type UserRole = 'admin' | 'manager' | 'member' | 'viewer'

// 권한 타입
export interface Permission {
  resource: string
  action: string
  allowed: boolean
}

// 알림 타입
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  read: boolean
  createdAt: DateTimeString
}

// 검색 타입
export interface SearchParams {
  query: string
  filters?: FilterOptions
  sort?: SortOptions
  pagination?: Pick<Pagination, 'page' | 'limit'>
}