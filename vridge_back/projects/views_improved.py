"""
개선된 프로젝트 생성 뷰 - 더 나은 에러 처리와 디버깅
"""
import logging
import json
import random
from datetime import datetime
from django.utils import timezone
from django.http import JsonResponse
from django.views import View
from django.db import transaction
from users.utils import user_validator
from . import models
from feedbacks import models as feedback_model

logger = logging.getLogger(__name__)


class CreateProjectImproved(View):
    """개선된 프로젝트 생성 뷰"""
    
    @user_validator
    def post(self, request):
        logger.info(f"Project creation started by user: {request.user.username}")
        
        try:
            user = request.user
            
            # 요청 데이터 파싱
            try:
                files = request.FILES.getlist("files")
                inputs = json.loads(request.POST.get("inputs", "{}"))
                process = json.loads(request.POST.get("process", "[]"))
            except (json.JSONDecodeError, TypeError) as e:
                logger.error(f"JSON parsing error: {str(e)}")
                return JsonResponse({
                    "message": "요청 데이터 형식이 올바르지 않습니다.",
                    "error": str(e)
                }, status=400)
            
            # 필수 필드 검증
            required_fields = ["name", "manager", "consumer"]
            missing_fields = [field for field in required_fields if not inputs.get(field)]
            if missing_fields:
                logger.error(f"Missing required fields: {missing_fields}")
                return JsonResponse({
                    "message": f"필수 필드가 누락되었습니다: {', '.join(missing_fields)}",
                    "missing_fields": missing_fields
                }, status=400)
            
            logger.info(f"Creating project with inputs: {inputs}")
            logger.info(f"Process stages: {[p.get('key') for p in process]}")
            
            with transaction.atomic():
                # 프로젝트 생성
                project = models.Project.objects.create(user=user)
                
                # 기본 정보 설정
                for field, value in inputs.items():
                    if hasattr(project, field):
                        setattr(project, field, value)
                    else:
                        logger.warning(f"Unknown field in inputs: {field}")
                
                # 프로세스 단계별 처리
                stage_models = {
                    "basic_plan": models.BasicPlan,
                    "story_board": models.Storyboard,
                    "filming": models.Filming,
                    "video_edit": models.VideoEdit,
                    "post_work": models.PostWork,
                    "video_preview": models.VideoPreview,
                    "confirmation": models.Confirmation,
                    "video_delivery": models.VideoDelivery,
                }
                
                for stage_data in process:
                    key = stage_data.get("key")
                    if not key or key not in stage_models:
                        logger.error(f"Invalid stage key: {key}")
                        raise ValueError(f"유효하지 않은 프로세스 단계: {key}")
                    
                    # 날짜 파싱
                    start_date = self.parse_date(stage_data.get("startDate"))
                    end_date = self.parse_date(stage_data.get("endDate"))
                    
                    # 단계 모델 생성
                    stage_model = stage_models[key]
                    stage_instance = stage_model.objects.create(
                        start_date=start_date,
                        end_date=end_date
                    )
                    setattr(project, key, stage_instance)
                    logger.info(f"Created {key} stage with dates: {start_date} - {end_date}")
                
                # 피드백 모델 생성
                feedback = feedback_model.FeedBack.objects.create()
                project.feedback = feedback
                
                # 색상 생성
                project.color = f"#{random.randint(0, 0xFFFFFF):06x}"
                
                # 프로젝트 저장
                project.save()
                logger.info(f"Project created successfully with ID: {project.id}")
                
                # 파일 업로드 처리
                if files:
                    file_objects = [
                        models.File(project=project, files=f) 
                        for f in files
                    ]
                    models.File.objects.bulk_create(file_objects)
                    logger.info(f"Uploaded {len(files)} files for project {project.id}")
                
                # 프로젝트 생성자를 멤버로 추가
                models.Members.objects.create(
                    project=project,
                    user=user,
                    rating="owner"
                )
                
                return JsonResponse({
                    "message": "success",
                    "project_id": project.id,
                    "project_name": project.name
                }, status=201)
                
        except ValueError as e:
            logger.error(f"Validation error: {str(e)}")
            return JsonResponse({
                "message": str(e),
                "error_type": "validation"
            }, status=400)
            
        except Exception as e:
            logger.error(f"Unexpected error in project creation: {str(e)}", exc_info=True)
            return JsonResponse({
                "message": "프로젝트 생성 중 예상치 못한 오류가 발생했습니다.",
                "error": str(e),
                "error_type": type(e).__name__
            }, status=500)
    
    def parse_date(self, date_str):
        """다양한 형식의 날짜 문자열을 파싱"""
        if not date_str:
            return None
            
        if isinstance(date_str, datetime):
            return timezone.make_aware(date_str) if timezone.is_naive(date_str) else date_str
            
        date_formats = [
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d %H:%M",
            "%Y-%m-%d",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S.%fZ",
        ]
        
        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(date_str, fmt)
                return timezone.make_aware(parsed_date) if timezone.is_naive(parsed_date) else parsed_date
            except ValueError:
                continue
        
        # ISO format 시도
        try:
            parsed_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return timezone.make_aware(parsed_date) if timezone.is_naive(parsed_date) else parsed_date
        except ValueError:
            pass
            
        logger.error(f"Unable to parse date: {date_str}")
        raise ValueError(f"날짜 형식을 인식할 수 없습니다: {date_str}")


class ProjectDebugInfo(View):
    """프로젝트 생성 디버깅 정보 제공"""
    
    @user_validator
    def get(self, request):
        try:
            # CORS 설정 확인
            from django.conf import settings
            cors_info = {
                "CORS_ALLOWED_ORIGINS": getattr(settings, 'CORS_ALLOWED_ORIGINS', []),
                "CORS_ALLOW_CREDENTIALS": getattr(settings, 'CORS_ALLOW_CREDENTIALS', False),
                "CORS_ALLOW_ALL_ORIGINS": getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False),
            }
            
            # 사용자 정보
            user_info = {
                "username": request.user.username,
                "email": request.user.email,
                "is_authenticated": request.user.is_authenticated,
            }
            
            # 모델 확인
            models_check = {
                "Project": models.Project._meta.db_table,
                "BasicPlan": models.BasicPlan._meta.db_table,
                "Storyboard": models.Storyboard._meta.db_table,
                "FeedBack": feedback_model.FeedBack._meta.db_table,
            }
            
            return JsonResponse({
                "cors_settings": cors_info,
                "user_info": user_info,
                "models_check": models_check,
                "debug_mode": settings.DEBUG,
                "allowed_hosts": settings.ALLOWED_HOSTS,
            }, status=200)
            
        except Exception as e:
            logger.error(f"Debug info error: {str(e)}", exc_info=True)
            return JsonResponse({"error": str(e)}, status=500)