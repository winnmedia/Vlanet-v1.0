import logging, json
from django.conf import settings
from datetime import datetime
from django.shortcuts import render
from django.utils import timezone
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from users.utils import user_validator
from . import models
from feedbacks import models as feedback_model
from .utils_date import parse_date_flexible
from django.db import transaction, IntegrityError
from django.utils import timezone as django_timezone
from django.core.cache import cache

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class CreateProjectFixedFinal(View):
    """최종 수정된 안전한 프로젝트 생성 뷰"""
    
    @user_validator
    def post(self, request):
        try:
            user = request.user
            logger.info(f"[CreateProjectFixedFinal] Creating project for user: {user.username}")
            
            # FormData 처리
            inputs_raw = request.POST.get("inputs")
            process_raw = request.POST.get("process")
            
            if not inputs_raw:
                return JsonResponse({
                    "message": "프로젝트 정보가 누락되었습니다.",
                    "code": "MISSING_INPUTS"
                }, status=400)
                
            if not process_raw:
                return JsonResponse({
                    "message": "프로세스 정보가 누락되었습니다.",
                    "code": "MISSING_PROCESS"
                }, status=400)
            
            # JSON 파싱
            try:
                project_inputs = json.loads(inputs_raw)
                process_data = json.loads(process_raw)
                logger.info(f"[CreateProjectFixedFinal] Parsed inputs: {project_inputs}")
                logger.info(f"[CreateProjectFixedFinal] Parsed process: {process_data}")
            except json.JSONDecodeError as e:
                logger.error(f"[CreateProjectFixedFinal] JSON decode error: {str(e)}")
                return JsonResponse({
                    "message": "잘못된 데이터 형식입니다.",
                    "code": "INVALID_JSON"
                }, status=400)
            
            # 프로젝트 이름 확인
            project_name = project_inputs.get('name', '').strip()
            if not project_name:
                return JsonResponse({
                    "message": "프로젝트 이름을 입력해주세요.",
                    "code": "MISSING_PROJECT_NAME"
                }, status=400)
            
            # 멱등성 키 확인 (데이터베이스 기반)
            idempotency_key = request.headers.get('X-Idempotency-Key')
            if idempotency_key:
                # 최근 1분 내 같은 사용자의 프로젝트 확인
                recent_request = models.Project.objects.filter(
                    user=user,
                    created__gte=django_timezone.now() - django_timezone.timedelta(minutes=1)
                ).first()
                
                if recent_request:
                    logger.info(f"[CreateProjectFixedFinal] Found recent project, likely duplicate request")
                    return JsonResponse({
                        "message": "success",
                        "project_id": recent_request.id,
                        "project_name": recent_request.name,
                        "created_at": recent_request.created.isoformat()
                    })
            
            # 중복 프로젝트 확인 (최근 10초 내)
            recent_duplicate = models.Project.objects.filter(
                user=user,
                name=project_name,
                created__gte=django_timezone.now() - django_timezone.timedelta(seconds=10)
            ).exists()
            
            if recent_duplicate:
                logger.warning(f"[CreateProjectFixedFinal] Recent duplicate detected: {project_name}")
                return JsonResponse({
                    "message": "동일한 프로젝트가 방금 생성되었습니다. 잠시 후 다시 시도해주세요.",
                    "code": "RECENT_DUPLICATE"
                }, status=400)
            
            # 원자적 프로젝트 생성
            try:
                with transaction.atomic():
                    # 1. 프로젝트 생성
                    project = models.Project.objects.create(user=user)
                    logger.info(f"[CreateProjectFixedFinal] Created project with ID: {project.id}")
                    
                    # 2. 프로젝트 정보 설정
                    for key, value in project_inputs.items():
                        if hasattr(project, key):
                            setattr(project, key, value)
                            logger.debug(f"[CreateProjectFixedFinal] Set {key} = {value}")
                    
                    # 3. 프로세스 단계 생성
                    phase_models = {
                        'basic_plan': models.BasicPlan,
                        'story_board': models.Storyboard,  # 실제 모델명은 Storyboard
                        'filming': models.Filming,
                        'video_edit': models.VideoEdit,
                        'post_work': models.PostWork,
                        'video_preview': models.VideoPreview,
                        'confirmation': models.Confirmation,
                        'video_delivery': models.VideoDelivery,
                    }
                    
                    for phase_name, phase_info in process_data.items():
                        if phase_name in phase_models and isinstance(phase_info, dict):
                            phase_model = phase_models[phase_name]
                            
                            start_date = phase_info.get('start_date')
                            end_date = phase_info.get('end_date')
                            
                            if start_date and end_date:
                                try:
                                    start_date = parse_date_flexible(start_date)
                                    end_date = parse_date_flexible(end_date)
                                    
                                    phase_obj = phase_model.objects.create(
                                        start_date=start_date,
                                        end_date=end_date
                                    )
                                    setattr(project, phase_name, phase_obj)
                                    logger.info(f"[CreateProjectFixedFinal] Created {phase_name}: {start_date} ~ {end_date}")
                                except ValueError as e:
                                    logger.error(f"[CreateProjectFixedFinal] Date parsing error for {phase_name}: {e}")
                                    continue
                    
                    # 4. 피드백 객체 생성 (안전하게)
                    try:
                        feedback = feedback_model.FeedBack.objects.create()
                        project.feedback = feedback
                        logger.info(f"[CreateProjectFixedFinal] Created feedback with ID: {feedback.id}")
                    except Exception as e:
                        logger.warning(f"[CreateProjectFixedFinal] Feedback creation failed, continuing without: {e}")
                    
                    # 5. 프로젝트 저장
                    project.save()
                    logger.info(f"[CreateProjectFixedFinal] Project saved successfully: {project.name}")
                    
                    # 성공 응답 데이터
                    response_data = {
                        "message": "success",
                        "project_id": project.id,
                        "project_name": project.name,
                        "created_at": project.created.isoformat()
                    }
                    
                    # 성공 로그
                    logger.info(f"[CreateProjectFixedFinal] Project creation completed successfully")
                    return JsonResponse(response_data, status=201)
                    
            except IntegrityError as e:
                logger.warning(f"[CreateProjectFixedFinal] IntegrityError (likely duplicate): {str(e)}")
                
                # 중복 확인
                existing = models.Project.objects.filter(user=user, name=project_name).first()
                if existing:
                    return JsonResponse({
                        "message": "이미 같은 이름의 프로젝트가 존재합니다.",
                        "code": "DUPLICATE_PROJECT",
                        "existing_project_id": existing.id
                    }, status=400)
                else:
                    raise  # 다른 IntegrityError면 다시 발생
                    
            except Exception as e:
                logger.error(f"[CreateProjectFixedFinal] Unexpected error: {str(e)}", exc_info=True)
                return JsonResponse({
                    "message": f"프로젝트 생성 중 오류가 발생했습니다: {str(e)}",
                    "code": "CREATION_ERROR"
                }, status=500)
                
        except Exception as e:
            logger.error(f"[CreateProjectFixedFinal] Top-level error: {str(e)}", exc_info=True)
            return JsonResponse({
                "message": "서버 오류가 발생했습니다.",
                "code": "SERVER_ERROR"
            }, status=500)