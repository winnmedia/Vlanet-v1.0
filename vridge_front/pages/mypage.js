import MyPage from '../src/page/User/MyPage'

export default MyPage

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}