import Calendar from '../src/page/Cms/Calendar.jsx'

export default Calendar

// SSR에서 정적 생성 비활성화
export const getServerSideProps = async () => {
  return {
    props: {}
  }
}