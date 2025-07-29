import dynamic from 'next/dynamic'
import LoadingAnimation from '../src/components/LoadingAnimation'

// 코드 스플리팅 적용
const AdminRedirect = dynamic(
  () => import('../src/page/Admin/AdminRedirect'),
  {
    loading: () => <LoadingAnimation />,
    ssr: false
  }
)

export default AdminRedirect

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
