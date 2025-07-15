"""
이메일 모니터링 API 뷰
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
from .email_monitor import email_monitor
from .email_queue import email_queue_manager
import logging

logger = logging.getLogger(__name__)


class EmailStatusView(APIView):
    """특정 이메일의 상태 조회"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, email_id):
        """이메일 상태 조회"""
        try:
            # 이메일 상태 조회
            email_status = email_monitor.get_email_status(email_id)
            
            if not email_status:
                return Response({
                    "message": "이메일을 찾을 수 없습니다."
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 사용자 권한 확인 (관리자가 아니면 자신의 이메일만 조회 가능)
            if not request.user.is_staff:
                if email_status.get('recipient') != request.user.email:
                    return Response({
                        "message": "권한이 없습니다."
                    }, status=status.HTTP_403_FORBIDDEN)
            
            return Response({
                "status": "success",
                "data": email_status
            })
            
        except Exception as e:
            logger.error(f"이메일 상태 조회 오류: {str(e)}")
            return Response({
                "message": "이메일 상태 조회 중 오류가 발생했습니다."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmailMonitorDashboardView(APIView):
    """이메일 모니터링 대시보드 (관리자용)"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """이메일 통계 및 최근 이메일 목록 조회"""
        try:
            # 시간 범위 파라미터
            hours = int(request.GET.get('hours', 24))
            limit = int(request.GET.get('limit', 50))
            email_type = request.GET.get('type', None)
            
            # 통계 조회
            statistics = email_monitor.get_statistics(hours=hours)
            
            # 최근 이메일 목록
            recent_emails = email_monitor.get_recent_emails(limit=limit, email_type=email_type)
            
            # 큐 상태
            queue_size = email_queue_manager.queue.qsize() if hasattr(email_queue_manager.queue, 'qsize') else 0
            
            return Response({
                "status": "success",
                "data": {
                    "statistics": statistics,
                    "recent_emails": recent_emails,
                    "queue_status": {
                        "size": queue_size,
                        "is_running": email_queue_manager.is_running,
                        "batch_size": email_queue_manager.batch_size,
                        "pending_batch_count": len(email_queue_manager.pending_batch)
                    }
                }
            })
            
        except Exception as e:
            logger.error(f"이메일 모니터링 대시보드 오류: {str(e)}")
            return Response({
                "message": "대시보드 데이터 조회 중 오류가 발생했습니다."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmailResendView(APIView):
    """이메일 재발송"""
    permission_classes = [IsAdminUser]
    
    def post(self, request, email_id):
        """특정 이메일 재발송"""
        try:
            # 이메일 상태 조회
            email_status = email_monitor.get_email_status(email_id)
            
            if not email_status:
                return Response({
                    "message": "이메일을 찾을 수 없습니다."
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 실패한 이메일만 재발송 가능
            if email_status.get('status') not in ['failed', 'bounced']:
                return Response({
                    "message": "실패한 이메일만 재발송할 수 있습니다."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 큐에 다시 추가
            new_email_id = email_queue_manager.add_email(
                subject=email_status.get('subject'),
                body=email_status.get('body', ''),
                recipient_list=[email_status.get('recipient')],
                html_message=email_status.get('html_message'),
                priority=1,  # 높은 우선순위
                email_type=email_status.get('type', 'general')
            )
            
            return Response({
                "status": "success",
                "message": "이메일이 재발송 큐에 추가되었습니다.",
                "data": {
                    "new_email_id": new_email_id
                }
            })
            
        except Exception as e:
            logger.error(f"이메일 재발송 오류: {str(e)}")
            return Response({
                "message": "이메일 재발송 중 오류가 발생했습니다."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BulkEmailView(APIView):
    """대량 이메일 발송"""
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        """대량 이메일 발송 요청"""
        try:
            email_list = request.data.get('emails', [])
            
            if not email_list:
                return Response({
                    "message": "발송할 이메일 목록이 없습니다."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 유효성 검사
            for email in email_list:
                if not email.get('subject') or not email.get('recipient_list'):
                    return Response({
                        "message": "각 이메일에는 subject와 recipient_list가 필요합니다."
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # 대량 이메일 추가
            email_ids = email_queue_manager.add_bulk_emails(email_list)
            
            return Response({
                "status": "success",
                "message": f"{len(email_ids)}개의 이메일이 발송 큐에 추가되었습니다.",
                "data": {
                    "email_ids": email_ids,
                    "count": len(email_ids)
                }
            })
            
        except Exception as e:
            logger.error(f"대량 이메일 발송 오류: {str(e)}")
            return Response({
                "message": "대량 이메일 발송 중 오류가 발생했습니다."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmailCleanupView(APIView):
    """오래된 이메일 기록 정리"""
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        """오래된 기록 정리"""
        try:
            days = int(request.data.get('days', 7))
            
            if days < 1:
                return Response({
                    "message": "정리 기간은 1일 이상이어야 합니다."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 정리 실행
            deleted_count = email_monitor.cleanup_old_records(days=days)
            
            return Response({
                "status": "success",
                "message": f"{deleted_count}개의 오래된 이메일 기록이 삭제되었습니다.",
                "data": {
                    "deleted_count": deleted_count,
                    "days": days
                }
            })
            
        except Exception as e:
            logger.error(f"이메일 기록 정리 오류: {str(e)}")
            return Response({
                "message": "이메일 기록 정리 중 오류가 발생했습니다."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)