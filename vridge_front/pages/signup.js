import Signup from '../src/page/User/Signup'

export default Signup

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
