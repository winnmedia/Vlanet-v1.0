import os
import json
import tempfile
from unittest.mock import patch, MagicMock
from django.test import TestCase, Client
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

from projects import models
from feedbacks import models as feedback_model

User = get_user_model()


class ProjectFeedbackUploadTestCase(TestCase):
    """ProjectFeedbackUpload 뷰의 포괄적인 테스트"""
    
    def setUp(self):
        """테스트 환경 설정"""
        self.client = Client()
        
        # 테스트 사용자 생성
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@test.com',
            password='testpass123'
        )
        
        self.member = User.objects.create_user(
            username='member',
            email='member@test.com',
            password='testpass123'
        )
        
        self.non_member = User.objects.create_user(
            username='nonmember',
            email='nonmember@test.com',
            password='testpass123'
        )
        
        # 테스트 프로젝트 생성
        self.project = models.Project.objects.create(
            user=self.owner,
            name='Test Project',
            description='Test Description'
        )
        
        # 멤버 추가
        models.Members.objects.create(
            project=self.project,
            user=self.member,
            rating='normal'
        )
        
        # URL 패턴
        self.url = f'/api/projects/{self.project.id}/feedback/upload/'
        
        # 작은 비디오 파일 생성 (100 바이트)
        self.small_video_content = b'FAKE_VIDEO_CONTENT' * 5
        self.small_video = SimpleUploadedFile(
            "test_video.mp4",
            self.small_video_content,
            content_type="video/mp4"
        )
    
    def _create_large_file(self, size_mb, filename="large_video.mp4"):
        """지정된 크기의 파일 생성"""
        size_bytes = size_mb * 1024 * 1024
        content = b'0' * size_bytes
        return SimpleUploadedFile(filename, content, content_type="video/mp4")
    
    def _login_user(self, user):
        """사용자 로그인 헬퍼 - JWT 토큰 생성 및 설정"""
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
    
    def test_options_method_cors_headers(self):
        """TEST 1: OPTIONS 메서드 CORS 헤더 검증"""
        response = self.client.options(self.url)
        
        # 상태 코드 검증
        self.assertEqual(response.status_code, 200)
        
        # CORS 헤더 검증
        self.assertEqual(response['Access-Control-Allow-Origin'], '*')
        self.assertEqual(response['Access-Control-Allow-Methods'], 'POST, OPTIONS')
        self.assertEqual(response['Access-Control-Allow-Headers'], 'Content-Type, Authorization')
        self.assertEqual(response['Access-Control-Max-Age'], '3600')
        
        # 응답 본문 검증
        data = json.loads(response.content)
        self.assertEqual(data['status'], 'ok')
    
    def test_post_without_authentication(self):
        """TEST 2: 인증 없이 POST 요청 시 실패"""
        response = self.client.post(self.url, {
            'file': self.small_video
        })
        
        # 인증 데코레이터가 401 반환하는지 확인
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.content)
        self.assertIn('message', data)
        self.assertIn(data['message'], ['NEED_ACCESS_TOKEN', 'INVALID_TOKEN'])
    
    def test_successful_upload_by_owner(self):
        """TEST 3: 프로젝트 소유자의 성공적인 업로드"""
        self._login_user(self.owner)
        
        response = self.client.post(self.url, {
            'file': SimpleUploadedFile("owner_video.mp4", self.small_video_content, content_type="video/mp4")
        })
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('result', data)
        self.assertIn('id', data['result'])
        self.assertIn('file_url', data['result'])
        
        # 데이터베이스 확인
        self.project.refresh_from_db()
        self.assertIsNotNone(self.project.feedback)
        self.assertIsNotNone(self.project.feedback.files)
    
    def test_successful_upload_by_member(self):
        """TEST 4: 프로젝트 멤버의 성공적인 업로드"""
        self._login_user(self.member)
        
        response = self.client.post(self.url, {
            'files': SimpleUploadedFile("member_video.mp4", self.small_video_content, content_type="video/mp4")
        })
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('result', data)
        self.assertIn('file_url', data['result'])
        
        # 데이터베이스 확인
        self.project.refresh_from_db()
        self.assertIsNotNone(self.project.feedback)
    
    def test_upload_by_non_member_fails(self):
        """TEST 5: 권한 없는 사용자의 업로드 실패"""
        self._login_user(self.non_member)
        
        response = self.client.post(self.url, {
            'file': self.small_video
        })
        
        self.assertEqual(response.status_code, 403)
        data = json.loads(response.content)
        self.assertEqual(data['message'], '권한이 없습니다.')
    
    def test_upload_without_file(self):
        """TEST 6: 파일 없이 업로드 시도"""
        self._login_user(self.owner)
        
        response = self.client.post(self.url, {})
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertEqual(data['message'], '파일이 없습니다.')
    
    def test_file_size_limit_exactly_600mb(self):
        """TEST 7: 정확히 600MB 파일 업로드 성공"""
        self._login_user(self.owner)
        
        # 정확히 600MB 파일
        large_file = self._create_large_file(600)
        
        response = self.client.post(self.url, {
            'file': large_file
        })
        
        self.assertEqual(response.status_code, 200)
    
    def test_file_size_limit_exceeds_600mb(self):
        """TEST 8: 600MB 초과 파일 업로드 실패"""
        self._login_user(self.owner)
        
        # 601MB 파일
        large_file = self._create_large_file(601)
        
        response = self.client.post(self.url, {
            'file': large_file
        })
        
        self.assertEqual(response.status_code, 413)
        data = json.loads(response.content)
        self.assertIn('601.0MB', data['message'])
        self.assertIn('최대: 600MB', data['message'])
    
    def test_supported_video_formats(self):
        """TEST 9: 지원되는 비디오 형식 테스트"""
        self._login_user(self.owner)
        
        supported_formats = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
        
        for ext in supported_formats:
            filename = f"test_video{ext}"
            video_file = SimpleUploadedFile(
                filename,
                self.small_video_content,
                content_type=f"video/{ext[1:]}"
            )
            
            response = self.client.post(self.url, {
                'file': video_file
            })
            
            self.assertEqual(
                response.status_code, 
                200, 
                f"Failed to upload {ext} format"
            )
    
    def test_unsupported_file_formats(self):
        """TEST 10: 지원하지 않는 파일 형식 테스트"""
        self._login_user(self.owner)
        
        unsupported_files = [
            ('image.jpg', 'image/jpeg'),
            ('document.pdf', 'application/pdf'),
            ('audio.mp3', 'audio/mp3'),
            ('text.txt', 'text/plain'),
            ('excel.xlsx', 'application/vnd.ms-excel'),
        ]
        
        for filename, content_type in unsupported_files:
            file = SimpleUploadedFile(
                filename,
                b'FAKE_CONTENT',
                content_type=content_type
            )
            
            response = self.client.post(self.url, {
                'file': file
            })
            
            self.assertEqual(
                response.status_code, 
                400, 
                f"Should reject {filename}"
            )
            data = json.loads(response.content)
            self.assertIn('지원하지 않는 파일 형식', data['message'])
    
    def test_korean_filename_handling(self):
        """TEST 11: 한글 파일명 처리 테스트"""
        self._login_user(self.owner)
        
        korean_filenames = [
            '테스트비디오.mp4',
            '한글_동영상_파일.mp4',
            '프로젝트_최종_버전.mp4',
            '2025년_1월_영상.mp4'
        ]
        
        for filename in korean_filenames:
            video_file = SimpleUploadedFile(
                filename,
                self.small_video_content,
                content_type="video/mp4"
            )
            
            response = self.client.post(self.url, {
                'file': video_file
            })
            
            self.assertEqual(
                response.status_code, 
                200, 
                f"Failed to handle Korean filename: {filename}"
            )
            
            # 저장된 파일명이 안전하게 변환되었는지 확인
            self.project.refresh_from_db()
            saved_filename = self.project.feedback.files.name
            
            # 한글이 포함되지 않았는지 확인
            self.assertNotRegex(
                saved_filename,
                r'[가-힣]',
                f"Korean characters found in saved filename: {saved_filename}"
            )
            
            # 프로젝트 ID가 파일명에 포함되었는지 확인
            self.assertIn(
                f'project_{self.project.id}',
                saved_filename,
                "Project ID not found in converted filename"
            )
    
    def test_special_characters_in_filename(self):
        """TEST 12: 특수문자가 포함된 파일명 처리"""
        self._login_user(self.owner)
        
        special_filenames = [
            'video@#$%.mp4',
            'test&video!.mp4',
            'file   with   spaces.mp4',
            '___multiple___underscores___.mp4',
            'video().mp4'
        ]
        
        for filename in special_filenames:
            video_file = SimpleUploadedFile(
                filename,
                self.small_video_content,
                content_type="video/mp4"
            )
            
            response = self.client.post(self.url, {
                'file': video_file
            })
            
            self.assertEqual(response.status_code, 200)
            
            # 저장된 파일명 확인
            self.project.refresh_from_db()
            saved_filename = self.project.feedback.files.name
            
            # 특수문자가 언더스코어로 변환되었는지 확인
            self.assertNotRegex(
                saved_filename,
                r'[^\w\-_\.]',
                f"Special characters found in: {saved_filename}"
            )
            
            # 연속된 언더스코어가 제거되었는지 확인
            self.assertNotIn('__', saved_filename)
    
    def test_existing_file_replacement(self):
        """TEST 13: 기존 파일 교체 테스트"""
        self._login_user(self.owner)
        
        # 첫 번째 파일 업로드
        first_file = SimpleUploadedFile(
            "first.mp4",
            b'FIRST_VIDEO',
            content_type="video/mp4"
        )
        
        response = self.client.post(self.url, {'file': first_file})
        self.assertEqual(response.status_code, 200)
        
        self.project.refresh_from_db()
        first_file_name = self.project.feedback.files.name
        
        # 두 번째 파일 업로드 (교체)
        second_file = SimpleUploadedFile(
            "second.mp4",
            b'SECOND_VIDEO',
            content_type="video/mp4"
        )
        
        response = self.client.post(self.url, {'file': second_file})
        self.assertEqual(response.status_code, 200)
        
        self.project.refresh_from_db()
        second_file_name = self.project.feedback.files.name
        
        # 파일이 교체되었는지 확인
        self.assertNotEqual(first_file_name, second_file_name)
        self.assertIn('second', second_file_name)
    
    def test_project_not_found(self):
        """TEST 14: 존재하지 않는 프로젝트 테스트"""
        self._login_user(self.owner)
        
        non_existent_url = '/api/projects/99999/feedback/upload/'
        
        response = self.client.post(non_existent_url, {
            'file': self.small_video
        })
        
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.content)
        self.assertEqual(data['message'], '프로젝트를 찾을 수 없습니다.')
    
    def test_feedback_creation_for_new_project(self):
        """TEST 15: 피드백이 없는 프로젝트에 피드백 자동 생성"""
        # 피드백이 없는 새 프로젝트 생성
        new_project = models.Project.objects.create(
            user=self.owner,
            name='Project Without Feedback',
            description='Test'
        )
        
        self.assertIsNone(new_project.feedback)
        
        self._login_user(self.owner)
        
        url = f'/api/projects/{new_project.id}/feedback/upload/'
        response = self.client.post(url, {
            'file': SimpleUploadedFile("test.mp4", self.small_video_content, content_type="video/mp4")
        })
        
        self.assertEqual(response.status_code, 200)
        
        new_project.refresh_from_db()
        self.assertIsNotNone(new_project.feedback)
        self.assertIsNotNone(new_project.feedback.files)
    
    @patch('os.environ.get')
    def test_file_url_generation_debug_mode(self, mock_environ):
        """TEST 16: DEBUG 모드에서 파일 URL 생성"""
        mock_environ.return_value = None
        
        with self.settings(DEBUG=True):
            self._login_user(self.owner)
            
            response = self.client.post(self.url, {
                'file': SimpleUploadedFile("debug_test.mp4", self.small_video_content, content_type="video/mp4")
            })
            
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.content)
            
            # DEBUG 모드에서는 localhost URL이어야 함
            self.assertIn('http://localhost:8000', data['result']['file_url'])
    
    @patch('os.environ.get')
    def test_file_url_generation_production_mode(self, mock_environ):
        """TEST 17: 프로덕션 모드에서 파일 URL 생성"""
        mock_environ.return_value = 'https://videoplanet.up.railway.app'
        
        with self.settings(DEBUG=False):
            self._login_user(self.owner)
            
            response = self.client.post(self.url, {
                'file': SimpleUploadedFile("prod_test.mp4", self.small_video_content, content_type="video/mp4")
            })
            
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.content)
            
            # 프로덕션 모드에서는 Railway URL이어야 함
            self.assertIn('https://videoplanet.up.railway.app', data['result']['file_url'])
    
    def test_concurrent_uploads_same_project(self):
        """TEST 18: 동일 프로젝트에 대한 동시 업로드 시나리오"""
        self._login_user(self.owner)
        
        # 두 개의 파일을 순차적으로 업로드
        files = [
            SimpleUploadedFile("concurrent1.mp4", b'VIDEO1', content_type="video/mp4"),
            SimpleUploadedFile("concurrent2.mp4", b'VIDEO2', content_type="video/mp4")
        ]
        
        responses = []
        for file in files:
            response = self.client.post(self.url, {'file': file})
            responses.append(response)
        
        # 모든 요청이 성공해야 함
        for response in responses:
            self.assertEqual(response.status_code, 200)
        
        # 마지막 파일만 저장되어야 함
        self.project.refresh_from_db()
        self.assertIn('concurrent2', self.project.feedback.files.name)
    
    def test_empty_filename_handling(self):
        """TEST 19: 빈 파일명 또는 특수한 파일명 처리"""
        self._login_user(self.owner)
        
        # .mp4는 확장자가 없는 파일로 처리되어 400 에러
        response = self.client.post(self.url, {
            'file': SimpleUploadedFile(".mp4", self.small_video_content, content_type="video/mp4")
        })
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertIn('지원하지 않는 파일 형식', data['message'])
        
        # mp4.mp4와 video.mp4는 정상 처리
        success_files = [
            SimpleUploadedFile("mp4.mp4", self.small_video_content, content_type="video/mp4"),
            SimpleUploadedFile("video.mp4", self.small_video_content, content_type="video/mp4"),
        ]
        
        for file in success_files:
            response = self.client.post(self.url, {'file': file})
            
            self.assertEqual(response.status_code, 200)
            
            self.project.refresh_from_db()
            saved_filename = self.project.feedback.files.name
            
            # UUID가 포함된 안전한 파일명으로 변환되었는지 확인
            self.assertRegex(
                saved_filename,
                r'video_[a-f0-9]{8}\.mp4',
                f"Unsafe filename not properly converted: {saved_filename}"
            )
    
    def test_case_insensitive_extension_check(self):
        """TEST 20: 대소문자 구분 없는 확장자 검사"""
        self._login_user(self.owner)
        
        case_variations = ['test.MP4', 'test.Mp4', 'test.mP4', 'test.AVI', 'test.MKV']
        
        for filename in case_variations:
            file = SimpleUploadedFile(
                filename,
                self.small_video_content,
                content_type="video/mp4"
            )
            
            response = self.client.post(self.url, {'file': file})
            
            self.assertEqual(
                response.status_code,
                200,
                f"Failed to accept uppercase extension: {filename}"
            )


