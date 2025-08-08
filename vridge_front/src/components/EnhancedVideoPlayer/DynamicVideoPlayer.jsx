import dynamic from 'next/dynamic';

// react-player를 동적으로 임포트하여 SSR 문제 해결
const EnhancedVideoPlayer = dynamic(
  () => import('./EnhancedVideoPlayer'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#000',
        color: '#fff'
      }}>
        Loading player...
      </div>
    )
  }
);

export default EnhancedVideoPlayer;