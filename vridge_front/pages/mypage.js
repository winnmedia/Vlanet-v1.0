import dynamic from 'next/dynamic'
import LoadingAnimation from '../src/components/LoadingAnimation'

const MyPage = dynamic(() => import('../src/page/User/MyPage'), {
  loading: () => <LoadingAnimation />,
  ssr: false
})

export default MyPage

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}