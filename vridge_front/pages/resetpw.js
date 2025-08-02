import ResetPw from '../src/page/User/ResetPw.jsx'

export default ResetPw

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
