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
            project = project_model.Project.objects.get_or_none(id=id)
            if not project:
                return JsonResponse({"message": "잘못된 접근입니다."}, status=400)
            
            feedback = project.feedback
            if not feedback:
                return JsonResponse({"message": "피드백이 생성되지 않았습니다."}, status=400)

            members = project.members.all().filter(user__username=email)
            if project.user.username != email and not members.exists():
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            # print(feedback.files.name) path , url
            if feedback and feedback.files:
                # URL 그대로 사용 (인코딩 제거)
                file_path = feedback.files.url
                
                if settings.DEBUG:
                    file_url = f"http://127.0.0.1:8000{file_path}"
                else:
                    # 프로덕션 환경에서 요청의 호스트 사용
                    file_url = request.build_absolute_uri(file_path)
            else:
                file_url = None

            result = {
                "id": project.id,
                "name": project.name,
                "manager": project.manager,
                "consumer": project.consumer,
                "description": project.description,
                "owner_nickname": project.user.nickname,
                "owner_email": project.user.username,
                "created": project.created,
                "updated": project.updated,
                "member_list": list(
                    project.members.all()
                    .annotate(email=F("user__username"), nickname=F("user__nickname"))
                    .values("id", "rating", "email", "nickname")
                ),
                "files": file_url,
                "feedback": list(
                    feedback.comments.all()
                    .annotate(email=F("user__username"), nickname=F("user__nickname"))
                    .values(
                        "id",
                        "security",
                        "title",
                        "section",
                        "text",
                        "email",
                        "nickname",
                        "created",
                    )
                ) if feedback else [],
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
                feedback.files = files
                feedback.save()
                logging.info(f"File saved successfully at: {feedback.files.path}")
                
                # 비디오 파일인 경우 인코딩 작업 시작 (임시 비활성화)
                if feedback.is_video:
                    try:
                        # Celery가 설치될 때까지 인코딩 비활성화
                        logging.info(f"Video encoding disabled temporarily for feedback {feedback.id}")
                        feedback.encoding_status = 'none'
                        feedback.save()
                    except Exception as meta_error:
                        logging.error(f"Error processing video: {str(meta_error)}")
                
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
                if feedback.is_video:
                    response_data.update({
                        "encoding_status": feedback.encoding_status,
                        "video_metadata": {
                            "duration": feedback.duration,
                            "width": feedback.width,
                            "height": feedback.height,
                            "file_size": feedback.file_size
                        }
                    })
                
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
            
            feedback = project.feedback
            if not feedback:
                return JsonResponse({"message": "피드백이 생성되지 않았습니다."}, status=400)

            members = project.members.all().filter(user__username=email)
            if project.user.username != email and not members.exists():
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            response_data = {
                "encoding_status": feedback.encoding_status or "none",
                "has_original": bool(feedback.files),
                "has_web_version": bool(feedback.video_file_web),
                "has_thumbnail": bool(feedback.thumbnail),
                "has_hls": bool(feedback.hls_playlist_url),
            }

            # Add URLs for encoded versions if available
            if feedback.video_file_web:
                response_data["web_video_url"] = feedback.video_file_web.url
            
            if feedback.thumbnail:
                response_data["thumbnail_url"] = feedback.thumbnail.url
            
            if feedback.hls_playlist_url:
                response_data["hls_url"] = feedback.hls_playlist_url

            # Add quality versions if available
            quality_versions = []
            for quality in ['high', 'medium', 'low']:
                field_name = f'video_file_{quality}'
                if getattr(feedback, field_name):
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
