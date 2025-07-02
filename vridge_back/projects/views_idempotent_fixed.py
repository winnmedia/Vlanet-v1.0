"""
개선된 멱등성 프로젝트 생성 뷰 - 캐시 없이도 작동
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
from django.core.cache.backends.dummy import DummyCache
from users.utils import user_validator
from . import models
from .utils_date import parse_date_flexible

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class CreateProjectIdempotentFixed(View):
    """캐시 없이도 작동하는 개선된 멱등성 프로젝트 생성 뷰"""
    
    def is_cache_available(self):
        """캐시가 실제로 작동하는지 확인"""
        try:
            test_key = 'test_cache_availability'
            cache.set(test_key, 'test', 1)
            result = cache.get(test_key)
            return result == 'test' and not isinstance(cache._cache, DummyCache)
        except:
            return False
    
    @user_validator
    def post(self, request):
        try:
            user = request.user
            # request.FILES가 None인 경우 처리
            files = request.FILES.getlist("files") if request.FILES else []
            inputs = json.loads(request.POST.get("inputs", "{}"))
            process = json.loads(request.POST.get("process", "[]"))
            
            # 로깅
            logger.info(f"[CreateProjectFixed] Request from user {user.id} ({user.username})")
            logger.info(f"[CreateProjectFixed] Project name: {inputs.get('name', 'Unknown')}")
            logger.info(f"[CreateProjectFixed] Origin: {request.META.get('HTTP_ORIGIN', 'Unknown')}")
            
            # 멱등성 키 처리
            idempotency_key = request.META.get('HTTP_X_IDEMPOTENCY_KEY')
            if not idempotency_key:
                key_source = f"{user.id}_{inputs.get('name', '')}_{json.dumps(inputs, sort_keys=True)}"
                idempotency_key = hashlib.md5(key_source.encode()).hexdigest()
                logger.warning(f"[CreateProjectFixed] No idempotency key provided, generated: {idempotency_key}")
            else:
                logger.info(f"[CreateProjectFixed] Received idempotency key: {idempotency_key}")
            
            # 1차 체크: 최근 5초 내 동일한 프로젝트명
            recent_project = models.Project.objects.filter(
                user=user,
                name=inputs.get('name', ''),
                created__gte=datetime.now() - timedelta(seconds=5)
            ).first()
            
            if recent_project:
                logger.warning(f"[CreateProjectFixed] Recent duplicate found: project {recent_project.id}")
                return JsonResponse({
                    "message": "success",
                    "project_id": recent_project.id,
                    "duplicate_prevented": True,
                    "method": "recent_check"
                }, status=200)
            
            # 2차 체크: 데이터베이스 기반 멱등성 레코드
            try:
                # 기존 레코드 확인
                idempotency_record = models.IdempotencyRecord.objects.filter(
                    user=user,
                    idempotency_key=idempotency_key
                ).first()
                
                if idempotency_record:
                    if idempotency_record.status == 'processing':
                        # 아직 처리 중
                        logger.info(f"[CreateProjectFixed] Request still processing")
                        return JsonResponse({
                            "message": "요청이 처리 중입니다. 잠시만 기다려주세요.",
                            "status": "processing"
                        }, status=202)
                    elif idempotency_record.status == 'completed' and idempotency_record.project_id:
                        # 이미 완료됨
                        logger.info(f"[CreateProjectFixed] Duplicate request, returning existing project {idempotency_record.project_id}")
                        return JsonResponse({
                            "message": "success",
                            "project_id": idempotency_record.project_id,
                            "duplicate_prevented": True,
                            "method": "idempotency_record"
                        }, status=200)
                
                # 새 레코드 생성
                if not idempotency_record:
                    idempotency_record = models.IdempotencyRecord.objects.create(
                        user=user,
                        idempotency_key=idempotency_key,
                        request_data=json.dumps({'inputs': inputs, 'process': process}),
                        status='processing'
                    )
            except Exception as e:
                logger.error(f"[CreateProjectFixed] Error with idempotency record: {e}")
            
            # 3차 체크: 캐시 기반 (가능한 경우)
            cache_available = self.is_cache_available()
            if cache_available:
                cache_key = f"project_creation_{idempotency_key}"
                cached_response = cache.get(cache_key)
                if cached_response and isinstance(cached_response, dict):
                    logger.info(f"[CreateProjectFixed] Cache hit for key: {idempotency_key}")
                    return JsonResponse(cached_response, status=200)
                # 캐시에 처리 중 표시
                cache.set(cache_key, {"message": "processing"}, 30)
            else:
                logger.warning("[CreateProjectFixed] Cache not available, using database only")
            
            # 프로젝트 생성
            with transaction.atomic():
                project = models.Project.objects.create(user=user)
                for k, v in inputs.items():
                    setattr(project, k, v)
                
                logger.info(f"[CreateProjectFixed] Creating project with ID: {project.id}")
                
                # 프로세스 처리
                for i in process:
                    key = i.get("key")
                    start_date = i.get("startDate")
                    end_date = i.get("endDate")
                    
                    try:
                        start_date = parse_date_flexible(start_date)
                        end_date = parse_date_flexible(end_date)
                    except ValueError as e:
                        logger.error(f"Date parsing error for {key}: {str(e)}")
                        
                        # 롤백을 위해 멱등성 레코드 삭제
                        if 'idempotency_record' in locals():
                            idempotency_record.delete()
                        
                        return JsonResponse({
                            "message": f"{key} 단계의 날짜 형식이 올바르지 않습니다.",
                            "error": str(e)
                        }, status=400)
                    
                    # 각 프로세스 생성
                    if key == "basic_plan":
                        basic_plan = models.BasicPlan.objects.create(start_date=start_date, end_date=end_date)
                        setattr(project, key, basic_plan)
                    elif key == "story_board":
                        story_board = models.Storyboard.objects.create(start_date=start_date, end_date=end_date)
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
                        video_preview = models.VideoPreview.objects.create(start_date=start_date, end_date=end_date)
                        setattr(project, key, video_preview)
                    elif key == "confirmation":
                        confirmation = models.Confirmation.objects.create(start_date=start_date, end_date=end_date)
                        setattr(project, key, confirmation)
                    elif key == "video_delivery":
                        video_delivery = models.VideoDelivery.objects.create(start_date=start_date, end_date=end_date)
                        setattr(project, key, video_delivery)
                
                # 색상 설정
                project.color = "".join(
                    ["#" + "".join([random.choice("0123456789ABCDEF") for j in range(6)])]
                )
                project.save()
                
                # 파일 처리
                file_obj = []
                for f in files:
                    file_obj.append(models.File(project=project, files=f))
                models.File.objects.bulk_create(file_obj)
                
                # 멤버 추가
                models.Members.objects.create(
                    project=project,
                    user=user,
                    rating="owner"
                )
                
                # 멱등성 레코드 업데이트
                if 'idempotency_record' in locals():
                    idempotency_record.project_id = project.id
                    idempotency_record.status = 'completed'
                    idempotency_record.save()
            
            # FeedBack 생성 시도 (트랜잭션 밖)
            try:
                from feedbacks import models as feedback_model
                feedback = feedback_model.FeedBack.objects.create()
                project.feedback = feedback
                project.save()
                logger.info("[CreateProjectFixed] FeedBack created successfully")
            except Exception as e:
                logger.warning(f"[CreateProjectFixed] Could not create FeedBack: {str(e)}")
            
            # 성공 응답
            response_data = {
                "message": "success",
                "project_id": project.id
            }
            
            # 캐시가 가능하면 저장
            if cache_available:
                cache.set(cache_key, response_data, 300)
            
            logger.info(f"[CreateProjectFixed] === PROJECT CREATION SUCCESS ===")
            logger.info(f"[CreateProjectFixed] Project ID: {project.id}")
            logger.info(f"[CreateProjectFixed] Project name: {project.name}")
            
            return JsonResponse(response_data, status=200)
            
        except Exception as e:
            logger.error(f"[CreateProjectFixed] Error creating project: {str(e)}")
            logger.error(f"[CreateProjectFixed] Error type: {type(e).__name__}")
            import traceback
            logger.error(f"[CreateProjectFixed] Traceback: {traceback.format_exc()}")
            
            # 에러 시 멱등성 레코드 정리
            if 'idempotency_record' in locals():
                idempotency_record.delete()
            
            return JsonResponse({"message": f"프로젝트 생성 중 오류가 발생했습니다: {str(e)}"}, status=500)