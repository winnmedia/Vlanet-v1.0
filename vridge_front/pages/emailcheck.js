import EmailCheck from '../src/page/User/EmailCheck.jsx'

export default EmailCheck

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
