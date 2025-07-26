// API 관련 타입 정의
import { User, DateTimeString, FileInfo } from './common'

// 프로젝트 타입
export interface Project {
  id: string
  name: string
  client?: string
  description?: string
  color: string
  status: ProjectStatus
  current_phase?: ProjectPhase
  deadline?: DateTimeString
  created_at: DateTimeString
  updated_at: DateTimeString
  owner: User
  members: ProjectMember[]
  feedback?: Feedback[]
  videos?: Video[]
  is_important?: boolean
  settings?: ProjectSettings
}

export type ProjectStatus = 'active' | 'completed' | 'pending' | 'archived'
export type ProjectPhase = 'planning' | 'production' | 'post-production' | 'review' | 'completed'

export interface ProjectMember {
  user: User
  role: ProjectRole
  joined_at: DateTimeString
}

export type ProjectRole = 'owner' | 'editor' | 'viewer'

export interface ProjectSettings {
  notifications_enabled: boolean
  auto_archive: boolean
  default_video_settings?: VideoSettings
}

// 비디오 타입
export interface Video {
  id: string
  project_id: string
  title: string
  description?: string
  url: string
  thumbnail?: string
  duration: number // seconds
  status: VideoStatus
  created_at: DateTimeString
  updated_at: DateTimeString
  created_by: User
  tags?: string[]
  metadata?: VideoMetadata
}

export type VideoStatus = 'draft' | 'processing' | 'ready' | 'published' | 'archived'

export interface VideoMetadata {
  width: number
  height: number
  fps: number
  codec: string
  bitrate: number
  file_size: number
}

export interface VideoSettings {
  resolution: '720p' | '1080p' | '4k'
  fps: 24 | 30 | 60
  format: 'mp4' | 'mov' | 'webm'
}

// 피드백 타입
export interface Feedback {
  id: string
  project_id: string
  video_id?: string
  user: User
  text: string
  timestamp?: number // video timestamp in seconds
  status: FeedbackStatus
  created_at: DateTimeString
  updated_at: DateTimeString
  replies?: FeedbackReply[]
  attachments?: FileInfo[]
}

export type FeedbackStatus = 'open' | 'resolved' | 'declined'

export interface FeedbackReply {
  id: string
  feedback_id: string
  user: User
  text: string
  created_at: DateTimeString
}

// 영상 기획 타입
export interface VideoPlanning {
  id: string
  project_id: string
  title: string
  concept: string
  target_audience: string
  key_messages: string[]
  visual_style: VisualStyle
  duration_estimate: number // seconds
  scenes: Scene[]
  references?: Reference[]
  status: PlanningStatus
  created_at: DateTimeString
  updated_at: DateTimeString
  created_by: User
}

export type PlanningStatus = 'draft' | 'review' | 'approved' | 'revision'

export interface VisualStyle {
  color_palette: string[]
  typography: TypographyStyle
  animation_style?: string
  mood: string[]
}

export interface TypographyStyle {
  primary_font: string
  secondary_font?: string
  sizes: {
    heading: number
    body: number
    caption: number
  }
}

export interface Scene {
  id: string
  order: number
  title: string
  description: string
  duration: number // seconds
  shots: Shot[]
  notes?: string
}

export interface Shot {
  id: string
  order: number
  type: ShotType
  description: string
  duration: number
  camera_angle?: string
  movement?: string
  elements: string[]
}

export type ShotType = 'wide' | 'medium' | 'close-up' | 'extreme-close-up' | 'establishing'

export interface Reference {
  id: string
  type: 'video' | 'image' | 'document'
  url: string
  title: string
  notes?: string
}

// 초대 타입
export interface Invitation {
  id: string
  project: Project
  inviter: User
  invitee_email: string
  role: ProjectRole
  status: InvitationStatus
  message?: string
  expires_at: DateTimeString
  created_at: DateTimeString
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired'

// 활동 로그 타입
export interface Activity {
  id: string
  project_id: string
  user: User
  action: ActivityAction
  resource_type: ResourceType
  resource_id: string
  resource_name?: string
  details?: Record<string, any>
  created_at: DateTimeString
}

export type ActivityAction = 'created' | 'updated' | 'deleted' | 'commented' | 'uploaded' | 'invited' | 'joined' | 'left'
export type ResourceType = 'project' | 'video' | 'feedback' | 'planning' | 'file'

// 통계 타입
export interface ProjectStatistics {
  total_projects: number
  active_projects: number
  completed_projects: number
  total_videos: number
  total_feedback: number
  average_completion_time: number // days
  team_size_average: number
}

export interface UserStatistics {
  projects_owned: number
  projects_member: number
  videos_created: number
  feedback_given: number
  storage_used: number // bytes
  last_active: DateTimeString
}

// API 요청 타입
export interface CreateProjectRequest {
  name: string
  client?: string
  description?: string
  color?: string
  deadline?: DateTimeString
  members?: string[] // user emails
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: ProjectStatus
  current_phase?: ProjectPhase
}

export interface CreateVideoRequest {
  project_id: string
  title: string
  description?: string
  file: File
  tags?: string[]
}

export interface CreateFeedbackRequest {
  project_id: string
  video_id?: string
  text: string
  timestamp?: number
  attachments?: File[]
}

export interface InviteUserRequest {
  project_id: string
  email: string
  role: ProjectRole
  message?: string
}

// API 응답 타입
export interface LoginResponse {
  user: User
  token: string
  refresh_token?: string
  expires_at: DateTimeString
}

export interface UploadResponse {
  file: FileInfo
  upload_url?: string
}

export interface InvitationsResponse {
  sent: Invitation[]
  received: Invitation[]
  recent_accepted: Invitation[]
}