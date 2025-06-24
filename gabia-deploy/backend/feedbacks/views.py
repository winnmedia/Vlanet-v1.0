import json, logging, my_settings, os
from django.shortcuts import render
from django.http import JsonResponse
from django.views import View
from users.utils import user_validator

from . import models
from projects import models as project_model

from django.db.models import F


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
                if my_settings.DEBUG:
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
            user = request.user
            email = user.username

            project = project_model.Project.objects.get_or_none(id=id)
            feedback = project.feedback

            if not project:
                return JsonResponse({"message": "잘못된 접근입니다."}, status=400)

            members = project.members.all().filter(user__username=email)
            if project.user.username != email and not members.exists():
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            files = request.FILES.getlist("files")
            files = files[0]
            # logging.info(files)
            # logging.info(dir(files))

            from moviepy.editor import VideoFileClip
            import boto3, uuid
            from django.core.files import File

            if ".mov" in files.name:
                uid = uuid.uuid4().hex + ".mov"
                f = open(uid, "wb")
                f.write(files.read())
                # logging.info(files.chunks())
                f.close()

                video = VideoFileClip(uid)
                output_path = uid.replace(".mov", ".mp4")
                video.write_videofile(output_path, codec="libx264", audio_codec="aac")

                with open(output_path, "rb") as f:
                    output_file = File(f)
                    feedback.files.save(output_path, output_file)
                    if os.path.isfile(output_path):
                        os.remove(output_path)
                    if os.path.isfile(uid):
                        os.remove(uid)
            else:
                feedback.files = files
                feedback.save()

            return JsonResponse({"result": "result"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


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
