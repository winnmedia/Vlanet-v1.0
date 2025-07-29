
import dynamic from 'next/dynamic'
const Home = dynamic(() => import('../src/page/Home'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});;

export default Home

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}