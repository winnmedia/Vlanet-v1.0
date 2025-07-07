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
from django.db import transaction, IntegrityError, connection
from django.utils import timezone as django_timezone
from django.core.cache import cache

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class CreateProjectColumnSafe(View):
    """컬럼 누락 문제에 안전한 프로젝트 생성 뷰"""
    
    @user_validator
    def post(self, request):
        try:
            user = request.user
            logger.info(f"[CreateProjectColumnSafe] Creating project for user: {user.username}")
            
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
                logger.info(f"[CreateProjectColumnSafe] Parsed inputs: {project_inputs}")
                logger.info(f"[CreateProjectColumnSafe] Parsed process: {process_data}")
            except json.JSONDecodeError as e:
                logger.error(f"[CreateProjectColumnSafe] JSON parse error: {e}")
                return JsonResponse({
                    "message": "잘못된 데이터 형식입니다.",
                    "code": "INVALID_JSON"
                }, status=400)
            
            # 필수 필드 검증
            required_fields = ['name', 'manager', 'consumer']
            missing_fields = [field for field in required_fields if not project_inputs.get(field)]
            
            if missing_fields:
                return JsonResponse({
                    "message": f"필수 필드가 누락되었습니다: {', '.join(missing_fields)}",
                    "code": "MISSING_REQUIRED_FIELDS"
                }, status=400)
            
            project_name = project_inputs.get('name', '').strip()
            
            # 원자적 프로젝트 생성
            try:
                with transaction.atomic():
                    # 1. 프로젝트 생성
                    project = models.Project.objects.create(user=user)
                    logger.info(f"[CreateProjectColumnSafe] Created project with ID: {project.id}")
                    
                    # 2. 현재 테이블에 실제로 존재하는 컬럼 확인
                    existing_columns = []
                    with connection.cursor() as cursor:
                        cursor.execute("""
                            SELECT column_name 
                            FROM information_schema.columns 
                            WHERE table_name = 'projects_project'
                        """)
                        existing_columns = [row[0] for row in cursor.fetchall()]
                    
                    logger.info(f"[CreateProjectColumnSafe] Existing columns: {existing_columns}")
                    
                    # 3. 안전한 필드만 설정
                    safe_fields = ['name', 'manager', 'consumer', 'description', 'color']
                    optional_fields = ['tone_manner', 'genre', 'concept']
                    
                    for key, value in project_inputs.items():
                        if key in safe_fields:
                            if hasattr(project, key):
                                setattr(project, key, value)
                                logger.debug(f"[CreateProjectColumnSafe] Set {key} = {value}")
                        elif key in optional_fields:
                            # 컬럼이 존재하는 경우에만 설정
                            if key in existing_columns and hasattr(project, key):
                                setattr(project, key, value)
                                logger.debug(f"[CreateProjectColumnSafe] Set optional {key} = {value}")
                            else:
                                logger.warning(f"[CreateProjectColumnSafe] Column {key} does not exist, skipping")
                    
                    # 4. 프로세스 단계 생성
                    phase_models = {
                        'basic_plan': models.BasicPlan,
                        'story_board': models.Storyboard,
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
                                    logger.info(f"[CreateProjectColumnSafe] Created {phase_name} phase")
                                except Exception as e:
                                    logger.error(f"[CreateProjectColumnSafe] Failed to create {phase_name}: {e}")
                    
                    # 5. 피드백 생성
                    try:
                        feedback = feedback_model.Feedback.objects.create()
                        project.feedback = feedback
                        logger.info(f"[CreateProjectColumnSafe] Created feedback with ID: {feedback.id}")
                    except Exception as e:
                        logger.error(f"[CreateProjectColumnSafe] Failed to create feedback: {e}")
                    
                    # 6. 최종 저장
                    project.save()
                    logger.info(f"[CreateProjectColumnSafe] Project saved successfully: {project.name}")
                    
                    # 성공 응답
                    return JsonResponse({
                        "message": "success",
                        "project_id": project.id,
                        "project_name": project.name
                    }, status=201)
                    
            except IntegrityError as e:
                if 'unique_user_project_name' in str(e) or '이미 같은 이름의 프로젝트가 존재합니다' in str(e):
                    logger.warning(f"[CreateProjectColumnSafe] Duplicate project name: {project_name}")
                    return JsonResponse({
                        "message": "이미 같은 이름의 프로젝트가 존재합니다.",
                        "code": "DUPLICATE_PROJECT_NAME"
                    }, status=400)
                else:
                    logger.error(f"[CreateProjectColumnSafe] Database integrity error: {e}")
                    return JsonResponse({
                        "message": "프로젝트 생성 중 오류가 발생했습니다.",
                        "code": "DATABASE_ERROR"
                    }, status=500)
            
        except Exception as e:
            logger.error(f"[CreateProjectColumnSafe] Unexpected error: {e}")
            return JsonResponse({
                "message": f"프로젝트 생성 중 오류가 발생했습니다: {str(e)}",
                "code": "UNEXPECTED_ERROR"
            }, status=500)