
import dynamic from 'next/dynamic'
const InvitationAccept = dynamic(() => import('../../src/page/Cms/InvitationAccept'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});;

export default InvitationAccept

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
