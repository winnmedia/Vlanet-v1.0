import React from 'react';
import UnifiedCard from '../components/unified/UnifiedCard';

import classNames from 'classnames';
import styles from './Skeleton.module.scss';

/**
 * 스켈레톤 UI 컴포넌트
 * - 로딩 중 자리 표시자
 * - 다양한 모양과 크기 지원
 * - 애니메이션 효과
 */
const Skeleton = ({
  variant = 'text', // text, circular, rectangular, button
  width,
  height,
  animation = true,
  className,
  style,
  ...props
}) => {
  const skeletonClasses = classNames(
    styles.skeleton,
    styles[variant],
    {
      [styles.animate]: animation
    },
    className
  );

  const skeletonStyle = {
    width: width || (variant === 'circular' ? height : undefined),
    height: height || (variant === 'text' ? '1em' : undefined),
    ...style
  };

  return (
    <div 
      className={skeletonClasses}
      style={skeletonStyle}
      aria-hidden="true"
      {...props}
    />
  );
};

// 텍스트 스켈레톤
export const TextSkeleton = ({ lines = 3, gap = 8, ...props }) => {
  return (
    <div className={styles.textSkeletonWrapper}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? '60%' : '100%'}
          style={{ marginBottom: index < lines - 1 ? gap : 0 }}
          {...props}
        />
      ))}
    </div>
  );
};

// 카드 스켈레톤
export const CardSkeleton = ({ showImage = true, ...props }) => {
  return (
    <div className={styles.cardSkeleton} {...props}>
      {showImage && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height={200}
          className={styles.cardImage}
        />
      )}
      <div className={styles.cardContent}>
        <Skeleton variant="text" width="80%" height={24} />
        <TextSkeleton lines={2} />
        <div className={styles.cardActions}>
          <Skeleton variant="button" width={80} height={32} />
          <Skeleton variant="button" width={80} height={32} />
        </div>
      </div>
    </div>
  );
};

// 리스트 아이템 스켈레톤
export const ListItemSkeleton = ({ showAvatar = true, ...props }) => {
  return (
    <div className={styles.listItemSkeleton} {...props}>
      {showAvatar && (
        <Skeleton
          variant="circular"
          width={40}
          height={40}
          className={styles.avatar}
        />
      )}
      <div className={styles.listContent}>
        <Skeleton variant="text" width="30%" height={16} />
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="70%" height={16} />
      </div>
    </div>
  );
};

// 테이블 스켈레톤
export const TableSkeleton = ({ rows = 5, columns = 4, ...props }) => {
  return (
    <div className={styles.tableSkeleton} {...props}>
      {/* 헤더 */}
      <div className={styles.tableHeader}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton
            key={`header-${index}`}
            variant="text"
            width="100%"
            height={20}
          />
        ))}
      </div>
      {/* 행들 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className={styles.tableRow}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              variant="text"
              width="100%"
              height={16}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// 프로젝트 카드 스켈레톤
export const ProjectCardSkeleton = () => {
  return (
    <CardSkeleton showImage>
      <div className={styles.projectMeta}>
        <Skeleton variant="text" width="40%" height={14} />
        <Skeleton variant="text" width="30%" height={14} />
      </div>
    </CardSkeleton>
  );
};

// 피드백 아이템 스켈레톤
export const FeedbackItemSkeleton = () => {
  return (
    <div className={styles.feedbackSkeleton}>
      <div className={styles.feedbackHeader}>
        <Skeleton variant="circular" width={32} height={32} />
        <div className={styles.feedbackMeta}>
          <Skeleton variant="text" width={100} height={16} />
          <Skeleton variant="text" width={60} height={14} />
        </div>
      </div>
      <TextSkeleton lines={2} />
    </div>
  );
};

// 비디오 플레이어 스켈레톤
export const VideoPlayerSkeleton = () => {
  return (
    <div className={styles.videoSkeleton}>
      <Skeleton
        variant="rectangular"
        width="100%"
        height={400}
        className={styles.videoPlayer}
      />
      <div className={styles.videoControls}>
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="text" width="80%" height={8} />
        <Skeleton variant="text" width={60} height={16} />
      </div>
    </div>
  );
};

// 폼 필드 스켈레톤
export const FormFieldSkeleton = ({ label = true }) => {
  return (
    <div className={styles.formFieldSkeleton}>
      {label && (
        <Skeleton variant="text" width={100} height={16} className={styles.label} />
      )}
      <Skeleton variant="rectangular" width="100%" height={40} />
    </div>
  );
};

// 통계 카드 스켈레톤
export const StatCardSkeleton = () => {
  return (
    <div className={styles.statCardSkeleton}>
      <Skeleton variant="circular" width={48} height={48} />
      <div className={styles.statContent}>
        <Skeleton variant="text" width={80} height={14} />
        <Skeleton variant="text" width={120} height={32} />
        <Skeleton variant="text" width={60} height={14} />
      </div>
    </div>
  );
};

export default Skeleton;