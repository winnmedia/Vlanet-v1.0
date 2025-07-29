import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import VideoPlanning from '../../page/Cms/VideoPlanning';
import axios from '../../config/axios';

jest.mock('../../config/axios');
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: { id: '123' }
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

describe('VideoPlanning Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('complete video planning workflow', async () => {
    const mockProject = {
      id: '123',
      name: 'Test Project',
      description: 'Test Description'
    };
    
    axios.get.mockResolvedValueOnce({ data: { result: mockProject } });
    
    render(
      <Provider store={mockStore}>
        <VideoPlanning />
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/영상 기획/i)).toBeInTheDocument();
    });
  });

  test('handles errors gracefully', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));
    
    render(
      <Provider store={mockStore}>
        <VideoPlanning />
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/오류/i)).toBeInTheDocument();
    });
  });
});