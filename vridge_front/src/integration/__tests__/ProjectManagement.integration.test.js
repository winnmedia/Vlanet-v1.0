import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProjectCreate from '../../page/Cms/ProjectCreate';
import ProjectView from '../../page/Cms/ProjectView';

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {}
  })
}));

const mockStore = configureStore({
  reducer: {
    ProjectStore: () => ({
      project_list: [],
      user: 'test@example.com'
    })
  }
});

describe('Project Management Integration Tests', () => {
  test('project creation workflow', async () => {
    render(
      <Provider store={mockStore}>
        <ProjectCreate />
      </Provider>
    );
    
    const nameInput = screen.getByPlaceholderText(/프로젝트 이름/i);
    fireEvent.change(nameInput, { target: { value: 'New Project' } });
    
    const createButton = screen.getByText(/생성/i);
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText(/프로젝트가 생성되었습니다/i)).toBeInTheDocument();
    });
  });

  test('project member invitation', async () => {
    render(
      <Provider store={mockStore}>
        <ProjectView />
      </Provider>
    );
    
    const inviteButton = screen.getByText(/초대/i);
    fireEvent.click(inviteButton);
    
    const emailInput = screen.getByPlaceholderText(/이메일 주소/i);
    fireEvent.change(emailInput, { target: { value: 'member@example.com' } });
    
    const sendButton = screen.getByText(/보내기/i);
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/초대가 발송되었습니다/i)).toBeInTheDocument();
    });
  });
});