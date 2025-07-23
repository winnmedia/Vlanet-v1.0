// 디버깅 헬퍼 - 브라우저 콘솔에서 사용
window.debugProjectAPI = async () => {
  const token = localStorage.getItem('VGID');
  console.log('Current token:', token);
  
  if (!token) {
    console.log('No token found. Please login first.');
    return;
  }
  
  try {
    // 프로젝트 목록 조회
    const response = await fetch('http://localhost:8000/api/projects/project_list/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('Project API Response:', data);
    
    if (data.result && data.result.length > 0) {
      // 첫 번째 프로젝트 상세 조회
      const projectId = data.result[0].id;
      const detailResponse = await fetch(`http://localhost:8000/api/projects/detail/${projectId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const detailData = await detailResponse.json();
      console.log('Project Detail:', detailData);
    }
  } catch (error) {
    console.error('API Error:', error);
  }
};

console.log('Debug helper loaded. Use window.debugProjectAPI() to test API.');