import dynamic from 'next/dynamic'
import LoadingAnimation from '../src/components/LoadingAnimation'

const AdminDashboard = dynamic(() => import('../src/page/Admin/AdminDashboard'), {
  loading: () => <LoadingAnimation />,
  ssr: false
})

export default AdminDashboard

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}