import dynamic from 'next/dynamic'
import LoadingAnimation from '../src/components/LoadingAnimation'

const Login = dynamic(() => import('../src/page/User/Login'), {
  loading: () => <LoadingAnimation />,
  ssr: false
})

export default Login

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}