"""
Celery 태스크 - 비동기 영상 분석
"""
from celery import shared_task
import logging
from .models import VideoAnalysisResult
from .analyzer_lazy import get_video_analyzer
from .views import save_feedback_items

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def analyze_video_task(self, analysis_id, video_path):
    """
    비동기 영상 분석 태스크
    
    Args:
        analysis_id: VideoAnalysisResult ID
        video_path: 분석할 영상 파일 경로
    """
    try:
        # 분석 결과 객체 가져오기
        analysis_result = VideoAnalysisResult.objects.get(id=analysis_id)
        
        logger.info(f"비동기 영상 분석 시작: {video_path} (ID: {analysis_id})")
        
        # 분석 실행
        analysis_data = video_analyzer.analyze_video(
            video_path, 
            feedback_id=analysis_result.feedback.id
        )
        
        # 에러 확인
        if analysis_data.get('error'):
            raise Exception(analysis_data.get('error_message', '알 수 없는 오류'))
        
        # 결과 저장
        analysis_result.status = 'completed'
        analysis_result.overall_score = analysis_data['results']['overall_score']
        analysis_result.analysis_data = analysis_data
        analysis_result.processing_time = analysis_data.get('processing_time', 0)
        analysis_result.ai_model_version = analysis_data.get('ai_version', 'unknown')
        analysis_result.ai_server_url = analysis_data.get('server_url', '')
        analysis_result.error_message = ''
        analysis_result.save()
        
        # 개별 피드백 항목 저장
        if 'feedback' in analysis_data['results']:
            save_feedback_items(analysis_result, analysis_data['results']['feedback'])
        
        logger.info(f"영상 분석 완료: {video_path} (ID: {analysis_id})")
        
        return {
            'success': True,
            'analysis_id': analysis_id,
            'overall_score': analysis_result.overall_score,
            'processing_time': analysis_result.processing_time
        }
        
    except VideoAnalysisResult.DoesNotExist:
        logger.error(f"분석 결과 객체를 찾을 수 없음: {analysis_id}")
        return {'success': False, 'error': '분석 결과 객체를 찾을 수 없습니다.'}
        
    except Exception as e:
        error_message = str(e)
        logger.error(f"영상 분석 태스크 오류 (ID: {analysis_id}): {error_message}")
        
        # 에러 상태로 업데이트
        try:
            analysis_result = VideoAnalysisResult.objects.get(id=analysis_id)
            analysis_result.status = 'failed'
            analysis_result.error_message = error_message
            analysis_result.save()
        except:
            pass
        
        # 재시도 로직
        if self.request.retries < self.max_retries:
            logger.info(f"영상 분석 재시도 ({self.request.retries + 1}/{self.max_retries}): {analysis_id}")
            raise self.retry(countdown=60 * (self.request.retries + 1))
        
        return {
            'success': False,
            'error': error_message,
            'analysis_id': analysis_id
        }


@shared_task
def cleanup_old_analyses():
    """오래된 분석 결과 정리 (주기적 실행)"""
    from django.utils import timezone
    from datetime import timedelta
    
    try:
        # 30일 이상 된 실패한 분석 결과 삭제
        cutoff_date = timezone.now() - timedelta(days=30)
        
        old_failed_analyses = VideoAnalysisResult.objects.filter(
            status='failed',
            created_at__lt=cutoff_date
        )
        
        deleted_count = old_failed_analyses.count()
        old_failed_analyses.delete()
        
        logger.info(f"오래된 실패 분석 결과 {deleted_count}개 정리 완료")
        
        # 90일 이상 된 분석 결과의 상세 데이터 압축
        very_old_analyses = VideoAnalysisResult.objects.filter(
            created_at__lt=timezone.now() - timedelta(days=90)
        )
        
        compressed_count = 0
        for analysis in very_old_analyses:
            if analysis.analysis_data and len(str(analysis.analysis_data)) > 1000:
                # 상세 데이터 압축 (핵심 정보만 유지)
                compressed_data = {
                    'overall_score': analysis.overall_score,
                    'summary': '오래된 분석 결과 (상세 데이터 압축됨)',
                    'compressed_at': timezone.now().isoformat()
                }
                analysis.analysis_data = compressed_data
                analysis.save()
                compressed_count += 1
        
        if compressed_count > 0:
            logger.info(f"오래된 분석 결과 {compressed_count}개 압축 완료")
        
        return {
            'deleted_failed': deleted_count,
            'compressed_old': compressed_count
        }
        
    except Exception as e:
        logger.error(f"분석 결과 정리 오류: {str(e)}")
        return {'error': str(e)}


@shared_task
def batch_analyze_videos(feedback_ids):
    """여러 영상 일괄 분석"""
    results = []
    
    for feedback_id in feedback_ids:
        try:
            from feedbacks.models import FeedBack
            feedback = FeedBack.objects.get(id=feedback_id)
            
            # 분석 결과 생성
            analysis_result, created = VideoAnalysisResult.objects.get_or_create(
                feedback=feedback,
                defaults={'status': 'processing'}
            )
            
            if created or analysis_result.status == 'failed':
                # 개별 분석 태스크 실행
                analyze_video_task.delay(analysis_result.id, feedback.file.path)
                results.append({
                    'feedback_id': feedback_id,
                    'analysis_id': analysis_result.id,
                    'status': 'queued'
                })
            else:
                results.append({
                    'feedback_id': feedback_id,
                    'analysis_id': analysis_result.id,
                    'status': 'already_exists'
                })
                
        except Exception as e:
            logger.error(f"일괄 분석 오류 (feedback_id: {feedback_id}): {str(e)}")
            results.append({
                'feedback_id': feedback_id,
                'status': 'error',
                'error': str(e)
            })
    
    return results