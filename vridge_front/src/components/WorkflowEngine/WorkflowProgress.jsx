import React, { useEffect } from 'react'

const WorkflowProgress = ({ projectId }) => {
  const dispatch = useDispatch()
  const workflow = useSelector(state => state.workflow)
  const { stages, overallProgress } = workflow
  
  // 프로젝트가 변경될 때마다 워크플로우 초기화
  useEffect(() => {
    if (projectId) {
      dispatch(initializeWorkflow(projectId))
    }
  }, [projectId, dispatch])

  const stageOrder = ['planning', 'schedule', 'feedback']
  
  const getStageIcon = (stageId) => {
    const icons = {
      planning: '📋',
      schedule: '📅',
      feedback: '💬'
    }
    return icons[stageId] || '📌'
  }
  
  const getStageClass = (status) => {
    return {
      pending: styles.pending,
      in_progress: styles.inProgress,
      completed: styles.completed
    }[status] || ''
  }
  
  const handleStageClick = (stageId) => {
    const stage = stages[stageId]
    if (stage.status === 'pending') {
      // 이전 단계가 완료되었는지 확인
      const currentIndex = stageOrder.indexOf(stageId)
      if (currentIndex === 0 || stages[stageOrder[currentIndex - 1]].status === 'completed') {
        dispatch(updateStageStatus(stageId, 'in_progress'))
      }
    }
  }
  
  return (
    <div className={styles.workflowProgress}>
      <div className={styles.header}>
        <h3>프로젝트 진행 상황</h3>
        <div className={styles.overallProgress}>
          <span className={styles.percentage}>{overallProgress}%</span>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className={styles.stages}>
        {stageOrder.map((stageId, index) => {
          const stage = stages[stageId]
          const isActive = stage.status === 'in_progress'
          const isCompleted = stage.status === 'completed'
          const isPending = stage.status === 'pending'
          
          return (
            <React.Fragment key={stageId}>
              <div 
                className={`${styles.stage} ${getStageClass(stage.status)}`}
                onClick={() => handleStageClick(stageId)}
              >
                <div className={styles.stageIcon}>
                  {getStageIcon(stageId)}
                </div>
                <div className={styles.stageContent}>
                  <h4>{stage.name}</h4>
                  <div className={styles.stageProgress}>
                    <div className={styles.stageProgressBar}>
                      <div 
                        className={styles.stageProgressFill} 
                        style={{ width: `${stage.progress}%` }}
                      />
                    </div>
                    <span className={styles.stagePercentage}>{stage.progress}%</span>
                  </div>
                  {isActive && (
                    <div className={styles.stageActions}>
                      <button 
                        className={styles.completeBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          dispatch(completeStage(stageId))
                        }}
                      >
                        단계 완료
                      </button>
                    </div>
                  )}
                  {stage.tasks.length > 0 && (
                    <div className={styles.stageTasks}>
                      <span className={styles.taskCount}>
                        작업 {stage.tasks.filter(t => t.status === 'completed').length}/{stage.tasks.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {index < stageOrder.length - 1 && (
                <div className={`${styles.connector} ${isCompleted ? styles.completed : ''}`}>
                  <div className={styles.line} />
                  <div className={styles.arrow}>→</div>
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
      
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.pending}`} />
          <span>대기중</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.inProgress}`} />
          <span>진행중</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.completed}`} />
          <span>완료</span>
        </div>
      </div>
    </div>
  )
}

export default WorkflowProgress