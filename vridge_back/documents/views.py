from django.http import JsonResponse, FileResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
from users.utils import user_validator
from projects.models import Project
from .models import Document
import json
import logging
import os

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class DocumentListView(View):
    """문서 목록 조회 및 업로드"""
    
    @user_validator
    def get(self, request, project_id):
        """프로젝트 문서 목록 조회"""
        try:
            user = request.user
            
            # 프로젝트 권한 확인
            try:
                project = Project.objects.get(id=project_id)
            except Project.DoesNotExist:
                return JsonResponse({'message': '프로젝트를 찾을 수 없습니다.'}, status=404)
            
            # 권한 확인
            is_member = project.members.filter(user=user).exists()
            if project.user != user and not is_member:
                return JsonResponse({'message': '권한이 없습니다.'}, status=403)
            
            # 문서 목록 조회
            documents = Document.objects.filter(
                project=project,
                is_active=True
            ).select_related('uploader')
            
            document_list = []
            for doc in documents:
                document_list.append({
                    'id': doc.id,
                    'filename': doc.filename,
                    'category': doc.category,
                    'description': doc.description,
                    'size': doc.size,
                    'mime_type': doc.mime_type,
                    'uploaded_at': doc.uploaded_at.isoformat(),
                    'uploader': {
                        'id': doc.uploader.id if doc.uploader else None,
                        'username': doc.uploader.username if doc.uploader else 'Unknown'
                    },
                    'download_count': doc.download_count,
                    'url': doc.file.url if doc.file else None
                })
            
            return JsonResponse({
                'success': True,
                'documents': document_list
            })
            
        except Exception as e:
            logger.error(f"Document list error: {str(e)}", exc_info=True)
            return JsonResponse({'message': '문서 목록 조회 중 오류가 발생했습니다.'}, status=500)
    
    @user_validator
    @transaction.atomic
    def post(self, request, project_id):
        """문서 업로드"""
        try:
            user = request.user
            
            # 프로젝트 권한 확인
            try:
                project = Project.objects.get(id=project_id)
            except Project.DoesNotExist:
                return JsonResponse({'message': '프로젝트를 찾을 수 없습니다.'}, status=404)
            
            # 권한 확인
            is_member = project.members.filter(user=user).exists()
            if project.user != user and not is_member:
                return JsonResponse({'message': '권한이 없습니다.'}, status=403)
            
            # 파일 확인
            if 'file' not in request.FILES:
                return JsonResponse({'message': '파일이 없습니다.'}, status=400)
            
            uploaded_file = request.FILES['file']
            category = request.POST.get('category', 'other')
            description = request.POST.get('description', '')
            
            # 파일 크기 제한 (50MB)
            if uploaded_file.size > 50 * 1024 * 1024:
                return JsonResponse({'message': '파일 크기는 50MB를 초과할 수 없습니다.'}, status=400)
            
            # 허용된 파일 확장자
            allowed_extensions = [
                '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
                '.txt', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar'
            ]
            
            file_extension = os.path.splitext(uploaded_file.name)[1].lower()
            if file_extension not in allowed_extensions:
                return JsonResponse({'message': '허용되지 않은 파일 형식입니다.'}, status=400)
            
            # 문서 생성
            document = Document.objects.create(
                project=project,
                uploader=user,
                filename=uploaded_file.name,
                file=uploaded_file,
                category=category,
                description=description,
                size=uploaded_file.size
            )
            
            logger.info(f"Document uploaded: {document.filename} by {user.username}")
            
            return JsonResponse({
                'success': True,
                'message': '문서가 업로드되었습니다.',
                'document': {
                    'id': document.id,
                    'filename': document.filename,
                    'category': document.category,
                    'size': document.size
                }
            })
            
        except Exception as e:
            logger.error(f"Document upload error: {str(e)}", exc_info=True)
            return JsonResponse({'message': '문서 업로드 중 오류가 발생했습니다.'}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class DocumentDetailView(View):
    """문서 상세 조회, 수정, 삭제"""
    
    @user_validator
    def get(self, request, project_id, document_id):
        """문서 다운로드"""
        try:
            user = request.user
            
            # 문서 조회
            try:
                document = Document.objects.select_related('project').get(
                    id=document_id,
                    project_id=project_id,
                    is_active=True
                )
            except Document.DoesNotExist:
                return JsonResponse({'message': '문서를 찾을 수 없습니다.'}, status=404)
            
            # 권한 확인
            project = document.project
            is_member = project.members.filter(user=user).exists()
            if project.user != user and not is_member:
                return JsonResponse({'message': '권한이 없습니다.'}, status=403)
            
            # 다운로드 횟수 증가
            document.increment_download_count()
            
            # 파일 응답
            if document.file:
                response = FileResponse(
                    document.file,
                    as_attachment=True,
                    filename=document.filename
                )
                return response
            else:
                return JsonResponse({'message': '파일을 찾을 수 없습니다.'}, status=404)
                
        except Exception as e:
            logger.error(f"Document download error: {str(e)}", exc_info=True)
            return JsonResponse({'message': '문서 다운로드 중 오류가 발생했습니다.'}, status=500)
    
    @user_validator
    def delete(self, request, project_id, document_id):
        """문서 삭제"""
        try:
            user = request.user
            
            # 문서 조회
            try:
                document = Document.objects.select_related('project').get(
                    id=document_id,
                    project_id=project_id,
                    is_active=True
                )
            except Document.DoesNotExist:
                return JsonResponse({'message': '문서를 찾을 수 없습니다.'}, status=404)
            
            # 권한 확인 (프로젝트 소유자 또는 문서 업로더만 삭제 가능)
            project = document.project
            if project.user != user and document.uploader != user:
                return JsonResponse({'message': '권한이 없습니다.'}, status=403)
            
            # 소프트 삭제
            document.is_active = False
            document.save()
            
            logger.info(f"Document deleted: {document.filename} by {user.username}")
            
            return JsonResponse({
                'success': True,
                'message': '문서가 삭제되었습니다.'
            })
            
        except Exception as e:
            logger.error(f"Document delete error: {str(e)}", exc_info=True)
            return JsonResponse({'message': '문서 삭제 중 오류가 발생했습니다.'}, status=500)