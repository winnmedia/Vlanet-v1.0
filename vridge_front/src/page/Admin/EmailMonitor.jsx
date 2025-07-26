import React, { useState, useEffect } from 'react';
import { axiosCredentials } from '../../util/util';

import moment from 'moment';
import 'moment/locale/ko';

moment.locale('ko');

const EmailMonitor = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [recentEmails, setRecentEmails] = useState([]);
  const [queueStatus, setQueueStatus] = useState(null);
  const [selectedHours, setSelectedHours] = useState(24);
  const [selectedType, setSelectedType] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const emailStatusColors = {
    'pending': '#ffc107',
    'sent': '#17a2b8',
    'delivered': '#28a745',
    'failed': '#dc3545',
    'retrying': '#fd7e14',
    'bounced': '#6c757d'
  };

  const emailStatusLabels = {
    'pending': '대기중',
    'sent': '발송됨',
    'delivered': '전달됨',
    'failed': '실패',
    'retrying': '재시도중',
    'bounced': '반송됨'
  };

  const emailTypeLabels = {
    'verification': '인증',
    'invitation': '초대',
    'notification': '알림',
    'bulk': '대량발송',
    'general': '일반'
  };

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams({
        hours: selectedHours,
        limit: 100
      });
      
      if (selectedType) {
        params.append('type', selectedType);
      }

      const response = await axiosCredentials(
        'get',
        `/api/users/email-monitor/dashboard/?${params.toString()}`
      );

      if (response.data.status === 'success') {
        const { statistics, recent_emails, queue_status } = response.data.data;
        setStatistics(statistics);
        setRecentEmails(recent_emails);
        setQueueStatus(queue_status);
      }
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // 10초마다 자동 새로고침
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [selectedHours, selectedType]);

  const handleResendEmail = async (emailId) => {
    if (!window.confirm('이 이메일을 재발송하시겠습니까?')) return;

    try {
      const response = await axiosCredentials(
        'post',
        `/api/users/email-monitor/resend/${emailId}/`
      );

      if (response.data.status === 'success') {
        alert('이메일이 재발송 큐에 추가되었습니다.');
        fetchDashboardData();
      }
    } catch (error) {
      alert('이메일 재발송에 실패했습니다.');
      console.error('재발송 실패:', error);
    }
  };

  const handleCleanup = async () => {
    const days = prompt('며칠 이상 된 기록을 삭제하시겠습니까? (기본: 7일)', '7');
    if (!days) return;

    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum < 1) {
      alert('올바른 숫자를 입력해주세요.');
      return;
    }

    if (!window.confirm(`${daysNum}일 이상 된 기록을 삭제하시겠습니까?`)) return;

    try {
      const response = await axiosCredentials(
        'post',
        '/api/users/email-monitor/cleanup/',
        { days: daysNum }
      );

      if (response.data.status === 'success') {
        alert(`${response.data.data.deleted_count}개의 기록이 삭제되었습니다.`);
        fetchDashboardData();
      }
    } catch (error) {
      alert('기록 정리에 실패했습니다.');
      console.error('정리 실패:', error);
    }
  };

  if (loading) {
    return <div className="email-monitor loading">로딩중...</div>;
  }

  return (
    <div className="email-monitor">
      <div className="monitor-header">
        <h1>이메일 발송 모니터링</h1>
        <div className="monitor-controls">
          <select 
            value={selectedHours} 
            onChange={(e) => setSelectedHours(Number(e.target.value))}
          >
            <option value={1}>최근 1시간</option>
            <option value={6}>최근 6시간</option>
            <option value={24}>최근 24시간</option>
            <option value={48}>최근 2일</option>
            <option value={168}>최근 7일</option>
          </select>
          
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">모든 타입</option>
            <option value="verification">인증 이메일</option>
            <option value="invitation">초대 이메일</option>
            <option value="notification">알림 이메일</option>
            <option value="bulk">대량 발송</option>
            <option value="general">일반</option>
          </select>
          
          <button 
            className="btn-refresh"
            onClick={fetchDashboardData}
            disabled={refreshing}
          >
            {refreshing ? '새로고침중...' : '새로고침'}
          </button>
          
          <button 
            className="btn-cleanup"
            onClick={handleCleanup}
          >
            오래된 기록 정리
          </button>
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="statistics-summary">
        <div className="stat-card">
          <h3>전체 발송</h3>
          <div className="stat-value">{statistics?.total_sent || 0}</div>
        </div>
        <div className="stat-card">
          <h3>전달 완료</h3>
          <div className="stat-value success">{statistics?.total_delivered || 0}</div>
        </div>
        <div className="stat-card">
          <h3>실패</h3>
          <div className="stat-value danger">{statistics?.total_failed || 0}</div>
        </div>
        <div className="stat-card">
          <h3>전달률</h3>
          <div className="stat-value">
            {statistics?.delivery_rate ? `${statistics.delivery_rate.toFixed(1)}%` : '0%'}
          </div>
        </div>
      </div>

      {/* 큐 상태 */}
      <div className="queue-status">
        <h2>큐 상태</h2>
        <div className="queue-info">
          <span>대기중: <strong>{queueStatus?.size || 0}</strong>개</span>
          <span>상태: <strong className={queueStatus?.is_running ? 'running' : 'stopped'}>
            {queueStatus?.is_running ? '실행중' : '중지됨'}
          </strong></span>
          <span>배치 크기: <strong>{queueStatus?.batch_size || 0}</strong></span>
          <span>대기중인 배치: <strong>{queueStatus?.pending_batch_count || 0}</strong></span>
        </div>
      </div>

      {/* 타입별 통계 */}
      {statistics?.by_type && Object.keys(statistics.by_type).length > 0 && (
        <div className="type-statistics">
          <h2>타입별 통계</h2>
          <div className="type-grid">
            {Object.entries(statistics.by_type).map(([type, stats]) => (
              <div key={type} className="type-card">
                <h4>{emailTypeLabels[type] || type}</h4>
                <div className="type-stats">
                  <div>발송: {stats.sent}</div>
                  <div>전달: {stats.delivered}</div>
                  <div>실패: {stats.failed}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 최근 이메일 목록 */}
      <div className="recent-emails">
        <h2>최근 이메일</h2>
        <div className="email-list">
          <table>
            <thead>
              <tr>
                <th>시간</th>
                <th>수신자</th>
                <th>제목</th>
                <th>타입</th>
                <th>상태</th>
                <th>시도</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {recentEmails.map((email) => (
                <tr key={email.id}>
                  <td>{moment(email.created_at).format('MM/DD HH:mm')}</td>
                  <td>{email.recipient}</td>
                  <td className="email-subject">{email.subject}</td>
                  <td>
                    <span className={`email-type ${email.type}`}>
                      {emailTypeLabels[email.type] || email.type}
                    </span>
                  </td>
                  <td>
                    <span 
                      className="email-status"
                      style={{ color: emailStatusColors[email.status] }}
                    >
                      {emailStatusLabels[email.status] || email.status}
                    </span>
                  </td>
                  <td>{email.attempts || 1}</td>
                  <td>
                    {email.status === 'failed' && (
                      <button 
                        className="btn-resend"
                        onClick={() => handleResendEmail(email.id)}
                      >
                        재발송
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {recentEmails.length === 0 && (
            <div className="no-emails">
              선택한 기간에 발송된 이메일이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 시간별 차트 (간단한 텍스트 차트) */}
      {statistics?.hourly && statistics.hourly.length > 0 && (
        <div className="hourly-chart">
          <h2>시간별 발송 현황</h2>
          <div className="chart-container">
            {statistics.hourly.slice(0, 24).reverse().map((hour) => {
              const maxValue = Math.max(...statistics.hourly.map(h => h.data.sent || 0));
              const barHeight = maxValue > 0 ? (hour.data.sent / maxValue) * 100 : 0;
              
              return (
                <div key={hour.hour} className="chart-bar">
                  <div 
                    className="bar" 
                    style={{ height: `${barHeight}%` }}
                    title={`${hour.data.sent}건`}
                  >
                    {hour.data.sent > 0 && <span>{hour.data.sent}</span>}
                  </div>
                  <div className="hour-label">
                    {moment(hour.hour).format('HH')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailMonitor;