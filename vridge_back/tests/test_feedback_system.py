"""
VideoPlanet 피드백 시스템 TDD 테스트 케이스
이 테스트들은 초기에 모두 실패해야 하며, 구현이 진행되면서 통과하게 됩니다.
"""

import pytest
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import transaction
from projects.models import Project
from feedbacks.models import FeedBack, FeedBackMessage, FeedBackComment
import json
import time
from concurrent.futures import ThreadPoolExecutor
import websocket

User = get_user_model()


class TestFeedbackDataModel(TestCase):
    """데이터 모델 관계 테스트"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='test@test.com',
            email='test@test.com',
            password='testpass123'
        )
        self.project = Project.objects.create(
            name='테스트 프로젝트',
            user=self.user,
            manager='담당자',
            consumer='고객사'
        )
    
    def test_project_can_have_multiple_feedbacks(self):
        """프로젝트는 여러 개의 피드백을 가질 수 있어야 함"""
        # 현재 모델 구조로는 실패할 것
        feedback1 = FeedBack.objects.create(project=self.project)
        feedback2 = FeedBack.objects.create(project=self.project)
        
        self.assertEqual(self.project.feedbacks.count(), 2)
        self.assertIn(feedback1, self.project.feedbacks.all())
        self.assertIn(feedback2, self.project.feedbacks.all())
    
    def test_feedback_has_user_and_video(self):
        """피드백은 작성자와 영상 파일을 가져야 함"""
        video_file = SimpleUploadedFile("test.mp4", b"video content", content_type="video/mp4")
        feedback = FeedBack.objects.create(
            project=self.project,
            user=self.user,
            video_file=video_file
        )
        
        self.assertEqual(feedback.user, self.user)
        self.assertIsNotNone(feedback.video_file)
        self.assertEqual(feedback.project, self.project)
    
    def test_feedback_comment_with_timestamp(self):
        """피드백 코멘트는 타임스탬프를 가져야 함"""
        feedback = FeedBack.objects.create(project=self.project, user=self.user)
        comment = FeedBackComment.objects.create(
            feedback=feedback,
            user=self.user,
            timestamp=15.5,  # 15.5초 시점
            content='이 부분 수정이 필요합니다',
            type='technical'
        )
        
        self.assertEqual(comment.timestamp, 15.5)
        self.assertEqual(comment.type, 'technical')


class TestFeedbackAPI(TestCase):
    """피드백 REST API 테스트"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='test@test.com',
            email='test@test.com',
            password='testpass123'
        )
        self.client.login(username='test@test.com', password='testpass123')
        
        self.project = Project.objects.create(
            name='테스트 프로젝트',
            user=self.user,
            manager='담당자',
            consumer='고객사'
        )
    
    def test_get_project_feedbacks_list(self):
        """프로젝트의 피드백 목록 조회"""
        response = self.client.get(f'/api/projects/{self.project.id}/feedbacks/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('feedbacks', data)
        self.assertIsInstance(data['feedbacks'], list)
    
    def test_create_feedback_with_video(self):
        """영상과 함께 피드백 생성"""
        video_file = SimpleUploadedFile("test.mp4", b"video content", content_type="video/mp4")
        
        response = self.client.post(
            f'/api/projects/{self.project.id}/feedbacks/',
            {
                'title': '첫 번째 피드백',
                'description': '초안 검토',
                'video_file': video_file
            },
            format='multipart'
        )
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn('feedback_id', data)
        self.assertIn('video_url', data)
    
    def test_add_comment_to_feedback(self):
        """피드백에 코멘트 추가"""
        # 피드백 생성
        feedback_response = self.client.post(
            f'/api/projects/{self.project.id}/feedbacks/',
            {'title': '피드백'}
        )
        feedback_id = feedback_response.json()['feedback_id']
        
        # 코멘트 추가
        response = self.client.post(
            f'/api/projects/{self.project.id}/feedbacks/{feedback_id}/comments/',
            {
                'timestamp': 10.5,
                'content': '이 부분 수정 필요',
                'type': 'technical'
            },
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data['timestamp'], 10.5)
    
    def test_update_comment(self):
        """코멘트 수정"""
        # 피드백과 코멘트 생성
        feedback = FeedBack.objects.create(project=self.project, user=self.user)
        comment = FeedBackComment.objects.create(
            feedback=feedback,
            user=self.user,
            content='원본 내용'
        )
        
        # 코멘트 수정
        response = self.client.put(
            f'/api/projects/{self.project.id}/feedbacks/{feedback.id}/comments/{comment.id}/',
            {'content': '수정된 내용'},
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        comment.refresh_from_db()
        self.assertEqual(comment.content, '수정된 내용')
    
    def test_delete_own_comment(self):
        """자신의 코멘트 삭제"""
        feedback = FeedBack.objects.create(project=self.project, user=self.user)
        comment = FeedBackComment.objects.create(
            feedback=feedback,
            user=self.user,
            content='삭제할 코멘트'
        )
        
        response = self.client.delete(
            f'/api/projects/{self.project.id}/feedbacks/{feedback.id}/comments/{comment.id}/'
        )
        
        self.assertEqual(response.status_code, 204)
        self.assertFalse(FeedBackComment.objects.filter(id=comment.id).exists())
    
    def test_cannot_delete_others_comment(self):
        """다른 사람의 코멘트는 삭제 불가"""
        other_user = User.objects.create_user('other@test.com', 'other@test.com', 'pass')
        feedback = FeedBack.objects.create(project=self.project, user=self.user)
        comment = FeedBackComment.objects.create(
            feedback=feedback,
            user=other_user,
            content='다른 사람 코멘트'
        )
        
        response = self.client.delete(
            f'/api/projects/{self.project.id}/feedbacks/{feedback.id}/comments/{comment.id}/'
        )
        
        self.assertEqual(response.status_code, 403)
        self.assertTrue(FeedBackComment.objects.filter(id=comment.id).exists())


class TestVideoUpload(TestCase):
    """영상 업로드 및 처리 테스트"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='test@test.com',
            email='test@test.com',
            password='testpass123'
        )
        self.client.login(username='test@test.com', password='testpass123')
        
        self.project = Project.objects.create(
            name='테스트 프로젝트',
            user=self.user,
            manager='담당자',
            consumer='고객사'
        )
    
    def test_chunk_upload_large_video(self):
        """대용량 영상 청크 업로드"""
        # 100MB 가상 파일 생성
        chunk_size = 1024 * 1024  # 1MB
        total_chunks = 100
        
        # 업로드 세션 시작
        response = self.client.post(
            f'/api/projects/{self.project.id}/feedbacks/upload/init/',
            {
                'filename': 'large_video.mp4',
                'total_size': chunk_size * total_chunks,
                'total_chunks': total_chunks
            },
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        upload_id = response.json()['upload_id']
        
        # 청크 업로드
        for i in range(total_chunks):
            chunk_data = b'x' * chunk_size
            response = self.client.post(
                f'/api/projects/{self.project.id}/feedbacks/upload/chunk/',
                {
                    'upload_id': upload_id,
                    'chunk_index': i,
                    'chunk_data': SimpleUploadedFile(f'chunk_{i}', chunk_data)
                },
                format='multipart'
            )
            self.assertEqual(response.status_code, 200)
        
        # 업로드 완료
        response = self.client.post(
            f'/api/projects/{self.project.id}/feedbacks/upload/complete/',
            {'upload_id': upload_id},
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        self.assertIn('feedback_id', response.json())
    
    def test_video_encoding_status(self):
        """영상 인코딩 상태 확인"""
        # 영상 업로드
        video_file = SimpleUploadedFile("test.mp4", b"video content", content_type="video/mp4")
        response = self.client.post(
            f'/api/projects/{self.project.id}/feedbacks/',
            {'video_file': video_file},
            format='multipart'
        )
        
        feedback_id = response.json()['feedback_id']
        
        # 인코딩 상태 확인
        response = self.client.get(
            f'/api/projects/{self.project.id}/feedbacks/{feedback_id}/encoding-status/'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('status', data)
        self.assertIn(data['status'], ['pending', 'processing', 'completed', 'failed'])
    
    def test_get_hls_streaming_url(self):
        """HLS 스트리밍 URL 획득"""
        # 피드백 생성 (인코딩 완료 상태로)
        feedback = FeedBack.objects.create(
            project=self.project,
            user=self.user,
            encoding_status='completed',
            hls_playlist_url='/media/feedback_file/test.m3u8'
        )
        
        response = self.client.get(
            f'/api/projects/{self.project.id}/feedbacks/{feedback.id}/stream/'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('hls_url', data)
        self.assertTrue(data['hls_url'].endswith('.m3u8'))


class TestRealtimeSync(TestCase):
    """실시간 동기화 테스트"""
    
    def test_websocket_connection(self):
        """WebSocket 연결 테스트"""
        ws = websocket.WebSocket()
        ws.connect('ws://localhost:8000/ws/feedback/1/')
        
        # 연결 확인
        self.assertEqual(ws.connected, True)
        
        # 메시지 전송
        ws.send(json.dumps({
            'type': 'comment.create',
            'data': {
                'timestamp': 10.5,
                'content': '테스트 코멘트'
            }
        }))
        
        # 응답 수신
        response = ws.recv()
        data = json.loads(response)
        self.assertEqual(data['type'], 'comment.created')
        
        ws.close()
    
    def test_concurrent_comment_creation(self):
        """동시 코멘트 생성 충돌 해결"""
        feedback = FeedBack.objects.create(
            project=self.project,
            user=self.user
        )
        
        def create_comment(user_id):
            user = User.objects.get(id=user_id)
            with transaction.atomic():
                comment = FeedBackComment.objects.create(
                    feedback=feedback,
                    user=user,
                    timestamp=10.0,  # 같은 시점
                    content=f'User {user_id} comment'
                )
                time.sleep(0.1)  # 동시성 시뮬레이션
                return comment.id
        
        # 10명의 사용자가 동시에 코멘트 생성
        users = [User.objects.create_user(f'user{i}@test.com', f'user{i}@test.com', 'pass') 
                 for i in range(10)]
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(create_comment, user.id) for user in users]
            results = [f.result() for f in futures]
        
        # 모든 코멘트가 생성되었는지 확인
        self.assertEqual(feedback.comments.count(), 10)
        
        # 타임스탬프 충돌이 해결되었는지 확인
        timestamps = list(feedback.comments.values_list('timestamp', flat=True))
        self.assertEqual(len(timestamps), len(set(timestamps)))  # 중복 없음
    
    def test_realtime_cursor_sync(self):
        """실시간 커서 동기화"""
        ws1 = websocket.WebSocket()
        ws2 = websocket.WebSocket()
        
        ws1.connect('ws://localhost:8000/ws/feedback/1/')
        ws2.connect('ws://localhost:8000/ws/feedback/1/')
        
        # User1이 커서 이동
        ws1.send(json.dumps({
            'type': 'cursor.move',
            'data': {
                'timestamp': 15.5,
                'x': 100,
                'y': 200
            }
        }))
        
        # User2가 업데이트 수신
        response = ws2.recv()
        data = json.loads(response)
        
        self.assertEqual(data['type'], 'cursor.moved')
        self.assertEqual(data['data']['timestamp'], 15.5)
        
        ws1.close()
        ws2.close()


class TestPerformance(TestCase):
    """성능 테스트"""
    
    def test_feedback_list_query_performance(self):
        """피드백 목록 조회 성능"""
        # 1000개의 피드백 생성
        project = Project.objects.create(
            name='성능 테스트',
            user=self.user,
            manager='담당자',
            consumer='고객사'
        )
        
        feedbacks = [
            FeedBack(project=project, user=self.user)
            for _ in range(1000)
        ]
        FeedBack.objects.bulk_create(feedbacks)
        
        # 쿼리 시간 측정
        start_time = time.time()
        response = self.client.get(f'/api/projects/{project.id}/feedbacks/')
        end_time = time.time()
        
        self.assertEqual(response.status_code, 200)
        self.assertLess(end_time - start_time, 2.0)  # 2초 이내
    
    def test_video_upload_timeout(self):
        """영상 업로드 타임아웃 처리"""
        # 5분 타임아웃 테스트
        large_file = SimpleUploadedFile(
            "large.mp4",
            b"x" * (600 * 1024 * 1024),  # 600MB
            content_type="video/mp4"
        )
        
        response = self.client.post(
            f'/api/projects/{self.project.id}/feedbacks/',
            {'video_file': large_file},
            format='multipart'
        )
        
        # 타임아웃 또는 성공
        self.assertIn(response.status_code, [201, 408])
    
    def test_concurrent_user_limit(self):
        """동시 사용자 100명 지원"""
        project = Project.objects.create(
            name='동시성 테스트',
            user=self.user,
            manager='담당자',
            consumer='고객사'
        )
        
        def simulate_user(user_id):
            ws = websocket.WebSocket()
            ws.connect(f'ws://localhost:8000/ws/feedback/{project.id}/')
            time.sleep(1)  # 1초 대기
            ws.close()
            return True
        
        # 100명 동시 접속
        with ThreadPoolExecutor(max_workers=100) as executor:
            futures = [executor.submit(simulate_user, i) for i in range(100)]
            results = [f.result() for f in futures]
        
        self.assertEqual(sum(results), 100)  # 모두 성공


if __name__ == '__main__':
    pytest.main([__file__, '-v'])