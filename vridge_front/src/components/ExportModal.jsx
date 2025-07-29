import React, { useState } from 'react';
import { UnifiedButton } from '../components/unified/UnifiedButton';

import axios from '../config/axios';
import { Button } from './unified/Button';
import UnifiedModal from './unified/UnifiedModal';

export default function ExportModal({ open, onClose, planningData }) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      // 기획 데이터 준비
      const exportData = {
        title: planningData.planningTitle || '영상 기획안',
        planning_text: planningData.planning,
        tone: planningData.planningOptions?.tone,
        genre: planningData.planningOptions?.genre,
        concept: planningData.planningOptions?.concept,
        target: planningData.planningOptions?.target,
        purpose: planningData.planningOptions?.purpose,
        duration: planningData.planningOptions?.duration,
        stories: planningData.stories || [],
        scenes: planningData.scenes?.map((scene) => ({
          ...scene,
          title: scene.scene_title || scene.title,
          description: scene.action || scene.description
        })) || [],
        shots: planningData.shots || [],
        storyboards: planningData.storyboards || [],
        character_name: planningData.planningOptions?.characterName,
        character_description: planningData.planningOptions?.characterDescription
      };

      // PDF 내보내기
      const response = await axios.post(
        '/api/video-planning/export/pdf/',
        {
          planning_data: exportData,
          export_type: 'full'
        },
        {
          responseType: 'blob'
        }
      );

      // 파일 다운로드
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // 파일명 추출
      const contentDisposition = response.headers['content-disposition'];
      let filename = '영상기획안.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setExportSuccess('PDF 파일이 다운로드되었습니다.');

      // 3초 후 모달 닫기
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      
      if (error.response?.data?.message) {
        setExportError(error.response.data.message);
      } else {
        setExportError('PDF 생성 중 오류가 발생했습니다.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <UnifiedModal
      open={open}
      onClose={onClose}
      title="영상 기획안 내보내기"
      size="medium"
    >
      <UnifiedModal open={true} onClose={() => {}} className="export-modal-content" role="dialog" aria-modal="true">
          <div className="export-info">
            <p>작성하신 영상 기획안을 PDF 파일로 내보낼 수 있습니다.</p>
            <p>PDF에는 다음 내용이 포함됩니다:</p>
            <ul>
              <li>기획 개요 및 컨셉</li>
              <li>타겟 및 목적</li>
              <li>기승전결 스토리 구성</li>
              <li>각 씬별 상세 내용</li>
              <li>스토리보드 이미지 (생성된 경우)</li>
            </ul>
          </div>

          {exportError &&
          <div className="export-error">
              ❌ {exportError}
            </div>
          }

          {exportSuccess &&
          <div className="export-success">
              ✅ {exportSuccess}
            </div>
          }
        </div>

        <div className="export-modal-footer" role="dialog" aria-modal="true">
          <Button variant="secondary" onClick={onClose} onKeyDown={(e) => e.key === 'Enter' && onClose} aria-label="Click">
            취소
          </Button>
          <Button variant="primary" onClick={handleExport} onKeyDown={(e) => e.key === 'Enter' && handleExport} disabled={isExporting} aria-label="Click">
            {isExporting ? '내보내는 중...' : 'PDF로 내보내기'}
          </Button>
        </div>
      </div>
    </UnifiedModal>
  );
}