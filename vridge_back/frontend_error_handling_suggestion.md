# 프론트엔드 에러 처리 개선 제안

## VideoPlanning.jsx의 downloadPlanningAsPDF 함수 개선

```javascript
const downloadPlanningAsPDF = async (planningId, planningTitle) => {
  try {
    const response = await axios.get(
      `/api/video-planning/export/pdf/${planningId}/`,
      { responseType: 'blob' }
    )
    
    // Blob으로부터 다운로드 URL 생성
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${planningTitle}_기획안.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    setSuccessMessage('PDF 다운로드가 완료되었습니다.')
    setTimeout(() => setSuccessMessage(null), 3000)
  } catch (err) {
    // 더 상세한 에러 처리
    if (err.response?.status === 404) {
      setError(`기획을 찾을 수 없습니다. (ID: ${planningId}). 페이지를 새로고침하여 최신 목록을 확인해주세요.`)
      // 최근 기획 목록 자동 새로고침
      fetchRecentPlannings()
    } else if (err.response?.status === 401) {
      setError('로그인이 필요합니다.')
      // 필요시 로그인 페이지로 리다이렉트
    } else {
      setError('PDF 다운로드에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
    console.error('PDF download error:', err)
  }
}
```

## 추가 개선사항

1. **ID 유효성 검증**:
```javascript
// 다운로드 전 ID 유효성 확인
if (!planningId || planningId < 1) {
  setError('유효하지 않은 기획 ID입니다.')
  return
}
```

2. **로딩 상태 표시**:
```javascript
const [isDownloading, setIsDownloading] = useState(false)

const downloadPlanningAsPDF = async (planningId, planningTitle) => {
  setIsDownloading(true)
  try {
    // ... 다운로드 로직
  } finally {
    setIsDownloading(false)
  }
}
```

3. **데이터 동기화**:
- 페이지 로드 시 항상 최신 기획 목록을 가져오도록 보장
- 로컬 스토리지에 캐시된 오래된 ID 제거