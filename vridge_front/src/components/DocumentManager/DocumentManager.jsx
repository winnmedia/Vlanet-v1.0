import React, { useState, useEffect } from 'react';
import { Upload, Button, List, Card, Modal, Input, Select, Tag, Space, Tooltip, message, Spin } from 'antd';
import { UploadOutlined, FileOutlined, DownloadOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import axios from 'axios';
import './DocumentManager.css';
import { toast } from 'react-toastify';

const { Search } = Input;
const { Option } = Select;

// 문서 카테고리 정의
const DOCUMENT_CATEGORIES = [
  { value: 'contract', label: '계약서', color: '#f50' },
  { value: 'planning', label: '기획서', color: '#2db7f5' },
  { value: 'script', label: '대본', color: '#87d068' },
  { value: 'storyboard', label: '스토리보드', color: '#108ee9' },
  { value: 'report', label: '보고서', color: '#722ed1' },
  { value: 'reference', label: '참고자료', color: '#faad14' },
  { value: 'other', label: '기타', color: '#666' }
];

const DocumentManager = ({ projectId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('other');
  const [uploadDescription, setUploadDescription] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/projects/${projectId}/documents/`);
      setDocuments(response.data.documents || []);
    } catch (error) {
      toast.error('문서 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', uploadCategory);
    formData.append('description', uploadDescription);

    setUploading(true);
    try {
      const response = await axios.post(
        `/api/projects/${projectId}/documents/upload/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        toast.success('문서가 업로드되었습니다.');
        fetchDocuments();
        setUploadModalVisible(false);
        setUploadDescription('');
      }
    } catch (error) {
      toast.error('문서 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }

    return false; // 자동 업로드 방지
  };

  const handleDelete = async (documentId) => {
    Modal.confirm({
      title: '문서 삭제',
      content: '정말로 이 문서를 삭제하시겠습니까?',
      okText: '삭제',
      cancelText: '취소',
      okType: 'danger',
      onOk: async () => {
        try {
          await axios.delete(`/api/projects/${projectId}/documents/${documentId}/`);
          toast.success('문서가 삭제되었습니다.');
          fetchDocuments();
        } catch (error) {
          toast.error('문서 삭제에 실패했습니다.');
        }
      },
    });
  };

  const handleDownload = async (document) => {
    try {
      const response = await axios.get(
        `/api/projects/${projectId}/documents/${document.id}/download/`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('문서 다운로드에 실패했습니다.');
    }
  };

  const handlePreview = (document) => {
    setPreviewDocument(document);
    setPreviewVisible(true);
  };

  // 필터링된 문서 목록
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchText.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 파일 크기 포맷
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 날짜 포맷
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR') + ' ' + date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  // 카테고리 정보 가져오기
  const getCategoryInfo = (categoryValue) => {
    return DOCUMENT_CATEGORIES.find(cat => cat.value === categoryValue) || DOCUMENT_CATEGORIES[6];
  };

  return (
    <div className="document-manager">
      <Card title="문서 관리" className="document-manager-card">
        <div className="document-manager-header">
          <Space>
            <Search
              placeholder="문서 검색"
              onSearch={setSearchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
            />
            <Select
              defaultValue="all"
              style={{ width: 120 }}
              onChange={setSelectedCategory}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">전체</Option>
              {DOCUMENT_CATEGORIES.map(cat => (
                <Option key={cat.value} value={cat.value}>
                  <Tag color={cat.color}>{cat.label}</Tag>
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setUploadModalVisible(true)}
              style={{
                background: 'linear-gradient(135deg, #1631F8 0%, #0F23C9 100%)',
                border: 'none',
              }}
            >
              문서 업로드
            </Button>
          </Space>
        </div>

        <div className="document-list">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : (
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
              dataSource={filteredDocuments}
              renderItem={(document) => {
                const categoryInfo = getCategoryInfo(document.category);
                return (
                  <List.Item>
                    <Card
                      className="document-card"
                      hoverable
                      actions={[
                        <Tooltip title="미리보기">
                          <EyeOutlined onClick={() => handlePreview(document)} />
                        </Tooltip>,
                        <Tooltip title="다운로드">
                          <DownloadOutlined onClick={() => handleDownload(document)} />
                        </Tooltip>,
                        <Tooltip title="삭제">
                          <DeleteOutlined onClick={() => handleDelete(document.id)} />
                        </Tooltip>,
                      ]}
                    >
                      <div className="document-icon">
                        <FileOutlined style={{ fontSize: 48, color: '#1631F8' }} />
                      </div>
                      <Card.Meta
                        title={
                          <Tooltip title={document.filename}>
                            <div className="document-title">{document.filename}</div>
                          </Tooltip>
                        }
                        description={
                          <div className="document-meta">
                            <Tag color={categoryInfo.color}>{categoryInfo.label}</Tag>
                            <div className="document-info">
                              <div>{formatFileSize(document.size)}</div>
                              <div>{formatDate(document.uploaded_at)}</div>
                              {document.description && (
                                <div className="document-description">{document.description}</div>
                              )}
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </List.Item>
                );
              }}
            />
          )}
        </div>
      </Card>

      {/* 업로드 모달 */}
      <Modal
        title="문서 업로드"
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={500}
      >
        <div className="upload-form">
          <div className="form-item">
            <label>카테고리</label>
            <Select
              value={uploadCategory}
              onChange={setUploadCategory}
              style={{ width: '100%' }}
            >
              {DOCUMENT_CATEGORIES.map(cat => (
                <Option key={cat.value} value={cat.value}>
                  <Tag color={cat.color}>{cat.label}</Tag>
                </Option>
              ))}
            </Select>
          </div>
          
          <div className="form-item">
            <label>설명 (선택사항)</label>
            <Input.TextArea
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder="문서에 대한 간단한 설명을 입력하세요"
              rows={3}
            />
          </div>

          <Upload
            beforeUpload={handleUpload}
            showUploadList={false}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
          >
            <Button
              icon={<UploadOutlined />}
              loading={uploading}
              style={{ width: '100%', height: 100 }}
              type="dashed"
            >
              클릭하거나 파일을 드래그하여 업로드
            </Button>
          </Upload>
        </div>
      </Modal>

      {/* 미리보기 모달 */}
      <Modal
        title={previewDocument?.filename}
        visible={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="download" type="primary" onClick={() => handleDownload(previewDocument)}>
            다운로드
          </Button>,
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            닫기
          </Button>,
        ]}
        width={800}
      >
        {previewDocument && (
          <div className="document-preview">
            <div className="preview-info">
              <Tag color={getCategoryInfo(previewDocument.category).color}>
                {getCategoryInfo(previewDocument.category).label}
              </Tag>
              <span>크기: {formatFileSize(previewDocument.size)}</span>
              <span>업로드: {formatDate(previewDocument.uploaded_at)}</span>
            </div>
            {previewDocument.description && (
              <div className="preview-description">
                <strong>설명:</strong> {previewDocument.description}
              </div>
            )}
            {/* 이미지 파일인 경우 미리보기 */}
            {['jpg', 'jpeg', 'png', 'gif'].includes(previewDocument.filename.split('.').pop().toLowerCase()) && (
              <div className="preview-image">
                <img src={previewDocument.url} alt={previewDocument.filename} style={{ maxWidth: '100%' }} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DocumentManager;