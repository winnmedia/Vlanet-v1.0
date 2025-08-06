import React from 'react'
import styles from './FeedbackStats.module.scss'

const FeedbackStats = ({ stats }) => {
  if (!stats) return null

  const completionRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0

  return (
    <div className={styles.statsContainer}>
      <div className={styles.statsGrid}>
        {/* 전체 피드백 */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>전체 피드백</div>
          </div>
        </div>

        {/* 완료율 */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <div className={styles.progressRing}>
              <svg viewBox="0 0 36 36">
                <path
                  className={styles.progressBg}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={styles.progressFill}
                  strokeDasharray={`${completionRate}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className={styles.progressText}>{completionRate}%</div>
            </div>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.completed}/{stats.total}</div>
            <div className={styles.statLabel}>완료율</div>
          </div>
        </div>

        {/* 시간 지정 피드백 */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.withTime}</div>
            <div className={styles.statLabel}>시간 지정</div>
          </div>
        </div>

        {/* 반응 통계 */}
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {stats.reactions.like + stats.reactions.dislike + stats.reactions.needExplanation}
            </div>
            <div className={styles.statLabel}>총 반응</div>
          </div>
        </div>
      </div>

      {/* 반응 상세 */}
      <div className={styles.reactionDetails}>
        <div className={styles.reactionItem}>
          <span className={styles.reactionIcon}>👍</span>
          <span className={styles.reactionCount}>{stats.reactions.like}</span>
        </div>
        <div className={styles.reactionItem}>
          <span className={styles.reactionIcon}>👎</span>
          <span className={styles.reactionCount}>{stats.reactions.dislike}</span>
        </div>
        <div className={styles.reactionItem}>
          <span className={styles.reactionIcon}>❓</span>
          <span className={styles.reactionCount}>{stats.reactions.needExplanation}</span>
        </div>
      </div>
    </div>
  )
}

export default React.memo(FeedbackStats)