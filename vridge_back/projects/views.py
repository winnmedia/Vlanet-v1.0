import logging, json, random
from django.conf import settings
from datetime import datetime
from django.shortcuts import render
from django.utils import timezone
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from users.utils import (
    user_validator,
    invite_send_email,
    project_token_generator,
    check_project_token,
)
from . import models
from feedbacks import models as feedback_model
from .utils_date import parse_date_flexible
from common.exceptions import APIException

from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str

from django.db.models import F
from django.db import transaction
from django.utils import timezone as django_timezone


@method_decorator(csrf_exempt, name='dispatch')
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
                    "files": "http://127.0.0.1:8000" + i.files.url if settings.DEBUG else i.files.url,
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
@method_decorator(csrf_exempt, name='dispatch')
class InviteMember(View):
    @user_validator
    def post(self, request, project_id):
        try:
            user = request.user

            data = json.loads(request.body)
            email = data.get("email")

            project = models.Project.objects.get_or_none(id=project_id)

            if project.user.username == email:
                return JsonResponse({"message": "프로젝트 소유자는 초대가 불가능합니다."}, status=400)
            if not project:
                return JsonResponse({"message": "존재하지 않는 프로젝트입니다."}, status=404)

            members = project.members.all().filter(user__username=email)
            if members.exists():
                return JsonResponse({"message": "이미 초대 된 사용자입니다."}, status=409)

            with transaction.atomic():
                invite, is_created = models.ProjectInvite.objects.get_or_create(project=project, email=email)

                if not is_created:
                    return JsonResponse({"message": "이미 초대한 사용자입니다."}, status=409)

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
                return JsonResponse({"message": "프로젝트를 찾을 수  없습니다."}, status=404)

            is_member = models.Members.objects.get_or_none(project=project, user=user, rating="manager")
            if project.user != user and is_member is None:
                return JsonResponse({"message": "권한이 없습니다."}, status=403)

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
@method_decorator(csrf_exempt, name='dispatch')
class AcceptInvite(View):
    @user_validator
    def get(self, request, uid, token):
        try:
            user = request.user
            project_id = force_str(urlsafe_base64_decode(uid))

            project = models.Project.objects.get_or_none(id=project_id)
            is_member = project.members.filter(user=user)

            if not project and is_member.exists() and project.user == user:
                return JsonResponse({"message": "존재하지 않는 프로젝트입니다."}, status=404)

            invite_obj = models.ProjectInvite.objects.get_or_none(project=project, email=user.username)
            if invite_obj is None:
                return JsonResponse({"message": "잘못된 요청입니다."}, status=400)

            if not check_project_token(project, token):
                return JsonResponse({"message": "잘못된 요청입니다."}, status=400)

            models.Members.objects.create(project=project, user=user)
            invite_obj.delete()

            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class CreateProject(View):
    @user_validator
    def post(self, request):
        try:
            user = request.user
            files = request.FILES.getlist("files")
            inputs = json.loads(request.POST.get("inputs"))
            process = json.loads(request.POST.get("process"))
            
            # 멱등성 키 확인
            idempotency_key = request.headers.get('X-Idempotency-Key')
            if idempotency_key:
                logging.info(f"[CreateProject] Request with idempotency key: {idempotency_key}")
                
                # 캐시에서 멱등성 키 확인 (Django 캐시 사용)
                from django.core.cache import cache
                cache_key = f"create_project_{user.id}_{idempotency_key}"
                
                # 이미 처리된 요청인지 확인
                cached_result = cache.get(cache_key)
                if cached_result:
                    logging.info(f"[CreateProject] Returning cached result for idempotency key: {idempotency_key}")
                    return JsonResponse(cached_result, status=200)
            
            # 프로젝트 이름 중복 체크 (10초 이내 동일한 이름의 프로젝트 생성 방지)
            project_name = inputs.get('name')
            if project_name:
                recent_projects = models.Project.objects.filter(
                    user=user,
                    name=project_name,
                    created__gte=django_timezone.now() - django_timezone.timedelta(seconds=10)
                ).exists()
                
                if recent_projects:
                    logging.warning(f"[CreateProject] Duplicate project creation attempt: {project_name}")
                    return JsonResponse({
                        "message": "동일한 프로젝트가 방금 생성되었습니다. 잠시 후 다시 시도해주세요."
                    }, status=400)

            with transaction.atomic():
                project = models.Project.objects.create(user=user)
                for k, v in inputs.items():
                    setattr(project, k, v)
                
                logging.info(f"[CreateProject] Creating project '{project_name}' for user {user.username}")
                logging.info(f"[CreateProject] Inputs: {inputs}")
                logging.info(f"[CreateProject] Process data: {process}")

                for i in process:
                    key = i.get("key")
                    start_date = i.get("startDate")
                    end_date = i.get("endDate")
                    
                    # 날짜 문자열을 datetime 객체로 변환 (유연한 파싱)
                    try:
                        start_date = parse_date_flexible(start_date)
                        end_date = parse_date_flexible(end_date)
                    except ValueError as e:
                        logging.error(f"Date parsing error for {key}: {str(e)}")
                        logging.error(f"Start date: {start_date}, End date: {end_date}")
                        return JsonResponse({
                            "message": f"{key} 단계의 날짜 형식이 올바르지 않습니다.",
                            "error": str(e)
                        }, status=400)
                    
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

            # 성공 결과를 캐시에 저장
            result = {"message": "success", "project_id": project.id}
            if idempotency_key:
                from django.core.cache import cache
                cache_key = f"create_project_{user.id}_{idempotency_key}"
                # 5분간 캐시 저장
                cache.set(cache_key, result, 300)
            
            logging.info(f"[CreateProject] Successfully created project '{project_name}' with ID: {project.id}")
            return JsonResponse(result, status=200)
        except Exception as e:
            print(e)
            logging.error(f"Project creation error: {str(e)}")
            logging.error(f"Error type: {type(e).__name__}")
            import traceback
            logging.error(f"Traceback: {traceback.format_exc()}")
            
            # 더 구체적인 에러 메시지 반환
            if "key" in str(e):
                return JsonResponse({"message": "프로젝트 단계 정보가 올바르지 않습니다. 프론트엔드와 백엔드 데이터 형식을 확인해주세요."}, status=400)
            elif "date" in str(e).lower():
                return JsonResponse({"message": "날짜 형식이 올바르지 않습니다."}, status=400)
            else:
                return JsonResponse({"message": f"프로젝트 생성 중 오류가 발생했습니다: {str(e)}"}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ProjectDetail(View):
    @user_validator
    def get(self, request, project_id):
        try:
            user = request.user
            project = models.Project.objects.get_or_none(id=project_id)
            if project is None:
                return JsonResponse({"message": "프로젝트를 찾을 수  없습니다."}, status=404)

            is_member = models.Members.objects.get_or_none(project=project, user=user)
            if project.user != user and is_member is None:
                return JsonResponse({"message": "권한이 없습니다."}, status=403)

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
                        "files": "http://127.0.0.1:8000" + i.files.url if settings.DEBUG else i.files.url,
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
                return JsonResponse({"message": "프로젝트를 찾을 수  없습니다."}, status=404)

            is_member = models.Members.objects.get_or_none(project=project, user=user, rating="manager")
            if project.user != user and is_member is None:
                return JsonResponse({"message": "권한이 없습니다."}, status=403)

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
            logging.info(f"[ProjectDetail.delete] Delete request for project {project_id} by user {user.id} ({user.username})")

            project = models.Project.objects.get_or_none(id=project_id)
            if project is None:
                logging.warning(f"[ProjectDetail.delete] Project {project_id} not found")
                return JsonResponse({"message": "프로젝트를 찾을 수  없습니다."}, status=404)

            logging.info(f"[ProjectDetail.delete] Project owner: {project.user.id}, Requesting user: {user.id}")
            
            # 프로젝트 소유자이거나 매니저 권한이 있는 멤버인지 확인
            is_owner = project.user == user
            is_manager = models.Members.objects.filter(project=project, user=user, rating="manager").exists()
            
            if not is_owner and not is_manager:
                logging.warning(f"[ProjectDetail.delete] Permission denied for user {user.id} on project {project_id}")
                return JsonResponse({"message": "프로젝트 삭제 권한이 없습니다."}, status=403)

            # 프로젝트 삭제
            project_name = project.name
            project.delete()
            logging.info(f"[ProjectDetail.delete] Successfully deleted project {project_id} ({project_name})")
            
            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            logging.error(f"[ProjectDetail.delete] Error deleting project {project_id}: {str(e)}")
            logging.error(f"[ProjectDetail.delete] Error type: {type(e).__name__}")
            import traceback
            logging.error(f"[ProjectDetail.delete] Traceback: {traceback.format_exc()}")
            return JsonResponse({"message": f"프로젝트 삭제 중 오류가 발생했습니다: {str(e)}"}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
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
                return JsonResponse({"message": "권한이 없습니다."}, status=403)

            file_obj.delete()
            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ProjectMemo(View):
    @user_validator
    def post(self, request, id):
        try:
            user = request.user

            project = models.Project.objects.get_or_none(id=id)
            if project is None:
                return JsonResponse({"message": "프로젝트를 찾을 수  없습니다."}, status=404)

            is_member = models.Members.objects.get_or_none(project=project, user=user, rating="manager")
            if project.user != user and is_member is None:
                return JsonResponse({"message": "권한이 없습니다."}, status=403)

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
                return JsonResponse({"message": "메모를 찾을 수  없습니다."}, status=404)
            if project is None:
                return JsonResponse({"message": "메모를 찾을 수  없습니다."}, status=404)

            is_member = models.Members.objects.get_or_none(project=project, user=user, rating="manager")
            if project.user != user and is_member is None:
                return JsonResponse({"message": "권한이 없습니다."}, status=403)

            memo.delete()

            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            print(e)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ProjectDate(View):
    @user_validator
    def post(self, request, id):
        try:
            user = request.user

            project = models.Project.objects.get_or_none(id=id)
            if project is None:
                return JsonResponse({"message": "프로젝트를 찾을 수  없습니다."}, status=404)

            is_member = models.Members.objects.get_or_none(project=project, user=user, rating="manager")
            if project.user != user and is_member is None:
                return JsonResponse({"message": "권한이 없습니다."}, status=403)

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
