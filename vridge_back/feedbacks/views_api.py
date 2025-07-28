import json
import logging
from django.http import JsonResponse
from django.views import View
from users.utils import user_validator
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from . import models

logger = logging.getLogger(__name__)


# 답글 관리
@method_decorator(csrf_exempt, name='dispatch')
class FeedbackReply(View):
    @user_validator
    def post(self, request, feedback_id):
        """피드백에 답글 추가"""
        try:
            user = request.user
            data = json.loads(request.body)
            
            # 부모 댓글 확인
            parent_comment = models.FeedBackComment.objects.get_or_none(id=feedback_id)
            if not parent_comment:
                return JsonResponse({"message": "존재하지 않는 피드백입니다."}, status=404)
            
            # 프로젝트 권한 확인
            project = parent_comment.feedback.projects.first()
            if project:
                members = project.members.filter(user=user)
                if project.user != user and not members.exists():
                    return JsonResponse({"message": "권한이 없습니다."}, status=403)
            
            # 답글 생성
            reply = models.FeedBackComment.objects.create(
                feedback=parent_comment.feedback,
                parent=parent_comment,
                user=user,
                text=data.get('text'),
                display_mode=data.get('display_mode', 'anonymous'),
                nickname=data.get('nickname'),
                security=data.get('security', False),
                title="답글",
                section=parent_comment.section
            )
            
            return JsonResponse({
                "message": "답글이 등록되었습니다.",
                "reply_id": reply.id
            }, status=201)
            
        except Exception as e:
            logger.error(f"Error creating reply: {str(e)}", exc_info=True)
            return JsonResponse({"message": "답글 등록 중 오류가 발생했습니다."}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class FeedbackReplyDetail(View):
    @user_validator
    def delete(self, request, feedback_id, reply_id):
        """답글 삭제"""
        try:
            user = request.user
            
            reply = models.FeedBackComment.objects.get_or_none(
                id=reply_id, 
                parent_id=feedback_id
            )
            if not reply:
                return JsonResponse({"message": "존재하지 않는 답글입니다."}, status=404)
            
            if reply.user != user:
                return JsonResponse({"message": "권한이 없습니다."}, status=403)
            
            reply.delete()
            return JsonResponse({"message": "답글이 삭제되었습니다."}, status=200)
            
        except Exception as e:
            logger.error(f"Error deleting reply: {str(e)}", exc_info=True)
            return JsonResponse({"message": "답글 삭제 중 오류가 발생했습니다."}, status=500)


# 중요표시 토글
@method_decorator(csrf_exempt, name='dispatch')
class FeedbackToggleImportant(View):
    @user_validator
    def post(self, request, feedback_id):
        """피드백 중요표시 토글"""
        try:
            user = request.user
            
            comment = models.FeedBackComment.objects.get_or_none(id=feedback_id)
            if not comment:
                return JsonResponse({"message": "존재하지 않는 피드백입니다."}, status=404)
            
            # 프로젝트 소유자 또는 멤버만 중요표시 가능
            project = comment.feedback.projects.first()
            if project:
                members = project.members.filter(user=user)
                if project.user != user and not members.exists():
                    return JsonResponse({"message": "권한이 없습니다."}, status=403)
            
            # 토글
            comment.is_important = not comment.is_important
            comment.save()
            
            return JsonResponse({
                "message": "중요표시가 변경되었습니다.",
                "is_important": comment.is_important
            }, status=200)
            
        except Exception as e:
            logger.error(f"Error toggling important: {str(e)}", exc_info=True)
            return JsonResponse({"message": "중요표시 변경 중 오류가 발생했습니다."}, status=500)


# 반응 추가/변경
@method_decorator(csrf_exempt, name='dispatch')
class FeedbackReactionView(View):
    @user_validator
    def post(self, request, feedback_id):
        """피드백에 반응 추가/변경/삭제"""
        try:
            user = request.user
            data = json.loads(request.body)
            reaction_type = data.get('reaction')
            
            # reaction_type이 None이면 반응 제거
            valid_reactions = ['like', 'dislike', 'needExplanation', None]
            if reaction_type not in valid_reactions:
                return JsonResponse({"message": "잘못된 반응 타입입니다."}, status=400)
            
            comment = models.FeedBackComment.objects.get_or_none(id=feedback_id)
            if not comment:
                return JsonResponse({"message": "존재하지 않는 피드백입니다."}, status=404)
            
            # 반응 처리
            if reaction_type is None:
                # 반응 제거
                models.FeedbackReaction.objects.filter(
                    comment=comment,
                    user=user
                ).delete()
            else:
                # 반응 추가/업데이트
                reaction, created = models.FeedbackReaction.objects.update_or_create(
                    comment=comment,
                    user=user,
                    defaults={'reaction': reaction_type}
                )
            
            # 반응 수 계산
            like_count = comment.reactions.filter(reaction='like').count()
            dislike_count = comment.reactions.filter(reaction='dislike').count()
            need_explanation_count = comment.reactions.filter(reaction='needExplanation').count()
            
            return JsonResponse({
                "message": "반응이 처리되었습니다.",
                "reaction": reaction_type,
                "like_count": like_count,
                "dislike_count": dislike_count,
                "need_explanation_count": need_explanation_count
            }, status=200)
            
        except Exception as e:
            logger.error(f"Error updating reaction: {str(e)}", exc_info=True)
            return JsonResponse({"message": "반응 등록 중 오류가 발생했습니다."}, status=500)