import CmsHome from '../src/page/Cms/CmsHome.jsx'

export default CmsHome

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}
