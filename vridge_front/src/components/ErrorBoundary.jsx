import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>오류가 발생했습니다</h1>
          <p style={{ marginBottom: '20px', color: '#6c757d' }}>
            페이지를 새로고침하거나 홈으로 돌아가주세요.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => (typeof window !== 'undefined' && window.location.reload()}
              style={{
                padding: '10px 20px',
                background: '#1631F8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              새로고침
            </button>
            <button
              onClick={() => if (typeof window !== 'undefined') {
        window.location.href = '/'}
              style={{
                padding: '10px 20px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              홈으로
            </button>
          </div>
        </div>
      );
      }
    }

    return this.props.children;
  }
}

export default ErrorBoundary;