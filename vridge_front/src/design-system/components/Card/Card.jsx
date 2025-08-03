// VideoPlanet 디자인 시스템 - Card 컴포넌트
// 영상 제작 프로젝트와 콘텐츠 표시에 특화된 카드 시스템

import React from 'react';
import PropTypes from 'prop-types';
import styles from './Card.module.scss';

const Card = ({
  children,
  variant = 'default',
  size = 'medium',
  interactive = false,
  hoverable = false,
  selected = false,
  disabled = false,
  header = null,
  footer = null,
  className = '',
  onClick,
  ...props
}) => {
  const cardClasses = [
    styles.card,
    styles[`card--${variant}`],
    styles[`card--${size}`],
    interactive && styles['card--interactive'],
    hoverable && styles['card--hoverable'],
    selected && styles['card--selected'],
    disabled && styles['card--disabled'],
    className,
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (disabled) return;
    onClick?.(e);
  };

  const cardProps = {
    className: cardClasses,
    ...(interactive && { onClick: handleClick, role: 'button', tabIndex: disabled ? -1 : 0 }),
    ...props,
  };

  return (
    <div {...cardProps}>
      {header && (
        <div className={styles.cardHeader}>
          {header}
        </div>
      )}
      
      <div className={styles.cardContent}>
        {children}
      </div>
      
      {footer && (
        <div className={styles.cardFooter}>
          {footer}
        </div>
      )}
    </div>
  );
};

// 프로젝트 카드 전용 컴포넌트
export const ProjectCard = ({
  title,
  description,
  phase,
  priority,
  deadline,
  progress,
  thumbnail,
  tags = [],
  actions,
  ...props
}) => {
  const phaseConfig = {
    'planning': { label: '기획', color: '#3B82F6' },
    'production': { label: '제작', color: '#F59E0B' },
    'post-production': { label: '후반작업', color: '#8B5CF6' },
    'review': { label: '검토', color: '#06B6D4' },
    'completed': { label: '완료', color: '#10B981' },
    'on-hold': { label: '보류', color: '#6B7280' },
  };

  const priorityConfig = {
    'critical': { label: '긴급', color: '#DC2626' },
    'high': { label: '높음', color: '#EA580C' },
    'medium': { label: '보통', color: '#D97706' },
    'low': { label: '낮음', color: '#059669' },
  };

  const currentPhase = phaseConfig[phase] || phaseConfig.planning;
  const currentPriority = priorityConfig[priority] || priorityConfig.medium;

  const header = (
    <div className={styles.projectCardHeader}>
      {thumbnail && (
        <div className={styles.projectThumbnail}>
          <img src={thumbnail} alt={title} />
        </div>
      )}
      <div className={styles.projectMeta}>
        <div className={styles.projectBadges}>
          <span 
            className={styles.phaseBadge}
            style={{ backgroundColor: currentPhase.color }}
          >
            {currentPhase.label}
          </span>
          <span 
            className={styles.priorityBadge}
            style={{ backgroundColor: currentPriority.color }}
          >
            {currentPriority.label}
          </span>
        </div>
        {deadline && (
          <div className={styles.projectDeadline}>
            마감: {deadline}
          </div>
        )}
      </div>
    </div>
  );

  const content = (
    <div className={styles.projectCardContent}>
      <h3 className={styles.projectTitle}>{title}</h3>
      {description && (
        <p className={styles.projectDescription}>{description}</p>
      )}
      
      {progress !== undefined && (
        <div className={styles.progressSection}>
          <div className={styles.progressLabel}>
            진행률: {progress}%
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {tags.length > 0 && (
        <div className={styles.projectTags}>
          {tags.map((tag, index) => (
            <span key={index} className={styles.projectTag}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const footer = actions && (
    <div className={styles.projectCardFooter}>
      {actions}
    </div>
  );

  return (
    <Card
      variant="project"
      header={header}
      footer={footer}
      hoverable
      {...props}
    >
      {content}
    </Card>
  );
};

// 피드백 카드 전용 컴포넌트
export const FeedbackCard = ({
  author,
  timestamp,
  status,
  priority,
  content,
  videoTimestamp,
  replies = [],
  actions,
  ...props
}) => {
  const statusConfig = {
    'pending': { label: '대기중', color: '#F59E0B' },
    'in-progress': { label: '진행중', color: '#3B82F6' },
    'resolved': { label: '해결됨', color: '#10B981' },
    'rejected': { label: '거절됨', color: '#EF4444' },
  };

  const currentStatus = statusConfig[status] || statusConfig.pending;

  const header = (
    <div className={styles.feedbackCardHeader}>
      <div className={styles.feedbackAuthor}>
        <div className={styles.authorAvatar}>
          {author.charAt(0).toUpperCase()}
        </div>
        <div className={styles.authorInfo}>
          <div className={styles.authorName}>{author}</div>
          <div className={styles.feedbackTimestamp}>{timestamp}</div>
        </div>
      </div>
      <div className={styles.feedbackMeta}>
        <span 
          className={styles.statusBadge}
          style={{ backgroundColor: currentStatus.color }}
        >
          {currentStatus.label}
        </span>
        {videoTimestamp && (
          <span className={styles.videoTimestamp}>
            {videoTimestamp}
          </span>
        )}
      </div>
    </div>
  );

  const feedbackContent = (
    <div className={styles.feedbackCardContent}>
      <div className={styles.feedbackText}>
        {content}
      </div>
      
      {replies.length > 0 && (
        <div className={styles.feedbackReplies}>
          <div className={styles.repliesLabel}>
            답글 {replies.length}개
          </div>
          {replies.map((reply, index) => (
            <div key={index} className={styles.feedbackReply}>
              <div className={styles.replyAuthor}>
                {reply.author}
              </div>
              <div className={styles.replyContent}>
                {reply.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const footer = actions && (
    <div className={styles.feedbackCardFooter}>
      {actions}
    </div>
  );

  return (
    <Card
      variant="feedback"
      header={header}
      footer={footer}
      {...props}
    >
      {feedbackContent}
    </Card>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    'default',
    'elevated',
    'outlined',
    'project',
    'feedback',
    'ai-result',
    'timeline-item',
  ]),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  interactive: PropTypes.bool,
  hoverable: PropTypes.bool,
  selected: PropTypes.bool,
  disabled: PropTypes.bool,
  header: PropTypes.node,
  footer: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

ProjectCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  phase: PropTypes.oneOf([
    'planning',
    'production',
    'post-production',
    'review',
    'completed',
    'on-hold',
  ]),
  priority: PropTypes.oneOf(['critical', 'high', 'medium', 'low']),
  deadline: PropTypes.string,
  progress: PropTypes.number,
  thumbnail: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string),
  actions: PropTypes.node,
};

FeedbackCard.propTypes = {
  author: PropTypes.string.isRequired,
  timestamp: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending', 'in-progress', 'resolved', 'rejected']),
  priority: PropTypes.oneOf(['critical', 'high', 'medium', 'low']),
  content: PropTypes.string.isRequired,
  videoTimestamp: PropTypes.string,
  replies: PropTypes.arrayOf(PropTypes.shape({
    author: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
  })),
  actions: PropTypes.node,
};

export default Card;