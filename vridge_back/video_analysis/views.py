"""
AI 영상 분석 API 뷰
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.conf import settings
import os
import logging

from feedbacks.models import FeedBack
from .models import VideoAnalysisResult, AIFeedbackItem, AIAnalysisSettings
from .analyzer import video_analyzer
from .tasks import analyze_video_task

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_video_api(request):
    """
    영상 분석 API
    
    POST /api/video-analysis/analyze/
    {
        "feedback_id": 123
    }
    """
    try:
        feedback_id = request.data.get('feedback_id')
        
        if not feedback_id:
            return Response({
                'error': 'feedback_id가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 피드백 객체 확인
        feedback = get_object_or_404(FeedBack, id=feedback_id)
        
        # 권한 확인 (작성자 또는 관리자만)
        if feedback.user != request.user and not request.user.is_staff:
            return Response({
                'error': '권한이 없습니다.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # 영상 파일 확인
        if not feedback.file:
            return Response({
                'error': '분석할 영상 파일이 없습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        video_path = feedback.file.path
        if not os.path.exists(video_path):
            return Response({
                'error': '영상 파일을 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 기존 분석 결과 확인
        analysis_result, created = VideoAnalysisResult.objects.get_or_create(
            feedback=feedback,
            defaults={
                'status': 'pending'
            }
        )
        
        if not created and analysis_result.status == 'processing':
            return Response({
                'message': '이미 분석 중입니다.',
                'analysis_id': analysis_result.id,
                'status': analysis_result.status
            })
        
        # 분석 시작
        analysis_result.status = 'processing'
        analysis_result.save()
        
        try:
            # 설정 확인
            ai_settings = AIAnalysisSettings.get_settings()
            
            if ai_settings.is_enabled and ai_settings.ai_server_url:
                # 비동기 분석 (Celery 태스크)
                analyze_video_task.delay(analysis_result.id, video_path)
                message = 'AI 분석이 시작되었습니다. 잠시 후 결과를 확인해주세요.'
            else:
                # 즉시 더미 분석
                analysis_data = video_analyzer.analyze_video(video_path, feedback_id)
                
                # 결과 저장
                analysis_result.status = 'completed'
                analysis_result.overall_score = analysis_data['results']['overall_score']
                analysis_result.analysis_data = analysis_data
                analysis_result.processing_time = analysis_data.get('processing_time', 0)
                analysis_result.ai_model_version = analysis_data.get('ai_version', 'dummy')
                analysis_result.save()
                
                # 개별 피드백 항목 저장
                save_feedback_items(analysis_result, analysis_data['results']['feedback'])
                
                message = '분석이 완료되었습니다.'
            
            return Response({
                'success': True,
                'message': message,
                'analysis_id': analysis_result.id,
                'feedback_id': feedback_id,
                'status': analysis_result.status,
                'analysis_data': analysis_result.analysis_data if analysis_result.status == 'completed' else None
            })
            
        except Exception as e:
            # 에러 처리
            analysis_result.status = 'failed'
            analysis_result.error_message = str(e)
            analysis_result.save()
            
            logger.error(f"AI 분석 오류 (feedback_id: {feedback_id}): {str(e)}")
            raise e
        
    except Exception as e:
        logger.error(f"AI 분석 API 오류: {str(e)}")
        return Response({
            'error': f'분석 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analysis_result(request, analysis_id):
    """
    분석 결과 조회
    
    GET /api/video-analysis/result/{analysis_id}/
    """
    try:
        analysis_result = get_object_or_404(VideoAnalysisResult, id=analysis_id)
        
        # 권한 확인
        if analysis_result.feedback.user != request.user and not request.user.is_staff:
            return Response({
                'error': '권한이 없습니다.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # 피드백 항목들도 함께 반환
        feedback_items = analysis_result.feedback_items.all()
        feedback_items_data = [
            {
                'type': item.feedback_type,
                'score': item.score,
                'message': item.message,
                'timestamp': item.timestamp,
                'confidence': item.confidence
            }
            for item in feedback_items
        ]
        
        return Response({
            'analysis_id': analysis_result.id,
            'feedback_id': analysis_result.feedback.id,
            'status': analysis_result.status,
            'overall_score': analysis_result.overall_score,
            'analysis_data': analysis_result.analysis_data,
            'feedback_items': feedback_items_data,
            'processing_time': analysis_result.processing_time,
            'ai_model_version': analysis_result.ai_model_version,
            'created_at': analysis_result.created_at,
            'updated_at': analysis_result.updated_at,
            'error_message': analysis_result.error_message if analysis_result.status == 'failed' else None
        })
        
    except Exception as e:
        logger.error(f"분석 결과 조회 오류: {str(e)}")
        return Response({
            'error': f'결과 조회 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def ai_status(request):
    """AI 분석 시스템 상태 확인"""
    try:
        ai_settings = AIAnalysisSettings.get_settings()
        
        # 시스템 상태 확인
        status_info = {
            'ai_enabled': ai_settings.is_enabled,
            'ai_server_url': ai_settings.ai_server_url,
            'analysis_options': {
                'composition': ai_settings.analyze_composition,
                'lighting': ai_settings.analyze_lighting,
                'audio': ai_settings.analyze_audio,
                'stability': ai_settings.analyze_stability,
                'color': ai_settings.analyze_color,
                'motion': ai_settings.analyze_motion,
            },
            'limits': {
                'max_video_duration': ai_settings.max_video_duration,
                'analysis_timeout': ai_settings.analysis_timeout,
            }
        }
        
        if ai_settings.is_enabled and ai_settings.ai_server_url:
            status_info['status'] = 'active'
            status_info['message'] = 'AI 분석이 활성화되어 있습니다.'
        else:
            status_info['status'] = 'development_mode'
            status_info['message'] = '개발 모드: 더미 데이터를 반환합니다.'
        
        # 최근 분석 통계
        from django.utils import timezone
        from datetime import timedelta
        
        recent_analyses = VideoAnalysisResult.objects.filter(
            created_at__gte=timezone.now() - timedelta(hours=24)
        )
        
        status_info['statistics'] = {
            'total_analyses_24h': recent_analyses.count(),
            'completed_24h': recent_analyses.filter(status='completed').count(),
            'failed_24h': recent_analyses.filter(status='failed').count(),
            'processing_24h': recent_analyses.filter(status='processing').count(),
        }
        
        return Response(status_info)
        
    except Exception as e:
        logger.error(f"AI 상태 확인 오류: {str(e)}")
        return Response({
            'error': f'상태 확인 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_analysis_history(request):
    """사용자 분석 히스토리"""
    try:
        # 사용자의 피드백에 대한 분석 결과들
        analyses = VideoAnalysisResult.objects.filter(
            feedback__user=request.user
        ).select_related('feedback').order_by('-created_at')
        
        # 페이지네이션
        from django.core.paginator import Paginator
        paginator = Paginator(analyses, 10)
        page = request.GET.get('page', 1)
        page_analyses = paginator.get_page(page)
        
        results = []
        for analysis in page_analyses:
            results.append({
                'analysis_id': analysis.id,
                'feedback_id': analysis.feedback.id,
                'feedback_title': analysis.feedback.title,
                'status': analysis.status,
                'overall_score': analysis.overall_score,
                'created_at': analysis.created_at,
                'processing_time': analysis.processing_time,
                'ai_model_version': analysis.ai_model_version
            })
        
        return Response({
            'results': results,
            'pagination': {
                'current_page': page_analyses.number,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_analyses.has_next(),
                'has_previous': page_analyses.has_previous(),
            }
        })
        
    except Exception as e:
        logger.error(f"분석 히스토리 조회 오류: {str(e)}")
        return Response({
            'error': f'히스토리 조회 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def save_feedback_items(analysis_result, feedback_data):
    """피드백 항목들을 데이터베이스에 저장"""
    try:
        # 기존 피드백 항목 삭제
        analysis_result.feedback_items.all().delete()
        
        # 새 피드백 항목 생성
        feedback_items = []
        for item in feedback_data:
            feedback_items.append(
                AIFeedbackItem(
                    analysis_result=analysis_result,
                    feedback_type=item.get('type', 'composition'),
                    score=item.get('score', 0.0),
                    message=item.get('message', ''),
                    timestamp=item.get('timestamp', 0.0),
                    confidence=item.get('confidence', 1.0)
                )
            )
        
        # 벌크 생성
        AIFeedbackItem.objects.bulk_create(feedback_items)
        
    except Exception as e:
        logger.error(f"피드백 항목 저장 오류: {str(e)}")
        raise e