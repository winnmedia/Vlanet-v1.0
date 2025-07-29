import dynamic from 'next/dynamic'
import LoadingAnimation from '../src/components/LoadingAnimation'

// 코드 스플리팅 적용
const NotFound = dynamic(
  () => import('../src/page/NotFound'),
  {
    loading: () => <LoadingAnimation />,
    ssr: true
  }
)

export default NotFound