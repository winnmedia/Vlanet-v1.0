"""
최종 개선된 멱등성 프로젝트 생성 뷰
날짜 파싱 에러 시에도 멱등성이 유지되도록 개선
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
class CreateProjectIdempotentFinal(View):
    """최종 개선된 멱등성 프로젝트 생성 뷰"""
    
    def is_cache_available(self):
        """캐시가 실제로 작동하는지 확인"""
        try:
            test_key = 'test_cache_availability'
            cache.set(test_key, 'test', 1)
            result = cache.get(test_key)
            # cache._cache 접근 대신 설정에서 확인
            from django.conf import settings
            cache_backend = settings.CACHES.get('default', {}).get('BACKEND', '')
            is_dummy = 'DummyCache' in cache_backend
            return result == 'test' and not is_dummy
        except:
            return False
    
    def validate_process_dates(self, process):
        """프로세스 날짜들을 미리 검증"""
        validated_process = []
        for i, proc in enumerate(process):
            key = proc.get("key")
            start_date_str = proc.get("startDate")
            end_date_str = proc.get("endDate")
            
            try:
                start_date = parse_date_flexible(start_date_str)
                end_date = parse_date_flexible(end_date_str)
                
                validated_process.append({
                    "key": key,
                    "startDate": start_date,
                    "endDate": end_date,
                    "startDate_str": start_date_str,
                    "endDate_str": end_date_str
                })
            except ValueError as e:
                logger.error(f"Date validation error for {key}: {str(e)}")
                logger.error(f"Start date: {start_date_str}, End date: {end_date_str}")
                raise ValueError(f"{key} 단계의 날짜 형식이 올바르지 않습니다: {str(e)}")
        
        return validated_process
    
    @user_validator
    def post(self, request):
        idempotency_record = None
        try:
            user = request.user
            # request.FILES가 None인 경우 처리
            files = request.FILES.getlist("files") if request.FILES else []
            inputs = json.loads(request.POST.get("inputs", "{}"))
            process = json.loads(request.POST.get("process", "[]"))
            
            # 로깅
            logger.info(f"[CreateProjectFinal] Request from user {user.id} ({user.username})")
            logger.info(f"[CreateProjectFinal] Project name: {inputs.get('name', 'Unknown')}")
            
            # 멱등성 키 처리
            idempotency_key = request.META.get('HTTP_X_IDEMPOTENCY_KEY')
            if not idempotency_key:
                key_source = f"{user.id}_{inputs.get('name', '')}_{json.dumps(inputs, sort_keys=True)}"
                idempotency_key = hashlib.md5(key_source.encode()).hexdigest()
                logger.warning(f"[CreateProjectFinal] No idempotency key provided, generated: {idempotency_key}")
            else:
                logger.info(f"[CreateProjectFinal] Received idempotency key: {idempotency_key}")
            
            # 1차 체크: 최근 5초 내 동일한 프로젝트명
            recent_project = models.Project.objects.filter(
                user=user,
                name=inputs.get('name', ''),
                created__gte=datetime.now() - timedelta(seconds=5)
            ).first()
            
            if recent_project:
                logger.warning(f"[CreateProjectFinal] Recent duplicate found: project {recent_project.id}")
                return JsonResponse({
                    "message": "success",
                    "project_id": recent_project.id,
                    "duplicate_prevented": True,
                    "method": "recent_check"
                }, status=200)
            
            # 날짜 검증을 먼저 수행 (트랜잭션 밖에서)
            try:
                validated_process = self.validate_process_dates(process)
                logger.info("[CreateProjectFinal] All dates validated successfully")
            except ValueError as e:
                logger.error(f"[CreateProjectFinal] Date validation failed: {str(e)}")
                # 날짜 검증 실패 시 멱등성 레코드를 생성하지 않음
                return JsonResponse({
                    "message": str(e),
                    "error": "date_validation_failed"
                }, status=400)
            
            # 2차 체크: 데이터베이스 기반 멱등성 레코드
            try:
                # 기존 레코드 확인
                idempotency_record = models.IdempotencyRecord.objects.filter(
                    user=user,
                    idempotency_key=idempotency_key
                ).first()
                
                if idempotency_record:
                    if idempotency_record.status == 'processing':
                        logger.info(f"[CreateProjectFinal] Request still processing")
                        return JsonResponse({
                            "message": "요청이 처리 중입니다. 잠시만 기다려주세요.",
                            "status": "processing"
                        }, status=202)
                    elif idempotency_record.status == 'completed' and idempotency_record.project_id:
                        logger.info(f"[CreateProjectFinal] Duplicate request, returning existing project {idempotency_record.project_id}")
                        return JsonResponse({
                            "message": "success",
                            "project_id": idempotency_record.project_id,
                            "duplicate_prevented": True,
                            "method": "idempotency_record"
                        }, status=200)
                    elif idempotency_record.status == 'failed':
                        # 이전에 실패한 요청이면 재시도 허용
                        logger.info(f"[CreateProjectFinal] Previous request failed, retrying")
                        idempotency_record.status = 'processing'
                        idempotency_record.save()
                
                # 새 레코드 생성
                if not idempotency_record:
                    idempotency_record = models.IdempotencyRecord.objects.create(
                        user=user,
                        idempotency_key=idempotency_key,
                        request_data=json.dumps({'inputs': inputs, 'process': process}),
                        status='processing'
                    )
            except Exception as e:
                logger.error(f"[CreateProjectFinal] Error with idempotency record: {e}")
            
            # 3차 체크: 캐시 기반 (가능한 경우)
            cache_available = self.is_cache_available()
            cache_key = f"project_creation_{idempotency_key}"
            
            if cache_available:
                cached_response = cache.get(cache_key)
                if cached_response and isinstance(cached_response, dict):
                    logger.info(f"[CreateProjectFinal] Cache hit for key: {idempotency_key}")
                    return JsonResponse(cached_response, status=200)
                cache.set(cache_key, {"message": "processing"}, 30)
            
            # 프로젝트 생성
            project = None
            try:
                with transaction.atomic():
                    project = models.Project.objects.create(user=user)
                    for k, v in inputs.items():
                        setattr(project, k, v)
                    
                    logger.info(f"[CreateProjectFinal] Creating project with ID: {project.id}")
                    
                    # 검증된 프로세스 데이터 사용
                    for proc in validated_process:
                        key = proc["key"]
                        start_date = proc["startDate"]
                        end_date = proc["endDate"]
                        
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
                
                # 트랜잭션 성공 후 멱등성 레코드 업데이트
                if idempotency_record and project:
                    idempotency_record.project_id = project.id
                    idempotency_record.status = 'completed'
                    idempotency_record.save()
                
            except Exception as e:
                logger.error(f"[CreateProjectFinal] Error in transaction: {str(e)}")
                # 트랜잭션 실패 시 멱등성 레코드를 failed로 표시
                if idempotency_record:
                    idempotency_record.status = 'failed'
                    idempotency_record.save()
                raise
            
            # FeedBack 생성 시도 (트랜잭션 밖)
            try:
                from feedbacks import models as feedback_model
                feedback = feedback_model.FeedBack.objects.create()
                project.feedback = feedback
                project.save()
                logger.info("[CreateProjectFinal] FeedBack created successfully")
            except Exception as e:
                logger.warning(f"[CreateProjectFinal] Could not create FeedBack: {str(e)}")
            
            # 성공 응답
            response_data = {
                "message": "success",
                "project_id": project.id
            }
            
            # 캐시가 가능하면 저장
            if cache_available:
                cache.set(cache_key, response_data, 300)
            
            logger.info(f"[CreateProjectFinal] === PROJECT CREATION SUCCESS ===")
            logger.info(f"[CreateProjectFinal] Project ID: {project.id}")
            logger.info(f"[CreateProjectFinal] Project name: {project.name}")
            
            return JsonResponse(response_data, status=200)
            
        except Exception as e:
            logger.error(f"[CreateProjectFinal] Error creating project: {str(e)}")
            logger.error(f"[CreateProjectFinal] Error type: {type(e).__name__}")
            import traceback
            logger.error(f"[CreateProjectFinal] Traceback: {traceback.format_exc()}")
            
            # 에러 타입에 따른 처리
            error_message = str(e)
            if "날짜" in error_message:
                status_code = 400
            else:
                status_code = 500
                error_message = f"프로젝트 생성 중 오류가 발생했습니다: {error_message}"
            
            return JsonResponse({"message": error_message}, status=status_code)