import Feedback from '../../src/page/Cms/Feedback'

export default Feedback

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}