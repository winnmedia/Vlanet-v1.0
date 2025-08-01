import json
import logging
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction

from users.decorators import user_validator
from . import models
from projects import models as project_model

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class FeedbackMessageReaction(View):
    """피드백 메시지 반응 관리 API"""
    
    @user_validator
    def patch(self, request, message_id):
        """반응 추가/변경/제거"""
        try:
            user = request.user
            data = json.loads(request.body)
            
            # 메시지 조회
            try:
                message = models.FeedBackMessage.objects.get(id=message_id)
            except models.FeedBackMessage.DoesNotExist:
                return JsonResponse({"message": "존재하지 않는 메시지입니다."}, status=404)
            
            # 반응 타입 검증
            reaction_type = data.get("reaction")
            valid_reactions = ['like', 'dislike', 'needExplanation', None]
            
            if reaction_type not in valid_reactions:
                return JsonResponse({
                    "message": "유효하지 않은 반응 타입입니다.",
                    "valid_types": valid_reactions[:-1]
                }, status=400)
            
            # 기존 반응 조회 또는 생성
            reaction, created = models.FeedbackReaction.objects.get_or_create(
                message=message,
                user=user,
                defaults={'reaction_type': reaction_type}
            )
            
            if reaction_type is None:
                # 반응 제거
                reaction.delete()
                message_text = "반응이 제거되었습니다."
            else:
                # 반응 추가/변경
                reaction.reaction_type = reaction_type
                reaction.save()
                message_text = "반응이 저장되었습니다."
            
            # 반응 카운트 집계
            reaction_counts = {
                'like': 0,
                'dislike': 0,
                'needExplanation': 0
            }
            
            reactions = models.FeedbackReaction.objects.filter(message=message)
            for r in reactions:
                if r.reaction_type in reaction_counts:
                    reaction_counts[r.reaction_type] += 1
            
            return JsonResponse({
                "message": message_text,
                "result": {
                    "message_id": message.id,
                    "user_reaction": reaction_type,
                    "reaction_counts": reaction_counts
                }
            }, status=200)
            
        except json.JSONDecodeError:
            return JsonResponse({"message": "잘못된 JSON 형식입니다."}, status=400)
        except Exception as e:
            logger.error(f"Error managing feedback reaction: {str(e)}", exc_info=True)
            return JsonResponse({"message": "반응 처리 중 오류가 발생했습니다."}, status=500)
    
    @user_validator
    def get(self, request, message_id):
        """메시지의 반응 조회"""
        try:
            user = request.user
            
            # 메시지 조회
            try:
                message = models.FeedBackMessage.objects.get(id=message_id)
            except models.FeedBackMessage.DoesNotExist:
                return JsonResponse({"message": "존재하지 않는 메시지입니다."}, status=404)
            
            # 현재 사용자의 반응
            user_reaction = None
            try:
                reaction = models.FeedbackReaction.objects.get(
                    message=message,
                    user=user
                )
                user_reaction = reaction.reaction_type
            except models.FeedbackReaction.DoesNotExist:
                pass
            
            # 반응 카운트 집계
            reaction_counts = {
                'like': 0,
                'dislike': 0,
                'needExplanation': 0
            }
            
            reactions = models.FeedbackReaction.objects.filter(message=message)
            for r in reactions:
                if r.reaction_type in reaction_counts:
                    reaction_counts[r.reaction_type] += 1
            
            return JsonResponse({
                "result": {
                    "message_id": message.id,
                    "user_reaction": user_reaction,
                    "reaction_counts": reaction_counts
                }
            }, status=200)
            
        except Exception as e:
            logger.error(f"Error getting feedback reactions: {str(e)}", exc_info=True)
            return JsonResponse({"message": "반응 조회 중 오류가 발생했습니다."}, status=500)