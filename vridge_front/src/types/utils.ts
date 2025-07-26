// 유틸리티 함수 타입 정의

// Performance 관련 타입
export interface PerformanceMeasure {
  componentName: string
  duration: number
  timestamp: number
}

export type PerformanceMetric = {
  name: string
  value: number
  unit: 'ms' | 'kb' | 'mb' | '%'
}

// Debounce/Throttle 타입
export type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void
  cancel: () => void
  flush: () => void
}

export type ThrottledFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void
  cancel: () => void
}

// Intersection Observer 타입
export interface IntersectionObserverOptions {
  target: React.RefObject<Element>
  onIntersect: () => void
  threshold?: number | number[]
  rootMargin?: string
  enabled?: boolean
  root?: Element | null
}

// 이미지 최적화 타입
export interface ImageOptimizationOptions {
  quality?: number
  format?: 'auto' | 'webp' | 'jpg' | 'png'
  width?: number
  height?: number
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
}

// 번들 분석 타입
export interface BundleStats {
  totalSize: number
  jsSize: number
  cssSize: number
  imageSize: number
  chunks: ChunkInfo[]
}

export interface ChunkInfo {
  name: string
  size: number
  modules: string[]
}

export interface PerformanceBudget {
  js: number
  css: number
  images: number
  total: number
}

// 메모리 관련 타입
export interface MemoryInfo {
  used: number
  total: number
  limit: number
  usage: number // percentage
}

export interface CacheStats {
  entries: number
  currentSize: string
  maxSize: string
  usage: string // percentage
}

// 로거 타입
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  stack?: string
}

export interface Logger {
  debug: (message: string, context?: Record<string, any>) => void
  info: (message: string, context?: Record<string, any>) => void
  warn: (message: string, context?: Record<string, any>) => void
  error: (message: string, error?: Error, context?: Record<string, any>) => void
  fatal: (message: string, error?: Error, context?: Record<string, any>) => void
}

// 스토리지 타입
export interface StorageAdapter {
  get: <T>(key: string) => T | null
  set: <T>(key: string, value: T) => void
  remove: (key: string) => void
  clear: () => void
  has: (key: string) => boolean
  size: () => number
}

// 검증 타입
export interface ValidationRule<T = any> {
  validate: (value: T) => boolean
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string[]>
}

export type Validator<T> = (value: T) => ValidationResult

// 날짜 유틸리티 타입
export interface DateFormatOptions {
  format?: string
  locale?: string
  timezone?: string
}

export interface DateRange {
  start: Date
  end: Date
}

// HTTP 요청 타입
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  params?: Record<string, any>
  data?: any
  timeout?: number
  withCredentials?: boolean
  onUploadProgress?: (progress: number) => void
  onDownloadProgress?: (progress: number) => void
}

export interface Response<T = any> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
}

export interface RequestError {
  message: string
  code?: string
  status?: number
  response?: Response
}

// 암호화 타입
export interface EncryptionOptions {
  algorithm?: string
  key?: string
  iv?: string
}

// 파일 유틸리티 타입
export interface FileValidationOptions {
  maxSize?: number
  allowedTypes?: string[]
  allowedExtensions?: string[]
}

export interface FileInfo {
  name: string
  size: number
  type: string
  extension: string
  lastModified: Date
}

// 색상 유틸리티 타입
export interface Color {
  r: number
  g: number
  b: number
  a?: number
}

export interface HSL {
  h: number
  s: number
  l: number
  a?: number
}

export type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla'

// 애니메이션 타입
export interface AnimationOptions {
  duration?: number
  easing?: string | ((t: number) => number)
  delay?: number
  iterations?: number
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  fill?: 'none' | 'forwards' | 'backwards' | 'both'
}

// 제스처 타입
export interface GestureEvent {
  deltaX: number
  deltaY: number
  velocityX: number
  velocityY: number
  direction: 'up' | 'down' | 'left' | 'right'
  distance: number
}

export interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

// 네트워크 상태 타입
export interface NetworkStatus {
  online: boolean
  effectiveType?: '2g' | '3g' | '4g' | '5g'
  downlink?: number
  rtt?: number
  saveData?: boolean
}

// 브라우저 기능 감지 타입
export interface BrowserFeatures {
  webp: boolean
  serviceWorker: boolean
  intersectionObserver: boolean
  webGL: boolean
  webRTC: boolean
  localStorage: boolean
  sessionStorage: boolean
  indexedDB: boolean
  webWorker: boolean
  fetch: boolean
}

// 접근성 타입
export interface A11yOptions {
  announceDelay?: number
  ariaLive?: 'polite' | 'assertive' | 'off'
  role?: string
}

export interface A11yAnnouncement {
  message: string
  priority?: 'polite' | 'assertive'
  clearAfter?: number
}

// 보안 관련 타입
export interface CSPDirectives {
  defaultSrc?: string[]
  scriptSrc?: string[]
  styleSrc?: string[]
  imgSrc?: string[]
  fontSrc?: string[]
  connectSrc?: string[]
  mediaSrc?: string[]
  objectSrc?: string[]
  frameSrc?: string[]
  workerSrc?: string[]
}

export interface SanitizeOptions {
  allowedTags?: string[]
  allowedAttributes?: Record<string, string[]>
  allowedSchemes?: string[]
  transformTags?: Record<string, string | ((tagName: string, attribs: Record<string, string>) => any)>
}