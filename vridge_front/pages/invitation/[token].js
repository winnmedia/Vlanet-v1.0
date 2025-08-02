import InvitationAccept from '../../src/page/Cms/InvitationAccept.jsx'

export default InvitationAccept

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
