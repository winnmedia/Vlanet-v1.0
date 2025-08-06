/**
 * VideoPlanet 피드백 시스템 프론트엔드 TDD 테스트 케이스
 * 이 테스트들은 초기에 모두 실패해야 하며, 구현이 진행되면서 통과하게 됩니다.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import WS from 'jest-websocket-mock';

// 컴포넌트 import (아직 구현되지 않음)
import FeedbackList from '../components/FeedbackList';
import FeedbackPlayer from '../components/FeedbackPlayer';
import CommentTimeline from '../components/CommentTimeline';
import VideoUploader from '../components/VideoUploader';

// API 함수 import
import {
  getFeedbackList,
  createFeedback,
  uploadVideo,
  addComment,
  updateComment,
  deleteComment,
  getStreamingUrl
} from '../api/feedback';

// Mock 설정
jest.mock('axios');

describe('피드백 시스템 데이터 플로우', () => {
  beforeEach(() => {
    axios.get.mockClear();
    axios.post.mockClear();
    axios.put.mockClear();
    axios.delete.mockClear();
  });

  describe('피드백 목록 관리', () => {
    test('프로젝트의 피드백 목록을 가져올 수 있어야 함', async () => {
      const projectId = 1;
      const mockFeedbacks = [
        { id: 1, title: '첫 번째 피드백', created_at: '2025-01-01' },
        { id: 2, title: '두 번째 피드백', created_at: '2025-01-02' }
      ];

      axios.get.mockResolvedValue({ data: { feedbacks: mockFeedbacks } });

      const feedbacks = await getFeedbackList(projectId);
      
      expect(axios.get).toHaveBeenCalledWith(`/api/projects/${projectId}/feedbacks/`);
      expect(feedbacks).toHaveLength(2);
      expect(feedbacks[0].title).toBe('첫 번째 피드백');
    });

    test('새 피드백을 생성할 수 있어야 함', async () => {
      const projectId = 1;
      const feedbackData = {
        title: '새 피드백',
        description: '초안 검토'
      };

      axios.post.mockResolvedValue({ 
        data: { 
          feedback_id: 3,
          ...feedbackData 
        } 
      });

      const result = await createFeedback(projectId, feedbackData);
      
      expect(axios.post).toHaveBeenCalledWith(
        `/api/projects/${projectId}/feedbacks/`,
        feedbackData
      );
      expect(result.feedback_id).toBe(3);
    });
  });

  describe('영상 업로드', () => {
    test('영상 파일을 업로드할 수 있어야 함', async () => {
      const projectId = 1;
      const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
      const onProgress = jest.fn();

      axios.post.mockImplementation((url, data, config) => {
        // 프로그레스 콜백 시뮬레이션
        if (config.onUploadProgress) {
          config.onUploadProgress({ loaded: 50, total: 100 });
          config.onUploadProgress({ loaded: 100, total: 100 });
        }
        return Promise.resolve({ 
          data: { 
            feedback_id: 1,
            video_url: '/media/feedback_file/test.mp4' 
          } 
        });
      });

      const result = await uploadVideo(projectId, file, onProgress);
      
      expect(onProgress).toHaveBeenCalledWith({ loaded: 50, total: 100 });
      expect(onProgress).toHaveBeenCalledWith({ loaded: 100, total: 100 });
      expect(result.video_url).toBeTruthy();
    });

    test('대용량 파일 청크 업로드를 지원해야 함', async () => {
      const projectId = 1;
      const largeFile = new File(['x'.repeat(100 * 1024 * 1024)], 'large.mp4', { type: 'video/mp4' });
      
      // 청크 업로드 시뮬레이션
      const uploadId = 'upload-123';
      const chunkSize = 1024 * 1024; // 1MB
      const totalChunks = Math.ceil(largeFile.size / chunkSize);

      // 업로드 초기화
      axios.post.mockResolvedValueOnce({ data: { upload_id: uploadId, total_chunks: totalChunks } });

      // 청크 업로드
      for (let i = 0; i < totalChunks; i++) {
        axios.post.mockResolvedValueOnce({ data: { chunk_index: i, status: 'uploaded' } });
      }

      // 업로드 완료
      axios.post.mockResolvedValueOnce({ data: { feedback_id: 1, status: 'completed' } });

      const result = await uploadVideo(projectId, largeFile, null, { chunked: true });
      
      expect(axios.post).toHaveBeenCalledTimes(totalChunks + 2); // init + chunks + complete
      expect(result.status).toBe('completed');
    });
  });

  describe('코멘트 관리', () => {
    test('특정 시점에 코멘트를 추가할 수 있어야 함', async () => {
      const projectId = 1;
      const feedbackId = 1;
      const commentData = {
        timestamp: 15.5,
        content: '이 부분 수정 필요',
        type: 'technical'
      };

      axios.post.mockResolvedValue({ 
        data: { 
          id: 1,
          ...commentData 
        } 
      });

      const result = await addComment(projectId, feedbackId, commentData);
      
      expect(axios.post).toHaveBeenCalledWith(
        `/api/projects/${projectId}/feedbacks/${feedbackId}/comments/`,
        commentData
      );
      expect(result.timestamp).toBe(15.5);
    });

    test('코멘트를 수정할 수 있어야 함', async () => {
      const projectId = 1;
      const feedbackId = 1;
      const commentId = 1;
      const updateData = {
        content: '수정된 내용'
      };

      axios.put.mockResolvedValue({ 
        data: { 
          id: commentId,
          content: updateData.content 
        } 
      });

      const result = await updateComment(projectId, feedbackId, commentId, updateData);
      
      expect(axios.put).toHaveBeenCalledWith(
        `/api/projects/${projectId}/feedbacks/${feedbackId}/comments/${commentId}/`,
        updateData
      );
      expect(result.content).toBe('수정된 내용');
    });

    test('자신의 코멘트를 삭제할 수 있어야 함', async () => {
      const projectId = 1;
      const feedbackId = 1;
      const commentId = 1;

      axios.delete.mockResolvedValue({ status: 204 });

      const result = await deleteComment(projectId, feedbackId, commentId);
      
      expect(axios.delete).toHaveBeenCalledWith(
        `/api/projects/${projectId}/feedbacks/${feedbackId}/comments/${commentId}/`
      );
      expect(result.status).toBe(204);
    });
  });
});

describe('피드백 UI 컴포넌트', () => {
  describe('FeedbackList 컴포넌트', () => {
    test('피드백 목록을 렌더링해야 함', async () => {
      const feedbacks = [
        { id: 1, title: '첫 번째 피드백', created_at: '2025-01-01' },
        { id: 2, title: '두 번째 피드백', created_at: '2025-01-02' }
      ];

      render(<FeedbackList projectId={1} feedbacks={feedbacks} />);
      
      await waitFor(() => {
        expect(screen.getByText('첫 번째 피드백')).toBeInTheDocument();
        expect(screen.getByText('두 번째 피드백')).toBeInTheDocument();
      });
    });

    test('새 피드백 버튼을 클릭하면 생성 폼이 표시되어야 함', async () => {
      render(<FeedbackList projectId={1} feedbacks={[]} />);
      
      const createButton = screen.getByText('새 피드백 만들기');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText('제목')).toBeInTheDocument();
        expect(screen.getByLabelText('영상 파일')).toBeInTheDocument();
      });
    });
  });

  describe('FeedbackPlayer 컴포넌트', () => {
    test('영상을 재생할 수 있어야 함', async () => {
      const feedback = {
        id: 1,
        video_url: '/media/feedback_file/test.mp4',
        hls_url: '/media/feedback_file/test.m3u8'
      };

      render(<FeedbackPlayer feedback={feedback} />);
      
      const video = screen.getByTestId('video-player');
      expect(video).toHaveAttribute('src', feedback.hls_url || feedback.video_url);
      
      const playButton = screen.getByTestId('play-button');
      fireEvent.click(playButton);
      
      await waitFor(() => {
        expect(video.paused).toBe(false);
      });
    });

    test('특정 시점으로 이동할 수 있어야 함', async () => {
      const feedback = {
        id: 1,
        video_url: '/media/feedback_file/test.mp4'
      };

      render(<FeedbackPlayer feedback={feedback} />);
      
      const video = screen.getByTestId('video-player');
      const seekBar = screen.getByTestId('seek-bar');
      
      // 15.5초로 이동
      fireEvent.change(seekBar, { target: { value: 15.5 } });
      
      await waitFor(() => {
        expect(video.currentTime).toBe(15.5);
      });
    });
  });

  describe('CommentTimeline 컴포넌트', () => {
    test('타임라인에 코멘트 마커를 표시해야 함', () => {
      const comments = [
        { id: 1, timestamp: 10, content: '코멘트 1' },
        { id: 2, timestamp: 25.5, content: '코멘트 2' },
        { id: 3, timestamp: 45, content: '코멘트 3' }
      ];

      render(<CommentTimeline comments={comments} duration={60} />);
      
      const markers = screen.getAllByTestId('comment-marker');
      expect(markers).toHaveLength(3);
      
      // 위치 확인 (비율)
      expect(markers[0].style.left).toBe('16.67%'); // 10/60
      expect(markers[1].style.left).toBe('42.5%');  // 25.5/60
      expect(markers[2].style.left).toBe('75%');    // 45/60
    });

    test('마커 클릭 시 해당 시점으로 이동해야 함', () => {
      const onSeek = jest.fn();
      const comments = [
        { id: 1, timestamp: 10, content: '코멘트 1' }
      ];

      render(
        <CommentTimeline 
          comments={comments} 
          duration={60} 
          onSeek={onSeek} 
        />
      );
      
      const marker = screen.getByTestId('comment-marker');
      fireEvent.click(marker);
      
      expect(onSeek).toHaveBeenCalledWith(10);
    });
  });

  describe('VideoUploader 컴포넌트', () => {
    test('드래그 앤 드롭으로 파일을 업로드할 수 있어야 함', async () => {
      const onUpload = jest.fn();
      
      render(<VideoUploader onUpload={onUpload} />);
      
      const dropZone = screen.getByTestId('drop-zone');
      const file = new File(['video'], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });
      
      await waitFor(() => {
        expect(onUpload).toHaveBeenCalledWith(file);
      });
    });

    test('업로드 진행률을 표시해야 함', async () => {
      render(<VideoUploader />);
      
      const file = new File(['video'], 'test.mp4', { type: 'video/mp4' });
      const input = screen.getByTestId('file-input');
      
      await userEvent.upload(input, file);
      
      await waitFor(() => {
        const progressBar = screen.getByTestId('progress-bar');
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveAttribute('value', expect.any(String));
      });
    });
  });
});

describe('실시간 동기화', () => {
  let server;

  beforeEach(() => {
    server = new WS('ws://localhost:8000/ws/feedback/1/');
  });

  afterEach(() => {
    WS.clean();
  });

  test('WebSocket 연결이 수립되어야 함', async () => {
    const client = new WebSocket('ws://localhost:8000/ws/feedback/1/');
    await server.connected;
    
    expect(client.readyState).toBe(WebSocket.OPEN);
    
    client.close();
  });

  test('새 코멘트가 실시간으로 동기화되어야 함', async () => {
    const onNewComment = jest.fn();
    
    // 컴포넌트 렌더링
    render(
      <CommentTimeline 
        comments={[]} 
        duration={60} 
        websocket={true}
        onNewComment={onNewComment}
      />
    );
    
    await server.connected;
    
    // 서버에서 새 코멘트 전송
    server.send(JSON.stringify({
      type: 'comment.created',
      data: {
        id: 1,
        timestamp: 10,
        content: '실시간 코멘트'
      }
    }));
    
    await waitFor(() => {
      expect(onNewComment).toHaveBeenCalledWith({
        id: 1,
        timestamp: 10,
        content: '실시간 코멘트'
      });
    });
  });

  test('다른 사용자의 커서 위치가 표시되어야 함', async () => {
    render(<FeedbackPlayer feedback={{ id: 1 }} collaborative={true} />);
    
    await server.connected;
    
    // 다른 사용자의 커서 위치 전송
    server.send(JSON.stringify({
      type: 'cursor.moved',
      data: {
        user_id: 2,
        timestamp: 15.5,
        x: 100,
        y: 200
      }
    }));
    
    await waitFor(() => {
      const cursor = screen.getByTestId('user-cursor-2');
      expect(cursor).toBeInTheDocument();
      expect(cursor.style.left).toBe('100px');
      expect(cursor.style.top).toBe('200px');
    });
  });

  test('연결이 끊어지면 재연결을 시도해야 함', async () => {
    const onReconnect = jest.fn();
    
    render(
      <CommentTimeline 
        comments={[]} 
        duration={60} 
        websocket={true}
        onReconnect={onReconnect}
      />
    );
    
    await server.connected;
    
    // 연결 끊기
    server.close();
    
    // 재연결 시도
    await waitFor(() => {
      expect(onReconnect).toHaveBeenCalled();
    }, { timeout: 5000 });
  });
});

describe('성능 테스트', () => {
  test('1000개의 코멘트를 2초 이내에 렌더링해야 함', async () => {
    const comments = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      timestamp: Math.random() * 3600,
      content: `코멘트 ${i}`
    }));

    const startTime = performance.now();
    
    render(<CommentTimeline comments={comments} duration={3600} />);
    
    await waitFor(() => {
      const markers = screen.getAllByTestId('comment-marker');
      expect(markers).toHaveLength(1000);
    });
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(2000);
  });

  test('영상 버퍼링이 1초 이내에 시작되어야 함', async () => {
    const feedback = {
      id: 1,
      hls_url: '/media/feedback_file/test.m3u8'
    };

    const startTime = performance.now();
    
    render(<FeedbackPlayer feedback={feedback} />);
    
    const video = screen.getByTestId('video-player');
    
    await waitFor(() => {
      expect(video.readyState).toBeGreaterThanOrEqual(2); // HAVE_CURRENT_DATA
    }, { timeout: 1000 });
    
    const bufferTime = performance.now() - startTime;
    expect(bufferTime).toBeLessThan(1000);
  });
});

describe('에러 처리', () => {
  test('네트워크 오류 시 재시도 옵션을 제공해야 함', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));
    
    render(<FeedbackList projectId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('네트워크 오류가 발생했습니다')).toBeInTheDocument();
      expect(screen.getByText('다시 시도')).toBeInTheDocument();
    });
    
    const retryButton = screen.getByText('다시 시도');
    
    axios.get.mockResolvedValue({ data: { feedbacks: [] } });
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(screen.queryByText('네트워크 오류가 발생했습니다')).not.toBeInTheDocument();
    });
  });

  test('권한 없는 접근 시 적절한 메시지를 표시해야 함', async () => {
    axios.get.mockRejectedValue({ response: { status: 403 } });
    
    render(<FeedbackList projectId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('이 프로젝트에 접근할 권한이 없습니다')).toBeInTheDocument();
    });
  });

  test('업로드 실패 시 복구 옵션을 제공해야 함', async () => {
    const file = new File(['video'], 'test.mp4', { type: 'video/mp4' });
    
    axios.post.mockRejectedValueOnce(new Error('Upload failed'));
    axios.post.mockResolvedValueOnce({ data: { feedback_id: 1 } });
    
    render(<VideoUploader />);
    
    const input = screen.getByTestId('file-input');
    await userEvent.upload(input, file);
    
    await waitFor(() => {
      expect(screen.getByText('업로드 실패')).toBeInTheDocument();
      expect(screen.getByText('다시 시도')).toBeInTheDocument();
    });
    
    const retryButton = screen.getByText('다시 시도');
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(screen.getByText('업로드 완료')).toBeInTheDocument();
    });
  });
});