class ProjectFeedbackUploadIntegrationTest(TestCase):
    """통합 테스트 및 엣지 케이스"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='integrationuser',
            email='integration@test.com',
            password='testpass123'
        )
        self.project = models.Project.objects.create(
            user=self.user,
            name='Integration Test Project'
        )
        self.url = f'/api/projects/{self.project.id}/feedback/upload/'
    
    def test_end_to_end_upload_workflow(self):
        """TEST 21: 전체 업로드 워크플로우 테스트"""
        # 1. OPTIONS 요청으로 CORS 확인
        options_response = self.client.options(self.url)
        self.assertEqual(options_response.status_code, 200)
        
        # 2. 인증 없이 시도
        unauth_response = self.client.post(self.url, {
            'file': SimpleUploadedFile("test.mp4", b'VIDEO', content_type="video/mp4")
        })
        # 409는 실제로는 업로드 API가 아닌 다른 API의 응답일 수 있음
        # 디버그를 위해 응답 내용 확인
        if unauth_response.status_code != 401:
            print(f"Unexpected status code: {unauth_response.status_code}")
            print(f"Response content: {unauth_response.content}")
        self.assertEqual(unauth_response.status_code, 401)
        
        # 3. 로그인
        # JWT 토큰으로 인증
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
        
        # 4. 성공적인 업로드
        video_file = SimpleUploadedFile(
            "통합테스트_영상.mp4",
            b'INTEGRATION_TEST_VIDEO' * 100,
            content_type="video/mp4"
        )
        
        upload_response = self.client.post(self.url, {'file': video_file})
        self.assertEqual(upload_response.status_code, 200)
        
        data = json.loads(upload_response.content)
        self.assertIn('result', data)
        self.assertIn('file_url', data['result'])
        
        # 5. 데이터베이스 검증
        self.project.refresh_from_db()
        self.assertIsNotNone(self.project.feedback)
        self.assertIsNotNone(self.project.feedback.files)
        
        # 6. 파일명이 안전하게 변환되었는지 확인
        saved_filename = self.project.feedback.files.name
        self.assertNotIn('통합테스트', saved_filename)
        self.assertIn(f'project_{self.project.id}', saved_filename)
    
    @patch('feedbacks.models.FeedBack.save')
    def test_database_failure_handling(self, mock_save):
        """TEST 22: 데이터베이스 오류 처리"""
        mock_save.side_effect = Exception("Database error")
        
        # JWT 토큰으로 인증
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
        
        response = self.client.post(self.url, {
            'file': SimpleUploadedFile("test.mp4", b'VIDEO', content_type="video/mp4")
        })
        
        # 서버 오류가 발생해야 함
        self.assertEqual(response.status_code, 500)
        data = json.loads(response.content)
        self.assertIn('오류', data['message'])


class ProjectFeedbackUploadSecurityTest(TestCase):
    """보안 관련 테스트"""
    
    def setUp(self):
        self.client = Client()
        self.attacker = User.objects.create_user(
            username='attacker',
            email='attacker@test.com',
            password='hackpass123'
        )
        self.victim = User.objects.create_user(
            username='victim',
            email='victim@test.com',
            password='safepass123'
        )
        self.victim_project = models.Project.objects.create(
            user=self.victim,
            name='Victim Project'
        )
        self.url = f'/api/projects/{self.victim_project.id}/feedback/upload/'
    
    def test_path_traversal_prevention(self):
        """TEST 23: 경로 탐색 공격 방지"""
        # JWT 토큰으로 인증
        refresh = RefreshToken.for_user(self.victim)
        access_token = str(refresh.access_token)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
        
        malicious_filenames = [
            '../../../etc/passwd.mp4',
            '..\\..\\..\\windows\\system32\\config\\sam.mp4',
            'video/../../../secret.mp4',
            './././../../../home/user/secret.mp4'
        ]
        
        for filename in malicious_filenames:
            file = SimpleUploadedFile(
                filename,
                b'MALICIOUS',
                content_type="video/mp4"
            )
            
            response = self.client.post(self.url, {'file': file})
            
            if response.status_code == 200:
                self.victim_project.refresh_from_db()
                saved_path = self.victim_project.feedback.files.name
                
                # 경로 구분자가 없어야 함
                self.assertNotIn('..', saved_path)
                self.assertNotIn('/', saved_path.split('/')[-1])
                self.assertNotIn('\\', saved_path)
    
    def test_malicious_content_type_spoofing(self):
        """TEST 24: Content-Type 스푸핑 공격"""
        # JWT 토큰으로 인증
        refresh = RefreshToken.for_user(self.victim)
        access_token = str(refresh.access_token)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
        
        # 실행 파일을 비디오로 위장
        malicious_file = SimpleUploadedFile(
            "malware.mp4",  # 확장자는 mp4
            b'\x4d\x5a\x90\x00',  # PE 실행 파일 시그니처
            content_type="video/mp4"  # Content-Type은 video
        )
        
        response = self.client.post(self.url, {'file': malicious_file})
        
        # 확장자 기반 검증만 하므로 통과할 수 있음
        # 실제 환경에서는 파일 내용 검증도 필요
        self.assertEqual(response.status_code, 200)
    
    def test_sql_injection_in_project_id(self):
        """TEST 25: 프로젝트 ID SQL 인젝션 시도"""
        # JWT 토큰으로 인증
        refresh = RefreshToken.for_user(self.attacker)
        access_token = str(refresh.access_token)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
        
        injection_attempts = [
            "1' OR '1'='1",
            "1; DROP TABLE projects;--",
            "1 UNION SELECT * FROM auth_user--"
        ]
        
        for injection in injection_attempts:
            url = f'/api/projects/{injection}/feedback/upload/'
            
            response = self.client.post(url, {
                'file': SimpleUploadedFile("test.mp4", b'VIDEO', content_type="video/mp4")
            })
            
            # Django ORM이 SQL 인젝션을 방지해야 함
            self.assertIn(response.status_code, [404, 400])


class ProjectFeedbackUploadMimeTypeTest(TestCase):
    """MIME 타입 검증 관련 테스트"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='mimeuser',
            email='mime@test.com',
            password='testpass123'
        )
        self.project = models.Project.objects.create(
            user=self.user,
            name='MIME Test Project'
        )
        self.url = f'/api/projects/{self.project.id}/feedback/upload/'
        
        # JWT 인증
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
    
    @patch('magic.Magic')
    def test_valid_video_mime_types(self, mock_magic_class):
        """TEST 26: 유효한 비디오 MIME 타입 검증"""
        mock_magic = MagicMock()
        mock_magic_class.return_value = mock_magic
        
        valid_mime_types = [
            ('video/mp4', 'test.mp4'),
            ('video/webm', 'test.webm'),
            ('video/ogg', 'test.ogg'),
            ('video/quicktime', 'test.mov'),
            ('video/x-msvideo', 'test.avi'),
            ('video/x-matroska', 'test.mkv'),
            ('application/x-matroska', 'test.mkv')
        ]
        
        for mime_type, filename in valid_mime_types:
            mock_magic.from_buffer.return_value = mime_type
            
            file = SimpleUploadedFile(
                filename,
                b'FAKE_VIDEO_CONTENT',
                content_type=mime_type
            )
            
            response = self.client.post(self.url, {'file': file})
            
            self.assertEqual(
                response.status_code,
                200,
                f"Failed to accept valid MIME type: {mime_type}"
            )
    
    @patch('magic.Magic')
    def test_invalid_mime_types_non_video(self, mock_magic_class):
        """TEST 27: 비디오가 아닌 MIME 타입 거부"""
        mock_magic = MagicMock()
        mock_magic_class.return_value = mock_magic
        
        invalid_mime_types = [
            ('image/jpeg', 'fake.mp4'),
            ('application/pdf', 'fake.mp4'),
            ('text/plain', 'fake.mp4'),
            ('audio/mp3', 'fake.mp4'),
            ('application/x-executable', 'malware.mp4'),
            ('application/octet-stream', 'binary.mp4')
        ]
        
        for mime_type, filename in invalid_mime_types:
            mock_magic.from_buffer.return_value = mime_type
            
            file = SimpleUploadedFile(
                filename,
                b'FAKE_CONTENT',
                content_type="video/mp4"  # Content-Type 헤더는 video로 위장
            )
            
            response = self.client.post(self.url, {'file': file})
            
            self.assertEqual(
                response.status_code,
                400,
                f"Should reject non-video MIME type: {mime_type}"
            )
            
            data = json.loads(response.content)
            self.assertEqual(data['message'], '업로드된 파일이 비디오 파일이 아닙니다.')
    
    @patch('magic.Magic')
    def test_unsupported_video_formats(self, mock_magic_class):
        """TEST 28: 지원하지 않는 비디오 형식 거부"""
        mock_magic = MagicMock()
        mock_magic_class.return_value = mock_magic
        
        unsupported_video_types = [
            'video/x-flv',      # Flash Video
            'video/3gpp',       # 3GP
            'video/x-ms-wmv',   # Windows Media Video
            'video/x-m4v'       # iTunes Video
        ]
        
        for mime_type in unsupported_video_types:
            mock_magic.from_buffer.return_value = mime_type
            
            file = SimpleUploadedFile(
                'unsupported.mp4',
                b'FAKE_VIDEO',
                content_type="video/mp4"
            )
            
            response = self.client.post(self.url, {'file': file})
            
            self.assertEqual(response.status_code, 400)
            data = json.loads(response.content)
            self.assertIn('지원하지 않는 비디오 형식', data['message'])
            self.assertIn(mime_type, data['message'])
    
    @patch('magic.Magic')
    def test_mime_validation_with_large_files(self, mock_magic_class):
        """TEST 29: 대용량 파일의 MIME 타입 검증 (첫 1MB만 확인)"""
        mock_magic = MagicMock()
        mock_magic_class.return_value = mock_magic
        mock_magic.from_buffer.return_value = 'video/mp4'
        
        # 10MB 크기의 파일 생성
        large_content = b'VIDEO_HEADER' + (b'0' * 10 * 1024 * 1024)
        
        file = SimpleUploadedFile(
            'large_video.mp4',
            large_content,
            content_type="video/mp4"
        )
        
        response = self.client.post(self.url, {'file': file})
        
        self.assertEqual(response.status_code, 200)
        
        # from_buffer가 1MB 이하의 데이터로 호출되었는지 확인
        called_buffer = mock_magic.from_buffer.call_args[0][0]
        self.assertLessEqual(len(called_buffer), 1024 * 1024)
    
    def test_mime_validation_library_not_installed(self):
        """TEST 30: python-magic 라이브러리가 없을 때 처리"""
        # ImportError를 시뮬레이션하기 위해 magic 모듈을 임시로 제거
        with patch.dict('sys.modules', {'magic': None}):
            file = SimpleUploadedFile(
                'test.mp4',
                b'VIDEO_CONTENT',
                content_type="video/mp4"
            )
            
            response = self.client.post(self.url, {'file': file})
            
            # python-magic이 없어도 확장자 검증은 통과하므로 성공해야 함
            self.assertEqual(response.status_code, 200)
    
    @patch('magic.Magic')
    def test_mime_validation_error_handling(self, mock_magic_class):
        """TEST 31: MIME 검증 중 예외 발생 시 처리"""
        mock_magic = MagicMock()
        mock_magic_class.return_value = mock_magic
        mock_magic.from_buffer.side_effect = Exception("Magic library error")
        
        file = SimpleUploadedFile(
            'test.mp4',
            b'VIDEO_CONTENT',
            content_type="video/mp4"
        )
        
        response = self.client.post(self.url, {'file': file})
        
        # MIME 검증 실패해도 확장자 검증은 통과했으므로 성공해야 함
        self.assertEqual(response.status_code, 200)
    
    @patch('magic.Magic')
    def test_executable_file_disguised_as_video(self, mock_magic_class):
        """TEST 32: 실행 파일을 비디오로 위장한 경우 감지"""
        mock_magic = MagicMock()
        mock_magic_class.return_value = mock_magic
        
        # Windows PE 실행 파일로 감지
        mock_magic.from_buffer.return_value = 'application/x-dosexec'
        
        # PE 헤더로 시작하는 파일
        pe_header = b'\x4d\x5a\x90\x00\x03\x00\x00\x00'
        
        file = SimpleUploadedFile(
            'malware.mp4',
            pe_header + b'MALICIOUS_CODE',
            content_type="video/mp4"
        )
        
        response = self.client.post(self.url, {'file': file})
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertEqual(data['message'], '업로드된 파일이 비디오 파일이 아닙니다.')
    
    @patch('magic.Magic')
    def test_script_file_disguised_as_video(self, mock_magic_class):
        """TEST 33: 스크립트 파일을 비디오로 위장한 경우 감지"""
        mock_magic = MagicMock()
        mock_magic_class.return_value = mock_magic
        
        script_types = [
            ('text/x-python', b'#!/usr/bin/env python\nimport os\nos.system("rm -rf /")'),
            ('text/x-shellscript', b'#!/bin/bash\nrm -rf /'),
            ('application/javascript', b'const fs = require("fs");\nfs.unlinkSync("/etc/passwd");')
        ]
        
        for mime_type, content in script_types:
            mock_magic.from_buffer.return_value = mime_type
            
            file = SimpleUploadedFile(
                'script.mp4',
                content,
                content_type="video/mp4"
            )
            
            response = self.client.post(self.url, {'file': file})
            
            self.assertEqual(
                response.status_code,
                400,
                f"Should reject script file with MIME type: {mime_type}"
            )
    
    @patch('magic.Magic')
    def test_polyglot_file_detection(self, mock_magic_class):
        """TEST 34: 폴리글롯 파일 (여러 형식을 동시에 가진 파일) 처리"""
        mock_magic = MagicMock()
        mock_magic_class.return_value = mock_magic
        
        # 비디오로 감지되면 통과
        mock_magic.from_buffer.return_value = 'video/mp4'
        
        # PDF와 MP4 헤더를 모두 가진 파일
        polyglot_content = b'%PDF-1.4' + b'\x00' * 100 + b'ftypmp42'
        
        file = SimpleUploadedFile(
            'polyglot.mp4',
            polyglot_content,
            content_type="video/mp4"
        )
        
        response = self.client.post(self.url, {'file': file})
        
        # magic 라이브러리가 video/mp4로 인식하면 통과
        self.assertEqual(response.status_code, 200)