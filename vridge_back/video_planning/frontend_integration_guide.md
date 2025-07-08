# 기획안 내보내기 프론트엔드 연동 가이드

## 📋 API 엔드포인트

### 기본 정보
- **베이스 URL**: `https://videoplanet.up.railway.app/api/video-planning/proposals/`
- **인증**: JWT Bearer 토큰 필요
- **Content-Type**: `application/json`

### 엔드포인트 목록

1. **전체 내보내기**: `POST /export/`
2. **구조 미리보기**: `POST /preview/`
3. **Google Slides 생성**: `POST /create-slides/`
4. **템플릿 조회**: `GET /templates/`
5. **서비스 상태**: `GET /status/`

## 🔧 JavaScript 연동 예시

### 1. API 클라이언트 설정

```javascript
class ProposalExportAPI {
  constructor(baseURL = 'https://videoplanet.up.railway.app/api', authToken = null) {
    this.baseURL = baseURL;
    this.authToken = authToken;
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    const url = `${this.baseURL}/video-planning/proposals${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 서비스 상태 확인
  async checkServiceStatus() {
    return await this.makeRequest('/status/');
  }

  // 구조 미리보기
  async previewStructure(planningText) {
    return await this.makeRequest('/preview/', 'POST', {
      planning_text: planningText,
      preview_only: true
    });
  }

  // 전체 내보내기
  async exportProposal(planningText, format = 'google_slides', title = null) {
    const requestData = {
      planning_text: planningText,
      export_format: format
    };

    if (title) {
      requestData.title = title;
    }

    return await this.makeRequest('/export/', 'POST', requestData);
  }

  // 구조화된 데이터로 Google Slides 생성
  async createSlidesFromStructure(structuredData) {
    return await this.makeRequest('/create-slides/', 'POST', structuredData);
  }

  // 템플릿 조회
  async getTemplates() {
    return await this.makeRequest('/templates/');
  }
}
```

### 2. React 컴포넌트 예시

```jsx
import React, { useState, useEffect } from 'react';
import { ProposalExportAPI } from './proposalExportAPI';

