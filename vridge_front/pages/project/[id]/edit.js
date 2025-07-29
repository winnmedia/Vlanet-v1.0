
import dynamic from 'next/dynamic'
const ProjectEdit = dynamic(() => import('../../../src/page/Cms/ProjectEdit'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});;

export default ProjectEdit

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
