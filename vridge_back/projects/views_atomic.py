import logging, json, random
from django.conf import settings
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction, IntegrityError
from django.core.cache import cache
from django.utils import timezone as django_timezone

from users.utils import user_validator
from . import models
from feedbacks import models as feedback_model
from .utils_date import parse_date_flexible

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class AtomicProjectCreate(View):
    """원자적 프로젝트 생성 뷰 - 데이터베이스 수준에서 중복 방지"""
    
    @user_validator
    def post(self, request):
        try:
            data = json.loads(request.body)
            user = request.user
            
            # 입력 데이터 검증
            project_name = data.get('name', '').strip()
            if not project_name:
                return JsonResponse({
                    "error": "프로젝트 이름을 입력해주세요.",
                    "code": "MISSING_PROJECT_NAME"
                }, status=400)
            
            # 멱등성 키 검증 (캐시 사용 시)
            idempotency_key = request.headers.get('X-Idempotency-Key')
            if idempotency_key:
                cache_key = f"project_create:{user.id}:{idempotency_key}"
                try:
                    cached_response = cache.get(cache_key)
                    if cached_response:
                        logger.info(f"Returning cached response for idempotency key: {idempotency_key}")
                        return JsonResponse(cached_response)
                except Exception as e:
                    logger.warning(f"Cache access failed, proceeding without cache: {e}")
                    pass
            
            # 프로젝트 데이터 준비
            project_data = {
                'user': user,
                'name': project_name,
                'manager': data.get('manager', ''),
                'consumer': data.get('consumer', ''),
                'description': data.get('description', ''),
                'color': data.get('color', '#1631F8')
            }
            
            # 프로세스 데이터 처리
            process_data = data.get('process', {})
            
            try:
                # 원자적 트랜잭션으로 모든 작업 처리
                with transaction.atomic():
                    # 1. 프로젝트 생성 (UniqueConstraint에 의해 중복 방지)
                    project = models.Project.objects.create(**project_data)
                    logger.info(f"Project created successfully: {project.id} - {project.name}")
                    
                    # 2. 프로젝트 단계별 객체 생성
                    phase_objects = {}
                    phases = [
                        'basic_plan', 'story_board', 'filming', 'video_edit',
                        'post_work', 'video_preview', 'confirmation', 'video_delivery'
                    ]
                    
                    for phase in phases:
                        phase_class = getattr(models, phase.title().replace('_', ''))
                        phase_data = process_data.get(phase, {})
                        
                        # 날짜 처리
                        start_date = None
                        end_date = None
                        
                        if phase_data.get('start_date'):
                            start_date = parse_date_flexible(phase_data['start_date'])
                        if phase_data.get('end_date'):
                            end_date = parse_date_flexible(phase_data['end_date'])
                        
                        # 단계 객체 생성
                        phase_obj = phase_class.objects.create(
                            start_date=start_date,
                            end_date=end_date
                        )
                        phase_objects[phase] = phase_obj
                        
                        # 프로젝트에 연결
                        setattr(project, phase, phase_obj)
                    
                    # 3. 피드백 객체 생성
                    feedback = feedback_model.FeedBack.objects.create()
                    project.feedback = feedback
                    
                    # 4. 프로젝트 저장
                    project.save()
                    
                    logger.info(f"All project components created successfully for project {project.id}")
                    
                    # 성공 응답 데이터
                    response_data = {
                        "message": "success",
                        "project_id": project.id,
                        "project_name": project.name,
                        "created_at": project.created.isoformat()
                    }
                    
                    # 멱등성 키가 있으면 캐시에 저장 (10분)
                    if idempotency_key:
                        try:
                            cache.set(cache_key, response_data, 600)
                            logger.info(f"Response cached for idempotency key: {idempotency_key}")
                        except Exception as e:
                            logger.warning(f"Cache storage failed, but operation succeeded: {e}")
                            pass
                    
                    return JsonResponse(response_data, status=201)
                    
            except IntegrityError as e:
                logger.warning(f"Project creation failed due to duplicate: {str(e)}")
                
                # 같은 이름의 프로젝트가 이미 존재하는지 확인
                existing_project = models.Project.objects.filter(
                    user=user, 
                    name=project_name
                ).first()
                
                if existing_project:
                    return JsonResponse({
                        "error": f"'{project_name}' 이름의 프로젝트가 이미 존재합니다.",
                        "code": "DUPLICATE_PROJECT_NAME",
                        "existing_project_id": existing_project.id
                    }, status=409)
                else:
                    # 다른 IntegrityError인 경우
                    logger.error(f"Unexpected IntegrityError: {str(e)}")
                    return JsonResponse({
                        "error": "프로젝트 생성 중 데이터 무결성 오류가 발생했습니다.",
                        "code": "INTEGRITY_ERROR"
                    }, status=500)
                    
        except json.JSONDecodeError:
            return JsonResponse({
                "error": "잘못된 JSON 형식입니다.",
                "code": "INVALID_JSON"
            }, status=400)
            
        except Exception as e:
            logger.error(f"Unexpected error in project creation: {str(e)}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                "error": "프로젝트 생성 중 오류가 발생했습니다.",
                "code": "INTERNAL_ERROR"
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ProjectCreateStatus(View):
    """프로젝트 생성 상태 확인 뷰"""
    
    @user_validator
    def get(self, request):
        """최근 생성된 프로젝트 확인"""
        try:
            user = request.user
            
            # 최근 10초 내 생성된 프로젝트 조회
            recent_projects = models.Project.objects.filter(
                user=user,
                created__gte=django_timezone.now() - timedelta(seconds=10)
            ).order_by('-created')[:5]
            
            projects_data = []
            for project in recent_projects:
                projects_data.append({
                    "id": project.id,
                    "name": project.name,
                    "created": project.created.isoformat(),
                    "manager": project.manager,
                    "consumer": project.consumer
                })
            
            return JsonResponse({
                "recent_projects": projects_data,
                "count": len(projects_data)
            })
            
        except Exception as e:
            logger.error(f"Error getting project status: {str(e)}")
            return JsonResponse({
                "error": "프로젝트 상태 조회 중 오류가 발생했습니다."
            }, status=500)