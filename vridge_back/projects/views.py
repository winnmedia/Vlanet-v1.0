import logging, json, random
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)
from datetime import datetime, timedelta
from django.shortcuts import render
from django.utils import timezone
from django.utils import timezone as django_timezone
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth import get_user_model
import secrets
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
# from .views_feedback import ProjectFeedback, ProjectFeedbackComments, ProjectFeedbackUpload

from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str

from django.db.models import F
from django.db import transaction
from django.utils import timezone as django_timezone
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.conf import settings
import os
import secrets
import hashlib
from datetime import timedelta


@method_decorator(csrf_exempt, name='dispatch')
class ProjectList(View):
    @user_validator
    def get(self, request):
        try:
            user = request.user
            
            # nickname 초기화
            if user.nickname:
                nickname = user.nickname
            else:
                nickname = user.username

            project_list = user.projects.all().select_related(
                "basic_plan",
                "story_board",
                "filming",
                "video_edit",
                "post_work",
                "video_preview",
                "confirmation",
                "video_delivery",
                "feedback",
            ).prefetch_related('feedback__comments')
            result = []
            for i in project_list:
                if i.video_delivery and i.video_delivery.end_date:
                    end_date = i.video_delivery.end_date
                elif i.confirmation and i.confirmation.end_date:
                    end_date = i.confirmation.end_date
                elif i.video_preview and i.video_preview.end_date:
                    end_date = i.video_preview.end_date
                elif i.post_work and i.post_work.end_date:
                    end_date = i.post_work.end_date
                elif i.video_edit and i.video_edit.end_date:
                    end_date = i.video_edit.end_date
                elif i.filming and i.filming.end_date:
                    end_date = i.filming.end_date
                elif i.story_board and i.story_board.end_date:
                    end_date = i.story_board.end_date
                elif i.basic_plan and i.basic_plan.end_date:
                    end_date = i.basic_plan.end_date
                else:
                    end_date = None

                if i.basic_plan and i.basic_plan.start_date:
                    first_date = i.basic_plan.start_date
                elif i.story_board and i.story_board.start_date:
                    first_date = i.story_board.start_date
                elif i.filming and i.filming.start_date:
                    first_date = i.filming.start_date
                elif i.video_edit and i.video_edit.start_date:
                    first_date = i.video_edit.start_date
                elif i.post_work and i.post_work.start_date:
                    first_date = i.post_work.start_date
                elif i.video_preview and i.video_preview.start_date:
                    first_date = i.video_preview.start_date
                elif i.confirmation and i.confirmation.start_date:
                    first_date = i.confirmation.start_date
                elif i.video_delivery and i.video_delivery.start_date:
                    first_date = i.video_delivery.start_date
                else:
                    first_date = None

                result.append(
                    {
                        "id": i.id,
                        "name": i.name,
                        "manager": i.manager,
                        "consumer": i.consumer,
                        "description": i.description,
                        "color": i.color,
                        "basic_plan": {
                            "start_date": i.basic_plan.start_date if i.basic_plan else None,
                            "end_date": i.basic_plan.end_date if i.basic_plan else None,
                        },
                        "story_board": {
                            "start_date": i.story_board.start_date if i.story_board else None,
                            "end_date": i.story_board.end_date if i.story_board else None,
                        },
                        "filming": {
                            "start_date": i.filming.start_date if i.filming else None,
                            "end_date": i.filming.end_date if i.filming else None,
                        },
                        "video_edit": {
                            "start_date": i.video_edit.start_date if i.video_edit else None,
                            "end_date": i.video_edit.end_date if i.video_edit else None,
                        },
                        "post_work": {
                            "start_date": i.post_work.start_date if i.post_work else None,
                            "end_date": i.post_work.end_date if i.post_work else None,
                        },
                        "video_preview": {
                            "start_date": i.video_preview.start_date if i.video_preview else None,
                            "end_date": i.video_preview.end_date if i.video_preview else None,
                        },
                        "confirmation": {
                            "start_date": i.confirmation.start_date if i.confirmation else None,
                            "end_date": i.confirmation.end_date if i.confirmation else None,
                        },
                        "video_delivery": {
                            "start_date": i.video_delivery.start_date if i.video_delivery else None,
                            "end_date": i.video_delivery.end_date if i.video_delivery else None,
                        },
                        "first_date": first_date,
                        "end_date": end_date,
                        "created": i.created,
                        "updated": i.updated,
                        "owner_nickname": i.user.nickname,
                        "owner_email": i.user.username,
                        "feedback_id": i.feedback.id if i.feedback else None,
                        "feedback": [
                            {
                                "id": fb.id,
                                "text": fb.text,
                                "nickname": fb.user.nickname if not fb.security else "익명",
                                "section": fb.section,
                                "title": fb.title,
                                "created": fb.created,
                                "updated": fb.updated,
                            }
                            for fb in (i.feedback.comments.all() if i.feedback else [])
                        ],
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
                "project", 
                "project__basic_plan",
                "project__story_board",
                "project__filming",
                "project__video_edit",
                "project__post_work",
                "project__video_preview",
                "project__confirmation",
                "project__video_delivery",
                "project__user",
                "project__feedback"
            ).prefetch_related('project__feedback__comments')
            for i in members:
                if i.project.video_delivery and i.project.video_delivery.end_date:
                    end_date = i.project.video_delivery.end_date
                elif i.project.confirmation and i.project.confirmation.end_date:
                    end_date = i.project.confirmation.end_date
                elif i.project.video_preview and i.project.video_preview.end_date:
                    end_date = i.project.video_preview.end_date
                elif i.project.post_work and i.project.post_work.end_date:
                    end_date = i.project.post_work.end_date
                elif i.project.video_edit and i.project.video_edit.end_date:
                    end_date = i.project.video_edit.end_date
                elif i.project.filming and i.project.filming.end_date:
                    end_date = i.project.filming.end_date
                elif i.project.story_board and i.project.story_board.end_date:
                    end_date = i.project.story_board.end_date
                elif i.project.basic_plan and i.project.basic_plan.end_date:
                    end_date = i.project.basic_plan.end_date
                else:
                    end_date = None

                if i.project.basic_plan and i.project.basic_plan.start_date:
                    first_date = i.project.basic_plan.start_date
                elif i.project.story_board and i.project.story_board.start_date:
                    first_date = i.project.story_board.start_date
                elif i.project.filming and i.project.filming.start_date:
                    first_date = i.project.filming.start_date
                elif i.project.video_edit and i.project.video_edit.start_date:
                    first_date = i.project.video_edit.start_date
                elif i.project.post_work and i.project.post_work.start_date:
                    first_date = i.project.post_work.start_date
                elif i.project.video_preview and i.project.video_preview.start_date:
                    first_date = i.project.video_preview.start_date
                elif i.project.confirmation and i.project.confirmation.start_date:
                    first_date = i.project.confirmation.start_date
                elif i.project.video_delivery and i.project.video_delivery.start_date:
                    first_date = i.project.video_delivery.start_date
                else:
                    first_date = None
                result.append(
                    {
                        "id": i.project.id,
                        "name": i.project.name,
                        "manager": i.project.manager,
                        "consumer": i.project.consumer,
                        "description": i.project.description,
                        "color": i.project.color,
                        "basic_plan": {
                            "start_date": i.project.basic_plan.start_date if i.project.basic_plan else None,
                            "end_date": i.project.basic_plan.end_date if i.project.basic_plan else None,
                        },
                        "story_board": {
                            "start_date": i.project.story_board.start_date if i.project.story_board else None,
                            "end_date": i.project.story_board.end_date if i.project.story_board else None,
                        },
                        "filming": {
                            "start_date": i.project.filming.start_date if i.project.filming else None,
                            "end_date": i.project.filming.end_date if i.project.filming else None,
                        },
                        "video_edit": {
                            "start_date": i.project.video_edit.start_date if i.project.video_edit else None,
                            "end_date": i.project.video_edit.end_date if i.project.video_edit else None,
                        },
                        "post_work": {
                            "start_date": i.project.post_work.start_date if i.project.post_work else None,
                            "end_date": i.project.post_work.end_date if i.project.post_work else None,
                        },
                        "video_preview": {
                            "start_date": i.project.video_preview.start_date if i.project.video_preview else None,
                            "end_date": i.project.video_preview.end_date if i.project.video_preview else None,
                        },
                        "confirmation": {
                            "start_date": i.project.confirmation.start_date if i.project.confirmation else None,
                            "end_date": i.project.confirmation.end_date if i.project.confirmation else None,
                        },
                        "video_delivery": {
                            "start_date": i.project.video_delivery.start_date if i.project.video_delivery else None,
                            "end_date": i.project.video_delivery.end_date if i.project.video_delivery else None,
                        },
                        "first_date": first_date,
                        "end_date": end_date,
                        "created": i.project.created,
                        "updated": i.project.updated,
                        "owner_nickname": i.project.user.nickname,
                        "owner_email": i.project.user.username,
                        "feedback_id": i.project.feedback.id if i.project.feedback else None,
                        "feedback": [
                            {
                                "id": fb.id,
                                "text": fb.text,
                                "nickname": fb.user.nickname if not fb.security else "익명",
                                "section": fb.section,
                                "title": fb.title,
                                "created": fb.created,
                                "updated": fb.updated,
                            }
                            for fb in (i.project.feedback.comments.all() if i.project.feedback else [])
                        ],
                        # "pending_list": list(i.project.invites.all().values("id", "email")),
                        "member_list": list(
                            i.project.members.all()
                            .annotate(email=F("user__username"), nickname=F("user__nickname"))
                            .values("id", "rating", "email", "nickname")
                        ),
                        # "files": list(i.project.files.all().values("id", "files")),
                    }
                )

            sample_files = [
                {
                    "file_name": i.files.name,
                    "files": "http://127.0.0.1:8000" + i.files.url if settings.DEBUG else i.files.url,
                }
                for i in models.SampleFiles.objects.all()
                if i.files
            ]

            # user_memos 안전하게 가져오기
            try:
                user_memos = list(user.memos.all().values("id", "date", "memo"))
            except AttributeError:
                user_memos = []
            
            # 프로필 이미지 URL 가져오기
            profile_image = None
            try:
                if hasattr(user, 'profile') and user.profile.profile_image:
                    profile_image = user.profile.profile_image.url
            except:
                pass

            return JsonResponse(
                {
                    "result": result,
                    "user": user.username,
                    "nickname": nickname,
                    "profile_image": profile_image,
                    "sample_files": sample_files,
                    "user_memos": user_memos,
                },
                status=200,
            )
        except Exception as e:
            logger.error(f"Error in ProjectList: {str(e)}", exc_info=True)
            logging.error(f"ProjectList error for user {request.user.id}: {str(e)}")
            import traceback
            logging.error(f"Traceback: {traceback.format_exc()}")
            
            # 더 구체적인 에러 메시지 반환
            error_message = "프로젝트 목록을 불러오는 중 오류가 발생했습니다."
            if "nickname" in str(e):
                error_message = "사용자 정보 오류가 발생했습니다."
            elif "memos" in str(e):
                error_message = "메모 정보를 불러오는 중 오류가 발생했습니다."
                
            return JsonResponse({
                "message": error_message,
                "error": str(e) if settings.DEBUG else None
            }, status=500)


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
                
                # 이메일 발송 시도
                email_sent = invite_send_email(request, email, uid, token, project.name)
                
                # 최근 초대 기록 업데이트
                from users.models import RecentInvitation
                try:
                    recent_invite, created = RecentInvitation.objects.get_or_create(
                        inviter=user,
                        invitee_email=email,
                        defaults={
                            'invitee_name': email.split('@')[0],  # 이메일의 username 부분을 이름으로 사용
                            'project_name': project.name,
                            'invitation_count': 1
                        }
                    )
                    if not created:
                        recent_invite.project_name = project.name
                        recent_invite.invitation_count += 1
                        recent_invite.save()
                except Exception as e:
                    logger.warning(f"최근 초대 기록 업데이트 실패: {str(e)}")
                
                if email_sent:
                    return JsonResponse({
                        "message": "초대 이메일이 성공적으로 발송되었습니다.",
                        "email_sent": True
                    }, status=200)
                else:
                    return JsonResponse({
                        "message": "초대 생성은 완료되었지만 이메일 발송에 실패했습니다. 관리자에게 문의하세요.",
                        "email_sent": False
                    }, status=200)
        except Exception as e:
            logger.error(f"Error in project operation: {str(e)}", exc_info=True)
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
            logger.error(f"Error in project operation: {str(e)}", exc_info=True)
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
            logger.error(f"Error in project operation: {str(e)}", exc_info=True)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class CreateProject(View):
    @user_validator
    def post(self, request):
        try:
            user = request.user
            files = request.FILES.getlist("files")
            
            # Content-Type에 따라 데이터 파싱
            if request.content_type == 'application/json':
                # JSON 요청 처리
                try:
                    data = json.loads(request.body)
                    inputs = {
                        'name': data.get('name'),
                        'manager': data.get('manager'),
                        'consumer': data.get('consumer'),
                        'description': data.get('description'),
                        'color': data.get('color', '#1631F8')
                    }
                    process = data.get('process', [])
                except json.JSONDecodeError:
                    return JsonResponse({
                        "message": "잘못된 JSON 형식입니다.",
                        "code": "INVALID_JSON"
                    }, status=400)
            else:
                # FormData 요청 처리 (레거시 지원)
                inputs_raw = request.POST.get("inputs")
                process_raw = request.POST.get("process")
                
                if not inputs_raw or not process_raw:
                    return JsonResponse({
                        "message": "프로젝트 생성 중 오류가 발생했습니다: 필수 데이터가 누락되었습니다.",
                        "code": "MISSING_DATA"
                    }, status=400)
                
                try:
                    inputs = json.loads(inputs_raw)
                    process = json.loads(process_raw)
                except json.JSONDecodeError as e:
                    return JsonResponse({
                        "message": f"프로젝트 생성 중 오류가 발생했습니다: 잘못된 데이터 형식입니다.",
                        "code": "INVALID_JSON"
                    }, status=400)
            
            # inputs와 process 검증
            if not inputs or not process:
                return JsonResponse({
                    "message": "프로젝트 생성 중 오류가 발생했습니다: 필수 데이터가 누락되었습니다.",
                    "code": "MISSING_DATA"
                }, status=400)
            
            # inputs가 dict인지 확인 (string으로 잘못 전달된 경우 처리)
            if isinstance(inputs, str):
                try:
                    inputs = json.loads(inputs)
                except json.JSONDecodeError:
                    return JsonResponse({
                        "message": "프로젝트 생성 중 오류가 발생했습니다: inputs 데이터가 올바른 형식이 아닙니다.",
                        "code": "INVALID_INPUTS_FORMAT"
                    }, status=400)
            
            if isinstance(process, str):
                try:
                    process = json.loads(process)
                except json.JSONDecodeError:
                    return JsonResponse({
                        "message": "프로젝트 생성 중 오류가 발생했습니다: process 데이터가 올바른 형식이 아닙니다.",
                        "code": "INVALID_PROCESS_FORMAT"
                    }, status=400)
            
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
                # 프로젝트 생성 시 필수 필드들을 함께 전달
                # 데이터베이스 마이그레이션 이슈를 피하기 위한 임시 조치
                # is_public 필드 제외
                project = models.Project(
                    user=user,
                    name=inputs.get('name'),
                    manager=inputs.get('manager'),
                    consumer=inputs.get('consumer'),
                    description=inputs.get('description', ''),
                    color=inputs.get('color', '#1631F8')
                )
                
                # 추가 필드들 (있는 경우만 설정)
                if 'tone_manner' in inputs:
                    project.tone_manner = inputs['tone_manner']
                if 'genre' in inputs:
                    project.genre = inputs['genre']
                if 'concept' in inputs:
                    project.concept = inputs['concept']
                
                # 협업 관련 필드는 Railway 마이그레이션 문제로 임시 제거
                # try:
                #     if hasattr(project, 'is_public'):
                #         project.is_public = False  # 기본값
                # except Exception:
                #     pass
                
                project.save()
                
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
            result = {
                "message": "success", 
                "project_id": project.id,
                "project_name": project.name
            }
            if idempotency_key:
                from django.core.cache import cache
                cache_key = f"create_project_{user.id}_{idempotency_key}"
                # 5분간 캐시 저장
                cache.set(cache_key, result, 300)
            
            logging.info(f"[CreateProject] Successfully created project '{project_name}' with ID: {project.id}")
            return JsonResponse(result, status=200)
        except Exception as e:
            logger.error(f"Error in project operation: {str(e)}", exc_info=True)
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
                    "start_date": project.basic_plan.start_date if project.basic_plan else None,
                    "end_date": project.basic_plan.end_date if project.basic_plan else None,
                },
                "story_board": {
                    "key": "story_board",
                    "start_date": project.story_board.start_date if project.story_board else None,
                    "end_date": project.story_board.end_date if project.story_board else None,
                },
                "filming": {
                    "key": "filming",
                    "start_date": project.filming.start_date if project.filming else None,
                    "end_date": project.filming.end_date if project.filming else None,
                },
                "video_edit": {
                    "key": "video_edit",
                    "start_date": project.video_edit.start_date if project.video_edit else None,
                    "end_date": project.video_edit.end_date if project.video_edit else None,
                },
                "post_work": {
                    "key": "post_work",
                    "start_date": project.post_work.start_date if project.post_work else None,
                    "end_date": project.post_work.end_date if project.post_work else None,
                },
                "video_preview": {
                    "key": "video_preview",
                    "start_date": project.video_preview.start_date if project.video_preview else None,
                    "end_date": project.video_preview.end_date if project.video_preview else None,
                },
                "confirmation": {
                    "key": "confirmation",
                    "start_date": project.confirmation.start_date if project.confirmation else None,
                    "end_date": project.confirmation.end_date if project.confirmation else None,
                },
                "video_delivery": {
                    "key": "video_delivery",
                    "start_date": project.video_delivery.start_date if project.video_delivery else None,
                    "end_date": project.video_delivery.end_date if project.video_delivery else None,
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
            logger.error(f"Error in project operation: {str(e)}", exc_info=True)
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
            logger.error(f"Error in project operation: {str(e)}", exc_info=True)
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

            # 프로젝트 삭제 - 안전한 삭제 프로세스
            project_name = project.name
            
            # 프로젝트 삭제 - 단계별 안전 삭제
            deleted_items = []
            
            try:
                # 1. 피드백 관련 데이터 삭제 (프로젝트에 연결된 피드백이 있다면)
                try:
                    if hasattr(project, 'feedback') and project.feedback:
                        from feedbacks.models import FeedBackComment, FeedBackMessage
                        feedback_obj = project.feedback
                        # 피드백 댓글 삭제
                        comment_count = FeedBackComment.objects.filter(feedback=feedback_obj).count()
                        FeedBackComment.objects.filter(feedback=feedback_obj).delete()
                        # 피드백 메시지 삭제
                        message_count = FeedBackMessage.objects.filter(feedback=feedback_obj).count()
                        FeedBackMessage.objects.filter(feedback=feedback_obj).delete()
                        deleted_items.append(f"피드백 댓글 {comment_count}개, 메시지 {message_count}개")
                except Exception as feedback_error:
                    logger.warning(f"피드백 데이터 삭제 중 오류: {str(feedback_error)}")
                
                # 2. 프로젝트 초대 삭제
                try:
                    invite_count = models.ProjectInvite.objects.filter(project=project).count()
                    models.ProjectInvite.objects.filter(project=project).delete()
                    deleted_items.append(f"프로젝트 초대 {invite_count}개")
                except Exception as e:
                    logger.warning(f"프로젝트 초대 삭제 중 오류: {str(e)}")
                
                # 3. 프로젝트 멤버 삭제
                try:
                    member_count = models.Members.objects.filter(project=project).count()
                    models.Members.objects.filter(project=project).delete()
                    deleted_items.append(f"프로젝트 멤버 {member_count}개")
                except Exception as e:
                    logger.warning(f"프로젝트 멤버 삭제 중 오류: {str(e)}")
                
                # 4. 프로젝트 파일 삭제
                try:
                    file_count = models.File.objects.filter(project=project).count()
                    models.File.objects.filter(project=project).delete()
                    deleted_items.append(f"프로젝트 파일 {file_count}개")
                except Exception as e:
                    logger.warning(f"프로젝트 파일 삭제 중 오류: {str(e)}")
                
                # 5. 메모 삭제
                try:
                    memo_count = models.Memo.objects.filter(project=project).count()
                    models.Memo.objects.filter(project=project).delete()
                    deleted_items.append(f"메모 {memo_count}개")
                except Exception as e:
                    logger.warning(f"메모 삭제 중 오류: {str(e)}")
                
                # 6. 프로젝트 단계별 정보 삭제 (안전하게)
                stage_deleted = []
                try:
                    if hasattr(project, 'basic_plan') and project.basic_plan:
                        project.basic_plan.delete()
                        stage_deleted.append("기본계획")
                except Exception as e:
                    logger.warning(f"기본계획 삭제 중 오류: {str(e)}")
                
                try:
                    if hasattr(project, 'confirmation') and project.confirmation:
                        project.confirmation.delete()
                        stage_deleted.append("확정")
                except Exception as e:
                    logger.warning(f"확정 단계 삭제 중 오류: {str(e)}")
                
                # 다른 단계들도 안전하게 삭제
                stages = ['storyboard', 'filming', 'video_edit', 'video_preview', 'postwork', 'video_delivery']
                for stage in stages:
                    try:
                        if hasattr(project, stage) and getattr(project, stage):
                            getattr(project, stage).delete()
                            stage_deleted.append(stage)
                    except Exception as e:
                        logger.warning(f"{stage} 삭제 중 오류: {str(e)}")
                
                if stage_deleted:
                    deleted_items.append(f"프로젝트 단계: {', '.join(stage_deleted)}")
                
                # 7. 최종적으로 프로젝트 삭제
                project.delete()
                
                logging.info(f"[ProjectDetail.delete] Successfully deleted project {project_id} ({project_name})")
                logging.info(f"[ProjectDetail.delete] Deleted items: {', '.join(deleted_items)}")
                
                return JsonResponse({
                    "message": "프로젝트가 성공적으로 삭제되었습니다.",
                    "project_name": project_name,
                    "deleted_items": deleted_items
                }, status=200)
                
            except Exception as delete_error:
                logging.error(f"[ProjectDetail.delete] Critical error during project deletion: {str(delete_error)}")
                # 최후의 수단으로 간단한 삭제 시도
                try:
                    project.delete()
                    return JsonResponse({
                        "message": "프로젝트가 삭제되었습니다. (일부 관련 데이터는 남아있을 수 있습니다)",
                        "project_name": project_name
                    }, status=200)
                except Exception as final_error:
                    raise final_error
        except Exception as e:
            logging.error(f"[ProjectDetail.delete] Error deleting project {project_id}: {str(e)}")
            logging.error(f"[ProjectDetail.delete] Error type: {type(e).__name__}")
            import traceback
            logging.error(f"[ProjectDetail.delete] Traceback: {traceback.format_exc()}")
            
            # 더 자세한 오류 정보를 사용자에게 제공 (디버깅용)
            error_details = {
                "message": "프로젝트 삭제 중 오류가 발생했습니다.",
                "error_type": type(e).__name__,
                "error_detail": str(e),
                "project_id": project_id
            }
            
            # 개발 환경에서는 더 자세한 정보 제공
            if settings.DEBUG:
                error_details["traceback"] = traceback.format_exc()
            
            return JsonResponse(error_details, status=500)


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
            logger.error(f"Error in project operation: {str(e)}", exc_info=True)
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
            logger.error(f"Error in project operation: {str(e)}", exc_info=True)
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
            logger.error(f"Error in project operation: {str(e)}", exc_info=True)
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
            logger.error(f"Error in project operation: {str(e)}", exc_info=True)
            logging.info(str(e))
            return JsonResponse({"message": "알 수 없는 에러입니다 고객센터에 문의해주세요."}, status=500)



# 프로젝트 피드백 관련 뷰들
@method_decorator(csrf_exempt, name="dispatch")
class ProjectFeedback(View):
    """프로젝트의 피드백 조회 및 생성"""
    
    @user_validator
    def get(self, request, project_id):
        try:
            user = request.user
            project = models.Project.objects.select_related("feedback").filter(id=project_id).first()
            
            if project is None:
                return JsonResponse({"message": "프로젝트를 찾을 수 없습니다."}, status=404)
            
            # 권한 확인 - 프로젝트 소유자나 멤버인지 확인
            is_member = models.Members.objects.filter(project=project, user=user).exists()
            if project.user != user and not is_member:
                return JsonResponse({"message": "권한이 없습니다."}, status=403)
            
            # 피드백이 없으면 빈 객체 반환
            if not project.feedback:
                return JsonResponse({
                    "result": {
                        "id": None,
                        "project": project_id,
                        "files": None,
                        "comments": []
                    }
                }, status=200)
            
            # 피드백 정보 반환
            feedback = project.feedback
            
            # 파일 URL 생성 - 전체 URL 반환
            file_url = None
            if feedback.files:
                if hasattr(feedback.files, 'url'):
                    file_url = feedback.files.url
                    # URL이 상대 경로인 경우 전체 URL로 변환
                    if file_url and not file_url.startswith('http'):
                        # 환경 변수에서 도메인 가져오기
                        if settings.DEBUG:
                            file_url = f"http://localhost:8000{file_url}"
                        else:
                            # Railway 또는 프로덕션 환경
                            backend_url = os.environ.get('BACKEND_URL', 'https://videoplanet.up.railway.app')
                            # URL이 이미 /로 시작하는 경우와 아닌 경우 처리
                            if backend_url.endswith('/'):
                                backend_url = backend_url.rstrip('/')
                            file_url = f"{backend_url}{file_url}"
                    logger.info(f"Generated file URL: {file_url}")
            
            result = {
                "id": feedback.id,
                "project": project_id,
                "files": file_url,
                "created": feedback.created,
                "updated": feedback.updated,
                "comments": []
            }
            
            # 코멘트 정보 추가
            comments = feedback_model.FeedBackComment.objects.filter(
                feedback=feedback
            ).order_by("-created")
            
            for comment in comments:
                result["comments"].append({
                    "id": comment.id,
                    "section": comment.section,
                    "title": comment.title,
                    "text": comment.text,
                    "security": comment.security,
                    "user": comment.user.email if not comment.security else "익명",
                    "created": comment.created
                })
            
            return JsonResponse({"result": result}, status=200)
            
        except Exception as e:
            logger.error(f"Error in project feedback: {str(e)}", exc_info=True)
            return JsonResponse({"message": f"오류가 발생했습니다: {str(e)}"}, status=500)


@method_decorator(csrf_exempt, name="dispatch")
class ProjectFeedbackComments(View):
    """프로젝트 피드백의 코멘트 목록 조회 및 작성"""
    
    @user_validator
    def get(self, request, project_id):
        # 이미 ProjectFeedback.get에서 코멘트 정보를 포함하고 있으므로
        # 여기서는 별도 구현 불필요
        return JsonResponse({"message": "Use /api/projects/{project_id}/feedback/ endpoint"}, status=200)
    
    @user_validator
    def post(self, request, project_id):
        try:
            user = request.user
            project = models.Project.objects.select_related("feedback").filter(id=project_id).first()
            
            if project is None:
                return JsonResponse({"message": "프로젝트를 찾을 수 없습니다."}, status=404)
            
            # 권한 확인
            is_member = models.Members.objects.filter(project=project, user=user).exists()
            if project.user != user and not is_member:
                return JsonResponse({"message": "권한이 없습니다."}, status=403)
            
            # 피드백이 없으면 에러
            if not project.feedback:
                return JsonResponse({"message": "피드백이 없습니다."}, status=404)
            
            data = json.loads(request.body)
            
            # 코멘트 생성
            comment = feedback_model.FeedBackComment.objects.create(
                feedback=project.feedback,
                user=user,
                section=data.get("section", ""),
                title=data.get("title", ""),
                text=data.get("text", ""),
                security=data.get("security", False)
            )
            
            return JsonResponse({
                "result": {
                    "id": comment.id,
                    "section": comment.section,
                    "title": comment.title,
                    "text": comment.text,
                    "security": comment.security,
                    "user": comment.user.email if not comment.security else "익명",
                    "created": comment.created
                }
            }, status=201)
            
        except Exception as e:
            logger.error(f"Error in feedback comments: {str(e)}", exc_info=True)
            return JsonResponse({"message": f"오류가 발생했습니다: {str(e)}"}, status=500)


@method_decorator(csrf_exempt, name="dispatch")
class ProjectFeedbackUpload(View):
    """프로젝트 피드백 파일 업로드"""
    
    @user_validator
    def post(self, request, project_id):
        try:
            user = request.user
            project = models.Project.objects.select_related("feedback").filter(id=project_id).first()
            
            if project is None:
                return JsonResponse({"message": "프로젝트를 찾을 수 없습니다."}, status=404)
            
            # 권한 확인 - 매니저 이상만 업로드 가능
            is_manager = models.Members.objects.filter(
                project=project, 
                user=user, 
                rating="manager"
            ).exists()
            
            if project.user != user and not is_manager:
                return JsonResponse({"message": "권한이 없습니다."}, status=403)
            
            # 파일 처리
            file = request.FILES.get("files") or request.FILES.get("file")
            if not file:
                return JsonResponse({"message": "파일이 없습니다."}, status=400)
            
            # 피드백이 없으면 생성
            if not project.feedback:
                feedback = feedback_model.FeedBack.objects.create()
                project.feedback = feedback
                project.save()
            else:
                feedback = project.feedback
            
            # 기존 파일이 있으면 삭제
            if feedback.files:
                feedback.files.delete()
            
            # 새 파일 저장
            feedback.files = file
            feedback.save()
            
            # 파일 URL 생성 - 전체 URL 반환
            file_url = feedback.files.url
            if file_url and not file_url.startswith('http'):
                if settings.DEBUG:
                    file_url = f"http://localhost:8000{file_url}"
                else:
                    backend_url = os.environ.get('BACKEND_URL', 'https://videoplanet.up.railway.app')
                    if backend_url.endswith('/'):
                        backend_url = backend_url.rstrip('/')
                    file_url = f"{backend_url}{file_url}"
            
            logger.info(f"Upload complete. File URL: {file_url}")
            
            return JsonResponse({
                "result": {
                    "id": feedback.id,
                    "file_url": file_url
                }
            }, status=200)
            
        except Exception as e:
            logger.error(f"Error in feedback upload: {str(e)}", exc_info=True)
            return JsonResponse({"message": f"오류가 발생했습니다: {str(e)}"}, status=500)


@method_decorator(csrf_exempt, name="dispatch")
class ProjectFeedbackEncodingStatus(View):
    """비디오 인코딩 상태 확인"""
    
    @user_validator
    def get(self, request, project_id):
        try:
            user = request.user
            project = models.Project.objects.select_related("feedback").filter(id=project_id).first()
            
            if project is None:
                return JsonResponse({"message": "프로젝트를 찾을 수 없습니다."}, status=404)
            
            # 권한 확인
            is_member = models.Members.objects.filter(project=project, user=user).exists()
            if project.user != user and not is_member:
                return JsonResponse({"message": "권한이 없습니다."}, status=403)
            
            # 피드백이 없으면 인코딩 상태도 없음
            if not project.feedback or not project.feedback.files:
                return JsonResponse({
                    "status": "no_file",
                    "message": "업로드된 파일이 없습니다."
                }, status=200)
            
            # 여기서는 간단히 파일이 있으면 완료로 처리
            # 실제로는 인코딩 서비스와 연동 필요
            return JsonResponse({
                "status": "completed",
                "message": "인코딩이 완료되었습니다.",
                "file_url": project.feedback.files.url
            }, status=200)
            
        except Exception as e:
            logger.error(f"Error in encoding status: {str(e)}", exc_info=True)
            return JsonResponse({"message": f"오류가 발생했습니다: {str(e)}"}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ProjectInvitation(View):
    """프로젝트 초대 관리"""
    
    @user_validator
    def delete(self, request, project_id):
        """초대 취소"""
        try:
            user = request.user
            data = json.loads(request.body)
            
            invitation_id = data.get('invitation_id')
            
            if not invitation_id:
                return JsonResponse({"message": "초대 ID가 필요합니다."}, status=400)
            
            # 초대 확인
            invitation = models.ProjectInvitation.objects.filter(
                id=invitation_id,
                project_id=project_id
            ).first()
            
            if not invitation:
                return JsonResponse({"message": "초대를 찾을 수 없습니다."}, status=404)
            
            # 권한 확인 (초대자만 취소 가능)
            if invitation.inviter != user:
                return JsonResponse({"message": "초대를 취소할 권한이 없습니다."}, status=403)
            
            # 이미 처리된 초대는 취소 불가
            if invitation.status != 'pending':
                return JsonResponse({"message": f"이미 {invitation.get_status_display()}된 초대는 취소할 수 없습니다."}, status=400)
            
            # 초대 취소
            invitation.status = 'cancelled'
            invitation.save()
            
            # 초대받은 사람이 가입된 사용자인 경우 알림 생성
            try:
                if invitation.invitee:
                    from users.models import Notification
                    Notification.objects.create(
                        recipient=invitation.invitee,
                        notification_type='invitation_cancelled',
                        title='초대가 취소되었습니다',
                        message=f'{invitation.inviter.nickname}님이 "{invitation.project.name}" 프로젝트 초대를 취소했습니다.',
                        project_id=invitation.project.id
                    )
            except Exception as e:
                logger.error(f"초대 취소 알림 생성 중 오류: {str(e)}")
            
            return JsonResponse({"message": "초대를 취소했습니다."}, status=200)
            
        except Exception as e:
            logger.error(f"초대 취소 중 오류: {str(e)}")
            return JsonResponse({"message": "초대 취소 중 오류가 발생했습니다."}, status=500)

    @user_validator
    def post(self, request, project_id):
        """프로젝트 멤버 초대"""
        try:
            user = request.user
            data = json.loads(request.body)
            
            # 필수 필드 확인
            email = data.get('email')
            message = data.get('message', '')
            
            if not email:
                return JsonResponse({"message": "이메일이 필요합니다."}, status=400)
            
            # 프로젝트 확인
            project = models.Project.objects.filter(id=project_id).first()
            if not project:
                return JsonResponse({"message": "프로젝트를 찾을 수 없습니다."}, status=404)
            
            # 권한 확인 (프로젝트 소유자 또는 매니저만 초대 가능)
            is_owner = project.user == user
            is_manager = models.Members.objects.filter(project=project, user=user, rating="manager").exists()
            
            if not is_owner and not is_manager:
                return JsonResponse({"message": "초대 권한이 없습니다."}, status=403)
            
            # 이미 멤버인지 확인
            User = get_user_model()
            invitee_user = User.objects.filter(email=email).first()
            if invitee_user and models.Members.objects.filter(project=project, user=invitee_user).exists():
                return JsonResponse({"message": "이미 프로젝트 멤버입니다."}, status=400)
            
            # 이미 초대되었는지 확인
            existing_invitation = models.ProjectInvitation.objects.filter(
                project=project,
                invitee_email=email,
                status='pending'
            ).first()
            
            if existing_invitation:
                return JsonResponse({"message": "이미 초대를 보냈습니다."}, status=400)
            
            # 초대 토큰 생성
            token = secrets.token_urlsafe(32)
            
            # 초대 생성
            invitation = models.ProjectInvitation.objects.create(
                project=project,
                inviter=user,
                invitee_email=email,
                message=message,
                token=token,
                expires_at=django_timezone.now() + timedelta(days=7),  # 7일 후 만료
                invitee=invitee_user if invitee_user else None
            )
            
            # 이메일 발송 및 알림 생성
            
            # 이메일 발송
            try:
                if hasattr(settings, 'EMAIL_HOST') and settings.EMAIL_HOST:
                    invitation_url = f"{settings.FRONTEND_URL}/invitation/{token}"
                    send_mail(
                        subject=f'프로젝트 "{project.name}" 초대',
                        message=f'{user.nickname or user.username}님이 프로젝트 "{project.name}"에 초대했습니다.\n\n'
                               f'메시지: {message}\n\n'
                               f'초대 수락: {invitation_url}',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[email],
                        fail_silently=True,
                    )
                    logger.info(f"초대 이메일 발송 성공: {email}")
            except Exception as e:
                logger.error(f"초대 이메일 발송 중 오류: {str(e)}")
            
            # 알림 생성 (가입된 사용자인 경우)
            try:
                if invitee_user:
                    from users.models import Notification
                    Notification.objects.create(
                        recipient=invitee_user,
                        notification_type='invitation_received',
                        title='새로운 프로젝트 초대',
                        message=f'{user.nickname or user.username}님이 "{project.name}" 프로젝트에 초대했습니다.',
                        project_id=project.id,
                        invitation_id=invitation.id
                    )
                    logger.info(f"초대 알림 생성 성공: {email}")
            except Exception as e:
                logger.error(f"초대 알림 생성 중 오류: {str(e)}")
            
            # 최근 초대 기록 업데이트
            try:
                from users.models import RecentInvitation
                recent_invitation, created = RecentInvitation.objects.get_or_create(
                    inviter=user,
                    invitee_email=email,
                    defaults={
                        'invitee_name': invitee_user.nickname if invitee_user else '',
                        'project_name': project.name,
                        'invitation_count': 1
                    }
                )
                
                if not created:
                    # 이미 존재하는 경우 카운트 증가
                    recent_invitation.invitation_count += 1
                    recent_invitation.project_name = project.name  # 최근 프로젝트명으로 업데이트
                    recent_invitation.save()
            except Exception as e:
                logger.error(f"최근 초대 기록 업데이트 중 오류: {str(e)}")
            
            # 기존 코드 제거를 위해 주석 처리
            # try:
            #     if hasattr(settings, 'EMAIL_HOST') and settings.EMAIL_HOST:
            #         invitation_url = f"{settings.FRONTEND_URL}/invitation/{token}"
            #         send_mail(
            #             subject=f'프로젝트 "{project.name}" 초대',
            #             message=f'{user.nickname or user.username}님이 프로젝트 "{project.name}"에 초대했습니다.\n\n'
            #                    f'메시지: {message}\n\n'
            #                    f'초대 수락: {invitation_url}',
            #             from_email=settings.DEFAULT_FROM_EMAIL,
            #             recipient_list=[email],
            #             fail_silently=True,
            #         )
            # except Exception as e:
            #     logger.warning(f"Failed to send invitation email: {str(e)}")
            
            return JsonResponse({
                "message": "초대를 보냈습니다.",
                "invitation_id": invitation.id
            }, status=201)
            
        except Exception as e:
            logger.error(f"Error in project invitation: {str(e)}", exc_info=True)
            return JsonResponse({"message": f"초대 중 오류가 발생했습니다: {str(e)}"}, status=500)
    
    @user_validator
    def get(self, request, project_id=None):
        """초대 목록 조회"""
        try:
            user = request.user
            
            if project_id:
                # 특정 프로젝트의 초대 목록
                project = models.Project.objects.filter(id=project_id).first()
                if not project:
                    return JsonResponse({"message": "프로젝트를 찾을 수 없습니다."}, status=404)
                
                # 권한 확인
                is_owner = project.user == user
                is_manager = models.Members.objects.filter(project=project, user=user, rating="manager").exists()
                
                if not is_owner and not is_manager:
                    return JsonResponse({"message": "조회 권한이 없습니다."}, status=403)
                
                invitations = models.ProjectInvitation.objects.filter(project=project).order_by('-created')
            else:
                # 사용자의 모든 초대 (보낸 초대 + 받은 초대)
                sent_invitations = models.ProjectInvitation.objects.filter(inviter=user).order_by('-created')
                received_invitations = models.ProjectInvitation.objects.filter(invitee=user).order_by('-created')
                
                # 이메일 기반 받은 초대도 포함
                received_by_email = models.ProjectInvitation.objects.filter(invitee_email=user.email).order_by('-created')
                
                result = {
                    "sent_invitations": [
                        {
                            "id": inv.id,
                            "project_name": inv.project.name,
                            "project_id": inv.project.id,
                            "invitee_email": inv.invitee_email,
                            "message": inv.message,
                            "status": inv.status,
                            "created": inv.created.isoformat(),
                            "expires_at": inv.expires_at.isoformat(),
                        }
                        for inv in sent_invitations
                    ],
                    "received_invitations": [
                        {
                            "id": inv.id,
                            "project_name": inv.project.name,
                            "project_id": inv.project.id,
                            "inviter_name": inv.inviter.nickname or inv.inviter.username,
                            "message": inv.message,
                            "status": inv.status,
                            "created": inv.created.isoformat(),
                            "expires_at": inv.expires_at.isoformat(),
                        }
                        for inv in list(received_invitations) + list(received_by_email)
                    ]
                }
                
                return JsonResponse(result, status=200)
            
            # 특정 프로젝트 초대 목록
            invitations_data = [
                {
                    "id": inv.id,
                    "invitee_email": inv.invitee_email,
                    "inviter_name": inv.inviter.nickname or inv.inviter.username,
                    "message": inv.message,
                    "status": inv.status,
                    "created": inv.created.isoformat(),
                    "expires_at": inv.expires_at.isoformat(),
                }
                for inv in invitations
            ]
            
            return JsonResponse({"invitations": invitations_data}, status=200)
            
        except Exception as e:
            logger.error(f"Error in invitation list: {str(e)}", exc_info=True)
            return JsonResponse({"message": f"초대 목록 조회 중 오류가 발생했습니다: {str(e)}"}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class InvitationToken(View):
    """토큰으로 초대 정보 조회"""
    
    def get(self, request, token):
        """토큰으로 초대 정보 조회 (로그인 불필요)"""
        try:
            # 토큰으로 초대 확인
            invitation = models.ProjectInvitation.objects.filter(token=token).first()
            
            if not invitation:
                return JsonResponse({"status": "error", "message": "유효하지 않은 초대 링크입니다."}, status=404)
            
            # 만료 확인
            if invitation.expires_at < django_timezone.now():
                return JsonResponse({"status": "error", "message": "만료된 초대 링크입니다."}, status=400)
            
            # 이미 처리된 초대 확인
            if invitation.status != 'pending':
                status_text = {
                    'accepted': '이미 수락된',
                    'declined': '거절된',
                    'cancelled': '취소된'
                }.get(invitation.status, '처리된')
                return JsonResponse({"status": "error", "message": f"{status_text} 초대입니다."}, status=400)
            
            # 초대 정보 반환 (민감한 정보 제외)
            invitation_data = {
                "id": invitation.id,
                "project": {
                    "id": invitation.project.id,
                    "name": invitation.project.name,
                    "description": invitation.project.description,
                    "created": invitation.project.created
                },
                "inviter": {
                    "nickname": invitation.inviter.nickname or invitation.inviter.username,
                    "email": invitation.inviter.email
                },
                "invitee_email": invitation.invitee_email,
                "message": invitation.message,
                "created": invitation.created,
                "expires_at": invitation.expires_at,
                "status": invitation.status
            }
            
            return JsonResponse({
                "status": "success",
                "invitation": invitation_data
            }, status=200)
            
        except Exception as e:
            logger.error(f"토큰으로 초대 정보 조회 중 오류: {str(e)}")
            return JsonResponse({"status": "error", "message": "초대 정보 조회 중 오류가 발생했습니다."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class InvitationResponse(View):
    """초대 수락/거절"""
    
    @user_validator
    def post(self, request, invitation_id):
        """초대 수락/거절"""
        try:
            user = request.user
            data = json.loads(request.body)
            
            action = data.get('action')  # 'accept' or 'decline'
            
            if action not in ['accept', 'decline']:
                return JsonResponse({"message": "잘못된 액션입니다."}, status=400)
            
            # 초대 확인
            invitation = models.ProjectInvitation.objects.filter(id=invitation_id).first()
            if not invitation:
                return JsonResponse({"message": "초대를 찾을 수 없습니다."}, status=404)
            
            # 권한 확인 (초대받은 사람만 수락/거절 가능)
            if invitation.invitee != user and invitation.invitee_email != user.email:
                return JsonResponse({"message": "권한이 없습니다."}, status=403)
            
            # 이미 처리된 초대인지 확인
            if invitation.status != 'pending':
                return JsonResponse({"message": f"이미 {invitation.get_status_display()}된 초대입니다."}, status=400)
            
            # 만료된 초대인지 확인
            if invitation.expires_at < django_timezone.now():
                invitation.status = 'expired'
                invitation.save()
                return JsonResponse({"message": "만료된 초대입니다."}, status=400)
            
            # 초대 처리
            from .email_service import ProjectInvitationEmailService
            from .notification_service import NotificationService
            
            if action == 'accept':
                # 프로젝트 멤버로 추가
                member, created = models.Members.objects.get_or_create(
                    project=invitation.project,
                    user=user,
                    defaults={'rating': 'member'}
                )
                
                invitation.status = 'accepted'
                invitation.accepted_at = django_timezone.now()
                invitation.invitee = user  # 사용자 연결
                invitation.save()
                
                # 초대자에게 알림 및 이메일 발송
                try:
                    # 알림 생성
                    NotificationService.notify_invitation_accepted(invitation)
                    # 이메일 발송
                    ProjectInvitationEmailService.send_invitation_accepted_email(invitation)
                    # 프로젝트 멤버들에게 새 멤버 참여 알림
                    NotificationService.notify_member_joined(invitation.project, user)
                except Exception as e:
                    logger.error(f"초대 수락 알림/이메일 발송 중 오류: {str(e)}")
                
                return JsonResponse({"message": "초대를 수락했습니다."}, status=200)
            
            else:  # decline
                invitation.status = 'declined'
                invitation.declined_at = django_timezone.now()
                invitation.invitee = user  # 사용자 연결
                invitation.save()
                
                # 초대자에게 알림 및 이메일 발송
                try:
                    # 알림 생성
                    NotificationService.notify_invitation_declined(invitation)
                    # 이메일 발송
                    ProjectInvitationEmailService.send_invitation_declined_email(invitation)
                except Exception as e:
                    logger.error(f"초대 거절 알림/이메일 발송 중 오류: {str(e)}")
                
                # 기존 알림 코드 제거
                # from users.models import Notification
                # Notification.objects.create(
                #     recipient=invitation.inviter,
                #     notification_type='invitation_declined',
                #     title=f'초대 거절',
                #     message=f'{user.nickname or user.username}님이 프로젝트 "{invitation.project.name}" 초대를 거절했습니다.',
                #     project_id=invitation.project.id,
                #     invitation_id=invitation.id,
                #     extra_data={
                #         'decliner_name': user.nickname or user.username,
                #         'project_name': invitation.project.name
                #     }
                # )
                
                return JsonResponse({"message": "초대를 거절했습니다."}, status=200)
            
        except Exception as e:
            logger.error(f"Error in invitation response: {str(e)}", exc_info=True)
            return JsonResponse({"message": f"초대 처리 중 오류가 발생했습니다: {str(e)}"}, status=500)

