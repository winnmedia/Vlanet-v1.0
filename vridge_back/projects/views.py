import logging, json, my_settings, random
from datetime import datetime
from django.shortcuts import render
from django.http import JsonResponse
from django.views import View
from users.utils import (
    user_validator,
    invite_send_email,
    project_token_generator,
    check_project_token,
)
from . import models
from feedbacks import models as feedback_model

from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str

from django.db.models import F
from django.db import transaction


class ProjectList(View):
    @user_validator
    def get(self, request):
        try:
            user = request.user

            project_list = user.projects.all().select_related(
                "basic_plan",
                "story_board",
                "filming",
                "video_edit",
                "post_work",
                "video_preview",
                "confirmation",
                "video_delivery",
            )
            result = []
            for i in project_list:
                if i.video_delivery.end_date:
                    end_date = i.video_delivery.end_date
                elif i.confirmation.end_date:
                    end_date = i.confirmation.end_date
                elif i.video_preview.end_date:
                    end_date = i.video_preview.end_date
                elif i.post_work.end_date:
                    end_date = i.post_work.end_date
                elif i.video_edit.end_date:
                    end_date = i.video_edit.end_date
                elif i.filming.end_date:
                    end_date = i.filming.end_date
                elif i.story_board.end_date:
                    end_date = i.story_board.end_date
                else:
                    end_date = i.basic_plan.end_date

                if i.basic_plan.start_date:
                    first_date = i.basic_plan.start_date
                elif i.story_board.start_date:
                    first_date = i.story_board.start_date
                elif i.filming.start_date:
                    first_date = i.filming.start_date
                elif i.video_edit.start_date:
                    first_date = i.video_edit.start_date
                elif i.post_work.start_date:
                    first_date = i.post_work.start_date
                elif i.video_preview.start_date:
                    first_date = i.video_preview.start_date
                elif i.confirmation.start_date:
                    first_date = i.confirmation.start_date
                else:
                    first_date = i.video_delivery.start_date

                result.append(
                    {
                        "id": i.id,
                        "name": i.name,
                        "manager": i.manager,
                        "consumer": i.consumer,
                        "description": i.description,
                        "color": i.color,
                        "basic_plan": {
                            "start_date": i.basic_plan.start_date,
                            "end_date": i.basic_plan.end_date,
                        },
                        "story_board": {
                            "start_date": i.story_board.start_date,
                            "end_date": i.story_board.end_date,
                        },
                        "filming": {
                            "start_date": i.filming.start_date,
                            "end_date": i.filming.end_date,
                        },
                        "video_edit": {
                            "start_date": i.video_edit.start_date,
                            "end_date": i.video_edit.end_date,
                        },
                        "post_work": {
                            "start_date": i.post_work.start_date,
                            "end_date": i.post_work.end_date,
                        },
                        "video_preview": {
                            "start_date": i.video_preview.start_date,
                            "end_date": i.video_preview.end_date,
                        },
                        "confirmation": {
                            "start_date": i.confirmation.start_date,
                            "end_date": i.confirmation.end_date,
                        },
                        "video_delivery": {
                            "start_date": i.video_delivery.start_date,
                            "end_date": i.video_delivery.end_date,
                        },
                        "first_date": first_date,
                        "end_date": end_date,
                        "created": i.created,
                        "updated": i.updated,
                        "owner_nickname": i.user.nickname,
                        "owner_email": i.user.username,
                        # "pending_list": list(i.invites.all().values("id", "email")),
                        "member_list": list(
                            i.members.all()
                            .annotate(email=F("user__username"), nickname=F("user__nickname"))
                            .values("id", "rating", "email", "nickname")
                        ),
                        # "files": list(i.files.all().values("id", "files")),
                    }
                )

            members = user.members.all().select_related(
                "project", "project__basic_plan", "project__video_delivery"
            )
            for i in members:
                if i.project.video_delivery.end_date:
                    end_date = i.project.video_delivery.end_date
                elif i.project.confirmation.end_date:
                    end_date = i.project.confirmation.end_date
                elif i.project.video_preview.end_date:
                    end_date = i.project.video_preview.end_date
                elif i.project.post_work.end_date:
                    end_date = i.project.post_work.end_date
                elif i.project.video_edit.end_date:
                    end_date = i.project.video_edit.end_date
                elif i.project.filming.end_date:
                    end_date = i.project.filming.end_date
                elif i.project.story_board.end_date:
                    end_date = i.project.story_board.end_date
                else:
                    end_date = i.project.basic_plan.end_date

                if i.project.basic_plan.start_date:
                    first_date = i.project.basic_plan.start_date
                elif i.project.story_board.start_date:
                    first_date = i.project.story_board.start_date
                elif i.project.filming.start_date:
                    first_date = i.project.filming.start_date
                elif i.project.video_edit.start_date:
                    first_date = i.project.video_edit.start_date
                elif i.project.post_work.start_date:
                    first_date = i.project.post_work.start_date
                elif i.project.video_preview.start_date:
                    first_date = i.project.video_preview.start_date
                elif i.project.confirmation.start_date:
                    first_date = i.project.confirmation.start_date
                else:
                    first_date = i.project.video_delivery.start_date
                result.append(
                    {
                        "id": i.project.id,
                        "name": i.project.name,
                        "manager": i.project.manager,
                        "consumer": i.project.consumer,
                        "description": i.project.description,
                        "color": i.project.color,
                        "basic_plan": {
                            "start_date": i.project.basic_plan.start_date,
                            "end_date": i.project.basic_plan.end_date,
                        },
                        "story_board": {
                            "start_date": i.project.story_board.start_date,
                            "end_date": i.project.story_board.end_date,
                        },
                        "filming": {
                            "start_date": i.project.filming.start_date,
                            "end_date": i.project.filming.end_date,
                        },
                        "video_edit": {
                            "start_date": i.project.video_edit.start_date,
                            "end_date": i.project.video_edit.end_date,
                        },
                        "post_work": {
                            "start_date": i.project.post_work.start_date,
                            "end_date": i.project.post_work.end_date,
                        },
                        "video_preview": {
                            "start_date": i.project.video_preview.start_date,
                            "end_date": i.project.video_preview.end_date,
                        },
                        "confirmation": {
                            "start_date": i.project.confirmation.start_date,
                            "end_date": i.project.confirmation.end_date,
                        },
                        "video_delivery": {
                            "start_date": i.project.video_delivery.start_date,
                            "end_date": i.project.video_delivery.end_date,
                        },
                        "first_date": first_date,
                        "end_date": end_date,
                        "created": i.project.created,
                        "updated": i.project.updated,
                        "owner_nickname": i.project.user.nickname,
                        "owner_email": i.project.user.username,
                        # "pending_list": list(i.project.invites.all().values("id", "email")),
                        "member_list": list(
                            i.project.members.all()
                            .annotate(email=F("user__username"), nickname=F("user__nickname"))
                            .values("id", "rating", "email", "nickname")
                        ),
                        # "files": list(i.project.files.all().values("id", "files")),
                    }
                )
            if user.nickname:
                nickname = user.nickname
            else:
                nickname = user.username

            sample_files = [
                {
                    "file_name": i.files.name,
                    "files": "http://127.0.0.1:8000" + i.files.url if my_settings.DEBUG else i.files.url,
                }
                for i in models.SampleFiles.objects.all()
                if i.files
            ]

            user_memos = list(user.memos.all().values("id", "date", "memo"))

            return JsonResponse(
                {
                    "result": result,
                    "user": user.username,
                    "nickname": nickname,
                    "sample_files": sample_files,
                    "user_memos": user_memos,
                },
                status=200,
            )
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


