"""
프로젝트 일정 관리를 위한 본질적이고 클린한 솔루션
"""
import json
import logging
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
from django.utils import timezone
from users.utils import user_validator
from . import models

logger = logging.getLogger(__name__)


class ProjectScheduleManager:
    """프로젝트 일정 관리를 위한 비즈니스 로직 클래스"""
    
    PHASE_ORDER = [
        'basic_plan',
        'story_board',
        'filming',
        'video_edit',
        'post_work',
        'video_preview',
        'confirmation',
        'video_delivery'
    ]
    
    PHASE_MODEL_MAP = {
        'basic_plan': models.BasicPlan,
        'story_board': models.Storyboard,
        'filming': models.Filming,
        'video_edit': models.VideoEdit,
        'post_work': models.PostWork,
        'video_preview': models.VideoPreview,
        'confirmation': models.Confirmation,
        'video_delivery': models.VideoDelivery,
    }
    
    @classmethod
    def update_phase_schedule(cls, project, phase_key, start_date, end_date, completed=None):
        """단일 단계의 일정을 업데이트"""
        if phase_key not in cls.PHASE_MODEL_MAP:
            raise ValueError(f"Invalid phase key: {phase_key}")
        
        # 날짜 파싱
        if isinstance(start_date, str):
            start_date = cls._parse_date(start_date)
        if isinstance(end_date, str):
            end_date = cls._parse_date(end_date)
        
        # 단계 객체 가져오기 또는 생성
        phase_obj = getattr(project, phase_key)
        
        if phase_obj is None:
            # 객체가 없으면 새로 생성
            PhaseModel = cls.PHASE_MODEL_MAP[phase_key]
            phase_obj = PhaseModel.objects.create(
                start_date=start_date,
                end_date=end_date
            )
            setattr(project, phase_key, phase_obj)
            project.save()
        else:
            # 기존 객체 업데이트
            phase_obj.start_date = start_date
            phase_obj.end_date = end_date
            
            # completed 필드가 있다면 업데이트 (추후 모델에 추가 가능)
            if completed is not None and hasattr(phase_obj, 'completed'):
                phase_obj.completed = completed
            
            phase_obj.save()
        
        return phase_obj
    
    @classmethod
    def adjust_subsequent_phases(cls, project, completed_phase_key, actual_completion_date=None):
        """완료된 단계 이후의 모든 단계 일정을 자동 조정"""
        if completed_phase_key not in cls.PHASE_ORDER:
            raise ValueError(f"Invalid phase key: {completed_phase_key}")
        
        completed_index = cls.PHASE_ORDER.index(completed_phase_key)
        if completed_index >= len(cls.PHASE_ORDER) - 1:
            # 마지막 단계이므로 조정할 것이 없음
            return []
        
        # 실제 완료일 설정
        if actual_completion_date is None:
            actual_completion_date = timezone.now()
        elif isinstance(actual_completion_date, str):
            actual_completion_date = cls._parse_date(actual_completion_date)
        
        # 완료된 단계의 원래 종료일 가져오기
        completed_phase = getattr(project, completed_phase_key)
        if not completed_phase or not completed_phase.end_date:
            return []
        
        # 지연/단축 일수 계산
        original_end = completed_phase.end_date
        if timezone.is_naive(original_end):
            original_end = timezone.make_aware(original_end)
        if timezone.is_naive(actual_completion_date):
            actual_completion_date = timezone.make_aware(actual_completion_date)
        
        days_diff = (actual_completion_date.date() - original_end.date()).days
        
        if days_diff == 0:
            return []  # 변경 없음
        
        # 후속 단계들 조정
        adjusted_phases = []
        for i in range(completed_index + 1, len(cls.PHASE_ORDER)):
            phase_key = cls.PHASE_ORDER[i]
            phase_obj = getattr(project, phase_key)
            
            if phase_obj and phase_obj.start_date and phase_obj.end_date:
                # 새로운 날짜 계산
                new_start = phase_obj.start_date + timedelta(days=days_diff)
                new_end = phase_obj.end_date + timedelta(days=days_diff)
                
                # 업데이트
                phase_obj.start_date = new_start
                phase_obj.end_date = new_end
                phase_obj.save()
                
                adjusted_phases.append({
                    'phase': phase_key,
                    'new_start': new_start,
                    'new_end': new_end,
                    'adjustment_days': days_diff
                })
        
        return adjusted_phases
    
    @staticmethod
    def _parse_date(date_string):
        """다양한 날짜 형식을 파싱"""
        if not date_string:
            return None
        
        # 지원하는 날짜 형식들
        date_formats = [
            '%Y-%m-%d %H:%M',
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%dT%H:%M:%S',
            '%Y-%m-%dT%H:%M:%SZ',
            '%Y-%m-%dT%H:%M:%S.%fZ',
        ]
        
        for fmt in date_formats:
            try:
                dt = datetime.strptime(date_string, fmt)
                # timezone aware로 변환
                if timezone.is_naive(dt):
                    dt = timezone.make_aware(dt)
                return dt
            except ValueError:
                continue
        
        raise ValueError(f"Unable to parse date: {date_string}")


