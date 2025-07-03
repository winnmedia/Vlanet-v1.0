import json, logging, os
from django.conf import settings
from django.shortcuts import render
from django.http import JsonResponse
from django.views import View
from users.utils import user_validator
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from . import models
from projects import models as project_model

from django.db.models import F


@method_decorator(csrf_exempt, name='dispatch')
class FeedbackDetail(View):
    @user_validator
    def get(self, request, id):
        try:
            user = request.user
            email = user.username
            
            # Raw SQL로 필요한 필드만 가져오기
            from django.db import connection
            with connection.cursor() as cursor:
                # 프로젝트 정보 가져오기
                cursor.execute("""
                    SELECT p.id, p.name, p.manager, p.consumer, p.description,
                           p.user_id, p.created, p.updated, p.feedback_id,
                           u.username, u.nickname
                    FROM projects_project p
                    JOIN users_user u ON p.user_id = u.id
                    WHERE p.id = %s
                """, [id])
                
                row = cursor.fetchone()
                if not row:
                    return JsonResponse({"message": "잘못된 접근입니다."}, status=400)
                
                project_data = {
                    'id': row[0],
                    'name': row[1],
                    'manager': row[2],
                    'consumer': row[3],
                    'description': row[4],
                    'user_id': row[5],
                    'created': row[6],
                    'updated': row[7],
                    'feedback_id': row[8],
                    'owner_email': row[9],
                    'owner_nickname': row[10]
                }
                
                # 권한 확인
                cursor.execute("""
                    SELECT COUNT(*) FROM projects_members
                    WHERE project_id = %s AND user_id = %s
                """, [id, user.id])
                
                is_member = cursor.fetchone()[0] > 0
                if project_data['user_id'] != user.id and not is_member:
                    return JsonResponse({"message": "권한이 없습니다."}, status=500)
                
                # 피드백 정보 가져오기 (기본 필드만)
                feedback_file_url = None
                feedback_id = project_data['feedback_id']
                
                # 피드백이 없으면 생성
                if not feedback_id:
                    logging.info(f"Creating feedback for project {id}")
                    cursor.execute("""
                        INSERT INTO feedbacks_feedback (created, updated, files)
                        VALUES (NOW(), NOW(), NULL)
                        RETURNING id
                    """)
                    feedback_id = cursor.fetchone()[0]
                    
                    # 프로젝트에 피드백 연결
                    cursor.execute("""
                        UPDATE projects_project
                        SET feedback_id = %s
                        WHERE id = %s
                    """, [feedback_id, id])
                    logging.info(f"Created feedback {feedback_id} for project {id}")
                
                # 피드백 파일 정보 가져오기
                if feedback_id:
                    cursor.execute("""
                        SELECT id, files FROM feedbacks_feedback
                        WHERE id = %s
                    """, [feedback_id])
                    
                    feedback_row = cursor.fetchone()
                    if feedback_row and feedback_row[1]:
                        # files 필드가 이미 전체 경로를 포함하고 있을 수 있음
                        file_name = feedback_row[1]
                        if file_name.startswith('feedback_file/'):
                            file_path = f"/media/{file_name}"
                        else:
                            file_path = f"/media/feedback_file/{file_name}"
                        
                        if settings.DEBUG:
                            feedback_file_url = f"http://127.0.0.1:8000{file_path}"
                        else:
                            feedback_file_url = request.build_absolute_uri(file_path)
                
                # 멤버 리스트 가져오기
                cursor.execute("""
                    SELECT m.id, m.rating, u.username, u.nickname
                    FROM projects_members m
                    JOIN users_user u ON m.user_id = u.id
                    WHERE m.project_id = %s
                """, [id])
                
                member_list = []
                for member_row in cursor.fetchall():
                    member_list.append({
                        'id': member_row[0],
                        'rating': member_row[1],
                        'email': member_row[2],
                        'nickname': member_row[3]
                    })
                
                # 피드백 코멘트 가져오기
                feedback_comments = []
                if project_data['feedback_id']:
                    cursor.execute("""
                        SELECT c.id, c.security, c.title, c.section, c.text,
                               u.username, u.nickname, c.created
                        FROM feedbacks_feedbackcomment c
                        JOIN users_user u ON c.user_id = u.id
                        WHERE c.feedback_id = %s
                        ORDER BY c.created DESC
                    """, [project_data['feedback_id']])
                    
                    for comment_row in cursor.fetchall():
                        feedback_comments.append({
                            'id': comment_row[0],
                            'security': comment_row[1],
                            'title': comment_row[2],
                            'section': comment_row[3],
                            'text': comment_row[4],
                            'email': comment_row[5],
                            'nickname': comment_row[6],
                            'created': comment_row[7]
                        })
            
            result = {
                "id": project_data['id'],
                "name": project_data['name'],
                "manager": project_data['manager'],
                "consumer": project_data['consumer'],
                "description": project_data['description'],
                "owner_nickname": project_data['owner_nickname'],
                "owner_email": project_data['owner_email'],
                "created": project_data['created'],
                "updated": project_data['updated'],
                "member_list": member_list,
                "files": feedback_file_url,
                "feedback": feedback_comments
            }
            
            return JsonResponse({"result": result}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)

    @user_validator
    def put(self, request, id):
        try:
            user = request.user
            email = user.username
            data = json.loads(request.body)

            secret = data.get("secret")
            if secret == "false":
                secret = False
            else:
                secret = True

            title = data.get("title")
            section = data.get("section")
            contents = data.get("contents")

            project = project_model.Project.objects.get_or_none(id=id)
            if not project:
                return JsonResponse({"message": "존재하지 않는 프로젝트입니다."}, status=500)

            feedback = project.feedback
            if not feedback:
                return JsonResponse({"message": "피드백이 생성되지 않았습니다."}, status=400)

            members = project.members.all().filter(user__username=email)
            if project.user.username != email and not members.exists():
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            models.FeedBackComment.objects.create(
                feedback=feedback,
                user=user,
                security=secret,
                title=title,
                section=section,
                text=contents,
            )
            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)

    @user_validator
    def delete(self, request, id):
        try:
            user = request.user

            feedback_comment = models.FeedBackComment.objects.get_or_none(id=id)

            if not feedback_comment:
                return JsonResponse({"message": "잘못된 요청입니다."}, status=500)

            if feedback_comment.user != user:
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            feedback_comment.delete()

            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)

    @user_validator
    def post(self, request, id):
        try:
            logging.info(f"File upload request for project {id}")
            logging.info(f"Request FILES: {request.FILES}")
            logging.info(f"Request method: {request.method}")
            logging.info(f"Content type: {request.content_type}")
            
            user = request.user
            email = user.username

            project = project_model.Project.objects.get_or_none(id=id)
            if not project:
                logging.error(f"Project {id} not found")
                return JsonResponse({"message": "잘못된 접근입니다."}, status=400)
            
            feedback = project.feedback
            if not feedback:
                return JsonResponse({"message": "피드백이 생성되지 않았습니다."}, status=400)

            members = project.members.all().filter(user__username=email)
            if project.user.username != email and not members.exists():
                logging.error(f"User {email} has no permission for project {id}")
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            if not request.FILES:
                logging.error("No files in request")
                return JsonResponse({"message": "파일이 없습니다."}, status=400)
                
            files = request.FILES.getlist("files")
            if not files:
                logging.error("No files found with key 'files'")
                return JsonResponse({"message": "파일이 없습니다."}, status=400)
                
            files = files[0]
            logging.info(f"File name: {files.name}, size: {files.size}")

            import uuid
            from django.core.files import File

            try:
                # 파일 유효성 검사
                if files.size == 0:
                    return JsonResponse({"message": "비어있는 파일입니다."}, status=400)
                
                # 파일 크기 검사
                max_size = 600 * 1024 * 1024  # 600MB
                if files.size > max_size:
                    size_mb = files.size / (1024 * 1024)
                    return JsonResponse({"message": f"파일 크기가 너무 큽니다. (현재: {size_mb:.1f}MB, 최대: 600MB)"}, status=413)
                
                # 파일 형식 검사
                allowed_extensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
                import os
                original_name = files.name
                name, ext = os.path.splitext(original_name.lower())
                
                if ext not in allowed_extensions:
                    return JsonResponse({"message": f"지원하지 않는 파일 형식입니다. ({', '.join(allowed_extensions)} 형식만 가능)"}, status=400)
                
                logging.info(f"Processing upload: {original_name}, size: {files.size / (1024*1024):.1f}MB")
                
                # 파일명 안전하게 변환
                from django.utils.text import slugify
                import uuid
                
                # 한글 파일명을 영문으로 변환하거나 UUID 사용
                safe_name = slugify(name, allow_unicode=False)
                if not safe_name or safe_name == 'mp4' or safe_name == 'video':
                    safe_name = f"video_{uuid.uuid4().hex[:8]}"
                
                files.name = f"{safe_name}{ext}"
                
                # 파일 저장
                logging.info(f"Saving file with safe name: {files.name} (original: {original_name}, size: {files.size} bytes)")
                logging.info(f"Feedback object before save: id={feedback.id}, files={getattr(feedback, 'files', None)}")
                feedback.files = files
                feedback.save()
                logging.info(f"Feedback object after save: id={feedback.id}, files={feedback.files}")
                logging.info(f"File field value: {feedback.files.name}")
                logging.info(f"File saved successfully at: {feedback.files.path}")
                
                # 비디오 파일인 경우 인코딩 작업 시작 (임시 비활성화)
                try:
                    if hasattr(feedback, 'is_video') and feedback.is_video:
                        try:
                            # Celery가 설치될 때까지 인코딩 비활성화
                            logging.info(f"Video encoding disabled temporarily for feedback {feedback.id}")
                            if hasattr(feedback, 'encoding_status'):
                                feedback.encoding_status = 'none'
                                feedback.save()
                        except Exception as meta_error:
                            logging.error(f"Error processing video: {str(meta_error)}")
                except AttributeError:
                    pass
                
                # Get the file URL
                file_url = None
                if feedback.files:
                    # URL 그대로 사용 (인코딩 제거)
                    file_path = feedback.files.url
                    
                    if settings.DEBUG:
                        file_url = f"http://127.0.0.1:8000{file_path}"
                    else:
                        # 프로덕션 환경에서 요청의 호스트 사용
                        file_url = request.build_absolute_uri(file_path)
                    logging.info(f"File URL: {file_url}")
                
                response_data = {
                    "message": "파일이 성공적으로 업로드되었습니다.",
                    "result": "success",
                    "file_url": file_url,
                    "file_name": feedback.files.name if feedback.files else None
                }
                
                # 비디오인 경우 인코딩 상태 추가
                try:
                    if hasattr(feedback, 'is_video') and feedback.is_video:
                        video_data = {"encoding_status": getattr(feedback, 'encoding_status', 'none')}
                        video_metadata = {}
                        if hasattr(feedback, 'duration'):
                            video_metadata["duration"] = feedback.duration
                        if hasattr(feedback, 'width'):
                            video_metadata["width"] = feedback.width
                        if hasattr(feedback, 'height'):
                            video_metadata["height"] = feedback.height
                        if hasattr(feedback, 'file_size'):
                            video_metadata["file_size"] = feedback.file_size
                        if video_metadata:
                            video_data["video_metadata"] = video_metadata
                        response_data.update(video_data)
                except AttributeError:
                    pass
                
                return JsonResponse(response_data, status=200)
            except Exception as upload_error:
                logging.error(f"Error during file processing: {str(upload_error)}")
                return JsonResponse({"message": f"파일 처리 중 오류: {str(upload_error)}"}, status=500)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class FeedbackFileDelete(View):
    @user_validator
    def delete(self, request, id):
        try:
            user = request.user
            email = user.username

            project = project_model.Project.objects.get_or_none(id=id)
            if not project:
                return JsonResponse({"message": "잘못된 접근입니다."}, status=400)
            
            # 피드백 안전하게 가져오기
            try:
                # 필요한 필드만 선택
                feedback = feedback_model.FeedBack.objects.filter(
                    projects=project
                ).only('id', 'files', 'created', 'updated').first()
            except Exception:
                # 실패 시 관계를 통해 가져오기
                feedback = project.feedback
            
            if not feedback:
                return JsonResponse({"message": "피드백이 생성되지 않았습니다."}, status=400)

            members = project.members.all().filter(user__username=email)
            if project.user.username != email and not members.exists():
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            feedback.files = None
            feedback.save()
            return JsonResponse({"result": "result"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class VideoEncodingStatus(View):
    """Check video encoding status"""
    @user_validator
    def get(self, request, id):
        try:
            user = request.user
            email = user.username

            project = project_model.Project.objects.get_or_none(id=id)
            if not project:
                return JsonResponse({"message": "잘못된 접근입니다."}, status=400)
            
            # 피드백 안전하게 가져오기
            try:
                # 필요한 필드만 선택
                feedback = feedback_model.FeedBack.objects.filter(
                    projects=project
                ).only('id', 'files', 'created', 'updated').first()
            except Exception:
                # 실패 시 관계를 통해 가져오기
                feedback = project.feedback
            
            if not feedback:
                return JsonResponse({"message": "피드백이 생성되지 않았습니다."}, status=400)

            members = project.members.all().filter(user__username=email)
            if project.user.username != email and not members.exists():
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            response_data = {
                "encoding_status": getattr(feedback, 'encoding_status', 'none'),
                "has_original": bool(feedback.files),
                "has_web_version": bool(getattr(feedback, 'video_file_web', None)),
                "has_thumbnail": bool(getattr(feedback, 'thumbnail', None)),
                "has_hls": bool(getattr(feedback, 'hls_playlist_url', None)),
            }

            # Add URLs for encoded versions if available
            if hasattr(feedback, 'video_file_web') and feedback.video_file_web:
                response_data["web_video_url"] = feedback.video_file_web.url
            
            if hasattr(feedback, 'thumbnail') and feedback.thumbnail:
                response_data["thumbnail_url"] = feedback.thumbnail.url
            
            if hasattr(feedback, 'hls_playlist_url') and feedback.hls_playlist_url:
                response_data["hls_url"] = feedback.hls_playlist_url

            # Add quality versions if available
            quality_versions = []
            for quality in ['high', 'medium', 'low']:
                field_name = f'video_file_{quality}'
                if hasattr(feedback, field_name) and getattr(feedback, field_name):
                    quality_versions.append({
                        "quality": quality,
                        "path": getattr(feedback, field_name)
                    })
            
            if quality_versions:
                response_data["quality_versions"] = quality_versions

            return JsonResponse(response_data, status=200)
            
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)
