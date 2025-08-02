import ProjectEdit from '../../../src/page/Cms/ProjectEdit.jsx'

export default ProjectEdit

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
