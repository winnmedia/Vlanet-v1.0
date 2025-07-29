import dynamic from 'next/dynamic'
import LoadingAnimation from '../src/components/LoadingAnimation'

// 코드 스플리팅 적용
const Privacy = dynamic(
  () => import('../src/page/Privacy'),
  {
    loading: () => <LoadingAnimation />,
    ssr: true
  }
)

export default Privacy

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
