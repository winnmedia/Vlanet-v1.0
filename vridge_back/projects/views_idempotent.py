"""
프로젝트 생성 시 멱등성을 보장하는 뷰
"""
import logging
import json
import random
import hashlib
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views import View
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
from users.utils import user_validator
from . import models
from .utils_date import parse_date_flexible

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class CreateProjectIdempotent(View):
    """멱등성을 보장하는 프로젝트 생성 뷰"""
    
    @user_validator
    def post(self, request):
        try:
            user = request.user
            # request.FILES가 None인 경우 처리
            files = request.FILES.getlist("files") if request.FILES else []
            inputs = json.loads(request.POST.get("inputs", "{}"))
            process = json.loads(request.POST.get("process", "[]"))
            
            # 멱등성 키 생성 (사용자 ID + 프로젝트 이름 + 요청 시간)
            idempotency_key = request.META.get('HTTP_X_IDEMPOTENCY_KEY')
            if not idempotency_key:
                # 클라이언트가 키를 제공하지 않은 경우, 요청 내용으로 생성
                key_source = f"{user.id}_{inputs.get('name', '')}_{json.dumps(inputs, sort_keys=True)}"
                idempotency_key = hashlib.md5(key_source.encode()).hexdigest()
                logger.warning(f"No idempotency key provided, generated: {idempotency_key}")
            else:
                logger.info(f"Received idempotency key: {idempotency_key}")
            
            # 추가: 같은 이름의 프로젝트가 최근 5초 내에 생성되었는지 확인
            recent_project = models.Project.objects.filter(
                user=user,
                name=inputs.get('name', ''),
                created__gte=datetime.now() - timedelta(seconds=5)
            ).first()
            
            if recent_project:
                logger.warning(f"[ProjectDetail.create] Duplicate project detected within 5 seconds")
                logger.warning(f"Existing project: {recent_project.id} created at {recent_project.created}")
                return JsonResponse({
                    "message": "success",
                    "project_id": recent_project.id,
                    "duplicate_prevented": True
                }, status=200)
            
            # 캐시 키
            cache_key = f"project_creation_{idempotency_key}"
            
            # 이미 처리된 요청인지 확인
            cached_response = cache.get(cache_key)
            if cached_response:
                logger.warning(f"DUPLICATE REQUEST DETECTED! Key: {idempotency_key}")
                logger.warning(f"Cached response: {cached_response}")
                logger.warning(f"Request from user: {user.id} ({user.email})")
                logger.warning(f"Project name: {inputs.get('name', 'Unknown')}")
                
                # 처리 중인 경우와 완료된 경우를 구분
                if cached_response.get("message") == "processing":
                    return JsonResponse({"message": "요청이 처리 중입니다. 잠시만 기다려주세요."}, status=202)
                else:
                    return JsonResponse(cached_response, status=200)
            
            # 처리 중 표시 (30초 동안 유지)
            cache.set(cache_key, {"message": "processing"}, 30)

            logger.info(f"=== NEW PROJECT CREATION START ===")
            logger.info(f"User: {user.id} ({user.email})")
            logger.info(f"Project name: {inputs.get('name', 'Unknown')}")
            logger.info(f"Idempotency key: {idempotency_key}")
            logger.info(f"Origin: {request.META.get('HTTP_ORIGIN', 'Unknown')}")
            logger.info(f"Referer: {request.META.get('HTTP_REFERER', 'Unknown')}")
            
            with transaction.atomic():
                project = models.Project.objects.create(user=user)
                for k, v in inputs.items():
                    setattr(project, k, v)
                
                logger.info(f"Project created with ID: {project.id}")
                logger.info(f"Creating project with inputs: {inputs}")
                logger.info(f"Process data: {process}")

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
                        cache.delete(cache_key)  # 에러 시 캐시 삭제
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

                # FeedBack 생성을 완전히 건너뛰기
                logger.info("Skipping FeedBack creation due to database schema mismatch")
                
                project.color = "".join(
                    ["#" + "".join([random.choice("0123456789ABCDEF") for j in range(6)])]
                )
                project.save()

                file_obj = []
                for f in files:
                    file_obj.append(models.File(project=project, files=f))

                models.File.objects.bulk_create(file_obj)
                
                # 프로젝트 생성자를 멤버로 추가
                models.Members.objects.create(
                    project=project,
                    user=user,
                    rating="owner"
                )

            # FeedBack 생성을 트랜잭션 밖에서 시도
            try:
                from feedbacks import models as feedback_model
                feedback = feedback_model.FeedBack.objects.create()
                project.feedback = feedback
                project.save()
                logger.info("FeedBack created successfully after transaction")
            except Exception as e:
                logger.warning(f"Could not create FeedBack (non-critical): {str(e)}")

            # 성공 응답을 캐시에 저장 (5분간 유지)
            response_data = {
                "message": "success",
                "project_id": project.id
            }
            cache.set(cache_key, response_data, 300)
            
            logger.info(f"=== PROJECT CREATION SUCCESS ===")
            logger.info(f"Project ID: {project.id}")
            logger.info(f"Project name: {project.name}")
            logger.info(f"Idempotency key: {idempotency_key}")
            logger.info(f"Response cached for 5 minutes")
            
            return JsonResponse(response_data, status=200)
            
        except Exception as e:
            logger.error(f"Project creation error: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            # 에러 시 캐시 삭제
            if 'cache_key' in locals():
                cache.delete(cache_key)
            
            # 더 구체적인 에러 메시지 반환
            if "key" in str(e):
                return JsonResponse({"message": "프로젝트 단계 정보가 올바르지 않습니다."}, status=400)
            elif "date" in str(e).lower():
                return JsonResponse({"message": "날짜 형식이 올바르지 않습니다."}, status=400)
            else:
                return JsonResponse({"message": f"프로젝트 생성 중 오류가 발생했습니다: {str(e)}"}, status=500)