# 이미 초대를 보낸경우, 멤버에 있는 경우, 나 자신도 안됨
class InviteMember(View):
    @user_validator
    def post(self, request, project_id):
        try:
            user = request.user

            data = json.loads(request.body)
            email = data.get("email")

            project = models.Project.objects.get_or_none(id=project_id)

            if project.user.username == email:
                return JsonResponse({"message": "프로젝트 소유자는 초대가 불가능합니다."}, status=500)
            if not project:
                return JsonResponse({"message": "존재하지 않는 프로젝트입니다."}, status=500)

            members = project.members.all().filter(user__username=email)
            if members.exists():
                return JsonResponse({"message": "이미 초대 된 사용자입니다."}, status=500)

            with transaction.atomic():
                invite, is_created = models.ProjectInvite.objects.get_or_create(project=project, email=email)

                if not is_created:
                    return JsonResponse({"message": "이미 초대한 사용자입니다."}, status=500)

                uid = urlsafe_base64_encode(force_bytes(project_id)).encode().decode()
                token = project_token_generator(project)
                invite_send_email(request, email, uid, token, project.name)
                return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)

    @user_validator
    def delete(self, request, project_id):
        try:
            user = request.user
            data = json.loads(request.body)
            pk = data.get("pk")

            project = models.Project.objects.get_or_none(id=project_id)
            if project is None:
                return JsonResponse({"message": "프로젝트를 찾을 수  없습니다."}, status=500)

            is_member = models.Members.objects.get_or_none(project=project, user=user, rating="manager")
            if project.user != user and is_member is None:
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            invite = models.ProjectInvite.objects.get_or_none(pk=pk)
            if invite:
                invite.delete()
            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


