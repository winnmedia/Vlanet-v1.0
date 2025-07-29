import dynamic from 'next/dynamic'
import LoadingAnimation from '../src/components/LoadingAnimation'

// 동적 import로 변경하여 SSR 문제 해결 - 로딩 컴포넌트 개선
const VideoPlanning = dynamic(
  () => import('../src/page/Cms/VideoPlanning'),
  { 
    ssr: false,
    loading: () => <LoadingAnimation />
  }
)

export default VideoPlanning

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async (context) => {
  return {
    props: {}
  }
}
