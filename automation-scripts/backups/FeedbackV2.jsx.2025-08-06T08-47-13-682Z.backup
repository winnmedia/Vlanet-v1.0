import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import PageTemplate from 'components/PageTemplate'
import SideBar from 'components/SideBar'
import EnhancedVideoPlayer from 'components/EnhancedVideoPlayer/EnhancedVideoPlayer'
import FeedbackListV2 from 'components/FeedbackList/FeedbackListV2'
import LoadingSpinner from 'components/LoadingSpinner'
import Button from 'components/common/Button'
import { showSuccess, showError, showInfo } from '../../components/Toast'
import feedbackAPIService from '../../services/feedbackAPIService'
import { axiosCredentials } from 'util/util'
import styles from './FeedbackV2.module.scss'
import layoutStyles from './FeedbackPageLayout.module.scss'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, message } from 'antd'

/**
 * 새로운 백엔드 API와 통합된 간소화된 피드백 페이지
 * 픽셀 퍼펙트 UI/UX 구현
 */
const FeedbackV2 = () => {
  const router = useRouter()
  const projectId = router.query.id
  const { user } = useSelector((s) => s.ProjectStore)
  
  // 상태 관리
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState(null)
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [currentVideoTime, setCurrentVideoTime] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Refs
  const videoPlayerRef = useRef(null)
  const fileInputRef = useRef(null)

  // 프로젝트 정보 로드
  const loadProjectInfo = useCallback(async () => {
    if (!projectId) return

    try {
      setLoading(true)
      const response = await axiosCredentials('get', `/api/projects/${projectId}/`)
      
      if (response?.data) {
        setProject(response.data)
        
        // 비디오 URL 설정
        if (response.data.feedback_video_url) {
          setVideoUrl(response.data.feedback_video_url)
        }
      }
    } catch (error) {
      console.error('프로젝트 정보 로드 실패:', error)
      showError('프로젝트 정보를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // 컴포넌트 마운트 시 프로젝트 정보 로드
  useEffect(() => {
    loadProjectInfo()
  }, [loadProjectInfo])

  // 비디오 업로드 핸들러
  const handleVideoUpload = useCallback(async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 크기 확인 (600MB 제한)
    if (file.size > 600 * 1024 * 1024) {
      showError('파일 크기는 600MB를 초과할 수 없습니다.')
      return
    }

    // 파일 형식 확인
    const allowedTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi']
    if (!allowedTypes.includes(file.type)) {
      showError('지원하지 않는 파일 형식입니다. MP4, WebM, MOV, AVI 파일만 업로드 가능합니다.')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const result = await feedbackAPIService.uploadVideo(
        projectId,
        file,
        (progress) => setUploadProgress(progress)
      )

      if (result.success) {
        showSuccess('비디오가 성공적으로 업로드되었습니다.')
        if (result.data?.video_url) {
          setVideoUrl(result.data.video_url)
        }
        await loadProjectInfo()
      } else {
        showError(result.error || '비디오 업로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('비디오 업로드 오류:', error)
      showError('비디오 업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [projectId, loadProjectInfo])

  // 피드백 선택 핸들러
  const handleFeedbackSelect = useCallback((feedback) => {
    setSelectedFeedback(feedback)
    
    // 비디오 플레이어로 시간 이동
    if (videoPlayerRef.current && feedback?.metadata?.timestamp) {
      videoPlayerRef.current.seekTo(feedback.metadata.timestamp)
    }
  }, [])

  // 비디오 시간 업데이트 핸들러
  const handleVideoTimeUpdate = useCallback((time) => {
    setCurrentVideoTime(time)
  }, [])

  // 로딩 상태
  if (loading) {
    return (
      <PageTemplate isActive="Feedback">
        <div className={layoutStyles.pageContainer}>
          <div className={layoutStyles.loadingContainer}>
            <LoadingSpinner size="large" />
            <p>프로젝트 정보를 불러오는 중...</p>
          </div>
        </div>
      </PageTemplate>
    )
  }

  // 프로젝트가 없는 경우
  if (!project) {
    return (
      <PageTemplate isActive="Feedback">
        <div className={layoutStyles.pageContainer}>
          <div className={layoutStyles.errorContainer}>
            <h2>프로젝트를 찾을 수 없습니다</h2>
            <Button onClick={() => router.push('/cms/projects')}>
              프로젝트 목록으로 돌아가기
            </Button>
          </div>
        </div>
      </PageTemplate>
    )
  }

  return (
    <PageTemplate isActive="Feedback">
      <div className={layoutStyles.pageContainer}>
        {/* 사이드바 */}
        <div className={layoutStyles.sidebarSection}>
          <SideBar userData={user} projectData={project} />
        </div>

        {/* 메인 콘텐츠 */}
        <div className={layoutStyles.mainContent}>
          {/* 프로젝트 정보 헤더 */}
          <div className={styles.projectHeader}>
            <div className={styles.projectInfo}>
              <h1 className={styles.projectTitle}>{project.name}</h1>
              <div className={styles.projectMeta}>
                <span className={styles.projectClient}>
                  고객사: {project.client || '미지정'}
                </span>
                <span className={styles.projectStatus}>
                  상태: {project.status || '진행중'}
                </span>
                <span className={styles.projectDate}>
                  시작일: {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className={styles.projectActions}>
              <Button
                variant="secondary"
                size="small"
                onClick={() => router.push(`/cms/project/${projectId}`)}
              >
                프로젝트 상세
              </Button>
            </div>
          </div>

          {/* 비디오 플레이어 섹션 */}
          <div className={styles.videoSection}>
            {videoUrl ? (
              <div className={styles.videoPlayer}>
                <EnhancedVideoPlayer
                  ref={videoPlayerRef}
                  url={videoUrl}
                  onTimeUpdate={handleVideoTimeUpdate}
                  controls={true}
                  playing={false}
                  width="100%"
                  height="100%"
                />
              </div>
            ) : (
              <div className={styles.uploadSection}>
                <div className={styles.uploadBox}>
                  <div className={styles.uploadIcon}>📹</div>
                  <h3 className={styles.uploadTitle}>비디오를 업로드하세요</h3>
                  <p className={styles.uploadDescription}>
                    피드백을 받을 영상을 업로드해주세요. (최대 600MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    style={{ display: 'none' }}
                    disabled={isUploading}
                  />
                  <Button
                    variant="primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? `업로드 중... ${uploadProgress}%` : '비디오 선택'}
                  </Button>
                  {isUploading && (
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 피드백 목록 섹션 */}
          <div className={styles.feedbackSection}>
            <FeedbackListV2
              projectId={projectId}
              currentUser={user}
              onFeedbackSelect={handleFeedbackSelect}
              selectedFeedbackId={selectedFeedback?.id}
              currentVideoTime={currentVideoTime}
              videoPlayerRef={videoPlayerRef}
            />
          </div>

          {/* 선택된 피드백 상세 (선택사항) */}
          {selectedFeedback && (
            <div className={styles.feedbackDetail}>
              <div className={styles.detailHeader}>
                <h3>{selectedFeedback.title}</h3>
                <button
                  className={styles.closeBtn}
                  onClick={() => setSelectedFeedback(null)}
                >
                  ✕
                </button>
              </div>
              <div className={styles.detailContent}>
                <p>{selectedFeedback.description}</p>
                {selectedFeedback.messages?.map((message, index) => (
                  <div key={message.id || index} className={styles.message}>
                    <div className={styles.messageHeader}>
                      <span className={styles.messageAuthor}>
                        {message.author_name || '익명'}
                      </span>
                      <span className={styles.messageTime}>
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className={styles.messageContent}>{message.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  )
}

export default FeedbackV2