import dynamic from 'next/dynamic'
import LoadingAnimation from '../src/components/LoadingAnimation'

const EmailMonitor = dynamic(() => import('../src/page/Admin/EmailMonitor'), {
  loading: () => <LoadingAnimation />,
  ssr: false
})

export default EmailMonitor

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}