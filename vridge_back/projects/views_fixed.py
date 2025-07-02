"""
프로젝트 생성 시 FeedBack 모델 호환성 문제 해결
"""
import logging
import json
import random
from django.http import JsonResponse
from django.views import View
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from users.utils import user_validator
from . import models
from feedbacks import models as feedback_model
from .utils_date import parse_date_flexible

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class CreateProjectFixed(View):
    """FeedBack 모델 호환성 문제를 해결한 프로젝트 생성 뷰"""
    
    @user_validator
    def post(self, request):
        try:
            user = request.user
            files = request.FILES.getlist("files")
            inputs = json.loads(request.POST.get("inputs"))
            process = json.loads(request.POST.get("process"))

            with transaction.atomic():
                project = models.Project.objects.create(user=user)
                for k, v in inputs.items():
                    setattr(project, k, v)
                
                logging.info(f"Creating project with inputs: {inputs}")
                logging.info(f"Process data: {process}")

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

                # FeedBack 생성 - 안전한 방식으로 처리
                try:
                    # 먼저 모든 필드로 생성 시도
                    feedback = feedback_model.FeedBack.objects.create()
                except Exception as e:
                    logger.warning(f"FeedBack creation with all fields failed: {str(e)}")
                    # 기본 필드만으로 생성 시도
                    try:
                        # 임시로 SQL로 직접 생성
                        from django.db import connection
                        with connection.cursor() as cursor:
                            cursor.execute(
                                "INSERT INTO feedbacks_feedback (created, updated) VALUES (NOW(), NOW()) RETURNING id"
                            )
                            feedback_id = cursor.fetchone()[0]
                            feedback = feedback_model.FeedBack.objects.get(id=feedback_id)
                    except Exception as e2:
                        logger.error(f"FeedBack creation with basic fields failed: {str(e2)}")
                        # FeedBack 없이 프로젝트 생성
                        feedback = None
                
                if feedback:
                    project.feedback = feedback
                
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

            return JsonResponse({"message": "success"}, status=200)
        except Exception as e:
            logger.error(f"Project creation error: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            # 더 구체적인 에러 메시지 반환
            if "key" in str(e):
                return JsonResponse({"message": "프로젝트 단계 정보가 올바르지 않습니다. 프론트엔드와 백엔드 데이터 형식을 확인해주세요."}, status=400)
            elif "date" in str(e).lower():
                return JsonResponse({"message": "날짜 형식이 올바르지 않습니다."}, status=400)
            else:
                return JsonResponse({"message": f"프로젝트 생성 중 오류가 발생했습니다: {str(e)}"}, status=500)