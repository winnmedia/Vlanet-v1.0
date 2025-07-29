import dynamic from 'next/dynamic'
import LoadingAnimation from '../../src/components/LoadingAnimation'

// 코드 스플리팅 적용
const Feedback = dynamic(
  () => import('../../src/page/Cms/Feedback'),
  {
    loading: () => <LoadingAnimation />,
    ssr: true
  }
)

export default Feedback

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}