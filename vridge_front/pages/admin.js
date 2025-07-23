import AdminRedirect from '../src/page/Admin/AdminRedirect'

export default AdminRedirect

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
