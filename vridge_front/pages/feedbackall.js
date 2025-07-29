import dynamic from 'next/dynamic'
import LoadingAnimation from '../src/components/LoadingAnimation'

const FeedbackAll = dynamic(() => import('../src/page/Cms/FeedbackAll'), {
  loading: () => <LoadingAnimation />,
  ssr: false
})

export default FeedbackAll

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}