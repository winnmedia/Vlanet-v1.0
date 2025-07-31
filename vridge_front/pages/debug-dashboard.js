import { useState, useEffect } from 'react';
import styles from '../src/css/debug-dashboard.module.scss';

// 디버깅 대시보드 - 시스템 상태를 실시간으로 모니터링
export default function DebugDashboard() {
  const [systemStatus, setSystemStatus] = useState({
    frontend: { status: 'checking', message: '확인 중...' },
    backend: { status: 'checking', message: '확인 중...' },
    database: { status: 'checking', message: '확인 중...' },
    auth: { status: 'checking', message: '확인 중...' }
  });
  
  const [testResults, setTestResults] = useState(null);
  const [errorLogs, setErrorLogs] = useState([]);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // 시스템 상태 체크
  const checkSystemStatus = async () => {
    // Frontend 체크
    try {
      const frontResponse = await fetch('/api/hello');
      const frontData = await frontResponse.json();
      setSystemStatus(prev => ({
        ...prev,
        frontend: { 
          status: 'healthy', 
          message: `Next.js ${frontData.version || '정상'}` 
        }
      }));
    } catch (error) {
      setSystemStatus(prev => ({
        ...prev,
        frontend: { status: 'error', message: error.message }
      }));
    }

    // Backend 체크
    try {
      const backResponse = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/health/');
      const backData = await backResponse.json();
      
      if (backData.status === 'emergency_mode') {
        setSystemStatus(prev => ({
          ...prev,
          backend: { 
            status: 'warning', 
            message: backData.message 
          }
        }));
      } else {
        setSystemStatus(prev => ({
          ...prev,
          backend: { status: 'healthy', message: 'Django 정상 작동' }
        }));
      }
    } catch (error) {
      setSystemStatus(prev => ({
        ...prev,
        backend: { status: 'error', message: '연결 실패' }
      }));
    }

    // Database 체크 (backend가 정상일 때만)
    if (systemStatus.backend.status === 'healthy') {
      try {
        const dbResponse = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/db-check/');
        const dbData = await dbResponse.json();
        setSystemStatus(prev => ({
          ...prev,
          database: { status: 'healthy', message: 'PostgreSQL 연결됨' }
        }));
      } catch (error) {
        setSystemStatus(prev => ({
          ...prev,
          database: { status: 'unknown', message: 'DB 체크 불가' }
        }));
      }
    }

    // Auth 체크
    try {
      const authResponse = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/auth/status/');
      if (authResponse.status === 503) {
        setSystemStatus(prev => ({
          ...prev,
          auth: { status: 'error', message: '인증 서비스 중단' }
        }));
      } else {
        setSystemStatus(prev => ({
          ...prev,
          auth: { status: 'healthy', message: '인증 시스템 정상' }
        }));
      }
    } catch (error) {
      setSystemStatus(prev => ({
        ...prev,
        auth: { status: 'error', message: '인증 체크 실패' }
      }));
    }
  };

  // 사용자 여정 테스트 실행
  const runJourneyTest = async () => {
    setIsRunningTest(true);
    setTestResults(null);
    
    try {
      // 간단한 클라이언트 사이드 테스트
      const journeys = {
        '홈페이지 접근': await testPageAccess('/'),
        '로그인 페이지': await testPageAccess('/login'),
        '회원가입 페이지': await testPageAccess('/signup'),
        'API 헬스체크': await testAPIEndpoint('/api/health/'),
        '프로젝트 목록': await testPageAccess('/cmshome')
      };
      
      const passed = Object.values(journeys).filter(j => j.success).length;
      const total = Object.keys(journeys).length;
      
      setTestResults({
        journeys,
        summary: {
          total,
          passed,
          failed: total - passed,
          successRate: ((passed / total) * 100).toFixed(1)
        }
      });
    } catch (error) {
      console.error('테스트 실행 오류:', error);
    } finally {
      setIsRunningTest(false);
    }
  };

  // 페이지 접근 테스트
  const testPageAccess = async (path) => {
    try {
      const response = await fetch(path);
      return {
        success: response.ok,
        status: response.status,
        message: response.ok ? '정상' : `오류 ${response.status}`
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        message: error.message
      };
    }
  };

  // API 엔드포인트 테스트
  const testAPIEndpoint = async (path) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + path);
      const data = await response.json();
      return {
        success: response.ok || data.status === 'emergency_mode',
        status: response.status,
        message: data.message || '정상'
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        message: error.message
      };
    }
  };

  // 실시간 오류 수집
  useEffect(() => {
    const collectErrors = () => {
      if (typeof window !== 'undefined') {
        window.addEventListener('error', (event) => {
          setErrorLogs(prev => [...prev, {
            timestamp: new Date().toISOString(),
            message: event.message,
            source: event.filename,
            line: event.lineno,
            col: event.colno
          }].slice(-10)); // 최근 10개만 유지
        });
      }
    };

    collectErrors();
    checkSystemStatus();
    
    // 30초마다 상태 체크
    const interval = setInterval(checkSystemStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // 상태에 따른 색상 결정
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#28a745';
      case 'warning': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className={styles.dashboard}>
      <h1>🔬 VideoPlanet 디버깅 대시보드</h1>
      
      {/* 시스템 상태 */}
      <section className={styles.section}>
        <h2>시스템 상태</h2>
        <div className={styles.statusGrid}>
          {Object.entries(systemStatus).map(([service, info]) => (
            <div key={service} className={styles.statusCard}>
              <h3>{service.toUpperCase()}</h3>
              <div 
                className={styles.statusIndicator}
                style={{ backgroundColor: getStatusColor(info.status) }}
              />
              <p className={styles.statusMessage}>{info.message}</p>
            </div>
          ))}
        </div>
        <button onClick={checkSystemStatus} className={styles.refreshButton}>
          새로고침
        </button>
      </section>

      {/* 사용자 여정 테스트 */}
      <section className={styles.section}>
        <h2>사용자 여정 테스트</h2>
        <button 
          onClick={runJourneyTest} 
          disabled={isRunningTest}
          className={styles.testButton}
        >
          {isRunningTest ? '테스트 실행 중...' : '여정 테스트 실행'}
        </button>
        
        {testResults && (
          <div className={styles.testResults}>
            <div className={styles.summary}>
              <h3>테스트 요약</h3>
              <p>총 테스트: {testResults.summary.total}</p>
              <p>성공: {testResults.summary.passed}</p>
              <p>실패: {testResults.summary.failed}</p>
              <p>성공률: {testResults.summary.successRate}%</p>
            </div>
            
            <div className={styles.journeyDetails}>
              <h3>상세 결과</h3>
              {Object.entries(testResults.journeys).map(([name, result]) => (
                <div key={name} className={styles.journeyItem}>
                  <span className={result.success ? styles.success : styles.fail}>
                    {result.success ? '✅' : '❌'}
                  </span>
                  <span>{name}: {result.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 최근 오류 로그 */}
      <section className={styles.section}>
        <h2>최근 오류 로그</h2>
        {errorLogs.length === 0 ? (
          <p>오류가 감지되지 않았습니다.</p>
        ) : (
          <div className={styles.errorLogs}>
            {errorLogs.map((error, index) => (
              <div key={index} className={styles.errorItem}>
                <span className={styles.timestamp}>
                  {new Date(error.timestamp).toLocaleTimeString()}
                </span>
                <span className={styles.errorMessage}>{error.message}</span>
                <span className={styles.errorSource}>
                  {error.source}:{error.line}:{error.col}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 권장 조치사항 */}
      <section className={styles.section}>
        <h2>권장 조치사항</h2>
        <div className={styles.recommendations}>
          {systemStatus.backend.status !== 'healthy' && (
            <div className={styles.recommendation}>
              <h4>🚨 백엔드 서비스 복구 필요</h4>
              <p>Django 서버가 응급 모드로 작동 중입니다.</p>
              <ul>
                <li>Railway 콘솔에서 로그 확인</li>
                <li>마이그레이션 상태 점검</li>
                <li>환경변수 설정 확인</li>
              </ul>
            </div>
          )}
          
          {systemStatus.auth.status === 'error' && (
            <div className={styles.recommendation}>
              <h4>⚠️ 인증 시스템 점검 필요</h4>
              <p>사용자 로그인/회원가입이 불가능합니다.</p>
              <ul>
                <li>JWT 설정 확인</li>
                <li>CORS 정책 점검</li>
                <li>인증 미들웨어 상태 확인</li>
              </ul>
            </div>
          )}
          
          {testResults && testResults.summary.successRate < 80 && (
            <div className={styles.recommendation}>
              <h4>📊 시스템 안정성 개선 필요</h4>
              <p>성공률이 80% 미만입니다.</p>
              <ul>
                <li>실패한 테스트 케이스 분석</li>
                <li>의존성 관계 점검</li>
                <li>통합 테스트 강화</li>
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}