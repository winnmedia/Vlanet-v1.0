import dynamic from 'next/dynamic'
import LoadingAnimation from '../src/components/LoadingAnimation'

const Calendar = dynamic(() => import('../src/page/Cms/Calendar'), {
  loading: () => <LoadingAnimation />,
  ssr: false
})

export default Calendar

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}