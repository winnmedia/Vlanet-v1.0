function Error({ statusCode }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'suit, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        {statusCode
          ? `${statusCode} 에러가 발생했습니다`
          : '클라이언트 에러가 발생했습니다'}
      </h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
        죄송합니다. 페이지를 불러오는 중 문제가 발생했습니다.
      </p>
      <a 
        href="/login" 
        style={{
          padding: '12px 24px',
          backgroundColor: '#1631F8',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          fontSize: '16px'
        }}
      >
        로그인 페이지로 이동
      </a>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error