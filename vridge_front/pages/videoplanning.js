import VideoPlanning from '../src/page/Cms/VideoPlanning'

export default VideoPlanning

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
