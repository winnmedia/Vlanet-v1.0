import VideoPlanning from '../src/page/Cms/VideoPlanning-working'

export default VideoPlanning

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async (context) => {
  console.log('[videoplanning.js] getServerSideProps called')
  console.log('[videoplanning.js] URL:', context.resolvedUrl)
  
  return {
    props: {}
  }
}
