import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import FeedbackList from '../../components/FeedbackList/FeedbackList'

export default function FeedbackMore({ current_project, onTimeClick, onFeedbackSelect }) {
  const { user } = useSelector((s) => s.ProjectStore)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const feedbackList = current_project?.feedback || []

  return (
    <FeedbackList
      feedbacks={feedbackList}
      currentUser={user}
      onTimeClick={onTimeClick}
      onFeedbackSelect={onFeedbackSelect}
      showActions={false}
      showSearch={false}
      showStatus={false}
      groupByDate={true}
      isLoading={isLoading}
      error={error}
      emptyStateTitle="아직 피드백이 없습니다"
      emptyStateDescription={
        <>
          영상에 대한 첫 번째 피드백을 남겨보세요.<br/>
          피드백 등록 탭에서 새로운 피드백을 추가할 수 있습니다.
        </>
      }
    />
  )
}

React.memo(FeedbackMore)