const ProposalExportPage = () => {
  const [planningText, setPlanningText] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);

  const api = new ProposalExportAPI();

  useEffect(() => {
    // 컴포넌트 마운트 시 서비스 상태 확인
    checkServiceStatus();
    
    // JWT 토큰 설정 (localStorage에서 가져오기)
    const token = localStorage.getItem('authToken');
    if (token) {
      api.setAuthToken(token);
    }
  }, []);

  const checkServiceStatus = async () => {
    try {
      const result = await api.checkServiceStatus();
      if (result.success) {
        setServiceStatus(result.data.services);
      }
    } catch (error) {
      console.error('서비스 상태 확인 실패:', error);
    }
  };

  const handlePreview = async () => {
    if (!planningText.trim()) {
      alert('기획안 텍스트를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.previewStructure(planningText);
      
      if (result.success) {
        setPreviewData(result.data.structured_data);
      } else {
        alert(`미리보기 실패: ${result.data.message || result.error}`);
      }
    } catch (error) {
      alert(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!planningText.trim()) {
      alert('기획안 텍스트를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.exportProposal(planningText);
      
      if (result.success) {
        setExportResult(result.data);
        
        // Google Slides URL이 있으면 새 탭에서 열기
        if (result.data.presentation?.url) {
          window.open(result.data.presentation.url, '_blank');
        }
      } else {
        // 부분 성공인 경우 처리
        if (result.status === 207) {
          setExportResult(result.data);
          alert(`부분 성공: ${result.data.message}`);
        } else {
          alert(`내보내기 실패: ${result.data.message || result.error}`);
        }
      }
    } catch (error) {
      alert(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSlides = async () => {
    if (!previewData) {
      alert('먼저 구조 미리보기를 생성해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.createSlidesFromStructure(previewData);
      
      if (result.success) {
        setExportResult(result.data);
        
        // Google Slides URL 열기
        if (result.data.presentation?.url) {
          window.open(result.data.presentation.url, '_blank');
        }
      } else {
        alert(`Google Slides 생성 실패: ${result.data.message || result.error}`);
      }
    } catch (error) {
      alert(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="proposal-export-page">
      <h1>AI 기반 기획안 내보내기</h1>
      
      {/* 서비스 상태 표시 */}
      {serviceStatus && (
        <div className="service-status">
          <h3>서비스 상태</h3>
          <div className={`status-item ${serviceStatus.gemini_api ? 'available' : 'unavailable'}`}>
            Gemini API: {serviceStatus.gemini_api ? '✅ 사용 가능' : '❌ 사용 불가'}
          </div>
          <div className={`status-item ${serviceStatus.google_slides ? 'available' : 'unavailable'}`}>
            Google Slides: {serviceStatus.google_slides ? '✅ 사용 가능' : '❌ 사용 불가'}
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="input-section">
        <h3>기획안 텍스트 입력</h3>
        <textarea
          value={planningText}
          onChange={(e) => setPlanningText(e.target.value)}
          placeholder="자유 형식으로 영상 기획안을 입력해주세요. (최소 50자, 최대 10,000자)"
          rows={15}
          cols={80}
          maxLength={10000}
        />
        <div className="char-count">
          {planningText.length} / 10,000자
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="button-section">
        <button 
          onClick={handlePreview} 
          disabled={isLoading || !planningText.trim()}
          className="preview-btn"
        >
          {isLoading ? '처리 중...' : '구조 미리보기'}
        </button>
        
        <button 
          onClick={handleExport} 
          disabled={isLoading || !planningText.trim()}
          className="export-btn"
        >
          {isLoading ? '처리 중...' : 'Google Slides로 내보내기'}
        </button>
        
        {previewData && (
          <button 
            onClick={handleCreateSlides} 
            disabled={isLoading}
            className="create-slides-btn"
          >
            {isLoading ? '처리 중...' : '미리보기로 Google Slides 생성'}
          </button>
        )}
      </div>

      {/* 미리보기 결과 */}
      {previewData && (
        <div className="preview-section">
          <h3>구조 미리보기</h3>
          <div className="metadata">
            <h4>{previewData.metadata?.title}</h4>
            <p>{previewData.metadata?.subtitle}</p>
            <div className="meta-info">
              <span>프로젝트 유형: {previewData.metadata?.project_type}</span>
              <span>타겟: {previewData.metadata?.target_audience}</span>
              <span>예상 길이: {previewData.metadata?.duration}</span>
            </div>
          </div>
          
          <div className="slides-preview">
            <h4>슬라이드 구성 ({previewData.slides?.length}개)</h4>
            {previewData.slides?.map((slide, index) => (
              <div key={index} className="slide-preview">
                <h5>{slide.slide_number}. {slide.title}</h5>
                <p>레이아웃: {slide.layout}</p>
                {slide.content?.bullet_points && (
                  <ul>
                    {slide.content.bullet_points.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 내보내기 결과 */}
      {exportResult && (
        <div className="export-result">
          <h3>내보내기 결과</h3>
          {exportResult.presentation ? (
            <div className="success-result">
              <p>✅ Google Slides가 성공적으로 생성되었습니다!</p>
              <div className="presentation-info">
                <p><strong>제목:</strong> {exportResult.presentation.title}</p>
                <p><strong>슬라이드 수:</strong> {exportResult.presentation.slide_count}개</p>
                <a 
                  href={exportResult.presentation.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="slides-link"
                >
                  Google Slides에서 열기 →
                </a>
              </div>
            </div>
          ) : (
            <div className="partial-result">
              <p>⚠️ 부분적으로 완료되었습니다.</p>
              <p>{exportResult.message}</p>
              {exportResult.structured_data && (
                <p>구조화된 데이터는 생성되었습니다. 수동으로 Google Slides를 생성할 수 있습니다.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProposalExportPage;
```

### 3. CSS 스타일 예시

```css
.proposal-export-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.service-status {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.status-item {
  margin: 5px 0;
  padding: 5px 10px;
  border-radius: 4px;
}

.status-item.available {
  background: #d4edda;
  color: #155724;
}

.status-item.unavailable {
  background: #f8d7da;
  color: #721c24;
}

.input-section {
  margin-bottom: 20px;
}

.input-section textarea {
  width: 100%;
  padding: 15px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #6c757d;
  margin-top: 5px;
}

.button-section {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.button-section button {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preview-btn {
  background: #6c757d;
  color: white;
}

.export-btn {
  background: #4318FF;
  color: white;
}

.create-slides-btn {
  background: #28a745;
  color: white;
}

.button-section button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.button-section button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.preview-section, .export-result {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.metadata h4 {
  margin: 0 0 10px 0;
  color: #212529;
}

.meta-info {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.meta-info span {
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 12px;
}

.slide-preview {
  background: #f8f9fa;
  padding: 15px;
  margin: 10px 0;
  border-radius: 6px;
  border-left: 4px solid #4318FF;
}

.slides-link {
  display: inline-block;
  padding: 10px 20px;
  background: #4285f4;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  margin-top: 10px;
}

.slides-link:hover {
  background: #3367d6;
}
```

## 🔍 사용 시나리오

### 시나리오 1: 간단한 미리보기 후 내보내기

```javascript
// 1. 구조 미리보기
const previewResult = await api.previewStructure(userInput);

// 2. 미리보기 확인 후 Google Slides 생성
if (previewResult.success) {
  const slidesResult = await api.createSlidesFromStructure(previewResult.data.structured_data);
  
  if (slidesResult.success) {
    window.open(slidesResult.data.presentation.url, '_blank');
  }
}
```

### 시나리오 2: 원스텝 내보내기

```javascript
// 바로 Google Slides 생성
const exportResult = await api.exportProposal(userInput, 'google_slides', '나의 기획서');

if (exportResult.success && exportResult.data.presentation) {
  // 성공
  window.open(exportResult.data.presentation.url, '_blank');
} else if (exportResult.status === 207) {
  // 부분 성공 - 구조화는 됐지만 Google Slides 생성 실패
  console.log('구조화 성공, Google Slides 생성 실패');
  // 사용자에게 수동 편집 옵션 제공
}
```

## ⚠️ 주의사항

1. **인증 토큰**: 모든 API 호출에 유효한 JWT 토큰이 필요합니다.
2. **텍스트 길이**: 50자 이상 10,000자 이하의 텍스트만 허용됩니다.
3. **API 제한**: 사용자별 시간당 호출 제한이 있을 수 있습니다.
4. **에러 처리**: 네트워크 오류, API 제한, 서비스 장애 등을 적절히 처리해야 합니다.
5. **보안**: API 키나 민감한 정보를 클라이언트 코드에 노출하지 마세요.

## 🔧 환경 설정

Railway 환경에서 다음 환경 변수가 설정되어야 합니다:

- `GOOGLE_API_KEY`: Gemini API 키
- `GOOGLE_APPLICATION_CREDENTIALS`: Google Slides API 서비스 계정 키 파일 경로

## 📊 모니터링

프로덕션 환경에서는 다음을 모니터링하세요:

- API 응답 시간
- 성공/실패율
- 사용자별 사용량
- Google API 할당량 사용량