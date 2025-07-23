import ProjectCreate from '../../src/page/Cms/ProjectCreate'

export default ProjectCreate

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
