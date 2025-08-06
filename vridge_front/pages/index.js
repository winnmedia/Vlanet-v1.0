import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import LoadingSpinner from '../src/components/LoadingSpinner'

// 동적 임포트로 코드 스플리팅
const Home = dynamic(() => import('../src/page/Home'), {
  loading: () => <LoadingSpinner />,
  ssr: true
})

function HomePage(props) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Home {...props} />
    </Suspense>
  )
}

export default HomePage

// ISR (Incremental Static Regeneration) 적용
export const getStaticProps = async () => {
  return {
    props: {},
    revalidate: 3600 // 1시간마다 재생성
  }
}