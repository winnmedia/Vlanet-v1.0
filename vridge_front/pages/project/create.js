import dynamic from 'next/dynamic'
import LoadingAnimation from '../../src/components/LoadingAnimation'

const ProjectCreate = dynamic(() => import('../../src/page/Cms/ProjectCreate'), {
  loading: () => <LoadingAnimation />,
  ssr: false
})

export default ProjectCreate

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}