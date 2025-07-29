import React from 'react';
import { UnifiedButton } from '../../components/unified/UnifiedButton';

import classNames from 'classnames';
import styles from './UnifiedCard.module.scss';

/**
 * 통합 Card 컴포넌트
 * - 일관된 카드 스타일 제공
 * - 다양한 변형 지원
 * - 접근성 고려
 */
const UnifiedCard = ({
  variant = 'default', // default, elevated, outlined, interactive
  padding = 'medium', // none, small, medium, large
  radius = 'medium', // none, small, medium, large
  shadow = 'small', // none, small, medium, large
  hoverable = false,
  clickable = false,
  selected = false,
  disabled = false,
  loading = false,
  header,
  footer,
  cover,
  title,
  description,
  extra,
  actions,
  children,
  className,
  onClick,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const cardClasses = classNames(
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    styles[`radius-${radius}`],
    styles[`shadow-${shadow}`],
    {
      [styles.hoverable]: hoverable,
      [styles.clickable]: clickable,
      [styles.selected]: selected,
      [styles.disabled]: disabled,
      [styles.loading]: loading
    },
    className
  );

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  const handleKeyDown = (e) => {
    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick(e);
    }
  };

  const cardProps = {
    className: cardClasses,
    onClick: clickable ? handleClick : undefined,
    onMouseEnter,
    onMouseLeave,
    tabIndex: clickable && !disabled ? 0 : undefined,
    onKeyDown: clickable ? handleKeyDown : undefined,
    role: clickable ? 'button' : undefined,
    'aria-disabled': disabled,
    'aria-busy': loading,
    ...props
  };

  return (
    <div {...cardProps}>
      {/* 로딩 오버레이 */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} aria-label="로딩 중" />
        </div>
      )}

      {/* 커버 이미지 */}
      {cover && (
        <div className={styles.cover}>
          {typeof cover === 'string' ? (
            <img src={cover} alt="" / loading="lazy">
          ) : (
            cover
          )}
        </div>
      )}

      {/* 헤더 */}
      {header && (
        <div className={styles.header}>
          {header}
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className={styles.body}>
        {/* 메타 정보 */}
        {(title || extra) && (
          <div className={styles.meta}>
            {title && (
              <div className={styles.metaContent}>
                <h3 className={styles.title}>{title}</h3>
                {description && (
                  <p className={styles.description}>{description}</p>
                )}
              </div>
            )}
            {extra && (
              <div className={styles.extra}>{extra}</div>
            )}
          </div>
        )}

        {/* 자식 콘텐츠 */}
        {children && (
          <div className={styles.content}>
            {children}
          </div>
        )}
      </div>

      {/* 액션 버튼들 */}
      {actions && actions.length > 0 && (
        <div className={styles.actions}>
          {actions.map((action, index) => (
            <React.Fragment key={index}>
              {action}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* 푸터 */}
      {footer && (
        <div className={styles.footer}>
          {footer}
        </div>
      )}
    </div>
  );
};

// 카드 그룹 컴포넌트
export const CardGroup = ({
  children,
  gap = 'medium', // small, medium, large
  columns = 'auto', // auto, 1, 2, 3, 4
  className,
  ...props
}) => {
  const groupClasses = classNames(
    styles.cardGroup,
    styles[`gap-${gap}`],
    styles[`columns-${columns}`],
    className
  );

  return (
    <div className={groupClasses} {...props}>
      {children}
    </div>
  );
};

// 프로젝트 카드 프리셋
export const ProjectCard = ({
  project,
  onEdit,
  onDelete,
  onView,
  ...props
}) => {
  const actions = [];
  
  if (onView) {
    actions.push(
      <UnifiedButton 
        key="view"
        onClick={onView}
        className={styles.actionButton}
        aria-label={`${project.title} 보기`}
       type="button">
        보기
      </UnifiedButton>
    );
  }
  
  if (onEdit) {
    actions.push(
      <UnifiedButton 
        key="edit"
        onClick={onEdit}
        className={styles.actionButton}
        aria-label={`${project.title} 수정`}
       type="button">
        수정
      </UnifiedButton>
    );
  }
  
  if (onDelete) {
    actions.push(
      <UnifiedButton 
        key="delete"
        onClick={onDelete}
        className={styles.actionButtonDanger}
        aria-label={`${project.title} 삭제`}
       type="button">
        삭제
      </UnifiedButton>
    );
  }

  return (
    <UnifiedCard
      variant="interactive"
      hoverable
      title={project.title}
      description={project.description}
      cover={project.thumbnail}
      extra={
        <span className={styles.projectStatus}>
          {project.status === 'active' ? '진행중' : '완료'}
        </span>
      }
      actions={actions}
      {...props}
    >
      <div className={styles.projectMeta}>
        <span>생성일: {project.createdAt}</span>
        <span>참여자: {project.participants}명</span>
      </div>
    </UnifiedCard>
  );
};

// 피드백 카드 프리셋
export const FeedbackCard = ({
  feedback,
  selected,
  onSelect,
  onReply,
  onPin,
  ...props
}) => {
  return (
    <UnifiedCard
      variant="outlined"
      padding="small"
      hoverable
      clickable
      selected={selected}
      onClick={onSelect}
      {...props}
    >
      <div className={styles.feedbackContent}>
        <div className={styles.feedbackHeader}>
          <span className={styles.feedbackUser}>{feedback.user}</span>
          <span className={styles.feedbackTime}>{feedback.time}</span>
        </div>
        <div className={styles.feedbackBody}>
          {feedback.content}
        </div>
        <div className={styles.feedbackActions}>
          {onReply && (
            <UnifiedButton onClick={onReply} className={styles.iconButton} aria-label="Click" type="button">
              답글
            </UnifiedButton>
          )}
          {onPin && (
            <UnifiedButton onClick={onPin} className={styles.iconButton} aria-label="Click" type="button">
              {feedback.pinned ? '고정 해제' : '고정'}
            </UnifiedButton>
          )}
        </div>
      </div>
    </UnifiedCard>
  );
};

// 통계 카드 프리셋
export const StatCard = ({
  title,
  value,
  unit,
  trend,
  icon,
  color = 'primary',
  ...props
}) => {
  return (
    <UnifiedCard
      variant="elevated"
      padding="large"
      {...props}
    >
      <div className={styles.statContent}>
        {icon && (
          <div className={`${styles.statIcon} ${styles[`color-${color}`]}`}>
            {icon}
          </div>
        )}
        <div className={styles.statData}>
          <h4 className={styles.statTitle}>{title}</h4>
          <div className={styles.statValue}>
            <span className={styles.value}>{value}</span>
            {unit && <span className={styles.unit}>{unit}</span>}
          </div>
          {trend && (
            <div className={`${styles.statTrend} ${styles[trend.direction]}`}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
            </div>
          )}
        </div>
      </div>
    </UnifiedCard>
  );
};

export default UnifiedCard;