# 초대 받았을때 이미 멤버에 있거나 초대유효가 없으면 안됨, 나 자신도 안됨
# 초대요청이 되면 해당 프로젝트에 멤버가 생성
class AcceptInvite(View):
    @user_validator
    def get(self, request, uid, token):
        try:
            user = request.user
            project_id = force_str(urlsafe_base64_decode(uid))

            project = models.Project.objects.get_or_none(id=project_id)
            is_member = project.members.filter(user=user)

            if not project and is_member.exists() and project.user == user:
                return JsonResponse({"message": "존재하지 않는 프로젝트입니다."}, status=500)

            invite_obj = models.ProjectInvite.objects.get_or_none(project=project, email=user.username)
            if invite_obj is None:
                return JsonResponse({"message": "잘못된 요청입니다."}, status=500)

            if not check_project_token(project, token):
                return JsonResponse({"message": "잘못된 요청입니다."}, status=500)

            models.Members.objects.create(project=project, user=user)
            invite_obj.delete()

            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


class CreateProject(View):
    @user_validator
    def post(self, request):
        try:
            user = request.user
            files = request.FILES.getlist("files")
            inputs = json.loads(request.POST.get("inputs"))
            process = json.loads(request.POST.get("process"))

            with transaction.atomic():
                project = models.Project.objects.create(user=user)
                for k, v in inputs.items():
                    setattr(project, k, v)

                for i in process:
                    key = i.get("key")
                    start_date = i.get("startDate")
                    end_date = i.get("endDate")
                    if key == "basic_plan":
                        basic_plan = models.BasicPlan.objects.create(start_date=start_date, end_date=end_date)
                        setattr(project, key, basic_plan)
                    elif key == "story_board":
                        story_board = models.Storyboard.objects.create(
                            start_date=start_date, end_date=end_date
                        )
                        setattr(project, key, story_board)
                    elif key == "filming":
                        filming = models.Filming.objects.create(start_date=start_date, end_date=end_date)
                        setattr(project, key, filming)
                    elif key == "video_edit":
                        video_edit = models.VideoEdit.objects.create(start_date=start_date, end_date=end_date)
                        setattr(project, key, video_edit)
                    elif key == "post_work":
                        post_work = models.PostWork.objects.create(start_date=start_date, end_date=end_date)
                        setattr(project, key, post_work)
                    elif key == "video_preview":
                        video_preview = models.VideoPreview.objects.create(
                            start_date=start_date, end_date=end_date
                        )
                        setattr(project, key, video_preview)
                    elif key == "confirmation":
                        confirmation = models.Confirmation.objects.create(
                            start_date=start_date, end_date=end_date
                        )
                        setattr(project, key, confirmation)
                    elif key == "video_delivery":
                        video_delivery = models.VideoDelivery.objects.create(
                            start_date=start_date, end_date=end_date
                        )
                        setattr(project, key, video_delivery)

                feedback = feedback_model.FeedBack.objects.create()
                project.feedback = feedback
                project.color = "".join(
                    ["#" + "".join([random.choice("0123456789ABCDEF") for j in range(6)])]
                )
                project.save()

                file_obj = []
                for f in files:
                    file_obj.append(models.File(project=project, files=f))

                models.File.objects.bulk_create(file_obj)

            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


