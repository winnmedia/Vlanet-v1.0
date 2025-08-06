import React, { useState } from 'react';
import styles from './FeedbackList.module.scss';
import moment from 'moment';
import { useState } from 'react'
import 'moment/locale/ko';

moment.locale('ko');

const FeedbackList = ({ feedbacks = [], comments = [], drawings = [], onTimeClick, onEdit, onDelete, currentUser }) => {
  const [activeTab, setActiveTab] = useState('feedback'); // 'feedback' or 'comment' or 'drawing'
  const [expandedItems, setExpandedItems] = useState(new Set());

  // 피드백과 코멘트, 그림을 합쳐서 시간순으로 정렬
  const allItems = [
    ...feedbacks.map(item => ({ ...item, type: 'feedback' })),
    ...comments.map(item => ({ ...item, type: 'comment' })),
    ...drawings.map(item => ({ 
      ...item, 
      type: 'drawing',
      section: item.timestamp ? `${Math.floor(item.timestamp / 60).toString().padStart(2, '0')}:${Math.floor(item.timestamp % 60).toString().padStart(2, '0')}` : '00:00',
      content: `[그림] ${item.tool} - ${item.color}`,
      created: item.createdAt || new Date().toISOString()
    }))
  ].sort((a, b) => {
    // 시간 정보가 있는 항목을 우선 정렬
    const timeA = a.section || a.timestamp || '99:99';
    const timeB = b.section || b.timestamp || '99:99';
    return timeA.localeCompare(timeB);
  });

  const filteredItems = activeTab === 'all' 
    ? allItems 
    : allItems.filter(item => item.type === activeTab);

  const toggleExpand = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString;
  };

  const getDisplayName = (item) => {
    if (item.secret || item.display_mode === 'anonymous') {
      return '익명';
    } else if (item.display_mode === 'nickname' && item.nickname) {
      return item.nickname;
    } else if (item.user_nickname) {
      return item.user_nickname;
    } else if (item.user_email) {
      return item.user_email.split('@')[0];
    }
    return '익명';
  };

  const isOwner = (item) => {
    return currentUser && (
      item.user_email === currentUser ||
      item.owner === currentUser ||
      item.created_by === currentUser
    );
  };

  return (
    <div className={styles.feedbackListContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          피드백 & 코멘트
        </h3>
        <div className={styles.tabButtons}>
          <button 
            className={activeTab === 'all' ? styles.active : ''}
            onClick={() => setActiveTab('all')}
          >
            전체 ({allItems.length})
          </button>
          <button 
            className={activeTab === 'feedback' ? styles.active : ''}
            onClick={() => setActiveTab('feedback')}
          >
            피드백 ({feedbacks.length})
          </button>
          <button 
            className={activeTab === 'comment' ? styles.active : ''}
            onClick={() => setActiveTab('comment')}
          >
            코멘트 ({comments.length})
          </button>
          {drawings.length > 0 && (
            <button 
              className={activeTab === 'drawing' ? styles.active : ''}
              onClick={() => setActiveTab('drawing')}
            >
              그림 ({drawings.length})
            </button>
          )}
        </div>
      </div>

      <div className={styles.listContent}>
        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p>{activeTab === 'feedback' ? '아직 피드백이 없습니다' : '아직 코멘트가 없습니다'}</p>
          </div>
        ) : (
          <ul className={styles.feedbackList}>
            {filteredItems.map((item) => (
              <li 
                key={item.id} 
                className={`${styles.feedbackItem} ${item.type === 'comment' ? styles.commentItem : ''}`}
              >
                <div className={styles.itemHeader}>
                  <div className={styles.leftInfo}>
                    {((item.type === 'feedback' || item.type === 'drawing') && item.section) && (
                      <button 
                        className={styles.timeButton}
                        onClick={() => onTimeClick?.(item.section)}
                        title="해당 시간으로 이동"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        {formatTime(item.section)}
                      </button>
                    )}
                    <span className={styles.type}>
                      {item.type === 'feedback' ? '피드백' : item.type === 'comment' ? '코멘트' : '그림'}
                    </span>
                    <span className={styles.author}>
                      {getDisplayName(item)}
                    </span>
                  </div>
                  <div className={styles.rightInfo}>
                    <span className={styles.date}>
                      {moment(item.created || item.create_date).format('MM.DD HH:mm')}
                    </span>
                    {isOwner(item) && (
                      <div className={styles.actions}>
                        <button 
                          className={styles.editBtn}
                          onClick={() => onEdit?.(item)}
                          title="수정"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button 
                          className={styles.deleteBtn}
                          onClick={() => onDelete?.(item)}
                          title="삭제"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div 
                  className={`${styles.content} ${expandedItems.has(item.id) ? styles.expanded : ''}`}
                  onClick={() => toggleExpand(item.id)}
                >
                  {item.contents || item.content}
                </div>
                
                {/* 답글이 있는 경우 표시 */}
                {item.replies && item.replies.length > 0 && (
                  <div className={styles.replies}>
                    {item.replies.map((reply) => (
                      <div key={reply.id} className={styles.reply}>
                        <span className={styles.replyAuthor}>{getDisplayName(reply)}</span>
                        <span className={styles.replyContent}>{reply.content}</span>
                        <span className={styles.replyDate}>
                          {moment(reply.created).fromNow()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FeedbackList;