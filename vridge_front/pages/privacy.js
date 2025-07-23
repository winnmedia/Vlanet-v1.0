import PrivacyPolicy from '../src/page/Policy/PrivacyPolicy'

export default PrivacyPolicy

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
