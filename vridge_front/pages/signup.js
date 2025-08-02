import Signup from '../src/page/User/Signup.jsx'

export default Signup

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
