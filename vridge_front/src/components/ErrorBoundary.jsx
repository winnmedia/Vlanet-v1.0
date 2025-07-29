import React from 'react';
import { Button } from './unified/Button';
import styles from './ErrorBoundary.module.scss';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error information
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    this.setState({ errorInfo });

    // 프로덕션 환경에서는 에러 리포팅 서비스로 전송
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      this.reportError(error, errorInfo);
    }
  }

  reportError = (error, errorInfo) => {
    // 에러 리포팅 서비스로 전송 (예: Sentry)
    // 현재는 로컬스토리지에 저장
    try {
      const errorLog = {
        id: this.state.errorId,
        message: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: window.navigator.userAgent,
        url: window.location.href
      };

      const existingErrors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      existingErrors.push(errorLog);
      // 최대 10개의 에러만 저장
      if (existingErrors.length > 10) {
        existingErrors.shift();
      }
      localStorage.setItem('errorLogs', JSON.stringify(existingErrors));
    } catch (e) {}
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  handleReportError = () => {
    // 사용자가 직접 에러를 리포트할 수 있는 기능
    const subject = encodeURIComponent(`오류 리포트: ${this.state.errorId}`);
    const body = encodeURIComponent(`오류 ID: ${this.state.errorId}\n\n발생 시간: ${new Date().toISOString()}\n\n오류 내용:\n${this.state.error?.toString()}\n\n재현 단계:\n1. \n2. \n3. `);
    window.location.href = `mailto:support@vlanet.net?subject=${subject}&body=${body}`;
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>
              <svg viewBox="0 0 24 24" width="80" height="80">
                <circle cx="12" cy="12" r="10" fill="#dc3545" />
                <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            
            <h1 className={styles.errorTitle}>페이지에 오류가 발생했습니다</h1>
            
            <p className={styles.errorMessage}>
              예기치 않은 오류가 발생했습니다. 불편을 드려 죄송합니다.
            </p>
            
            {isDevelopment && this.state.error &&
            <div className={styles.errorDetails}>
                <details>
                  <summary>오류 상세 정보 (개발 모드)</summary>
                  <div className={styles.errorCode}>
                    <p><strong>오류 ID:</strong> {this.state.errorId}</p>
                    <p><strong>오류 메시지:</strong></p>
                    <pre>{this.state.error.toString()}</pre>
                    {this.state.error.stack &&
                  <>
                        <p><strong>스택 트레이스:</strong></p>
                        <pre>{this.state.error.stack}</pre>
                      </>
                  }
                    {this.state.errorInfo &&
                  <>
                        <p><strong>컴포넌트 스택:</strong></p>
                        <pre>{this.state.errorInfo.componentStack}</pre>
                      </>
                  }
                  </div>
                </details>
              </div>
            }
            
            <div className={styles.errorActions}>
              <UnifiedButton
                variant="primary"
                onClick={this.handleReload} onKeyDown={(e) => e.key === 'Enter' && this.handleReload}
                icon={
                <svg viewBox="0 0 24 24" width="20" height="20" aria-label="Click">
                    <path d="M4 12a8 8 0 0 1 13.66-5.66l-1.42 1.42A6 6 0 1 0 18 12h-2a8 8 0 1 1-8-8v2l4-4-4-4v2a8 8 0 0 0-4 6z" fill="currentColor" />
                  </svg>
                }>

                페이지 새로고침
              </UnifiedButton>
              
              <UnifiedButton
                variant="secondary"
                onClick={this.handleGoHome} onKeyDown={(e) => e.key === 'Enter' && this.handleGoHome} aria-label="Click">

                홈으로 이동
              </UnifiedButton>
              
              {!isDevelopment &&
              <UnifiedButton
                variant="ghost"
                size="sm"
                onClick={this.handleReportError} onKeyDown={(e) => e.key === 'Enter' && this.handleReportError} aria-label="Click">

                  오류 신고하기
                </UnifiedButton>
              }
            </div>
            
            {!isDevelopment &&
            <p className={styles.errorId}>
                오류 ID: {this.state.errorId}
              </p>
            }
          </div>
        </div>);

    }

    return this.props.children;
  }
}

export default ErrorBoundary;