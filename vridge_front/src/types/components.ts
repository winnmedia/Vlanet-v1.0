// 컴포넌트 Props 타입 정의
import { ReactNode, CSSProperties, RefObject } from 'react'
import { 
  Size, 
  Variant, 
  Status, 
  Position, 
  Alignment,
  ClickHandler,
  ChangeHandler,
  FormHandler,
  KeyboardHandler 
} from './common'

// 기본 컴포넌트 Props
export interface BaseComponentProps {
  className?: string
  style?: CSSProperties
  id?: string
  'data-testid'?: string
}

// 자식 요소를 가지는 컴포넌트
export interface WithChildren {
  children?: ReactNode
}

// 비활성화 가능한 컴포넌트
export interface Disableable {
  disabled?: boolean
}

// 로딩 상태를 가지는 컴포넌트
export interface Loadable {
  loading?: boolean
}

// 미니멀 컴포넌트 Props
export interface MinimalCardProps extends BaseComponentProps, WithChildren {
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'small' | 'normal' | 'large'
  role?: string
  ariaLabel?: string
  tabIndex?: number
  onKeyDown?: KeyboardHandler<HTMLDivElement>
  as?: keyof JSX.IntrinsicElements
}

export interface CardHeaderProps extends BaseComponentProps, WithChildren {
  title?: string
  subtitle?: string
  action?: ReactNode
  icon?: ReactNode
}

export interface CardContentProps extends BaseComponentProps, WithChildren {
  padding?: 'none' | 'small' | 'normal' | 'large'
}

export interface CardFooterProps extends BaseComponentProps, WithChildren {
  align?: Alignment
  divider?: boolean
}

export interface MinimalButtonProps extends BaseComponentProps, WithChildren, Disableable, Loadable {
  variant?: Variant
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  onClick?: ClickHandler
  type?: 'button' | 'submit' | 'reset'
  ariaLabel?: string
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  tooltip?: string
  tooltipPosition?: Position
  active?: boolean
  href?: string
  target?: string
  rel?: string
}

export interface ButtonGroupProps extends BaseComponentProps, WithChildren {
  spacing?: 'none' | 'small' | 'medium'
  direction?: 'horizontal' | 'vertical'
  fullWidth?: boolean
}

export interface MinimalInputProps extends BaseComponentProps, Disableable {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  name?: string
  value?: string
  defaultValue?: string
  placeholder?: string
  label?: string
  helperText?: string
  error?: string
  required?: boolean
  readOnly?: boolean
  autoFocus?: boolean
  autoComplete?: string
  maxLength?: number
  min?: number | string
  max?: number | string
  step?: number | string
  pattern?: string
  onChange?: ChangeHandler
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  onFocus?: React.FocusEventHandler<HTMLInputElement>
  onKeyDown?: KeyboardHandler<HTMLInputElement>
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  showCharacterCount?: boolean
  size?: 'small' | 'medium' | 'large'
}

export interface MinimalTextareaProps extends Omit<MinimalInputProps, 'type' | 'icon' | 'iconPosition'> {
  rows?: number
  cols?: number
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
  onChange?: ChangeHandler<HTMLTextAreaElement>
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>
  onKeyDown?: KeyboardHandler<HTMLTextAreaElement>
}

export interface StepWizardProps extends BaseComponentProps {
  steps: StepConfig[]
  currentStep: number
  onStepChange?: (step: number) => void
  onComplete?: () => void
  allowStepSkip?: boolean
  showStepNumbers?: boolean
  orientation?: 'horizontal' | 'vertical'
}

export interface StepConfig {
  id: string
  title: string
  description?: string
  icon?: ReactNode
  status?: 'pending' | 'active' | 'completed' | 'error'
  disabled?: boolean
  content?: ReactNode
  validation?: () => boolean | Promise<boolean>
}

// 이미지 최적화 컴포넌트
export interface OptimizedImageProps extends BaseComponentProps {
  src: string
  alt: string
  width?: number | string
  height?: number | string
  placeholder?: string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
  sizes?: string
  quality?: number
}

// 가상 리스트 컴포넌트
export interface VirtualListProps<T> extends BaseComponentProps {
  items: T[]
  itemHeight?: number
  renderItem: (item: T, index: number) => ReactNode
  overscan?: number
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void
  getItemHeight?: (index: number) => number
  estimatedItemHeight?: number
  scrollToIndex?: number
}

// 모달 컴포넌트
export interface ModalProps extends BaseComponentProps, WithChildren {
  open: boolean
  onClose: () => void
  title?: string
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  footer?: ReactNode
  centered?: boolean
  scrollable?: boolean
  animation?: 'fade' | 'slide' | 'scale' | 'none'
}

// 툴팁 컴포넌트
export interface TooltipProps extends BaseComponentProps, WithChildren {
  content: ReactNode
  position?: Position
  trigger?: 'hover' | 'click' | 'focus'
  delay?: number
  arrow?: boolean
  maxWidth?: number | string
}

// 드롭다운 컴포넌트
export interface DropdownProps extends BaseComponentProps {
  trigger: ReactNode
  items: DropdownItem[]
  position?: Position
  align?: Alignment
  closeOnItemClick?: boolean
  closeOnOutsideClick?: boolean
}

export interface DropdownItem {
  id: string
  label: string
  icon?: ReactNode
  onClick?: () => void
  disabled?: boolean
  divider?: boolean
  danger?: boolean
}

// 알림 컴포넌트
export interface AlertProps extends BaseComponentProps, WithChildren {
  type?: Status
  title?: string
  closable?: boolean
  onClose?: () => void
  icon?: ReactNode | boolean
  action?: ReactNode
}

// 배지 컴포넌트
export interface BadgeProps extends BaseComponentProps, WithChildren {
  variant?: Variant | Status
  size?: 'small' | 'medium' | 'large'
  dot?: boolean
  count?: number
  maxCount?: number
  showZero?: boolean
}

// 스켈레톤 컴포넌트
export interface SkeletonProps extends BaseComponentProps {
  variant?: 'text' | 'circular' | 'rectangular'
  width?: number | string
  height?: number | string
  animation?: 'pulse' | 'wave' | 'none'
  count?: number
}

// 프로그레스 컴포넌트
export interface ProgressProps extends BaseComponentProps {
  value: number
  max?: number
  variant?: Variant
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
  labelPosition?: 'inside' | 'outside'
  striped?: boolean
  animated?: boolean
}

// 스피너 컴포넌트
export interface SpinnerProps extends BaseComponentProps {
  size?: 'small' | 'medium' | 'large' | number
  color?: string
  thickness?: number
  speed?: number
}

// 탭 컴포넌트
export interface TabsProps extends BaseComponentProps {
  tabs: TabConfig[]
  activeTab: string
  onChange: (tabId: string) => void
  variant?: 'default' | 'pills' | 'underline'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  orientation?: 'horizontal' | 'vertical'
}

export interface TabConfig {
  id: string
  label: string
  icon?: ReactNode
  disabled?: boolean
  content?: ReactNode
  badge?: string | number
}

// 페이지네이션 컴포넌트
export interface PaginationProps extends BaseComponentProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  showPrevNext?: boolean
  maxButtons?: number
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'outlined'
}

// 폼 컴포넌트
export interface FormProps extends BaseComponentProps {
  onSubmit: FormHandler
  onReset?: () => void
  noValidate?: boolean
  autoComplete?: 'on' | 'off'
}

export interface FormFieldProps extends BaseComponentProps, WithChildren {
  name: string
  label?: string
  required?: boolean
  error?: string
  helperText?: string
}

// 셀렉트 컴포넌트
export interface SelectProps extends BaseComponentProps, Disableable {
  options: SelectOption[]
  value?: string | string[]
  defaultValue?: string | string[]
  placeholder?: string
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  onChange?: (value: string | string[]) => void
  onSearch?: (query: string) => void
  size?: 'small' | 'medium' | 'large'
  error?: string
  label?: string
  helperText?: string
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  group?: string
  icon?: ReactNode
}

// 날짜 선택 컴포넌트
export interface DatePickerProps extends BaseComponentProps, Disableable {
  value?: Date | string
  onChange?: (date: Date | null) => void
  placeholder?: string
  format?: string
  minDate?: Date | string
  maxDate?: Date | string
  showTime?: boolean
  label?: string
  error?: string
  helperText?: string
}

// 파일 업로드 컴포넌트
export interface FileUploadProps extends BaseComponentProps, Disableable {
  accept?: string
  multiple?: boolean
  maxSize?: number // bytes
  maxFiles?: number
  onUpload?: (files: File[]) => void
  onError?: (error: string) => void
  dragAndDrop?: boolean
  showPreview?: boolean
  uploadUrl?: string
  headers?: Record<string, string>
}