class ProjectDetail(View):
    @user_validator
    def get(self, request, project_id):
        try:
            user = request.user
            project = models.Project.objects.get_or_none(id=project_id)
            if project is None:
                return JsonResponse({"message": "프로젝트를 찾을 수  없습니다."}, status=500)

            is_member = models.Members.objects.get_or_none(project=project, user=user)
            if project.user != user and is_member is None:
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            result = {
                "id": project.id,
                "name": project.name,
                "manager": project.manager,
                "consumer": project.consumer,
                "description": project.description,
                "color": project.color,
                "basic_plan": {
                    "key": "basic_plan",
                    "start_date": project.basic_plan.start_date,
                    "end_date": project.basic_plan.end_date,
                },
                "story_board": {
                    "key": "story_board",
                    "start_date": project.story_board.start_date,
                    "end_date": project.story_board.end_date,
                },
                "filming": {
                    "key": "filming",
                    "start_date": project.filming.start_date,
                    "end_date": project.filming.end_date,
                },
                "video_edit": {
                    "key": "video_edit",
                    "start_date": project.video_edit.start_date,
                    "end_date": project.video_edit.end_date,
                },
                "post_work": {
                    "key": "post_work",
                    "start_date": project.post_work.start_date,
                    "end_date": project.post_work.end_date,
                },
                "video_preview": {
                    "key": "video_preview",
                    "start_date": project.video_preview.start_date,
                    "end_date": project.video_preview.end_date,
                },
                "confirmation": {
                    "key": "confirmation",
                    "start_date": project.confirmation.start_date,
                    "end_date": project.confirmation.end_date,
                },
                "video_delivery": {
                    "key": "video_delivery",
                    "start_date": project.video_delivery.start_date,
                    "end_date": project.video_delivery.end_date,
                },
                "owner_nickname": project.user.nickname,
                "owner_email": project.user.username,
                "created": project.created,
                "updated": project.updated,
                "pending_list": list(project.invites.all().values("id", "email")),
                "member_list": list(
                    project.members.all()
                    .annotate(email=F("user__username"), nickname=F("user__nickname"))
                    .values("id", "rating", "email", "nickname")
                ),
                "files": [
                    {
                        "id": i.id,
                        "file_name": i.files.name,
                        "files": "http://127.0.0.1:8000" + i.files.url if my_settings.DEBUG else i.files.url,
                    }
                    for i in project.files.all()
                    if i.files
                ],
                "memo": list(project.memos.all().values("id", "date", "memo")),
            }
            return JsonResponse({"result": result}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)

    @user_validator
    def post(self, request, project_id):
        try:
            user = request.user
            files = request.FILES.getlist("files")
            inputs = json.loads(request.POST.get("inputs"))
            process = json.loads(request.POST.get("process"))
            members = json.loads(request.POST.get("members"))

            project = models.Project.objects.get_or_none(id=project_id)

            if project is None:
                return JsonResponse({"message": "프로젝트를 찾을 수  없습니다."}, status=500)

            is_member = models.Members.objects.get_or_none(project=project, user=user, rating="manager")
            if project.user != user and is_member is None:
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            with transaction.atomic():
                for k, v in inputs.items():
                    setattr(project, k, v)
                project.save()
                for i in process:
                    key = i.get("key")
                    start_date = i.get("startDate")
                    end_date = i.get("endDate")
                    get_process = getattr(project, key)

                    setattr(get_process, "start_date", start_date)
                    setattr(get_process, "end_date", end_date)
                    get_process.save()

                file_list = []
                for f in files:
                    file_list.append(models.File(project=project, files=f))

                models.File.objects.bulk_create(file_list)

                member_list = []
                for i in members:
                    member_obj = models.Members.objects.get_or_none(id=i["id"])
                    member_obj.rating = i["rating"]
                    member_list.append(member_obj)

                models.Members.objects.bulk_update(member_list, fields=["rating"])

            return JsonResponse({"result": "result"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)

    @user_validator
    def delete(self, request, project_id):
        try:
            user = request.user

            project = models.Project.objects.get_or_none(id=project_id)
            if project is None:
                return JsonResponse({"message": "프로젝트를 찾을 수  없습니다."}, status=500)

            is_member = models.Members.objects.get_or_none(project=project, user=user, rating="manager")
            if project.user != user and is_member is None:
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            project.delete()
            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


class ProjectFile(View):
    @user_validator
    def delete(self, request, file_id):
        try:
            user = request.user
            # data = json.loads(request.body)

            file_obj = models.File.objects.get_or_none(id=file_id)
            project = file_obj.project

            if project is None or file_obj is None:
                return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)

            is_member = models.Members.objects.get_or_none(project=project, user=user, rating="manager")
            if project.user != user and is_member is None:
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            file_obj.delete()
            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


