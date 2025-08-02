import FeedbackAll from '../src/page/Cms/FeedbackAll.jsx'

export default FeedbackAll

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}