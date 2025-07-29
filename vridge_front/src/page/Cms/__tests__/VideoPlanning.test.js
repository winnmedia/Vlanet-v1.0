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

const VideoPlanning = dynamic(() => import('../VideoPlanning'), {
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

describe('VideoPlanning Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders planning form correctly', () => {
    render(
      <Provider store={mockStore}>
        <VideoPlanning />
      </Provider>
    );

    expect(screen.getByText(/영상 기획/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/영상의 주제/i)).toBeInTheDocument();
  });

  it('handles planning title input', () => {
    render(
      <Provider store={mockStore}>
        <VideoPlanning />
      </Provider>
    );

    const titleInput = screen.getByPlaceholderText(/영상의 주제/i);
    fireEvent.change(titleInput, { target: { value: '테스트 기획안' } });
    
    expect(titleInput.value).toBe('테스트 기획안');
  });

  it('submits planning request successfully', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          planning_text: '생성된 기획안 내용',
          scene_suggestions: [],
        },
      },
    });

    render(
      <Provider store={mockStore}>
        <VideoPlanning />
      </Provider>
    );

    const titleInput = screen.getByPlaceholderText(/영상의 주제/i);
    fireEvent.change(titleInput, { target: { value: '테스트 기획안' } });

    const submitButton = screen.getByText(/기획안 생성/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/video-planning/generate/',
        expect.objectContaining({
          title: '테스트 기획안',
        })
      );
    });
  });

  it('handles genre selection', () => {
    render(
      <Provider store={mockStore}>
        <VideoPlanning />
      </Provider>
    );

    const genreButtons = screen.getAllByRole('button');
    const documentaryButton = genreButtons.find(btn => btn.textContent.includes('다큐멘터리'));
    
    if (documentaryButton) {
      fireEvent.click(documentaryButton);
      expect(documentaryButton).toHaveClass('selected');
    }
  });

  it('handles character information input', () => {
    render(
      <Provider store={mockStore}>
        <VideoPlanning />
      </Provider>
    );

    const characterNameInput = screen.getByPlaceholderText(/주인공 이름/i);
    const characterDescInput = screen.getByPlaceholderText(/주인공 설명/i);

    fireEvent.change(characterNameInput, { target: { value: '홍길동' } });
    fireEvent.change(characterDescInput, { target: { value: '조선시대 의적' } });

    expect(characterNameInput.value).toBe('홍길동');
    expect(characterDescInput.value).toBe('조선시대 의적');
  });

  it('handles planning save', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        planning_id: 123,
      },
    });

    render(
      <Provider store={mockStore}>
        <VideoPlanning />
      </Provider>
    );

    // 먼저 기획안을 생성
    const planningText = '생성된 기획안';
    const saveButton = screen.getByText(/저장/i);
    
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/video-planning/save/',
        expect.any(Object)
      );
    });
  });

  it('handles export modal open/close', () => {
    render(
      <Provider store={mockStore}>
        <VideoPlanning />
      </Provider>
    );

    const exportButton = screen.getByText(/내보내기/i);
    fireEvent.click(exportButton);

    expect(screen.getByText(/영상 기획안 내보내기/i)).toBeInTheDocument();

    const closeButton = screen.getByText(/취소/i);
    fireEvent.click(closeButton);

    expect(screen.queryByText(/영상 기획안 내보내기/i)).not.toBeInTheDocument();
  });

  it('handles error state correctly', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network error'));

    render(
      <Provider store={mockStore}>
        <VideoPlanning />
      </Provider>
    );

    const titleInput = screen.getByPlaceholderText(/영상의 주제/i);
    fireEvent.change(titleInput, { target: { value: '테스트 기획안' } });

    const submitButton = screen.getByText(/기획안 생성/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/오류가 발생했습니다/i)).toBeInTheDocument();
    });
  });

  it('validates required fields before submission', () => {
    render(
      <Provider store={mockStore}>
        <VideoPlanning />
      </Provider>
    );

    const submitButton = screen.getByText(/기획안 생성/i);
    fireEvent.click(submitButton);

    expect(screen.getByText(/제목을 입력해주세요/i)).toBeInTheDocument();
  });

  it('handles scene editing', async () => {
    render(
      <Provider store={mockStore}>
        <VideoPlanning />
      </Provider>
    );

    // 씬 편집 기능 테스트
    const addSceneButton = screen.getByText(/씬 추가/i);
    fireEvent.click(addSceneButton);

    const sceneInput = screen.getByPlaceholderText(/씬 제목/i);
    fireEvent.change(sceneInput, { target: { value: '새로운 씬' } });

    expect(sceneInput.value).toBe('새로운 씬');
  });
});