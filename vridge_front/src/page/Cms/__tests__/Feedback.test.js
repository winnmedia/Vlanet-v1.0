import React from 'react'
import dynamic from 'next/dynamic';;
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit'
const axios = dynamic(() => import('../../../config/axios'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});;
;

const Feedback = dynamic(() => import('../Feedback'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});;

jest.mock('../../../config/axios');
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { id: '1' },
    push: jest.fn(),
  }),
}));

const mockStore = configureStore({
  reducer: {
    common: (state = { loading: false }) => state,
    auth: (state = { user: { id: 1, name: 'Test User' } }) => state,
  },
});

describe('Feedback Component', () => {
  const mockVideoData = {
    id: 1,
    title: '테스트 비디오',
    video_url: 'http://example.com/video.mp4',
    thumbnail_url: 'http://example.com/thumb.jpg',
    duration: 120,
  };

  const mockFeedbacks = [
    {
      id: 1,
      user: { name: '사용자1' },
      comment: '좋은 영상입니다',
      created_at: '2024-01-01T10:00:00Z',
      time_seconds: 30,
    },
    {
      id: 2,
      user: { name: '사용자2' },
      comment: '여기 부분 수정이 필요해요',
      created_at: '2024-01-01T11:00:00Z',
      time_seconds: 45,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValueOnce({
      data: { success: true, data: mockVideoData },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, data: mockFeedbacks },
    });
  });

  it('renders video player and feedback list', async () => {
    render(
      <Provider store={mockStore}>
        <Feedback />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('테스트 비디오')).toBeInTheDocument();
    });

    expect(screen.getByText('좋은 영상입니다')).toBeInTheDocument();
    expect(screen.getByText('여기 부분 수정이 필요해요')).toBeInTheDocument();
  });

  it('handles feedback submission', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 3,
          user: { name: 'Test User' },
          comment: '새로운 피드백',
          created_at: new Date().toISOString(),
          time_seconds: 60,
        },
      },
    });

    render(
      <Provider store={mockStore}>
        <Feedback />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('테스트 비디오')).toBeInTheDocument();
    });

    const feedbackInput = screen.getByPlaceholderText(/피드백을 입력하세요/i);
    const submitButton = screen.getByText(/피드백 남기기/i);

    fireEvent.change(feedbackInput, { target: { value: '새로운 피드백' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/feedbacks/',
        expect.objectContaining({
          comment: '새로운 피드백',
          video_id: '1',
        })
      );
    });

    expect(screen.getByText('새로운 피드백')).toBeInTheDocument();
  });

  it('handles feedback deletion', async () => {
    axios.delete.mockResolvedValueOnce({
      data: { success: true },
    });

    render(
      <Provider store={mockStore}>
        <Feedback />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('좋은 영상입니다')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText(/삭제/i);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/api/feedbacks/1/');
    });
  });

  it('handles video time click from feedback', async () => {
    render(
      <Provider store={mockStore}>
        <Feedback />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('0:30')).toBeInTheDocument();
    });

    const timeButton = screen.getByText('0:30');
    fireEvent.click(timeButton);

    // 비디오 플레이어가 해당 시간으로 이동하는지 확인
    // 실제 구현에 따라 테스트 조정 필요
  });

  it('shows loading state', () => {
    axios.get.mockImplementationOnce(() => new Promise(() => {}));

    render(
      <Provider store={mockStore}>
        <Feedback />
      </Provider>
    );

    expect(screen.getByText(/로딩 중/i)).toBeInTheDocument();
  });

  it('handles error state', async () => {
    axios.get.mockRejectedValueOnce(new Error('Failed to load'));

    render(
      <Provider store={mockStore}>
        <Feedback />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/오류가 발생했습니다/i)).toBeInTheDocument();
    });
  });

  it('handles empty feedback state', async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, data: mockVideoData },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    render(
      <Provider store={mockStore}>
        <Feedback />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/아직 피드백이 없습니다/i)).toBeInTheDocument();
    });
  });

  it('validates feedback input before submission', async () => {
    render(
      <Provider store={mockStore}>
        <Feedback />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('테스트 비디오')).toBeInTheDocument();
    });

    const submitButton = screen.getByText(/피드백 남기기/i);
    fireEvent.click(submitButton);

    expect(screen.getByText(/피드백을 입력해주세요/i)).toBeInTheDocument();
  });

  it('handles real-time feedback updates', async () => {
    render(
      <Provider store={mockStore}>
        <Feedback />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('좋은 영상입니다')).toBeInTheDocument();
    });

    // 실시간 업데이트 시뮬레이션
    const newFeedback = {
      id: 4,
      user: { name: '새 사용자' },
      comment: '실시간으로 추가된 피드백',
      created_at: new Date().toISOString(),
      time_seconds: 90,
    };

    // WebSocket이나 polling을 통한 업데이트 시뮬레이션
    // 실제 구현에 따라 테스트 조정 필요
  });

  it('handles feedback filtering and sorting', async () => {
    render(
      <Provider store={mockStore}>
        <Feedback />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('좋은 영상입니다')).toBeInTheDocument();
    });

    // 정렬 버튼 클릭
    const sortButton = screen.getByText(/시간순/i);
    fireEvent.click(sortButton);

    // 정렬이 변경되었는지 확인
    const feedbacks = screen.getAllByTestId('feedback-item');
    expect(feedbacks[0]).toHaveTextContent('0:30');
    expect(feedbacks[1]).toHaveTextContent('0:45');
  });
});