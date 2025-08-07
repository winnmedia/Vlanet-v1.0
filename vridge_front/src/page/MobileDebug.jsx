import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { isMobile, isIOS, isAndroid } from 'config/mobile-config';
import { message } from 'antd'

const MobileDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [apiTest, setApiTest] = useState({ status: 'pending', message: '' });
  
  useEffect(() => {
    // 기본 정보 수집
    const info = {
      userAgent: navigator.userAgent,
      isMobile: isMobile(),
      isIOS: isIOS(),
      isAndroid: isAndroid(),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      currentURL: typeof window !== 'undefined' && window.location.href,
      hostname: typeof window !== 'undefined' && window.location.hostname,
      protocol: (typeof window !== 'undefined' && window.location.protocol,
      apiBaseURL: axios.defaults.baseURL || 'Not set',
      localStorage: {
        hasSession: !!typeof window !== 'undefined' && localStorage.getItem('vridge_session'),
        itemCount: localStorage.length
      },
      network: navigator.connection ? {
        type: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : 'Not available'
    };
    
    setDebugInfo(info);
    
    // API 연결 테스트
    testAPIConnection();
  }, []);
  
  const testAPIConnection = async () => {
    try {
      setApiTest({ status: 'testing', message: 'API 연결 테스트 중...' });
      
      const response = await axios.get('/health/');
      
      if (response.data) {
        setApiTest({ 
          status: 'success', 
          message: `API 연결 성공: ${JSON.stringify(response.data)}` 
        });
      }
    } catch (error) {
      setApiTest({ 
        status: 'error', 
        message: `API 연결 실패: ${error.message}`,
        details: error.response ? {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        } : {
          message: error.message,
          code: error.code
        }
      });
    }
  };
  
  const copyToClipboard = () => {
    const text = JSON.stringify({ debugInfo, apiTest }, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      alert('디버그 정보가 클립보드에 복사되었습니다.');
    });
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '100%', overflowX: 'auto' }}>
      <h1>모바일 디버그 정보</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={copyToClipboard}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px',
            backgroundColor: '#007ACC',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          디버그 정보 복사
        </button>
        
        <button 
          onClick={testAPIConnection}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            marginLeft: '10px'
          }}
        >
          API 재테스트
        </button>
      </div>
      
      <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
        <h2>기기 정보</h2>
        <pre style={{ fontSize: '12px', overflowX: 'auto' }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
      
      <div style={{ 
        backgroundColor: apiTest.status === 'success' ? '#d4edda' : 
                         apiTest.status === 'error' ? '#f8d7da' : '#cce5ff', 
        padding: '10px', 
        borderRadius: '5px' 
      }}>
        <h2>API 연결 상태</h2>
        <p><strong>상태:</strong> {apiTest.status}</p>
        <p><strong>메시지:</strong> {apiTest.message}</p>
        {apiTest.details && (
          <pre style={{ fontSize: '12px', overflowX: 'auto' }}>
            {JSON.stringify(apiTest.details, null, 2)}
          </pre>
        )}
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
        <h3>문제 해결 팁</h3>
        <ul style={{ fontSize: '14px' }}>
          <li>WiFi와 모바일 데이터를 전환해보세요</li>
          <li>브라우저 캐시를 삭제해보세요</li>
          <li>다른 브라우저에서 시도해보세요</li>
          <li>VPN을 사용 중이라면 끄고 시도해보세요</li>
        </ul>
      </div>
    </div>
  );
};

export default MobileDebug;
