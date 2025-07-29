import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Feedback from '../../page/Cms/Feedback';

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: { id: '456' }
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

describe('Feedback System Integration Tests', () => {
  test('feedback submission workflow', async () => {
    render(
      <Provider store={mockStore}>
        <Feedback />
      </Provider>
    );
    
    const feedbackInput = screen.getByPlaceholderText(/피드백을 입력하세요/i);
    fireEvent.change(feedbackInput, { target: { value: 'Test feedback' } });
    
    const submitButton = screen.getByText(/제출/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/피드백이 등록되었습니다/i)).toBeInTheDocument();
    });
  });

  test('real-time feedback updates', async () => {
    render(
      <Provider store={mockStore}>
        <Feedback />
      </Provider>
    );
    
    // Test polling mechanism
    await waitFor(() => {
      expect(screen.getByText(/새로운 피드백/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});