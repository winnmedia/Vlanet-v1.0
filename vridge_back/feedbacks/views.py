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
            feedback = project.feedback
            if not project:
                return JsonResponse({"message": "잘못된 접근입니다."}, status=400)

            members = project.members.all().filter(user__username=email)
            if project.user.username != email and not members.exists():
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            # print(feedback.files.name) path , url
            if feedback.files:
                if settings.DEBUG:
                    file_url = "http://127.0.0.1:8000" + feedback.files.url
                else:
                    file_url = feedback.files.url
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
                ),
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

            from moviepy.editor import VideoFileClip
            import boto3, uuid
            from django.core.files import File

            try:
                if ".mov" in files.name.lower():
                    logging.info("Processing .mov file")
                    uid = uuid.uuid4().hex + ".mov"
                    temp_path = os.path.join(settings.MEDIA_ROOT, uid)
                    
                    with open(temp_path, "wb") as f:
                        for chunk in files.chunks():
                            f.write(chunk)
                    
                    logging.info(f"Saved temp file: {temp_path}")
                    
                    video = VideoFileClip(temp_path)
                    output_path = temp_path.replace(".mov", ".mp4")
                    video.write_videofile(output_path, codec="libx264", audio_codec="aac")
                    
                    logging.info(f"Converted to mp4: {output_path}")
                    
                    with open(output_path, "rb") as f:
                        output_file = File(f)
                        feedback.files.save(os.path.basename(output_path), output_file)
                    
                    # Cleanup temp files
                    if os.path.isfile(output_path):
                        os.remove(output_path)
                    if os.path.isfile(temp_path):
                        os.remove(temp_path)
                    
                    logging.info("MOV file processed and saved successfully")
                else:
                    logging.info(f"Saving file directly: {files.name}")
                    feedback.files = files
                    feedback.save()
                    logging.info("File saved successfully")
                
                return JsonResponse({"message": "파일이 성공적으로 업로드되었습니다.", "result": "success"}, status=200)
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
            feedback = project.feedback

            if not project:
                return JsonResponse({"message": "잘못된 접근입니다."}, status=400)

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
