import EmailMonitor from '../src/page/Admin/EmailMonitor.jsx'

export default EmailMonitor

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
