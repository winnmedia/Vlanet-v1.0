import dynamic from 'next/dynamic'
import LoadingAnimation from '../src/components/LoadingAnimation'

// 코드 스플리팅 적용
const EmailCheck = dynamic(
  () => import('../src/page/User/EmailCheck'),
  {
    loading: () => <LoadingAnimation />,
    ssr: true
  }
)

export default EmailCheck

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
