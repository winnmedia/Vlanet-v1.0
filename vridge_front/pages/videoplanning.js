import dynamic from 'next/dynamic'

// 동적 import로 변경하여 SSR 문제 해결
const VideoPlanning = dynamic(
  () => import('../src/page/Cms/VideoPlanning.jsx'),
  { 
    ssr: false,
    loading: () => <div>Loading...</div>
  }
)

export default VideoPlanning

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async (context) => {
  console.log('[videoplanning.js] getServerSideProps called')
  console.log('[videoplanning.js] URL:', context.resolvedUrl)
  
  return {
    props: {}
  }
}
