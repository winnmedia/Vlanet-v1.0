import dynamic from 'next/dynamic'
import LoadingAnimation from '../src/components/LoadingAnimation'

const Signup = dynamic(() => import('../src/page/User/Signup'), {
  loading: () => <LoadingAnimation />,
  ssr: false
})

export default Signup

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}