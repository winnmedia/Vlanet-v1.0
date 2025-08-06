export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const errorData = req.body
    
    // 프로덕션 환경에서만 로깅
    if (process.env.NODE_ENV === 'production') {
      // 실제 환경에서는 여기서 로깅 서비스로 전송
      // 예: Sentry, LogRocket, 또는 자체 로깅 시스템
      console.error('[Client Error]', {
        timestamp: errorData.timestamp,
        message: errorData.message,
        url: errorData.url,
        userAgent: errorData.userAgent,
        stack: errorData.stack
      })
      
      // 추가로 데이터베이스나 외부 서비스에 저장 가능
      // await saveErrorToDatabase(errorData)
    }
    
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error logging failed:', error)
    res.status(500).json({ success: false, error: 'Failed to log error' })
  }
}