@method_decorator(csrf_exempt, name='dispatch')
class ProjectScheduleUpdate(View):
    """프로젝트 일정 업데이트를 위한 개선된 엔드포인트"""
    
    @user_validator
    @transaction.atomic
    def post(self, request, project_id):
        try:
            user = request.user
            
            # 프로젝트 확인
            try:
                project = models.Project.objects.get(id=project_id)
            except models.Project.DoesNotExist:
                return JsonResponse({
                    "success": False,
                    "message": "프로젝트를 찾을 수 없습니다."
                }, status=404)
            
            # 권한 확인
            is_manager = models.Members.objects.filter(
                project=project, 
                user=user, 
                rating="manager"
            ).exists()
            
            if project.user != user and not is_manager:
                return JsonResponse({
                    "success": False,
                    "message": "프로젝트 일정을 수정할 권한이 없습니다."
                }, status=403)
            
            # 요청 데이터 파싱
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({
                    "success": False,
                    "message": "잘못된 JSON 형식입니다."
                }, status=400)
            
            phase_key = data.get("key")
            start_date = data.get("start_date")
            end_date = data.get("end_date")
            completed = data.get("completed")
            auto_adjust = data.get("auto_adjust", False)  # 후속 일정 자동 조정 옵션
            
            # 필수 필드 검증
            if not phase_key:
                return JsonResponse({
                    "success": False,
                    "message": "단계 키(key)가 필요합니다."
                }, status=400)
            
            if not start_date or not end_date:
                return JsonResponse({
                    "success": False,
                    "message": "시작일과 종료일이 필요합니다."
                }, status=400)
            
            # 단계 업데이트
            try:
                phase_obj = ProjectScheduleManager.update_phase_schedule(
                    project, phase_key, start_date, end_date, completed
                )
                
                response_data = {
                    "success": True,
                    "message": "일정이 업데이트되었습니다.",
                    "phase": {
                        "key": phase_key,
                        "start_date": phase_obj.start_date.isoformat(),
                        "end_date": phase_obj.end_date.isoformat()
                    }
                }
                
                # 완료 처리 시 후속 일정 자동 조정
                if completed and auto_adjust:
                    adjusted = ProjectScheduleManager.adjust_subsequent_phases(
                        project, phase_key
                    )
                    if adjusted:
                        response_data["adjusted_phases"] = adjusted
                        response_data["message"] = f"일정이 업데이트되고 {len(adjusted)}개의 후속 단계가 조정되었습니다."
                
                return JsonResponse(response_data, status=200)
                
            except ValueError as e:
                return JsonResponse({
                    "success": False,
                    "message": str(e)
                }, status=400)
            
        except Exception as e:
            logger.error(f"Error in ProjectScheduleUpdate: {str(e)}", exc_info=True)
            return JsonResponse({
                "success": False,
                "message": "일정 업데이트 중 오류가 발생했습니다.",
                "error": str(e) if settings.DEBUG else None
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ProjectScheduleBulkUpdate(View):
    """여러 단계의 일정을 한 번에 업데이트"""
    
    @user_validator
    @transaction.atomic
    def post(self, request, project_id):
        try:
            user = request.user
            
            # 프로젝트 및 권한 확인 (위와 동일)
            try:
                project = models.Project.objects.get(id=project_id)
            except models.Project.DoesNotExist:
                return JsonResponse({
                    "success": False,
                    "message": "프로젝트를 찾을 수 없습니다."
                }, status=404)
            
            is_manager = models.Members.objects.filter(
                project=project, 
                user=user, 
                rating="manager"
            ).exists()
            
            if project.user != user and not is_manager:
                return JsonResponse({
                    "success": False,
                    "message": "프로젝트 일정을 수정할 권한이 없습니다."
                }, status=403)
            
            # 요청 데이터 파싱
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({
                    "success": False,
                    "message": "잘못된 JSON 형식입니다."
                }, status=400)
            
            phases_data = data.get("phases", [])
            if not phases_data:
                return JsonResponse({
                    "success": False,
                    "message": "업데이트할 단계 정보가 없습니다."
                }, status=400)
            
            # 모든 단계 업데이트
            updated_phases = []
            for phase_data in phases_data:
                phase_key = phase_data.get("key")
                start_date = phase_data.get("start_date")
                end_date = phase_data.get("end_date")
                completed = phase_data.get("completed")
                
                if not phase_key or not start_date or not end_date:
                    continue
                
                try:
                    phase_obj = ProjectScheduleManager.update_phase_schedule(
                        project, phase_key, start_date, end_date, completed
                    )
                    updated_phases.append({
                        "key": phase_key,
                        "start_date": phase_obj.start_date.isoformat(),
                        "end_date": phase_obj.end_date.isoformat()
                    })
                except Exception as e:
                    logger.error(f"Error updating phase {phase_key}: {str(e)}")
            
            return JsonResponse({
                "success": True,
                "message": f"{len(updated_phases)}개의 단계가 업데이트되었습니다.",
                "updated_phases": updated_phases
            }, status=200)
            
        except Exception as e:
            logger.error(f"Error in ProjectScheduleBulkUpdate: {str(e)}", exc_info=True)
            return JsonResponse({
                "success": False,
                "message": "일정 업데이트 중 오류가 발생했습니다.",
                "error": str(e) if settings.DEBUG else None
            }, status=500)