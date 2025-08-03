"""
실시간 협업을 위한 WebSocket 컨슈머
영상 기획 프로젝트의 실시간 협업, 피드백, 알림 시스템
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import VideoPlanning, VideoPlanningCollaboration, VideoPlanningAIPrompt
from .ai_prompt_engine import PromptOptimizationService

logger = logging.getLogger(__name__)
User = get_user_model()

class VideoPlanningCollaborationConsumer(AsyncWebsocketConsumer):
    """영상 기획 실시간 협업 WebSocket 컨슈머"""
    
    async def connect(self):
        """WebSocket 연결"""
        try:
            # URL에서 기획 ID 추출
            self.planning_id = self.scope['url_route']['kwargs']['planning_id']
            self.room_group_name = f'planning_{self.planning_id}'
            
            # 사용자 인증 확인
            self.user = self.scope["user"]
            if not self.user.is_authenticated:
                await self.close(code=4001)
                return
            
            # 기획 접근 권한 확인
            has_access = await self.check_planning_access()
            if not has_access:
                await self.close(code=4003)
                return
            
            # 그룹 참가
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
            
            # 연결 알림
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_connected',
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
            # 현재 온라인 사용자 업데이트
            await self.update_last_access()
            
            logger.info(f"사용자 {self.user.username} 기획 {self.planning_id} 실시간 협업 시작")
            
        except Exception as e:
            logger.error(f"WebSocket 연결 오류: {str(e)}")
            await self.close(code=4000)
    
    async def disconnect(self, close_code):
        """WebSocket 연결 해제"""
        try:
            # 그룹에서 제거
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            
            # 연결 해제 알림
            if hasattr(self, 'user') and self.user.is_authenticated:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'user_disconnected',
                        'user_id': self.user.id,
                        'username': self.user.username,
                        'timestamp': timezone.now().isoformat()
                    }
                )
                
                logger.info(f"사용자 {self.user.username} 기획 {self.planning_id} 실시간 협업 종료")
                
        except Exception as e:
            logger.error(f"WebSocket 연결 해제 오류: {str(e)}")
    
    async def receive(self, text_data):
        """메시지 수신 및 처리"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            # 메시지 타입별 처리
            if message_type == 'planning_update':
                await self.handle_planning_update(data)
            elif message_type == 'real_time_comment':
                await self.handle_real_time_comment(data)
            elif message_type == 'cursor_position':
                await self.handle_cursor_position(data)
            elif message_type == 'ai_generation_request':
                await self.handle_ai_generation_request(data)
            elif message_type == 'collaboration_invite':
                await self.handle_collaboration_invite(data)
            elif message_type == 'status_update':
                await self.handle_status_update(data)
            elif message_type == 'ping':
                await self.send_ping_response()
            else:
                logger.warning(f"알 수 없는 메시지 타입: {message_type}")
                
        except json.JSONDecodeError:
            await self.send_error("잘못된 JSON 형식입니다.")
        except Exception as e:
            logger.error(f"메시지 처리 오류: {str(e)}")
            await self.send_error(f"메시지 처리 중 오류가 발생했습니다: {str(e)}")
    
    async def handle_planning_update(self, data):
        """기획 내용 실시간 업데이트"""
        try:
            update_type = data.get('update_type')  # story, scene, shot, storyboard
            content = data.get('content')
            field_name = data.get('field_name')
            
            # 권한 확인
            can_edit = await self.check_edit_permission()
            if not can_edit:
                await self.send_error("편집 권한이 없습니다.")
                return
            
            # 데이터베이스 업데이트
            await self.update_planning_content(update_type, field_name, content)
            
            # 다른 사용자들에게 브로드캐스트
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'planning_updated',
                    'update_type': update_type,
                    'field_name': field_name,
                    'content': content,
                    'updated_by': self.user.username,
                    'updated_by_id': self.user.id,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"기획 업데이트 처리 오류: {str(e)}")
            await self.send_error("기획 업데이트 중 오류가 발생했습니다.")
    
    async def handle_real_time_comment(self, data):
        """실시간 댓글/피드백"""
        try:
            comment_text = data.get('comment')
            target_section = data.get('target_section')  # story, scene, shot 등
            position_data = data.get('position', {})
            
            if not comment_text:
                await self.send_error("댓글 내용이 필요합니다.")
                return
            
            # 댓글 저장 (임시 또는 영구)
            comment_id = await self.save_real_time_comment(comment_text, target_section, position_data)
            
            # 실시간 브로드캐스트
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'new_comment',
                    'comment_id': comment_id,
                    'comment': comment_text,
                    'target_section': target_section,
                    'position': position_data,
                    'author': self.user.username,
                    'author_id': self.user.id,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"실시간 댓글 처리 오류: {str(e)}")
            await self.send_error("댓글 처리 중 오류가 발생했습니다.")
    
    async def handle_cursor_position(self, data):
        """실시간 커서 위치 공유"""
        try:
            position = data.get('position', {})
            section = data.get('section')
            
            # 다른 사용자들에게 커서 위치 브로드캐스트
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'cursor_moved',
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'position': position,
                    'section': section,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"커서 위치 처리 오류: {str(e)}")
    
    async def handle_ai_generation_request(self, data):
        """AI 생성 요청 실시간 처리"""
        try:
            prompt_type = data.get('prompt_type')
            user_input = data.get('user_input')
            optimization_level = data.get('optimization_level', 'high')
            
            # AI 생성 시작 알림
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'ai_generation_started',
                    'prompt_type': prompt_type,
                    'requested_by': self.user.username,
                    'requested_by_id': self.user.id,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
            # AI 생성 실행 (비동기)
            result = await self.generate_ai_content(prompt_type, user_input, optimization_level)
            
            # 결과 브로드캐스트
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'ai_generation_completed',
                    'prompt_type': prompt_type,
                    'result': result,
                    'requested_by': self.user.username,
                    'requested_by_id': self.user.id,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"AI 생성 요청 처리 오류: {str(e)}")
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'ai_generation_failed',
                    'prompt_type': data.get('prompt_type'),
                    'error': str(e),
                    'requested_by': self.user.username,
                    'timestamp': timezone.now().isoformat()
                }
            )
    
    async def handle_collaboration_invite(self, data):
        """협업 초대 처리"""
        try:
            invite_email = data.get('email')
            role = data.get('role', 'viewer')
            
            if not invite_email:
                await self.send_error("초대할 이메일이 필요합니다.")
                return
            
            # 초대 처리
            invitation_result = await self.send_collaboration_invite(invite_email, role)
            
            # 초대 결과 브로드캐스트
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'collaboration_invite_sent',
                    'email': invite_email,
                    'role': role,
                    'result': invitation_result,
                    'invited_by': self.user.username,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"협업 초대 처리 오류: {str(e)}")
            await self.send_error("협업 초대 중 오류가 발생했습니다.")
    
    async def handle_status_update(self, data):
        """상태 업데이트 (타이핑, 작업 중 등)"""
        try:
            status_type = data.get('status_type')
            status_data = data.get('status_data', {})
            
            # 상태 브로드캐스트
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_status_updated',
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'status_type': status_type,
                    'status_data': status_data,
                    'timestamp': timezone.now().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"상태 업데이트 처리 오류: {str(e)}")
    
    # WebSocket 이벤트 핸들러들
    async def user_connected(self, event):
        """사용자 연결 알림"""
        await self.send(text_data=json.dumps({
            'type': 'user_connected',
            'user_id': event['user_id'],
            'username': event['username'],
            'timestamp': event['timestamp']
        }))
    
    async def user_disconnected(self, event):
        """사용자 연결 해제 알림"""
        await self.send(text_data=json.dumps({
            'type': 'user_disconnected',
            'user_id': event['user_id'],
            'username': event['username'],
            'timestamp': event['timestamp']
        }))
    
    async def planning_updated(self, event):
        """기획 업데이트 알림"""
        # 자신이 업데이트한 내용은 제외
        if event['updated_by_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'planning_updated',
                'update_type': event['update_type'],
                'field_name': event['field_name'],
                'content': event['content'],
                'updated_by': event['updated_by'],
                'timestamp': event['timestamp']
            }))
    
    async def new_comment(self, event):
        """새 댓글 알림"""
        await self.send(text_data=json.dumps({
            'type': 'new_comment',
            'comment_id': event['comment_id'],
            'comment': event['comment'],
            'target_section': event['target_section'],
            'position': event['position'],
            'author': event['author'],
            'author_id': event['author_id'],
            'timestamp': event['timestamp']
        }))
    
    async def cursor_moved(self, event):
        """커서 이동 알림"""
        # 자신의 커서는 제외
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'cursor_moved',
                'user_id': event['user_id'],
                'username': event['username'],
                'position': event['position'],
                'section': event['section'],
                'timestamp': event['timestamp']
            }))
    
    async def ai_generation_started(self, event):
        """AI 생성 시작 알림"""
        await self.send(text_data=json.dumps({
            'type': 'ai_generation_started',
            'prompt_type': event['prompt_type'],
            'requested_by': event['requested_by'],
            'timestamp': event['timestamp']
        }))
    
    async def ai_generation_completed(self, event):
        """AI 생성 완료 알림"""
        await self.send(text_data=json.dumps({
            'type': 'ai_generation_completed',
            'prompt_type': event['prompt_type'],
            'result': event['result'],
            'requested_by': event['requested_by'],
            'timestamp': event['timestamp']
        }))
    
    async def ai_generation_failed(self, event):
        """AI 생성 실패 알림"""
        await self.send(text_data=json.dumps({
            'type': 'ai_generation_failed',
            'prompt_type': event['prompt_type'],
            'error': event['error'],
            'requested_by': event['requested_by'],
            'timestamp': event['timestamp']
        }))
    
    async def collaboration_invite_sent(self, event):
        """협업 초대 전송 알림"""
        await self.send(text_data=json.dumps({
            'type': 'collaboration_invite_sent',
            'email': event['email'],
            'role': event['role'],
            'result': event['result'],
            'invited_by': event['invited_by'],
            'timestamp': event['timestamp']
        }))
    
    async def user_status_updated(self, event):
        """사용자 상태 업데이트 알림"""
        # 자신의 상태는 제외
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'user_status_updated',
                'user_id': event['user_id'],
                'username': event['username'],
                'status_type': event['status_type'],
                'status_data': event['status_data'],
                'timestamp': event['timestamp']
            }))
    
    # 헬퍼 메서드들
    async def send_error(self, message):
        """에러 메시지 전송"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message,
            'timestamp': timezone.now().isoformat()
        }))
    
    async def send_ping_response(self):
        """핑 응답"""
        await self.send(text_data=json.dumps({
            'type': 'pong',
            'timestamp': timezone.now().isoformat()
        }))
    
    @database_sync_to_async
    def check_planning_access(self):
        """기획 접근 권한 확인"""
        try:
            planning = VideoPlanning.objects.get(id=self.planning_id)
            
            # 소유자인지 확인
            if planning.user == self.user:
                return True
            
            # 협업자인지 확인
            collaboration = VideoPlanningCollaboration.objects.filter(
                planning=planning,
                user=self.user,
                status='accepted'
            ).first()
            
            return collaboration is not None
            
        except VideoPlanning.DoesNotExist:
            return False
    
    @database_sync_to_async
    def check_edit_permission(self):
        """편집 권한 확인"""
        try:
            planning = VideoPlanning.objects.get(id=self.planning_id)
            
            # 소유자는 항상 편집 가능
            if planning.user == self.user:
                return True
            
            # 협업자의 편집 권한 확인
            collaboration = VideoPlanningCollaboration.objects.filter(
                planning=planning,
                user=self.user,
                status='accepted',
                can_edit=True
            ).first()
            
            return collaboration is not None
            
        except VideoPlanning.DoesNotExist:
            return False
    
    @database_sync_to_async
    def update_planning_content(self, update_type, field_name, content):
        """기획 내용 업데이트"""
        try:
            planning = VideoPlanning.objects.get(id=self.planning_id)
            
            if update_type == 'story':
                if field_name == 'selected_story':
                    planning.selected_story = content
                elif field_name == 'stories':
                    planning.stories = content
            elif update_type == 'scene':
                if field_name == 'selected_scene':
                    planning.selected_scene = content
                elif field_name == 'scenes':
                    planning.scenes = content
            elif update_type == 'shot':
                if field_name == 'selected_shot':
                    planning.selected_shot = content
                elif field_name == 'shots':
                    planning.shots = content
            elif update_type == 'storyboard':
                if field_name == 'storyboards':
                    planning.storyboards = content
            
            planning.save()
            return True
            
        except Exception as e:
            logger.error(f"기획 내용 업데이트 오류: {str(e)}")
            return False
    
    @database_sync_to_async
    def save_real_time_comment(self, comment_text, target_section, position_data):
        """실시간 댓글 저장"""
        # 추후 별도의 실시간 댓글 모델 구현
        # 현재는 임시 ID 반환
        import uuid
        return str(uuid.uuid4())
    
    @database_sync_to_async
    def update_last_access(self):
        """마지막 접근 시간 업데이트"""
        try:
            collaboration = VideoPlanningCollaboration.objects.filter(
                planning_id=self.planning_id,
                user=self.user
            ).first()
            
            if collaboration:
                collaboration.update_last_access()
                
        except Exception as e:
            logger.error(f"마지막 접근 시간 업데이트 오류: {str(e)}")
    
    async def generate_ai_content(self, prompt_type, user_input, optimization_level):
        """AI 콘텐츠 생성 (비동기)"""
        try:
            # 동기 함수를 비동기로 래핑
            return await database_sync_to_async(self._generate_ai_content_sync)(
                prompt_type, user_input, optimization_level
            )
        except Exception as e:
            logger.error(f"AI 콘텐츠 생성 오류: {str(e)}")
            return {'error': str(e)}
    
    def _generate_ai_content_sync(self, prompt_type, user_input, optimization_level):
        """AI 콘텐츠 생성 (동기)"""
        try:
            planning = VideoPlanning.objects.get(id=self.planning_id)
            prompt_service = PromptOptimizationService()
            
            if prompt_type == 'story':
                result = prompt_service.generate_story_prompt(planning, user_input, optimization_level)
            elif prompt_type == 'scene':
                result = prompt_service.generate_scene_prompt(planning, user_input, optimization_level)
            elif prompt_type == 'shot':
                result = prompt_service.generate_shot_prompt(planning, user_input, optimization_level)
            elif prompt_type in ['image', 'storyboard']:
                result = prompt_service.generate_image_prompt(planning, user_input, optimization_level)
            else:
                return {'error': '지원하지 않는 프롬프트 타입입니다.'}
            
            return {
                'success': result.is_successful,
                'enhanced_prompt': result.enhanced_prompt,
                'generation_time': result.generation_time,
                'confidence_score': result.confidence_score,
                'suggestions': result.optimization_suggestions
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    @database_sync_to_async
    def send_collaboration_invite(self, email, role):
        """협업 초대 전송"""
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            # 초대할 사용자 찾기
            try:
                invited_user = User.objects.get(email=email)
            except User.DoesNotExist:
                return {'success': False, 'message': '해당 이메일의 사용자를 찾을 수 없습니다.'}
            
            # 기존 협업 확인
            planning = VideoPlanning.objects.get(id=self.planning_id)
            existing_collaboration = VideoPlanningCollaboration.objects.filter(
                planning=planning,
                user=invited_user
            ).first()
            
            if existing_collaboration:
                if existing_collaboration.status == 'accepted':
                    return {'success': False, 'message': '이미 협업 중인 사용자입니다.'}
                elif existing_collaboration.status == 'invited':
                    return {'success': False, 'message': '이미 초대된 사용자입니다.'}
            
            # 새 협업 초대 생성
            collaboration = VideoPlanningCollaboration.objects.create(
                planning=planning,
                user=invited_user,
                role=role,
                status='invited',
                invited_by=self.user,
                can_edit=(role in ['owner', 'editor']),
                can_comment=True,
                can_approve=(role == 'reviewer'),
                can_invite=(role == 'owner')
            )
            
            # 이메일 알림 전송 (추후 구현)
            # send_collaboration_invite_email(invited_user.email, planning, self.user)
            
            return {
                'success': True, 
                'message': f'{invited_user.username}님에게 협업 초대를 전송했습니다.',
                'collaboration_id': collaboration.id
            }
            
        except Exception as e:
            logger.error(f"협업 초대 전송 오류: {str(e)}")
            return {'success': False, 'message': f'초대 전송 중 오류가 발생했습니다: {str(e)}'}


class VideoPlanningNotificationConsumer(AsyncWebsocketConsumer):
    """영상 기획 알림 전용 WebSocket 컨슈머"""
    
    async def connect(self):
        """알림 WebSocket 연결"""
        try:
            self.user = self.scope["user"]
            if not self.user.is_authenticated:
                await self.close(code=4001)
                return
            
            # 사용자별 알림 그룹
            self.notification_group = f'notifications_{self.user.id}'
            
            await self.channel_layer.group_add(
                self.notification_group,
                self.channel_name
            )
            
            await self.accept()
            
            # 읽지 않은 알림 전송
            await self.send_unread_notifications()
            
            logger.info(f"사용자 {self.user.username} 알림 WebSocket 연결")
            
        except Exception as e:
            logger.error(f"알림 WebSocket 연결 오류: {str(e)}")
            await self.close(code=4000)
    
    async def disconnect(self, close_code):
        """알림 WebSocket 연결 해제"""
        try:
            await self.channel_layer.group_discard(
                self.notification_group,
                self.channel_name
            )
        except Exception as e:
            logger.error(f"알림 WebSocket 연결 해제 오류: {str(e)}")
    
    async def receive(self, text_data):
        """알림 메시지 수신"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'mark_read':
                await self.mark_notification_read(data.get('notification_id'))
            elif message_type == 'get_unread_count':
                await self.send_unread_count()
                
        except Exception as e:
            logger.error(f"알림 메시지 처리 오류: {str(e)}")
    
    async def send_unread_notifications(self):
        """읽지 않은 알림 전송"""
        # 추후 구현: 데이터베이스에서 읽지 않은 알림 조회
        pass
    
    async def send_unread_count(self):
        """읽지 않은 알림 수 전송"""
        # 추후 구현: 읽지 않은 알림 수 계산
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'count': 0,
            'timestamp': timezone.now().isoformat()
        }))
    
    async def mark_notification_read(self, notification_id):
        """알림 읽음 처리"""
        # 추후 구현: 알림 읽음 상태 업데이트
        pass
    
    # 알림 이벤트 핸들러들
    async def collaboration_invite_received(self, event):
        """협업 초대 알림"""
        await self.send(text_data=json.dumps({
            'type': 'collaboration_invite_received',
            'planning_title': event['planning_title'],
            'invited_by': event['invited_by'],
            'role': event['role'],
            'invite_id': event['invite_id'],
            'timestamp': event['timestamp']
        }))
    
    async def planning_shared(self, event):
        """기획 공유 알림"""
        await self.send(text_data=json.dumps({
            'type': 'planning_shared',
            'planning_title': event['planning_title'],
            'shared_by': event['shared_by'],
            'timestamp': event['timestamp']
        }))
    
    async def ai_generation_completed_notification(self, event):
        """AI 생성 완료 알림"""
        await self.send(text_data=json.dumps({
            'type': 'ai_generation_completed',
            'planning_title': event['planning_title'],
            'prompt_type': event['prompt_type'],
            'result_summary': event['result_summary'],
            'timestamp': event['timestamp']
        }))