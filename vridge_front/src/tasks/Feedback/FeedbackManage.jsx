import React from 'react'
import FeedbackList from '../../components/FeedbackList/FeedbackList'

function FeedbackManage({ refetch, current_project, user, onTimeClick }) {
  const feedbackList = current_project?.feedback || []

  return (
    <FeedbackList
      feedbacks={feedbackList}
      currentUser={user}
      onRefetch={refetch}
      onTimeClick={onTimeClick}
      showActions={true}
      showSearch={true}
      showStatus={true}
      groupByDate={false}
      emptyStateTitle="아직 피드백이 없습니다"
      emptyStateDescription={
        <>
          영상에 대한 첫 번째 피드백을 남겨보세요.<br/>
          시간을 클릭하여 특정 구간에 대한 의견을 작성할 수 있습니다.
        </>
      }
    />
  )
}

export default React.memo(FeedbackManage)