class ProjectMemo(View):
    @user_validator
    def post(self, request, id):
        try:
            user = request.user

            project = models.Project.objects.get_or_none(id=id)
            if project is None:
                return JsonResponse({"message": "프로젝트를 찾을 수  없습니다."}, status=500)

            is_member = models.Members.objects.get_or_none(project=project, user=user, rating="manager")
            if project.user != user and is_member is None:
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            data = json.loads(request.body)

            date = data.get("date")

            memo = data.get("memo")
            if date and memo:
                models.Memo.objects.create(project=project, date=date, memo=memo)

            return JsonResponse({"message": "success"}, status=200)

        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)

    @user_validator
    def delete(self, request, id):
        try:
            user = request.user
            project = models.Project.objects.get_or_none(id=id)

            data = json.loads(request.body)
            memo_id = data.get("memo_id")
            memo = models.Memo.objects.get_or_none(id=memo_id)
            if memo is None:
                return JsonResponse({"message": "메모를 찾을 수  없습니다."}, status=500)
            if project is None:
                return JsonResponse({"message": "메모를 찾을 수  없습니다."}, status=500)

            is_member = models.Members.objects.get_or_none(project=project, user=user, rating="manager")
            if project.user != user and is_member is None:
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            memo.delete()

            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


class ProjectDate(View):
    @user_validator
    def post(self, request, id):
        try:
            user = request.user

            project = models.Project.objects.get_or_none(id=id)
            if project is None:
                return JsonResponse({"message": "프로젝트를 찾을 수  없습니다."}, status=500)

            is_member = models.Members.objects.get_or_none(project=project, user=user, rating="manager")
            if project.user != user and is_member is None:
                return JsonResponse({"message": "권한이 없습니다."}, status=500)

            data = json.loads(request.body)
            key = data.get("key")
            start_date = data.get("start_date")
            end_date = data.get("end_date")

            get_process = getattr(project, key)
            setattr(get_process, "start_date", start_date)
            setattr(get_process, "end_date", end_date)
            get_process.save()

            return JsonResponse({"message": "success"}, status=200)

        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)
