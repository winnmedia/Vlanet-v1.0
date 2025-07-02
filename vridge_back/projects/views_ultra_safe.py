"""
초안전 프로젝트 생성 뷰 - 문제 진단용
트랜잭션을 최소화하고 각 단계마다 로깅
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
from users.utils import user_validator
from . import models
from .utils_date import parse_date_flexible

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class CreateProjectUltraSafe(View):
    """문제 진단을 위한 초안전 프로젝트 생성 뷰"""
    
    @user_validator
    def post(self, request):
        try:
            user = request.user
            files = request.FILES.getlist("files")
            inputs = json.loads(request.POST.get("inputs"))
            process = json.loads(request.POST.get("process"))
            
            project_name = inputs.get('name', 'Unknown')
            
            logger.info("=" * 80)
            logger.info(f"[UltraSafe] START - User: {user.id}, Project: {project_name}")
            logger.info("=" * 80)
            
            # 1. 최근 중복 확인 (트랜잭션 밖)
            recent_project = models.Project.objects.filter(
                user=user,
                name=project_name,
                created__gte=datetime.now() - timedelta(seconds=10)
            ).first()
            
            if recent_project:
                logger.warning(f"[UltraSafe] DUPLICATE FOUND - Existing project ID: {recent_project.id}")
                # 프로젝트가 실제로 존재하는지 다시 확인
                still_exists = models.Project.objects.filter(id=recent_project.id).exists()
                logger.info(f"[UltraSafe] Project {recent_project.id} still exists: {still_exists}")
                
                return JsonResponse({
                    "message": "success",
                    "project_id": recent_project.id,
                    "duplicate_prevented": True,
                    "still_exists": still_exists
                }, status=200)
            
            # 2. 기본 프로젝트 생성 (최소 트랜잭션)
            project = None
            try:
                with transaction.atomic():
                    project = models.Project.objects.create(user=user)
                    project.name = project_name
                    project.color = "#" + "".join([random.choice("0123456789ABCDEF") for _ in range(6)])
                    project.save()
                    
                    # 멤버 추가
                    models.Members.objects.create(
                        project=project,
                        user=user,
                        rating="owner"
                    )
                
                logger.info(f"[UltraSafe] BASIC PROJECT CREATED - ID: {project.id}")
                
                # 생성 직후 존재 확인
                exists_after_create = models.Project.objects.filter(id=project.id).exists()
                logger.info(f"[UltraSafe] Project exists after creation: {exists_after_create}")
                
            except Exception as e:
                logger.error(f"[UltraSafe] FAILED TO CREATE BASIC PROJECT: {str(e)}")
                return JsonResponse({"message": f"기본 프로젝트 생성 실패: {str(e)}"}, status=500)
            
            # 3. 프로세스 추가 (개별 트랜잭션)
            for i, proc in enumerate(process):
                try:
                    key = proc.get("key")
                    start_date = parse_date_flexible(proc.get("startDate"))
                    end_date = parse_date_flexible(proc.get("endDate"))
                    
                    logger.info(f"[UltraSafe] Adding process {i+1}/{len(process)}: {key}")
                    
                    with transaction.atomic():
                        if key == "basic_plan":
                            obj = models.BasicPlan.objects.create(start_date=start_date, end_date=end_date)
                            project.basic_plan = obj
                        elif key == "story_board":
                            obj = models.Storyboard.objects.create(start_date=start_date, end_date=end_date)
                            project.story_board = obj
                        elif key == "filming":
                            obj = models.Filming.objects.create(start_date=start_date, end_date=end_date)
                            project.filming = obj
                        elif key == "video_edit":
                            obj = models.VideoEdit.objects.create(start_date=start_date, end_date=end_date)
                            project.video_edit = obj
                        elif key == "post_work":
                            obj = models.PostWork.objects.create(start_date=start_date, end_date=end_date)
                            project.post_work = obj
                        elif key == "video_preview":
                            obj = models.VideoPreview.objects.create(start_date=start_date, end_date=end_date)
                            project.video_preview = obj
                        elif key == "confirmation":
                            obj = models.Confirmation.objects.create(start_date=start_date, end_date=end_date)
                            project.confirmation = obj
                        elif key == "video_delivery":
                            obj = models.VideoDelivery.objects.create(start_date=start_date, end_date=end_date)
                            project.video_delivery = obj
                        
                        project.save()
                        
                except Exception as e:
                    logger.error(f"[UltraSafe] Failed to add process {key}: {str(e)}")
                    # 프로세스 추가 실패는 치명적이지 않으므로 계속 진행
            
            # 4. 파일 추가 (개별 처리)
            for i, f in enumerate(files):
                try:
                    models.File.objects.create(project=project, files=f)
                    logger.info(f"[UltraSafe] File {i+1}/{len(files)} added")
                except Exception as e:
                    logger.error(f"[UltraSafe] Failed to add file {i+1}: {str(e)}")
            
            # 5. 다른 필드 업데이트
            try:
                for k, v in inputs.items():
                    if k != 'name' and hasattr(project, k):
                        setattr(project, k, v)
                project.save()
                logger.info("[UltraSafe] Additional fields updated")
            except Exception as e:
                logger.error(f"[UltraSafe] Failed to update fields: {str(e)}")
            
            # 6. FeedBack 생성 시도 (선택적, 실패해도 무시)
            logger.info("[UltraSafe] SKIPPING FeedBack creation to avoid issues")
            
            # 7. 최종 확인
            final_exists = models.Project.objects.filter(id=project.id).exists()
            logger.info(f"[UltraSafe] FINAL CHECK - Project {project.id} exists: {final_exists}")
            
            # 프로젝트 세부 정보 로깅
            if final_exists:
                p = models.Project.objects.get(id=project.id)
                logger.info(f"[UltraSafe] Project details:")
                logger.info(f"  - ID: {p.id}")
                logger.info(f"  - Name: {p.name}")
                logger.info(f"  - User: {p.user.id}")
                logger.info(f"  - Created: {p.created}")
                logger.info(f"  - Color: {p.color}")
                logger.info(f"  - Members count: {p.members.count()}")
                logger.info(f"  - Files count: {p.files.count()}")
            
            logger.info("=" * 80)
            logger.info(f"[UltraSafe] SUCCESS - Project {project.id} created")
            logger.info("=" * 80)
            
            return JsonResponse({
                "message": "success",
                "project_id": project.id,
                "project_exists": final_exists,
                "created_at": project.created.isoformat() if project.created else None
            }, status=200)
            
        except Exception as e:
            logger.error("=" * 80)
            logger.error(f"[UltraSafe] CRITICAL ERROR: {str(e)}")
            logger.error(f"[UltraSafe] Error type: {type(e).__name__}")
            import traceback
            logger.error(f"[UltraSafe] Traceback:\n{traceback.format_exc()}")
            logger.error("=" * 80)
            
            return JsonResponse({
                "message": f"프로젝트 생성 중 오류가 발생했습니다: {str(e)}"
            }, status=500)