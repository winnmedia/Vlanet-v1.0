import AdminDashboard from '../src/page/Admin/AdminDashboard.jsx'

export default AdminDashboard

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
