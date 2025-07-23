import Login from '../src/page/User/Login'

export default Login

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
