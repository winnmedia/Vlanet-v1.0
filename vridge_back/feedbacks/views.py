import json
import logging
import os
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
from django.core.files.storage import default_storage
from django.core.paginator import Paginator
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import api_view, permission_classes, parser_classes

from . import models
from . import serializers
from projects import models as project_model
from users.utils import user_validator

# FeedbackListView 임포트
from .views_list import FeedbackListView

logger = logging.getLogger(__name__)


class ProjectFeedbackListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id):
        try:
            project = get_object_or_404(
                project_model.Project,
                id=project_id
            )
            
            # 프로젝트 접근 권한 확인
            if not (project.user == request.user or 
                    project.members.filter(user=request.user).exists()):
                return Response(
                    {"message": "프로젝트에 접근 권한이 없습니다."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # 피드백 목록 조회
            feedbacks = models.FeedBack.objects.filter(
                project=project
            ).select_related('user').prefetch_related('messages', 'comments')
            
            # 페이지네이션
            page = request.GET.get('page', 1)
            per_page = request.GET.get('per_page', 20)
            paginator = Paginator(feedbacks, per_page)
            page_obj = paginator.get_page(page)
            
            serializer = serializers.FeedBackSerializer(
                page_obj.object_list, 
                many=True,
                context={'request': request}
            )
            
            return Response({
                'feedbacks': serializer.data,
                'total': paginator.count,
                'page': page_obj.number,
                'pages': paginator.num_pages
            })
            
        except Exception as e:
            logger.error(f"Error in ProjectFeedbackListView: {str(e)}")
            return Response(
                {"message": "서버 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request, project_id):
        try:
            project = get_object_or_404(
                project_model.Project,
                id=project_id
            )
            
            # 프로젝트 접근 권한 확인
            if not (project.user == request.user or 
                    project.members.filter(user=request.user).exists()):
                return Response(
                    {"message": "프로젝트에 접근 권한이 없습니다."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # 시리얼라이저 데이터 준비
            data = request.data.copy()
            data['project'] = project.id
            
            serializer = serializers.FeedBackCreateSerializer(
                data=data,
                context={'request': request}
            )
            
            if serializer.is_valid():
                feedback = serializer.save()
                
                # 파일 처리
                if 'video_file' in request.FILES:
                    video_file = request.FILES['video_file']
                    feedback.files = video_file
                    feedback.file_size = video_file.size
                    
                    # 비디오 메타데이터 설정
                    if video_file.content_type.startswith('video/'):
                        feedback.encoding_status = 'pending'
                    
                    feedback.save()
                
                response_serializer = serializers.FeedBackSerializer(
                    feedback,
                    context={'request': request}
                )
                
                return Response(
                    {
                        'feedback_id': feedback.id,
                        'feedback': response_serializer.data,
                        'video_url': response_serializer.data.get('video_url')
                    },
                    status=status.HTTP_201_CREATED
                )
            
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Exception as e:
            logger.error(f"Error in ProjectFeedbackListView POST: {str(e)}")
            return Response(
                {"message": "서버 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FeedbackDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get(self, request, feedback_id):
        try:
            feedback = get_object_or_404(
                models.FeedBack.objects.select_related('project', 'user')
                .prefetch_related('messages__user', 'comments__user', 'attached_files'),
                id=feedback_id
            )
            
            # 접근 권한 확인
            project = feedback.project
            if project and not (project.user == request.user or 
                               project.members.filter(user=request.user).exists()):
                return Response(
                    {"message": "피드백에 접근 권한이 없습니다."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = serializers.FeedBackDetailSerializer(
                feedback,
                context={'request': request}
            )
            
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error in FeedbackDetailView: {str(e)}")
            return Response(
                {"message": "서버 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request, feedback_id):
        try:
            feedback = get_object_or_404(
                models.FeedBack,
                id=feedback_id
            )
            
            # 수정 권한 확인 (작성자 또는 프로젝트 소유자)
            project = feedback.project
            if not (feedback.user == request.user or 
                   (project and project.user == request.user)):
                return Response(
                    {"message": "수정 권한이 없습니다."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = serializers.FeedBackSerializer(
                feedback,
                data=request.data,
                partial=True,
                context={'request': request}
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Exception as e:
            logger.error(f"Error in FeedbackDetailView PUT: {str(e)}")
            return Response(
                {"message": "서버 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, feedback_id):
        try:
            feedback = get_object_or_404(
                models.FeedBack,
                id=feedback_id
            )
            
            # 삭제 권한 확인
            project = feedback.project
            if not (feedback.user == request.user or 
                   (project and project.user == request.user)):
                return Response(
                    {"message": "삭제 권한이 없습니다."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # 관련 파일 삭제
            if feedback.files:
                try:
                    feedback.files.delete()
                except:
                    pass
            
            feedback.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            logger.error(f"Error in FeedbackDetailView DELETE: {str(e)}")
            return Response(
                {"message": "서버 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FeedbackMessageView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, feedback_id):
        try:
            feedback = get_object_or_404(
                models.FeedBack.objects.select_related('project'),
                id=feedback_id
            )
            
            # 접근 권한 확인
            project = feedback.project
            if project and not (project.user == request.user or 
                               project.members.filter(user=request.user).exists()):
                return Response(
                    {"message": "피드백에 접근 권한이 없습니다."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            data = request.data.copy()
            data['feedback'] = feedback.id
            
            serializer = serializers.FeedBackMessageSerializer(
                data=data,
                context={'request': request}
            )
            
            if serializer.is_valid():
                message = serializer.save()
                return Response(
                    serializer.data,
                    status=status.HTTP_201_CREATED
                )
            
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Exception as e:
            logger.error(f"Error in FeedbackMessageView: {str(e)}")
            return Response(
                {"message": "서버 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FeedbackCommentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, project_id, feedback_id):
        try:
            feedback = get_object_or_404(
                models.FeedBack.objects.select_related('project'),
                id=feedback_id,
                project_id=project_id
            )
            
            # 접근 권한 확인
            project = feedback.project
            if not (project.user == request.user or 
                   project.members.filter(user=request.user).exists()):
                return Response(
                    {"message": "피드백에 접근 권한이 없습니다."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            data = request.data.copy()
            data['feedback'] = feedback.id
            
            serializer = serializers.FeedBackCommentSerializer(
                data=data,
                context={'request': request}
            )
            
            if serializer.is_valid():
                comment = serializer.save()
                return Response(
                    {
                        'id': comment.id,
                        'timestamp': comment.timestamp,
                        'content': comment.content,
                        'type': comment.type,
                        'created': comment.created.isoformat()
                    },
                    status=status.HTTP_201_CREATED
                )
            
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Exception as e:
            logger.error(f"Error in FeedbackCommentView: {str(e)}")
            return Response(
                {"message": "서버 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request, project_id, feedback_id, comment_id):
        try:
            comment = get_object_or_404(
                models.FeedBackComment.objects.select_related('feedback__project', 'user'),
                id=comment_id,
                feedback_id=feedback_id,
                feedback__project_id=project_id
            )
            
            # 수정 권한 확인 (작성자만)
            if comment.user != request.user:
                return Response(
                    {"message": "수정 권한이 없습니다."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = serializers.FeedBackCommentSerializer(
                comment,
                data=request.data,
                partial=True,
                context={'request': request}
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Exception as e:
            logger.error(f"Error in FeedbackCommentView PUT: {str(e)}")
            return Response(
                {"message": "서버 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, project_id, feedback_id, comment_id):
        try:
            comment = get_object_or_404(
                models.FeedBackComment.objects.select_related('feedback__project', 'user'),
                id=comment_id,
                feedback_id=feedback_id,
                feedback__project_id=project_id
            )
            
            # 삭제 권한 확인 (작성자만)
            if comment.user != request.user:
                return Response(
                    {"message": "삭제 권한이 없습니다."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            comment.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            logger.error(f"Error in FeedbackCommentView DELETE: {str(e)}")
            return Response(
                {"message": "서버 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# 비디오 업로드 관련 뷰
class VideoUploadInitView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, project_id):
        try:
            project = get_object_or_404(
                project_model.Project,
                id=project_id
            )
            
            # 프로젝트 접근 권한 확인
            if not (project.user == request.user or 
                    project.members.filter(user=request.user).exists()):
                return Response(
                    {"message": "프로젝트에 접근 권한이 없습니다."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # 업로드 세션 생성
            import uuid
            upload_id = str(uuid.uuid4())
            
            # Redis에 업로드 정보 저장 (캐시 사용)
            from django.core.cache import cache
            cache.set(f'upload_{upload_id}', {
                'project_id': project_id,
                'user_id': request.user.id,
                'filename': request.data.get('filename'),
                'total_size': request.data.get('total_size'),
                'total_chunks': request.data.get('total_chunks'),
                'uploaded_chunks': []
            }, timeout=3600)  # 1시간 타임아웃
            
            return Response({
                'upload_id': upload_id
            })
            
        except Exception as e:
            logger.error(f"Error in VideoUploadInitView: {str(e)}")
            return Response(
                {"message": "서버 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VideoUploadChunkView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, project_id):
        try:
            from django.core.cache import cache
            
            upload_id = request.data.get('upload_id')
            chunk_index = int(request.data.get('chunk_index'))
            chunk_data = request.FILES.get('chunk_data')
            
            # 업로드 세션 확인
            upload_info = cache.get(f'upload_{upload_id}')
            if not upload_info:
                return Response(
                    {"message": "유효하지 않은 업로드 세션입니다."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 청크 저장
            chunk_path = os.path.join(
                settings.MEDIA_ROOT, 
                'temp_uploads', 
                upload_id, 
                f'chunk_{chunk_index}'
            )
            os.makedirs(os.path.dirname(chunk_path), exist_ok=True)
            
            with open(chunk_path, 'wb') as f:
                for chunk in chunk_data.chunks():
                    f.write(chunk)
            
            # 업로드 정보 업데이트
            upload_info['uploaded_chunks'].append(chunk_index)
            cache.set(f'upload_{upload_id}', upload_info, timeout=3600)
            
            return Response({
                'uploaded': len(upload_info['uploaded_chunks']),
                'total': upload_info['total_chunks']
            })
            
        except Exception as e:
            logger.error(f"Error in VideoUploadChunkView: {str(e)}")
            return Response(
                {"message": "서버 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VideoUploadCompleteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, project_id):
        try:
            from django.core.cache import cache
            from django.core.files import File
            
            upload_id = request.data.get('upload_id')
            
            # 업로드 세션 확인
            upload_info = cache.get(f'upload_{upload_id}')
            if not upload_info:
                return Response(
                    {"message": "유효하지 않은 업로드 세션입니다."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 모든 청크가 업로드되었는지 확인
            if len(upload_info['uploaded_chunks']) != upload_info['total_chunks']:
                return Response(
                    {"message": "모든 청크가 업로드되지 않았습니다."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 청크 병합
            temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp_uploads', upload_id)
            final_path = os.path.join(temp_dir, upload_info['filename'])
            
            with open(final_path, 'wb') as final_file:
                for i in range(upload_info['total_chunks']):
                    chunk_path = os.path.join(temp_dir, f'chunk_{i}')
                    with open(chunk_path, 'rb') as chunk_file:
                        final_file.write(chunk_file.read())
                    os.remove(chunk_path)  # 청크 파일 삭제
            
            # 피드백 생성
            project = get_object_or_404(project_model.Project, id=project_id)
            
            with open(final_path, 'rb') as f:
                feedback = models.FeedBack.objects.create(
                    project=project,
                    user=request.user,
                    title=f"업로드: {upload_info['filename']}",
                    files=File(f, name=upload_info['filename']),
                    file_size=upload_info['total_size'],
                    encoding_status='pending'
                )
            
            # 임시 파일 삭제
            os.remove(final_path)
            os.rmdir(temp_dir)
            
            # 캐시 삭제
            cache.delete(f'upload_{upload_id}')
            
            return Response({
                'feedback_id': feedback.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error in VideoUploadCompleteView: {str(e)}")
            return Response(
                {"message": "서버 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FeedbackEncodingStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id, feedback_id):
        try:
            feedback = get_object_or_404(
                models.FeedBack.objects.select_related('project'),
                id=feedback_id,
                project_id=project_id
            )
            
            # 접근 권한 확인
            project = feedback.project
            if not (project.user == request.user or 
                   project.members.filter(user=request.user).exists()):
                return Response(
                    {"message": "피드백에 접근 권한이 없습니다."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return Response({
                'status': feedback.encoding_status,
                'progress': self._calculate_encoding_progress(feedback)
            })
            
        except Exception as e:
            logger.error(f"Error in FeedbackEncodingStatusView: {str(e)}")
            return Response(
                {"message": "서버 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _calculate_encoding_progress(self, feedback):
        if feedback.encoding_status == 'completed':
            return 100
        elif feedback.encoding_status == 'processing':
            # 인코딩 진행률 계산 로직
            progress = 0
            if feedback.video_file_low: progress += 25
            if feedback.video_file_medium: progress += 25
            if feedback.video_file_high: progress += 25
            if feedback.video_file_web: progress += 25
            return progress
        else:
            return 0


class FeedbackStreamView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id, feedback_id):
        try:
            feedback = get_object_or_404(
                models.FeedBack.objects.select_related('project'),
                id=feedback_id,
                project_id=project_id
            )
            
            # 접근 권한 확인
            project = feedback.project
            if not (project.user == request.user or 
                   project.members.filter(user=request.user).exists()):
                return Response(
                    {"message": "피드백에 접근 권한이 없습니다."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if not feedback.hls_playlist_url:
                return Response(
                    {"message": "스트리밍이 준비되지 않았습니다."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({
                'hls_url': request.build_absolute_uri(feedback.hls_playlist_url)
            })
            
        except Exception as e:
            logger.error(f"Error in FeedbackStreamView: {str(e)}")
            return Response(
                {"message": "서버 오류가 발생했습니다."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# 하위 호환성을 위한 기존 뷰들
@method_decorator(csrf_exempt, name='dispatch')
class FeedbackDetail(View):
    @user_validator
    def get(self, request, id):
        try:
            feedback = models.FeedBack.objects.get(id=id)
            
            # Django REST framework View 호출
            api_view = FeedbackDetailView.as_view()
            response = api_view(request._request, feedback_id=id)
            
            # Response를 JsonResponse로 변환
            return JsonResponse(response.data, safe=False)
            
        except models.FeedBack.DoesNotExist:
            return JsonResponse({"message": "피드백을 찾을 수 없습니다."}, status=404)
        except Exception as e:
            logger.error(f"Error in FeedbackDetail: {str(e)}")
            return JsonResponse({"message": "서버 오류가 발생했습니다."}, status=500)


# 하위 호환성을 위한 추가 클래스들
@method_decorator(csrf_exempt, name='dispatch')
class FeedbackFileDelete(View):
    @user_validator
    def delete(self, request, id):
        try:
            feedback = models.FeedBack.objects.get(id=id)
            
            # 권한 확인
            if feedback.user != request.user:
                return JsonResponse({"message": "삭제 권한이 없습니다."}, status=403)
            
            if feedback.files:
                feedback.files.delete()
                feedback.files = None
                feedback.save()
            
            return JsonResponse({"message": "파일이 삭제되었습니다."}, status=200)
            
        except models.FeedBack.DoesNotExist:
            return JsonResponse({"message": "피드백을 찾을 수 없습니다."}, status=404)
        except Exception as e:
            logger.error(f"Error in FeedbackFileDelete: {str(e)}")
            return JsonResponse({"message": "서버 오류가 발생했습니다."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class VideoEncodingStatus(View):
    @user_validator
    def get(self, request, id):
        try:
            feedback = models.FeedBack.objects.get(id=id)
            
            return JsonResponse({
                "encoding_status": feedback.encoding_status,
                "progress": self._calculate_progress(feedback)
            })
            
        except models.FeedBack.DoesNotExist:
            return JsonResponse({"message": "피드백을 찾을 수 없습니다."}, status=404)
        except Exception as e:
            logger.error(f"Error in VideoEncodingStatus: {str(e)}")
            return JsonResponse({"message": "서버 오류가 발생했습니다."}, status=500)
    
    def _calculate_progress(self, feedback):
        if feedback.encoding_status == 'completed':
            return 100
        elif feedback.encoding_status == 'processing':
            progress = 0
            if feedback.video_file_low: progress += 25
            if feedback.video_file_medium: progress += 25
            if feedback.video_file_high: progress += 25
            if feedback.video_file_web: progress += 25
            return progress
        else:
            return 0


@method_decorator(csrf_exempt, name='dispatch')
class FeedbackMessageUpdate(View):
    @user_validator
    def put(self, request, message_id):
        try:
            data = json.loads(request.body)
            message = models.FeedBackMessage.objects.get(id=message_id)
            
            # 권한 확인
            if message.user != request.user:
                return JsonResponse({"message": "수정 권한이 없습니다."}, status=403)
            
            message.text = data.get('text', message.text)
            message.save()
            
            return JsonResponse({
                "message": "메시지가 수정되었습니다.",
                "id": message.id,
                "text": message.text
            })
            
        except models.FeedBackMessage.DoesNotExist:
            return JsonResponse({"message": "메시지를 찾을 수 없습니다."}, status=404)
        except Exception as e:
            logger.error(f"Error in FeedbackMessageUpdate: {str(e)}")
            return JsonResponse({"message": "서버 오류가 발생했습니다."}, status=500)
    
    @user_validator
    def delete(self, request, message_id):
        try:
            message = models.FeedBackMessage.objects.get(id=message_id)
            
            # 권한 확인
            if message.user != request.user:
                return JsonResponse({"message": "삭제 권한이 없습니다."}, status=403)
            
            message.delete()
            
            return JsonResponse({"message": "메시지가 삭제되었습니다."}, status=200)
            
        except models.FeedBackMessage.DoesNotExist:
            return JsonResponse({"message": "메시지를 찾을 수 없습니다."}, status=404)
        except Exception as e:
            logger.error(f"Error in FeedbackMessageUpdate: {str(e)}")
            return JsonResponse({"message": "서버 오류가 발생했습니다."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class FeedbackMessageStatusUpdate(View):
    @user_validator
    def put(self, request, message_id):
        try:
            data = json.loads(request.body)
            message = models.FeedBackMessage.objects.get(id=message_id)
            
            # 권한 확인 (프로젝트 소유자만)
            if message.feedback.project and message.feedback.project.user != request.user:
                return JsonResponse({"message": "상태 변경 권한이 없습니다."}, status=403)
            
            new_status = data.get('status')
            if new_status in ['pending', 'completed']:
                message.status = new_status
                message.save()
                
                return JsonResponse({
                    "message": "상태가 변경되었습니다.",
                    "id": message.id,
                    "status": message.status
                })
            else:
                return JsonResponse({"message": "유효하지 않은 상태값입니다."}, status=400)
            
        except models.FeedBackMessage.DoesNotExist:
            return JsonResponse({"message": "메시지를 찾을 수 없습니다."}, status=404)
        except Exception as e:
            logger.error(f"Error in FeedbackMessageStatusUpdate: {str(e)}")
            return JsonResponse({"message": "서버 오류가 발생했습니다."}, status=500)


# 프로젝트별 피드백 하위 호환성 클래스
@method_decorator(csrf_exempt, name='dispatch')
class ProjectFeedbackList(View):
    @user_validator
    def get(self, request, project_id):
        try:
            # REST API 뷰 호출
            api_view = ProjectFeedbackListView.as_view()
            response = api_view(request._request, project_id=project_id)
            
            # Response를 JsonResponse로 변환
            return JsonResponse(response.data, safe=False)
            
        except Exception as e:
            logger.error(f"Error in ProjectFeedbackList: {str(e)}")
            return JsonResponse({"message": "서버 오류가 발생했습니다."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ProjectFeedbackCreate(View):
    @user_validator
    def post(self, request, project_id):
        try:
            # REST API 뷰 호출
            api_view = ProjectFeedbackListView.as_view()
            response = api_view(request._request, project_id=project_id)
            
            # Response를 JsonResponse로 변환
            return JsonResponse(response.data, safe=False, status=response.status_code)
            
        except Exception as e:
            logger.error(f"Error in ProjectFeedbackCreate: {str(e)}")
            return JsonResponse({"message": "서버 오류가 발생했습니다."}, status=500)