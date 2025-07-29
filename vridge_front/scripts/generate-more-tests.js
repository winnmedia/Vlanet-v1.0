const fs = require('fs');
const path = require('path');

// 추가로 테스트를 생성할 컴포넌트들
const additionalComponents = [
  // Components
  { path: 'src/components/ExportModal.jsx', name: 'ExportModal' },
  { path: 'src/components/FeedbackPlayer.jsx', name: 'FeedbackPlayer' },
  { path: 'src/components/ImageCropper.jsx', name: 'ImageCropper' },
  { path: 'src/components/ProjectForm.jsx', name: 'ProjectForm' },
  { path: 'src/components/VideoUploadGuide.jsx', name: 'VideoUploadGuide' },
  { path: 'src/components/ProjectScheduleSection.jsx', name: 'ProjectScheduleSection' },
  
  // Pages
  { path: 'src/page/Cms/Calendar.jsx', name: 'Calendar' },
  { path: 'src/page/Cms/ProjectCreate.jsx', name: 'ProjectCreate' },
  { path: 'src/page/Cms/ProjectEdit.jsx', name: 'ProjectEdit' },
  { path: 'src/page/Cms/ProjectView.jsx', name: 'ProjectView' },
  { path: 'src/page/User/EmailCheck.jsx', name: 'EmailCheck' },
  { path: 'src/page/User/ResetPw.jsx', name: 'ResetPw' },
  
  // Tasks
  { path: 'src/tasks/Feedback/FeedbackInput.jsx', name: 'FeedbackInput' },
  { path: 'src/tasks/Feedback/FeedbackManage.jsx', name: 'FeedbackManage' },
  { path: 'src/tasks/Feedback/FeedbackMessage.jsx', name: 'FeedbackMessage' },
  { path: 'src/tasks/Project/ProjectInput.jsx', name: 'ProjectInput' },
  { path: 'src/tasks/Project/InviteInput.jsx', name: 'InviteInput' },
  { path: 'src/tasks/Calendar/CalendarDate.jsx', name: 'CalendarDate' }
];

// API 테스트 추가
const apiModules = [
  { name: 'user', methods: ['Login', 'Signup', 'GetUserInfo', 'UpdateProfile'] },
  { name: 'feedback', methods: ['GetFeedbacks', 'CreateFeedback', 'UpdateFeedback', 'DeleteFeedback'] },
  { name: 'notification', methods: ['GetNotifications', 'MarkAsRead', 'MarkAllAsRead'] },
  { name: 'invitation', methods: ['SendInvitation', 'GetInvitations', 'AcceptInvitation', 'DeclineInvitation'] }
];

// 컴포넌트 테스트 템플릿
function generateComponentTest(componentName, componentPath) {
  const isPage = componentPath.includes('/page/');
  const isTask = componentPath.includes('/tasks/');
  
  return `import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
${isPage ? `import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { BrowserRouter } from 'react-router-dom';` : ''}
import ${componentName} from '../${componentName}';

jest.mock('${isPage ? '../../../' : isTask ? '../../../' : '../../'}util/nextNavigation', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    push: jest.fn()
  })
}));

${isPage ? `const mockStore = createStore(() => ({
  ProjectStore: {
    user: { id: 1, name: 'Test User' },
    project_list: []
  }
}));

const renderWithProviders = (component) => render(
  <Provider store={mockStore}>
    <BrowserRouter>{component}</BrowserRouter>
  </Provider>
);` : ''}

describe('${componentName}', () => {
  it('renders without crashing', () => {
    ${isPage ? `renderWithProviders(<${componentName} />)` : `render(<${componentName} />)`};
    expect(document.body).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    ${isPage ? `renderWithProviders(<${componentName} />)` : `render(<${componentName} />)`};
    const mainElement = screen.getByRole('main', { hidden: true });
    expect(mainElement).toBeInTheDocument();
  });

  ${componentName.includes('Form') || componentName.includes('Input') ? `
  it('handles form submission', async () => {
    const handleSubmit = jest.fn();
    render(<${componentName} onSubmit={handleSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /submit|save|확인/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
    });
  });` : ''}

  ${componentName.includes('Modal') ? `
  it('opens and closes modal', () => {
    const handleClose = jest.fn();
    render(<${componentName} isOpen={true} onClose={handleClose} />);
    
    const closeButton = screen.getByLabelText(/close|닫기/i);
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalled();
  });` : ''}
});`;
}

// API 테스트 템플릿
function generateApiTest(moduleName, methods) {
  return `import * as ${moduleName}Api from '../${moduleName}';
import axios from 'axios';

jest.mock('axios');

describe('${moduleName} API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

${methods.map(method => `
  describe('${method}', () => {
    it('calls API successfully', async () => {
      const mockResponse = { data: { success: true, data: {} } };
      axios.${method.includes('Get') ? 'get' : method.includes('Delete') ? 'delete' : 'post'}.mockResolvedValueOnce(mockResponse);
      
      const result = await ${moduleName}Api.${method}();
      
      expect(result).toEqual(mockResponse.data);
    });

    it('handles API error', async () => {
      axios.${method.includes('Get') ? 'get' : method.includes('Delete') ? 'delete' : 'post'}.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(${moduleName}Api.${method}()).rejects.toThrow('API Error');
    });
  });`).join('\n')}
});`;
}

let createdCount = 0;

// 컴포넌트 테스트 생성
additionalComponents.forEach(({ path: componentPath, name }) => {
  const componentDir = path.dirname(componentPath);
  const testDir = path.join(componentDir, '__tests__');
  const testFilePath = path.join(testDir, `${name}.test.js`);
  
  if (fs.existsSync(testFilePath)) {
    console.log(`⏭️  ${name}: 테스트가 이미 존재함`);
    return;
  }
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const testContent = generateComponentTest(name, componentPath);
  fs.writeFileSync(testFilePath, testContent);
  
  createdCount++;
  console.log(`✅ ${name}: 테스트 파일 생성 완료`);
});

// API 테스트 생성
apiModules.forEach(({ name, methods }) => {
  const testDir = path.join(__dirname, '../src/api/__tests__');
  const testFilePath = path.join(testDir, `${name}.test.js`);
  
  if (fs.existsSync(testFilePath)) {
    console.log(`⏭️  ${name} API: 테스트가 이미 존재함`);
    return;
  }
  
  const testContent = generateApiTest(name, methods);
  fs.writeFileSync(testFilePath, testContent);
  
  createdCount++;
  console.log(`✅ ${name} API: 테스트 파일 생성 완료`);
});

console.log(`\n📊 총 ${createdCount}개의 테스트 파일 추가 생성됨`);