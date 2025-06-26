import React, { useState, useEffect } from 'react'
import './ProjectForm.scss'
import { DatePicker, Input, Upload, Button, Select, Tag, ColorPicker, Form, Space, message } from 'antd'
import { 
  PlusOutlined, 
  DeleteOutlined, 
  CalendarOutlined,
  TeamOutlined,
  FileAddOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import moment from 'moment'
import 'moment/locale/ko'

const { TextArea } = Input
const { Option } = Select

export default function ProjectForm({ 
  project, 
  onSubmit, 
  isEdit = false,
  availableMembers = [] 
}) {
  const [form] = Form.useForm()
  const [files, setFiles] = useState([])
  const [projectColor, setProjectColor] = useState('#4A90E2')
  const [selectedMembers, setSelectedMembers] = useState([])
  
  const phases = [
    { key: 'basic_plan', name: '기초기획안 작성', color: '#4A90E2' },
    { key: 'story_board', name: '스토리보드 작성', color: '#50E3C2' },
    { key: 'filming', name: '촬영', color: '#F5A623' },
    { key: 'video_edit', name: '비디오 편집', color: '#7ED321' },
    { key: 'post_work', name: '후반 작업', color: '#BD10E0' },
    { key: 'video_preview', name: '비디오 시사', color: '#9013FE' },
    { key: 'confirmation', name: '최종 컨펌', color: '#B8E986' },
    { key: 'video_delivery', name: '영상 납품', color: '#FA7252' }
  ]
  
  useEffect(() => {
    if (project) {
      // Load existing project data
      const formData = {
        name: project.name,
        description: project.description,
        manager: project.manager,
        consumer: project.consumer,
        color: project.color || '#4A90E2',
        members: project.member_list?.map(m => m.email) || []
      }
      
      // Load phase dates
      phases.forEach(phase => {
        if (project[phase.key]) {
          formData[`${phase.key}_range`] = [
            project[phase.key].start_date ? moment(project[phase.key].start_date) : null,
            project[phase.key].end_date ? moment(project[phase.key].end_date) : null
          ]
        }
      })
      
      form.setFieldsValue(formData)
      setProjectColor(project.color || '#4A90E2')
      setSelectedMembers(project.member_list || [])
    }
  }, [project, form])
  
  const handleSubmit = async (values) => {
    try {
      const formData = new FormData()
      
      // Basic info
      const projectData = {
        name: values.name,
        description: values.description,
        manager: values.manager,
        consumer: values.consumer,
        color: projectColor
      }
      
      // Phase dates
      const processData = phases.map(phase => {
        const range = values[`${phase.key}_range`]
        return {
          type: phase.key,
          startDate: range?.[0] ? range[0].format('YYYY-MM-DD') : null,
          endDate: range?.[1] ? range[1].format('YYYY-MM-DD') : null
        }
      })
      
      // Members
      const memberData = selectedMembers.map(member => ({
        email: member.email || member,
        rating: member.rating || 'basic'
      }))
      
      formData.append('inputs', JSON.stringify(projectData))
      formData.append('process', JSON.stringify(processData))
      formData.append('members', JSON.stringify(memberData))
      
      // Files
      files.forEach(file => {
        if (file.originFileObj) {
          formData.append('files', file.originFileObj)
        }
      })
      
      await onSubmit(formData)
      message.success(isEdit ? '프로젝트가 수정되었습니다.' : '프로젝트가 생성되었습니다.')
    } catch (error) {
      message.error('프로젝트 저장 중 오류가 발생했습니다.')
    }
  }
  
  const handleFileChange = ({ fileList }) => {
    setFiles(fileList)
  }
  
  const handleMemberAdd = (email) => {
    const member = availableMembers.find(m => m.email === email)
    if (member && !selectedMembers.find(m => m.email === email)) {
      setSelectedMembers([...selectedMembers, member])
    }
  }
  
  const handleMemberRemove = (email) => {
    setSelectedMembers(selectedMembers.filter(m => m.email !== email))
  }
  
  const disabledDate = (current) => {
    // Disable past dates for new projects
    return !isEdit && current && current < moment().startOf('day')
  }
  
  const validateDateRange = (_, value) => {
    if (!value || value.length !== 2) {
      return Promise.resolve()
    }
    if (value[0] && value[1] && value[0].isAfter(value[1])) {
      return Promise.reject(new Error('시작일은 종료일보다 이전이어야 합니다.'))
    }
    return Promise.resolve()
  }
  
  return (
    <div className="project-form">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="form-container"
      >
        <div className="form-section">
          <h3>기본 정보</h3>
          
          <div className="form-grid">
            <Form.Item
              name="name"
              label="프로젝트명"
              rules={[{ required: true, message: '프로젝트명을 입력해주세요.' }]}
            >
              <Input placeholder="프로젝트명을 입력하세요" size="large" />
            </Form.Item>
            
            <Form.Item
              label="프로젝트 색상"
            >
              <div className="color-picker-wrapper">
                <ColorPicker
                  value={projectColor}
                  onChange={(color) => setProjectColor(color.toHexString())}
                  showText
                />
                <div 
                  className="color-preview" 
                  style={{ backgroundColor: projectColor }}
                />
              </div>
            </Form.Item>
          </div>
          
          <Form.Item
            name="description"
            label="프로젝트 설명"
            rules={[{ required: true, message: '프로젝트 설명을 입력해주세요.' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="프로젝트에 대한 상세 설명을 입력하세요"
              maxLength={500}
              showCount
            />
          </Form.Item>
          
          <div className="form-grid">
            <Form.Item
              name="manager"
              label="담당자"
              rules={[{ required: true, message: '담당자를 입력해주세요.' }]}
            >
              <Input 
                placeholder="담당자명" 
                prefix={<TeamOutlined />}
              />
            </Form.Item>
            
            <Form.Item
              name="consumer"
              label="고객사"
              rules={[{ required: true, message: '고객사를 입력해주세요.' }]}
            >
              <Input placeholder="고객사명" />
            </Form.Item>
          </div>
        </div>
        
        <div className="form-section">
          <h3>프로젝트 일정</h3>
          
          <div className="phase-timeline">
            {phases.map((phase, index) => (
              <div key={phase.key} className="phase-item">
                <div className="phase-header">
                  <div 
                    className="phase-indicator" 
                    style={{ backgroundColor: phase.color }}
                  />
                  <span className="phase-name">{phase.name}</span>
                </div>
                
                <Form.Item
                  name={`${phase.key}_range`}
                  rules={[{ validator: validateDateRange }]}
                >
                  <DatePicker.RangePicker
                    style={{ width: '100%' }}
                    placeholder={['시작일', '종료일']}
                    disabledDate={disabledDate}
                    format="YYYY-MM-DD"
                    allowClear
                  />
                </Form.Item>
                
                {index < phases.length - 1 && <div className="phase-connector" />}
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-section">
          <h3>팀 구성</h3>
          
          <Form.Item label="멤버 추가">
            <Select
              placeholder="멤버를 선택하세요"
              onChange={handleMemberAdd}
              value={undefined}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {availableMembers
                .filter(m => !selectedMembers.find(sm => sm.email === m.email))
                .map(member => (
                  <Option key={member.email} value={member.email}>
                    {member.nickname} ({member.email})
                  </Option>
                ))}
            </Select>
          </Form.Item>
          
          <div className="selected-members">
            {selectedMembers.map(member => (
              <Tag
                key={member.email}
                closable
                onClose={() => handleMemberRemove(member.email)}
                color={member.rating === 'manager' ? 'blue' : 'default'}
              >
                {member.nickname || member.email}
                {member.rating === 'manager' && ' (관리자)'}
              </Tag>
            ))}
          </div>
        </div>
        
        <div className="form-section">
          <h3>첨부 파일</h3>
          
          <Upload
            multiple
            fileList={files}
            onChange={handleFileChange}
            beforeUpload={() => false}
            listType="picture-card"
          >
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>파일 추가</div>
            </div>
          </Upload>
        </div>
        
        <div className="form-actions">
          <Button onClick={() => window.history.back()}>
            취소
          </Button>
          <Button type="primary" htmlType="submit" size="large">
            {isEdit ? '프로젝트 수정' : '프로젝트 생성'}
          </Button>
        </div>
      </Form>
    </div>
  )
}