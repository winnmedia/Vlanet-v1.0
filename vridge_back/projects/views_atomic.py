import logging, json, random
from django.conf import settings
from datetime import datetime, timedelta
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework import status
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
            user = request.user
            
            # FormData와 JSON 모두 지원
            if hasattr(request, 'POST') and request.POST.get('inputs'):
                # FormData 처리
                inputs_raw = request.POST.get('inputs')
                process_raw = request.POST.get('process')
                
                if not inputs_raw:
                    return JsonResponse({
                        "error": "입력 데이터가 누락되었습니다.",
                        "code": "MISSING_INPUTS"
                    }, status=400)
                
                try:
                    data = json.loads(inputs_raw)
                    if process_raw:
                        process_data = json.loads(process_raw)
                        data.update(process_data)
                except json.JSONDecodeError:
                    return JsonResponse({
                        "error": "잘못된 JSON 형식입니다.",
                        "code": "INVALID_JSON"
                    }, status=400)
            else:
                # JSON body 처리
                try:
                    data = json.loads(request.body)
                except json.JSONDecodeError:
                    return JsonResponse({
                        "error": "잘못된 JSON 형식입니다.",
                        "code": "INVALID_JSON"
                    }, status=400)
            
            # 입력 데이터 검증
            project_name = data.get('name', '').strip()
            if not project_name:
                return JsonResponse({
                    "error": "프로젝트 이름을 입력해주세요.",
                    "code": "MISSING_PROJECT_NAME"
                }, status=400)
            
            # 멱등성 키 검증 (데이터베이스 기반)
            idempotency_key = request.headers.get('X-Idempotency-Key')
            if idempotency_key:
                # IdempotencyRecord를 사용하여 중복 요청 확인
                try:
                    existing_record = models.IdempotencyRecord.objects.filter(
                        user=user,
                        idempotency_key=idempotency_key,
                        status='completed'
                    ).first()
                    
                    if existing_record and existing_record.project_id:
                        # 이미 처리된 요청이면 기존 프로젝트 정보 반환
                        existing_project = models.Project.objects.filter(id=existing_record.project_id).first()
                        if existing_project:
                            logger.info(f"Found existing project with idempotency key: {idempotency_key}")
                            return JsonResponse({
                                "message": "success",
                                "project_id": existing_project.id,
                                "project_name": existing_project.name,
                                "created_at": existing_project.created.isoformat()
                            })
                except Exception as e:
                    logger.warning(f"Error checking idempotency: {str(e)}")
            
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
                # 먼저 중복 체크 (SQLite constraint 문제 대응)
                existing_project = models.Project.objects.filter(
                    user=user,
                    name=project_name
                ).first()
                
                if existing_project:
                    logger.warning(f"Duplicate project name found: {project_name} for user {user.email}")
                    return JsonResponse({
                        "error": "이미 같은 이름의 프로젝트가 존재합니다.",
                        "existing_project": {
                            "id": existing_project.id,
                            "name": existing_project.name,
                            "created_at": existing_project.created.isoformat()
                        }
                    }, status=409)
                
                # 원자적 트랜잭션으로 모든 작업 처리
                with transaction.atomic():
                    # 멱등성 레코드 생성 (있는 경우)
                    idempotency_record = None
                    if idempotency_key:
                        try:
                            idempotency_record = models.IdempotencyRecord.objects.create(
                                user=user,
                                idempotency_key=idempotency_key,
                                request_data=json.dumps(data),
                                status='processing'
                            )
                        except IntegrityError:
                            # 이미 존재하는 키라면 기존 프로젝트 반환
                            existing_record = models.IdempotencyRecord.objects.filter(
                                user=user,
                                idempotency_key=idempotency_key
                            ).first()
                            if existing_record and existing_record.project_id:
                                existing_project = models.Project.objects.filter(id=existing_record.project_id).first()
                                if existing_project:
                                    return JsonResponse({
                                        "message": "success",
                                        "project_id": existing_project.id,
                                        "project_name": existing_project.name,
                                        "created_at": existing_project.created.isoformat()
                                    })
                    
                    # 1. 프로젝트 생성 (UniqueConstraint에 의해 중복 방지)
                    try:
                        project = models.Project.objects.create(**project_data)
                        logger.info(f"Project created successfully: {project.id} - {project.name}")
                    except IntegrityError as e:
                        logger.warning(f"Project creation failed due to duplicate name: {project_name}")
                        # 중복된 프로젝트 조회
                        existing_project = models.Project.objects.filter(
                            user=user,
                            name=project_name
                        ).first()
                        
                        if existing_project:
                            return JsonResponse({
                                "error": "이미 같은 이름의 프로젝트가 존재합니다.",
                                "existing_project": {
                                    "id": existing_project.id,
                                    "name": existing_project.name,
                                    "created_at": existing_project.created.isoformat()
                                }
                            }, status=409)
                        else:
                            raise e
                    
                    # 2. 프로젝트 단계별 객체 생성
                    phase_objects = {}
                    phases = [
                        'basic_plan', 'story_board', 'filming', 'video_edit',
                        'post_work', 'video_preview', 'confirmation', 'video_delivery'
                    ]
                    
                    # process_data가 리스트인 경우 딕셔너리로 변환
                    if isinstance(process_data, list):
                        process_dict = {}
                        for item in process_data:
                            if isinstance(item, dict) and 'key' in item:
                                process_dict[item['key']] = item
                        process_data = process_dict
                    
                    # 모델명 매핑
                    phase_model_map = {
                        'basic_plan': 'BasicPlan',
                        'story_board': 'Storyboard',
                        'filming': 'Filming',
                        'video_edit': 'VideoEdit',
                        'post_work': 'PostWork',
                        'video_preview': 'VideoPreview',
                        'confirmation': 'Confirmation',
                        'video_delivery': 'VideoDelivery',
                    }
                    
                    for phase in phases:
                        if phase not in phase_model_map:
                            continue
                        
                        phase_class = getattr(models, phase_model_map[phase])
                        phase_data = process_data.get(phase, {}) if isinstance(process_data, dict) else {}
                        
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
                    try:
                        feedback = feedback_model.FeedBack.objects.create()
                    except Exception as e:
                        # 마이그레이션이 적용되지 않은 경우를 위한 대체 처리
                        logger.error(f"FeedBack creation failed: {str(e)}")
                        logger.error("Please run: python manage.py migrate feedbacks")
                        # 기본 필드만으로 생성 시도
                        feedback = feedback_model.FeedBack.objects.create(
                            files=None  # 기본 필드만 지정
                        )
                    project.feedback = feedback
                    
                    # 4. 프로젝트 저장
                    project.save()
                    
                    # 5. 멱등성 레코드 업데이트
                    if idempotency_record:
                        idempotency_record.project_id = project.id
                        idempotency_record.status = 'completed'
                        idempotency_record.save()
                    
                    logger.info(f"All project components created successfully for project {project.id}")
                    
                    # 성공 응답 데이터
                    response_data = {
                        "message": "success",
                        "project_id": project.id,
                        "project_name": project.name,
                        "created_at": project.created.isoformat()
                    }
                    
                    # 성공 로그
                    logger.info(f"Project creation completed successfully for user {user.username}")
                    
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
            tb_str = traceback.format_exc()
            logger.error(f"Full traceback:\n{tb_str}")
            
            # 개발 환경에서는 더 자세한 에러 정보 제공
            error_detail = str(e)
            if hasattr(e, '__class__'):
                error_detail = f"{e.__class__.__name__}: {str(e)}"
            
            return JsonResponse({
                "error": "프로젝트 생성 중 오류가 발생했습니다.",
                "code": "INTERNAL_ERROR",
                "detail": error_detail if settings.DEBUG else None,
                "type": e.__class__.__name__ if hasattr(e, '__class__') else "Unknown"
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