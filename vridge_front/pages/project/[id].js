import ProjectView from '../../src/page/Cms/ProjectView-fixed.jsx'

export default ProjectView

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}