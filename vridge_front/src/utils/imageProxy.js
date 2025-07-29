import axios from '../config/axios'

/**
 * 이미지 URL을 프록시 URL로 변환합니다.
 * @param {string} imageUrl - 원본 이미지 URL
 * @returns {string} 프록시 URL
 */
export const getProxyImageUrl = (imageUrl) => {
  if (!imageUrl) return null
  
  // 이미 base64 데이터인 경우 그대로 반환
  if (imageUrl.startsWith('data:')) {
    return imageUrl
  }
  
  // 이미 프록시 URL인 경우 그대로 반환
  if (imageUrl.includes('/api/video-planning/proxy/image/')) {
    return imageUrl
  }
  
  // OpenAI URL인 경우 프록시 사용
  if (imageUrl.includes('oaidalleapiprodscus.blob.core.windows.net') || 
      imageUrl.includes('openai.com') ||
      imageUrl.includes('dalle-images.s3.amazonaws.com')) {
    const baseUrl = axios.defaults.baseURL || ''
    return `${baseUrl}/api/video-planning/proxy/image/?url=${encodeURIComponent(imageUrl)}`
  }
  
  // 그 외의 경우 원본 URL 반환
  return imageUrl
}

/**
 * 이미지를 base64로 변환합니다.
 * @param {string} imageUrl - 원본 이미지 URL
 * @returns {Promise<string>} base64 데이터 URL
 */
export const convertToBase64 = async (imageUrl) => {
  try {
    const response = await axios.post('/api/video-planning/convert/base64/', {
      image_url: imageUrl
    })
    
    if (response.data.status === 'success') {
      return response.data.data.base64_url
    }
    
    throw new Error(response.data.message || '이미지 변환 실패')
  } catch (error) {
    return null
  }
}

/**
 * 이미지 로드 에러 핸들러
 * @param {Event} event - 에러 이벤트
 * @param {string} originalUrl - 원본 이미지 URL
 * @param {Function} setImageUrl - 이미지 URL 설정 함수
 */
export const handleImageError = async (event, originalUrl, setImageUrl) => {
  try {
    const base64Url = await convertToBase64(originalUrl)
    if (base64Url) {
      setImageUrl(base64Url)
    } else {
      // 플레이스홀더 이미지 설정
      event.target.style.display = 'none'
      if (event.target.nextSibling) {
        event.target.nextSibling.style.display = 'flex'
      }
    }
  } catch (error) {
    event.target.style.display = 'none'
    if (event.target.nextSibling) {
      event.target.nextSibling.style.display = 'flex'
    }
  }
}