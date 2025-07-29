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

const ProjectView = dynamic(() => import('../ProjectView'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});;

jest.mock('../../../config/axios');
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { id: '1' },
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

const mockStore = configureStore({
  reducer: {
    common: (state = { loading: false }) => state,
    auth: (state = { user: { id: 1, name: 'Test User', role: 'admin' } }) => state,
  },
});

describe('ProjectView Component', () => {
  const mockProject = {
    id: 1,
    title: '테스트 프로젝트',
    description: '프로젝트 설명입니다',
    status: 'in_progress',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    owner: { id: 1, name: 'Test User' },
    members: [
      { id: 1, name: 'Test User', role: 'owner' },
      { id: 2, name: 'Member 1', role: 'editor' },
    ],
    videos: [
      { id: 1, title: '비디오 1', status: 'completed' },
      { id: 2, title: '비디오 2', status: 'in_progress' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValueOnce({
      data: { success: true, data: mockProject },
    });
  });

  it('renders project details correctly', async () => {
    render(
      <Provider store={mockStore}>
        <ProjectView />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('테스트 프로젝트')).toBeInTheDocument();
      expect(screen.getByText('프로젝트 설명입니다')).toBeInTheDocument();
      expect(screen.getByText('진행중')).toBeInTheDocument();
    });
  });

  it('shows project members', async () => {
    render(
      <Provider store={mockStore}>
        <ProjectView />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Member 1')).toBeInTheDocument();
    });
  });

  it('displays video list', async () => {
    render(
      <Provider store={mockStore}>
        <ProjectView />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('비디오 1')).toBeInTheDocument();
      expect(screen.getByText('비디오 2')).toBeInTheDocument();
    });
  });

  it('handles project edit navigation', async () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/router'), 'useRouter').mockReturnValue({
      query: { id: '1' },
      push: mockPush,
    });

    render(
      <Provider store={mockStore}>
        <ProjectView />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('프로젝트 수정')).toBeInTheDocument();
    });

    const editButton = screen.getByText('프로젝트 수정');
    fireEvent.click(editButton);

    expect(mockPush).toHaveBeenCalledWith('/cms/project/edit/1');
  });

  it('handles member invitation', async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: '초대가 전송되었습니다' },
    });

    render(
      <Provider store={mockStore}>
        <ProjectView />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('멤버 초대')).toBeInTheDocument();
    });

    const inviteButton = screen.getByText('멤버 초대');
    fireEvent.click(inviteButton);

    const emailInput = screen.getByPlaceholderText(/이메일 주소/i);
    fireEvent.change(emailInput, { target: { value: 'newmember@example.com' } });

    const sendButton = screen.getByText('초대 보내기');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/projects/1/invite/',
        { email: 'newmember@example.com' }
      );
    });

    expect(screen.getByText('초대가 전송되었습니다')).toBeInTheDocument();
  });

  it('handles project deletion', async () => {
    const mockPush = jest.fn();
    jest.spyOn(require('next/router'), 'useRouter').mockReturnValue({
      query: { id: '1' },
      push: mockPush,
    });

    axios.delete.mockResolvedValueOnce({
      data: { success: true },
    });

    render(
      <Provider store={mockStore}>
        <ProjectView />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('프로젝트 삭제')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('프로젝트 삭제');
    fireEvent.click(deleteButton);

    // 확인 다이얼로그
    const confirmButton = screen.getByText('삭제 확인');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/api/projects/1/');
      expect(mockPush).toHaveBeenCalledWith('/cms');
    });
  });

  it('handles video upload', async () => {
    render(
      <Provider store={mockStore}>
        <ProjectView />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('비디오 업로드')).toBeInTheDocument();
    });

    const uploadButton = screen.getByText('비디오 업로드');
    fireEvent.click(uploadButton);

    // 파일 선택 모달이 열리는지 확인
    expect(screen.getByText('비디오 파일 선택')).toBeInTheDocument();
  });

  it('handles permission-based UI rendering', async () => {
    // 일반 멤버로 테스트
    const memberStore = configureStore({
      reducer: {
        common: (state = { loading: false }) => state,
        auth: (state = { user: { id: 2, name: 'Member User' } }) => state,
      },
    });

    render(
      <Provider store={memberStore}>
        <ProjectView />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('테스트 프로젝트')).toBeInTheDocument();
    });

    // 일반 멤버는 삭제 버튼을 볼 수 없음
    expect(screen.queryByText('프로젝트 삭제')).not.toBeInTheDocument();
  });

  it('handles loading state', () => {
    axios.get.mockImplementationOnce(() => new Promise(() => {}));

    render(
      <Provider store={mockStore}>
        <ProjectView />
      </Provider>
    );

    expect(screen.getByText(/로딩 중/i)).toBeInTheDocument();
  });

  it('handles error state', async () => {
    axios.get.mockRejectedValueOnce(new Error('프로젝트를 찾을 수 없습니다'));

    render(
      <Provider store={mockStore}>
        <ProjectView />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/프로젝트를 찾을 수 없습니다/i)).toBeInTheDocument();
    });
  });

  it('handles project status update', async () => {
    axios.patch.mockResolvedValueOnce({
      data: { success: true, data: { ...mockProject, status: 'completed' } },
    });

    render(
      <Provider store={mockStore}>
        <ProjectView />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('진행중')).toBeInTheDocument();
    });

    const statusButton = screen.getByText('상태 변경');
    fireEvent.click(statusButton);

    const completedOption = screen.getByText('완료됨');
    fireEvent.click(completedOption);

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        '/api/projects/1/',
        { status: 'completed' }
      );
      expect(screen.getByText('완료됨')).toBeInTheDocument();
    });
  });
});