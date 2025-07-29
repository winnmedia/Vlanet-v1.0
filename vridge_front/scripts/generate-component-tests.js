const fs = require('fs');
const path = require('path');

// 테스트를 생성할 주요 컴포넌트 목록
const componentsToTest = [
  { path: 'src/components/SideBar.jsx', name: 'SideBar' },
  { path: 'src/components/ProjectDashboard.jsx', name: 'ProjectDashboard' },
  { path: 'src/components/ProjectPhaseBoard.jsx', name: 'ProjectPhaseBoard' },
  { path: 'src/components/NotificationDropdown.jsx', name: 'NotificationDropdown' },
  { path: 'src/components/LoadingAnimation.jsx', name: 'LoadingAnimation' },
  { path: 'src/components/PageTemplate.jsx', name: 'PageTemplate' },
  { path: 'src/components/ToggleButton.jsx', name: 'ToggleButton' },
  { path: 'src/components/UserAvatar.jsx', name: 'UserAvatar' },
  { path: 'src/components/CustomAlert.jsx', name: 'CustomAlert' },
  { path: 'src/page/Cms/CmsHome.jsx', name: 'CmsHome' },
  { path: 'src/page/Cms/VideoPlanning.jsx', name: 'VideoPlanning' },
  { path: 'src/page/Cms/Feedback.jsx', name: 'Feedback' },
  { path: 'src/page/User/Login.jsx', name: 'Login' },
  { path: 'src/page/User/Signup.jsx', name: 'Signup' },
  { path: 'src/page/User/MyPage.jsx', name: 'MyPage' }
];

// 기본 테스트 템플릿
function generateTestTemplate(componentName, isPage = false) {
  const imports = isPage ? `
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { BrowserRouter } from 'react-router-dom';` : '';

  const mockStore = isPage ? `
const mockStore = createStore(() => ({
  ProjectStore: {
    user: { name: 'Test User', id: 1 },
    project_list: [],
    this_month_project: [],
    next_month_project: []
  }
}));` : '';

  const wrapper = isPage ? `
const renderWithProviders = (component) => {
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};` : '';

  return `import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';${imports}
import ${componentName} from '../${componentName}';

// Mock next/navigation
jest.mock('${isPage ? '../../../' : '../../'}util/nextNavigation', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn()
  })
}));
${mockStore}
${wrapper}

describe('${componentName}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    ${isPage ? `renderWithProviders(<${componentName} />)` : `render(<${componentName} />)`};
    expect(document.body).toBeInTheDocument();
  });

  it('displays correct initial content', () => {
    ${isPage ? `renderWithProviders(<${componentName} />)` : `render(<${componentName} />)`};
    // Add specific content checks based on component
  });

  ${componentName === 'LoadingAnimation' ? `
  it('shows loading spinner', () => {
    render(<LoadingAnimation />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });` : ''}

  ${componentName === 'ToggleButton' ? `
  it('toggles state on click', () => {
    const handleToggle = jest.fn();
    render(<ToggleButton onChange={handleToggle} />);
    
    const button = screen.getByRole('switch');
    fireEvent.click(button);
    
    expect(handleToggle).toHaveBeenCalledWith(true);
  });` : ''}

  ${componentName === 'UserAvatar' ? `
  it('displays user avatar with name', () => {
    render(<UserAvatar name="John Doe" profileImage="/avatar.jpg" />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'John Doe');
  });

  it('shows default avatar when no image provided', () => {
    render(<UserAvatar name="John Doe" />);
    
    const avatar = screen.getByText('JD');
    expect(avatar).toBeInTheDocument();
  });` : ''}

  ${componentName === 'CustomAlert' ? `
  it('displays alert message', () => {
    render(<CustomAlert message="Test alert" type="success" />);
    
    expect(screen.getByText('Test alert')).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('success');
  });

  it('calls onClose when close button clicked', () => {
    const handleClose = jest.fn();
    render(<CustomAlert message="Test" onClose={handleClose} />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalled();
  });` : ''}

  ${isPage ? `
  it('handles user interactions correctly', async () => {
    renderWithProviders(<${componentName} />);
    
    // Add interaction tests specific to each page
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });` : ''}

  ${componentName === 'Login' ? `
  it('handles form submission', async () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });` : ''}

  ${componentName === 'VideoPlanning' ? `
  it('displays planning form', () => {
    renderWithProviders(<VideoPlanning />);
    
    expect(screen.getByText(/영상 기획/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });` : ''}

  it('is accessible', () => {
    ${isPage ? `renderWithProviders(<${componentName} />)` : `render(<${componentName} />)`};
    
    // Basic accessibility checks
    const main = screen.getByRole('main', { hidden: true });
    expect(main).toBeInTheDocument();
  });
});`;
}

// 테스트 파일 생성
let createdCount = 0;

componentsToTest.forEach(({ path: componentPath, name }) => {
  const componentDir = path.dirname(componentPath);
  const testDir = path.join(componentDir, '__tests__');
  const testFilePath = path.join(testDir, `${name}.test.js`);
  
  // 이미 테스트가 있는지 확인
  if (fs.existsSync(testFilePath)) {
    console.log(`⏭️  ${name}: 테스트가 이미 존재함`);
    return;
  }
  
  // __tests__ 디렉토리 생성
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // 페이지 컴포넌트인지 확인
  const isPage = componentPath.includes('/page/');
  
  // 테스트 파일 생성
  const testContent = generateTestTemplate(name, isPage);
  fs.writeFileSync(testFilePath, testContent);
  
  createdCount++;
  console.log(`✅ ${name}: 테스트 파일 생성 완료`);
});

console.log(`\n📊 총 ${createdCount}개의 테스트 파일 생성됨`);