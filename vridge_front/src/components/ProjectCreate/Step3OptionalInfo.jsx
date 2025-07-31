import React, { useState, useEffect } from 'react'

const GENRE_OPTIONS = [
  { value: 'corporate', label: '기업 홍보', icon: '🏢' },
  { value: 'product', label: '제품 소개', icon: '📦' },
  { value: 'education', label: '교육/강의', icon: '🎓' },
  { value: 'event', label: '이벤트', icon: '🎉' },
  { value: 'interview', label: '인터뷰', icon: '🎤' },
  { value: 'commercial', label: '광고', icon: '📺' },
  { value: 'documentary', label: '다큐멘터리', icon: '📹' },
  { value: 'other', label: '기타', icon: '📝' }
]

const COLOR_PALETTE = [
  '#1631F8', '#0F23C9', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#64748b'
]

const Step3OptionalInfo = ({ inputs, onChange, files, FileChange, FileDelete, onValidationChange }) => {
  const { description, color, genre } = inputs
  const [selectedGenre, setSelectedGenre] = useState(genre || '')
  const [selectedColor, setSelectedColor] = useState(color || '#1631F8')
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    // 선택사항이므로 항상 유효
    onValidationChange(true)
  }, [onValidationChange])

  const handleGenreChange = (genreValue) => {
    setSelectedGenre(genreValue)
    onChange({ target: { name: 'genre', value: genreValue } })
  }

  const handleColorChange = (colorValue) => {
    setSelectedColor(colorValue)
    onChange({ target: { name: 'color', value: colorValue } })
  }

  const handleDescriptionChange = (e) => {
    onChange(e)
  }

  return (
    <div className="step3-optional-info">
      <div className="step-header">
        <h2>추가 설정을 완료해주세요</h2>
        <p>선택사항이므로 나중에 수정할 수 있습니다</p>
      </div>

      {/* 장르 선택 */}
      <div className="section">
        <h3>
          프로젝트 장르
          <span className="optional">(선택사항)</span>
        </h3>
        <div className="genre-grid">
          {GENRE_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={`genre-card ${selectedGenre === option.value ? 'selected' : ''}`}
              onClick={() => handleGenreChange(option.value)}
            >
              <div className="genre-icon">{option.icon}</div>
              <div className="genre-label">{option.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 프로젝트 색상 */}
      <div className="section">
        <h3>
          프로젝트 색상
          <span className="optional">(선택사항)</span>
        </h3>
        <p className="section-description">
          캘린더와 대시보드에서 프로젝트를 구분하는 색상입니다
        </p>
        <div className="color-palette">
          {COLOR_PALETTE.map((colorOption) => (
            <div
              key={colorOption}
              className={`color-option ${selectedColor === colorOption ? 'selected' : ''}`}
              style={{ backgroundColor: colorOption }}
              onClick={() => handleColorChange(colorOption)}
            >
              {selectedColor === colorOption && (
                <div className="color-check">✓</div>
              )}
            </div>
          ))}
        </div>
        <div className="color-preview">
          <div className="preview-label">선택된 색상:</div>
          <div 
            className="preview-swatch"
            style={{ backgroundColor: selectedColor }}
          />
          <div className="preview-text">{selectedColor}</div>
        </div>
      </div>

      {/* 고급 설정 토글 */}
      <div className="advanced-toggle">
        <button
          type="button"
          className="toggle-button"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span>고급 설정</span>
          <div className={`toggle-icon ${showAdvanced ? 'open' : ''}`}>
            ▼
          </div>
        </button>
      </div>

      {/* 고급 설정 섹션 */}
      {showAdvanced && (
        <div className="advanced-section">
          {/* 프로젝트 설명 */}
          <div className="section">
            <h3>
              프로젝트 상세 설명
              <span className="optional">(선택사항)</span>
            </h3>
            <div className="description-input">
              <textarea
                name="description"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="프로젝트의 목표, 컨셉, 특별한 요구사항 등을 자유롭게 작성해주세요..."
                maxLength={500}
                rows={4}
              />
              <div className="char-count">{description.length}/500</div>
            </div>
            <div className="input-help">
              상세한 설명은 팀원들과의 소통에 도움이 됩니다
            </div>
          </div>

          {/* 파일 업로드 */}
          <div className="section">
            <h3>
              참고 자료 업로드
              <span className="optional">(선택사항)</span>
            </h3>
            <p className="section-description">
              기획서, 레퍼런스 이미지, 스크립트 등을 업로드할 수 있습니다
            </p>
            
            <div className="file-upload-area">
              <label htmlFor="file-upload" className="upload-button">
                <div className="upload-icon">📎</div>
                <div className="upload-text">
                  <strong>파일 선택</strong>
                  <span>또는 여기로 드래그하세요</span>
                </div>
              </label>
              <input
                id="file-upload"
                type="file"
                onChange={FileChange}
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mov"
                style={{ display: 'none' }}
              />
            </div>

            {files.length > 0 && (
              <div className="uploaded-files">
                <h4>업로드된 파일</h4>
                <div className="file-list">
                  {files.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-info">
                        <div className="file-icon">📄</div>
                        <div className="file-details">
                          <div className="file-name">{file.name}</div>
                          <div className="file-size">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="file-remove"
                        onClick={() => FileDelete(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 완료 안내 */}
      <div className="completion-info">
        <div className="info-box success">
          <div className="info-icon">🎉</div>
          <div className="info-content">
            <strong>프로젝트 생성 준비 완료!</strong>
            <p>모든 설정이 완료되었습니다. 언제든지 나중에 수정할 수 있습니다.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .step3-optional-info {
          max-width: 700px;
          margin: 0 auto;
        }
        
        .step-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .step-header h2 {
          font-size: 28px;
          font-weight: 700;
          color: #1631F8;
          margin-bottom: 8px;
        }
        
        .step-header p {
          font-size: 16px;
          color: #666;
        }
        
        .section {
          margin-bottom: 32px;
        }
        
        .section h3 {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .optional {
          font-size: 14px;
          color: #999;
          font-weight: 400;
        }
        
        .section-description {
          font-size: 14px;
          color: #666;
          margin-bottom: 16px;
        }
        
        .genre-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
        }
        
        .genre-card {
          padding: 16px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #fff;
        }
        
        .genre-card:hover {
          border-color: #1631F8;
          transform: translateY(-1px);
        }
        
        .genre-card.selected {
          border-color: #1631F8;
          background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
        }
        
        .genre-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        
        .genre-label {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }
        
        .color-palette {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
          gap: 8px;
          max-width: 400px;
          margin-bottom: 16px;
        }
        
        .color-option {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }
        
        .color-option:hover {
          transform: scale(1.1);
        }
        
        .color-option.selected {
          border-color: #333;
          transform: scale(1.15);
        }
        
        .color-check {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-weight: bold;
          font-size: 14px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        
        .color-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        
        .preview-label {
          font-size: 14px;
          color: #666;
        }
        
        .preview-swatch {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          border: 1px solid #ddd;
        }
        
        .preview-text {
          font-size: 14px;
          font-family: monospace;
          color: #333;
        }
        
        .advanced-toggle {
          margin-bottom: 24px;
        }
        
        .toggle-button {
          width: 100%;
          padding: 16px;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 16px;
          font-weight: 500;
          color: #333;
          transition: all 0.3s ease;
        }
        
        .toggle-button:hover {
          background: #e9ecef;
        }
        
        .toggle-icon {
          transition: transform 0.3s ease;
        }
        
        .toggle-icon.open {
          transform: rotate(180deg);
        }
        
        .advanced-section {
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 24px;
          background: #fafbfc;
          margin-bottom: 32px;
        }
        
        .description-input {
          position: relative;
        }
        
        .description-input textarea {
          width: 100%;
          padding: 16px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 16px;
          font-family: inherit;
          resize: vertical;
          min-height: 100px;
          transition: border-color 0.3s ease;
        }
        
        .description-input textarea:focus {
          outline: none;
          border-color: #1631F8;
        }
        
        .char-count {
          position: absolute;
          bottom: 8px;
          right: 12px;
          font-size: 12px;
          color: #999;
          background: #fff;
          padding: 2px 4px;
          border-radius: 3px;
        }
        
        .input-help {
          font-size: 12px;
          color: #666;
          margin-top: 6px;
        }
        
        .file-upload-area {
          border: 2px dashed #e9ecef;
          border-radius: 8px;
          padding: 32px;
          text-align: center;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .file-upload-area:hover {
          border-color: #1631F8;
          background: #f8f9ff;
        }
        
        .upload-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }
        
        .upload-icon {
          font-size: 32px;
        }
        
        .upload-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .upload-text strong {
          font-size: 16px;
          color: #1631F8;
        }
        
        .upload-text span {
          font-size: 14px;
          color: #666;
        }
        
        .uploaded-files {
          margin-top: 20px;
        }
        
        .uploaded-files h4 {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
        }
        
        .file-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #fff;
          border: 1px solid #e9ecef;
          border-radius: 6px;
        }
        
        .file-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .file-icon {
          font-size: 20px;
        }
        
        .file-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .file-name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }
        
        .file-size {
          font-size: 12px;
          color: #666;
        }
        
        .file-remove {
          width: 24px;
          height: 24px;
          border: none;
          background: #dc3545;
          color: white;
          border-radius: 50%;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.3s ease;
        }
        
        .file-remove:hover {
          background: #c82333;
        }
        
        .completion-info {
          margin-top: 32px;
        }
        
        .info-box {
          display: flex;
          gap: 12px;
          padding: 20px;
          border-radius: 8px;
        }
        
        .info-box.success {
          background: #f0f9f4;
          border: 1px solid #bbf7d0;
        }
        
        .info-icon {
          font-size: 24px;
          flex-shrink: 0;
        }
        
        .info-content strong {
          display: block;
          color: #15803d;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .info-content p {
          color: #166534;
          font-size: 14px;
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .genre-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .color-palette {
            grid-template-columns: repeat(8, 1fr);
          }
          
          .color-preview {
            flex-wrap: wrap;
          }
          
          .advanced-section {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  )
}

export default Step3OptionalInfo