import json
import logging
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
from . import models
from users.utils import user_validator

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class FeedbackMessageReaction(View):
    @user_validator
    def post(self, request, message_id):
        try:
            data = json.loads(request.body)
            reaction_type = data.get('reaction_type')
            
            if reaction_type not in ['like', 'dislike', 'needExplanation']:
                return JsonResponse({"message": "유효하지 않은 반응 타입입니다."}, status=400)
            
            message = models.FeedBackMessage.objects.get(id=message_id)
            
            with transaction.atomic():
                # 기존 반응 확인 및 업데이트
                reaction, created = models.FeedbackReaction.objects.update_or_create(
                    message=message,
                    user=request.user,
                    defaults={'reaction_type': reaction_type}
                )
            
            # 반응 통계 계산
            reaction_counts = {}
            for r in message.reactions.all():
                if r.reaction_type not in reaction_counts:
                    reaction_counts[r.reaction_type] = 0
                reaction_counts[r.reaction_type] += 1
            
            return JsonResponse({
                "message": "반응이 등록되었습니다.",
                "reaction_type": reaction_type,
                "reaction_counts": reaction_counts
            })
            
        except models.FeedBackMessage.DoesNotExist:
            return JsonResponse({"message": "메시지를 찾을 수 없습니다."}, status=404)
        except Exception as e:
            logger.error(f"Error in FeedbackMessageReaction: {str(e)}")
            return JsonResponse({"message": "서버 오류가 발생했습니다."}, status=500)
    
    @user_validator
    def delete(self, request, message_id):
        try:
            message = models.FeedBackMessage.objects.get(id=message_id)
            
            # 사용자의 반응 삭제
            models.FeedbackReaction.objects.filter(
                message=message,
                user=request.user
            ).delete()
            
            # 반응 통계 재계산
            reaction_counts = {}
            for r in message.reactions.all():
                if r.reaction_type not in reaction_counts:
                    reaction_counts[r.reaction_type] = 0
                reaction_counts[r.reaction_type] += 1
            
            return JsonResponse({
                "message": "반응이 삭제되었습니다.",
                "reaction_counts": reaction_counts
            })
            
        except models.FeedBackMessage.DoesNotExist:
            return JsonResponse({"message": "메시지를 찾을 수 없습니다."}, status=404)
        except Exception as e:
            logger.error(f"Error in FeedbackMessageReaction DELETE: {str(e)}")
            return JsonResponse({"message": "서버 오류가 발생했습니다."}, status=500)
    
    @user_validator
    def get(self, request, message_id):
        try:
            message = models.FeedBackMessage.objects.get(id=message_id)
            
            # 반응 통계
            reaction_counts = {}
            user_reaction = None
            
            for r in message.reactions.all():
                if r.reaction_type not in reaction_counts:
                    reaction_counts[r.reaction_type] = 0
                reaction_counts[r.reaction_type] += 1
                
                if r.user == request.user:
                    user_reaction = r.reaction_type
            
            return JsonResponse({
                "reaction_counts": reaction_counts,
                "user_reaction": user_reaction
            })
            
        except models.FeedBackMessage.DoesNotExist:
            return JsonResponse({"message": "메시지를 찾을 수 없습니다."}, status=404)
        except Exception as e:
            logger.error(f"Error in FeedbackMessageReaction GET: {str(e)}")
            return JsonResponse({"message": "서버 오류가 발생했습니다."}, status=500)