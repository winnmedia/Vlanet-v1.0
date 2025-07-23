import TermsOfService from '../src/page/Policy/TermsOfService'

export default TermsOfService

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
