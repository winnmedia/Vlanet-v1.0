from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
import logging
import json

from feedbacks.models import FeedBack
from .models import VideoAnalysisResult, AIFeedbackItem
from .serializers import VideoAnalysisResultSerializer, AIFeedbackItemSerializer

logger = logging.getLogger(__name__)

# Graceful import handling for development environment
try:
    from .twelve_labs_service import TwelveLabsService
    from .ai_teacher_service import AITeacherService
    SERVICES_AVAILABLE = True
except ImportError as e:
    logger.warning(f"AI services not available in development: {e}")
    TwelveLabsService = None
    AITeacherService = None
    SERVICES_AVAILABLE = False


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_feedback_video(request, feedback_id):
    """
    피드백 비디오 분석 시작
    """
    if not SERVICES_AVAILABLE:
        return Response({
            'status': 'error',
            'message': 'AI 분석 서비스가 현재 사용할 수 없습니다.'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    try:
        # 피드백 객체 확인
        feedback = get_object_or_404(FeedBack, id=feedback_id)
        
        # 권한 확인 (프로젝트 멤버인지)
        project = feedback.project_feedback.first()
        if project and not project.members.filter(user=request.user).exists():
            return Response({
                'status': 'error',
                'message': '해당 프로젝트의 멤버만 분석을 요청할 수 있습니다.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # 이미 분석 중이거나 완료된 경우
        existing_analysis = VideoAnalysisResult.objects.filter(feedback=feedback).first()
        if existing_analysis:
            if existing_analysis.status == 'processing':
                return Response({
                    'status': 'info',
                    'message': '이미 분석이 진행 중입니다.',
                    'data': VideoAnalysisResultSerializer(existing_analysis).data
                }, status=status.HTTP_200_OK)
            elif existing_analysis.status == 'completed':
                return Response({
                    'status': 'info',
                    'message': '이미 분석이 완료되었습니다.',
                    'data': VideoAnalysisResultSerializer(existing_analysis).data
                }, status=status.HTTP_200_OK)
        
        # 비디오 파일 URL 확인
        video_url = None
        if feedback.files:
            # 원본 파일 사용
            video_url = request.build_absolute_uri(feedback.files.url)
        elif feedback.video_file_web:
            # 웹 최적화 버전 사용
            video_url = request.build_absolute_uri(f"/media/{feedback.video_file_web}")
        else:
            return Response({
                'status': 'error',
                'message': '분석할 비디오 파일이 없습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 분석 결과 객체 생성
        with transaction.atomic():
            analysis_result = VideoAnalysisResult.objects.create(
                feedback=feedback,
                status='pending',
                created_by=request.user,
                analysis_type='twelve_labs'
            )
        
        # Twelve Labs 서비스 초기화
        try:
            twelve_labs = TwelveLabsService()
        except ValueError as e:
            analysis_result.status = 'failed'
            analysis_result.error_message = str(e)
            analysis_result.save()
            
            return Response({
                'status': 'error',
                'message': 'Twelve Labs API 키가 설정되지 않았습니다.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # 비디오 업로드 시작
        analysis_result.status = 'processing'
        analysis_result.processing_started_at = timezone.now()
        analysis_result.save()
        
        # 비디오 메타데이터
        metadata = {
            "feedback_id": str(feedback_id),
            "project_id": str(project.id) if project else None,
            "uploaded_by": request.user.email,
            "original_filename": feedback.files.name if feedback.files else "unknown"
        }
        
        # Twelve Labs에 비디오 업로드
        upload_result = twelve_labs.upload_video(
            video_url=video_url,
            video_name=f"feedback_{feedback_id}",
            metadata=metadata
        )
        
        if not upload_result['success']:
            analysis_result.status = 'failed'
            analysis_result.error_message = upload_result.get('error', '비디오 업로드 실패')
            analysis_result.processing_completed_at = timezone.now()
            analysis_result.save()
            
            return Response({
                'status': 'error',
                'message': '비디오 업로드에 실패했습니다.',
                'error': upload_result.get('error')
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 비디오 ID 저장
        analysis_result.external_video_id = upload_result.get('video_id')
        analysis_result.save()
        
        # 비디오 분석 수행
        if upload_result.get('video_id'):
            analysis_data = twelve_labs.analyze_video(upload_result['video_id'])
            
            if analysis_data['success']:
                # 분석 결과 저장
                analysis_result.analysis_data = analysis_data['analysis']
                analysis_result.overall_score = 85  # 임시 점수 (실제로는 분석 결과 기반으로 계산)
                analysis_result.status = 'completed'
                analysis_result.processing_completed_at = timezone.now()
                
                # 주요 피드백 항목 생성
                _create_feedback_items(analysis_result, analysis_data['analysis'])
                
            else:
                analysis_result.status = 'failed'
                analysis_result.error_message = analysis_data.get('error', '분석 실패')
                analysis_result.processing_completed_at = timezone.now()
        else:
            analysis_result.status = 'failed'
            analysis_result.error_message = '비디오 ID를 받지 못했습니다.'
            analysis_result.processing_completed_at = timezone.now()
        
        analysis_result.save()
        
        return Response({
            'status': 'success',
            'message': '비디오 분석이 완료되었습니다.',
            'data': VideoAnalysisResultSerializer(analysis_result).data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error analyzing video: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': '비디오 분석 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _create_feedback_items(analysis_result, analysis_data):
    """분석 결과를 바탕으로 피드백 항목 생성"""
    try:
        # 요약 기반 피드백
        if analysis_data.get('summary', {}).get('text'):
            AIFeedbackItem.objects.create(
                analysis_result=analysis_result,
                category='summary',
                severity='info',
                title='비디오 요약',
                description=analysis_data['summary']['text'],
                confidence_score=0.9
            )
        
        # 주요 순간 피드백
        key_moments = analysis_data.get('key_moments', [])
        for i, moment in enumerate(key_moments[:5]):  # 상위 5개만
            AIFeedbackItem.objects.create(
                analysis_result=analysis_result,
                category='key_moment',
                severity='info',
                title=f'주요 장면 #{i+1}',
                description=f"{moment['start_time']:.1f}초 - {moment['end_time']:.1f}초",
                timestamp=moment['start_time'],
                confidence_score=moment.get('confidence', 0.8),
                metadata={'thumbnail_url': moment.get('thumbnail_url')}
            )
        
        # 화면 내 텍스트 피드백
        texts_in_video = analysis_data.get('text_in_video', [])
        if texts_in_video:
            text_summary = '\n'.join([f"[{t['start_time']:.1f}s] {t['text']}" for t in texts_in_video[:10]])
            AIFeedbackItem.objects.create(
                analysis_result=analysis_result,
                category='text_detection',
                severity='info',
                title='화면에 나타난 텍스트',
                description=text_summary,
                confidence_score=0.85
            )
        
        # 대화 분석 피드백
        conversations = analysis_data.get('conversations', [])
        if conversations:
            conv_summary = '\n'.join([f"[{c['start_time']:.1f}s] {c['transcript']}" for c in conversations[:5]])
            AIFeedbackItem.objects.create(
                analysis_result=analysis_result,
                category='conversation',
                severity='info',
                title='주요 대화 내용',
                description=conv_summary,
                confidence_score=0.9
            )
            
    except Exception as e:
        logger.error(f"Error creating feedback items: {e}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analysis_result(request, feedback_id):
    """
    분석 결과 조회
    """
    try:
        feedback = get_object_or_404(FeedBack, id=feedback_id)
        
        # 권한 확인
        project = feedback.project_feedback.first()
        if project and not project.members.filter(user=request.user).exists():
            return Response({
                'status': 'error',
                'message': '해당 프로젝트의 멤버만 분석 결과를 조회할 수 있습니다.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        analysis_result = VideoAnalysisResult.objects.filter(feedback=feedback).first()
        
        if not analysis_result:
            return Response({
                'status': 'info',
                'message': '분석 결과가 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 피드백 항목도 함께 조회
        feedback_items = AIFeedbackItem.objects.filter(
            analysis_result=analysis_result
        ).order_by('-severity', '-confidence_score')
        
        return Response({
            'status': 'success',
            'data': {
                'analysis': VideoAnalysisResultSerializer(analysis_result).data,
                'feedback_items': AIFeedbackItemSerializer(feedback_items, many=True).data
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error retrieving analysis result: {str(e)}")
        return Response({
            'status': 'error',
            'message': '분석 결과 조회 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def search_in_videos(request):
    """
    업로드된 비디오들에서 내용 검색
    """
    try:
        query = request.data.get('query', '')
        options = request.data.get('options', ['visual', 'conversation', 'text_in_video'])
        limit = request.data.get('limit', 10)
        
        if not query:
            return Response({
                'status': 'error',
                'message': '검색어를 입력해주세요.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Twelve Labs 서비스 초기화
        try:
            twelve_labs = TwelveLabsService()
        except ValueError:
            return Response({
                'status': 'error',
                'message': 'Twelve Labs API 키가 설정되지 않았습니다.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # 비디오 검색 수행
        search_results = twelve_labs.search_in_videos(
            query=query,
            options=options,
            limit=limit
        )
        
        # 검색 결과에 피드백 정보 추가
        enriched_results = []
        for result in search_results:
            # external_video_id로 분석 결과 찾기
            analysis = VideoAnalysisResult.objects.filter(
                external_video_id=result['video_id']
            ).first()
            
            if analysis and analysis.feedback:
                # 권한 확인
                project = analysis.feedback.project_feedback.first()
                if project and project.members.filter(user=request.user).exists():
                    result['feedback_id'] = analysis.feedback.id
                    result['feedback_title'] = f"Feedback #{analysis.feedback.id}"
                    result['project_name'] = project.name if project else None
                    enriched_results.append(result)
        
        return Response({
            'status': 'success',
            'data': {
                'query': query,
                'results': enriched_results,
                'total': len(enriched_results)
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error searching videos: {str(e)}")
        return Response({
            'status': 'error',
            'message': '비디오 검색 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_analysis(request, feedback_id):
    """
    분석 결과 삭제
    """
    try:
        feedback = get_object_or_404(FeedBack, id=feedback_id)
        
        # 권한 확인 (프로젝트 매니저인지)
        project = feedback.project_feedback.first()
        if project:
            member = project.members.filter(user=request.user, member_type='manager').first()
            if not member:
                return Response({
                    'status': 'error',
                    'message': '프로젝트 매니저만 분석 결과를 삭제할 수 있습니다.'
                }, status=status.HTTP_403_FORBIDDEN)
        
        analysis_result = VideoAnalysisResult.objects.filter(feedback=feedback).first()
        
        if not analysis_result:
            return Response({
                'status': 'info',
                'message': '삭제할 분석 결과가 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Twelve Labs에서 비디오 삭제
        if analysis_result.external_video_id:
            try:
                twelve_labs = TwelveLabsService()
                twelve_labs.delete_video(analysis_result.external_video_id)
            except Exception as e:
                logger.error(f"Failed to delete video from Twelve Labs: {e}")
        
        # 분석 결과 삭제 (CASCADE로 AIFeedbackItem도 함께 삭제됨)
        analysis_result.delete()
        
        return Response({
            'status': 'success',
            'message': '분석 결과가 삭제되었습니다.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error deleting analysis: {str(e)}")
        return Response({
            'status': 'error',
            'message': '분석 결과 삭제 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_teacher_feedback(request, feedback_id):
    """
    AI 선생님의 피드백 받기
    """
    try:
        # 분석 결과 확인
        analysis_result = get_object_or_404(
            VideoAnalysisResult,
            feedback_id=feedback_id,
            status='completed'
        )
        
        # 권한 확인
        project = analysis_result.feedback.project_feedback.first()
        if project and not project.members.filter(user=request.user).exists():
            return Response({
                'status': 'error',
                'message': '해당 프로젝트의 멤버만 피드백을 받을 수 있습니다.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # 선생님 타입
        teacher_type = request.data.get('teacher_type', 'owl')
        
        # AI 선생님 서비스 초기화
        teacher_service = AITeacherService()
        
        # 피드백 생성
        teacher_feedback = teacher_service.transform_feedback(
            analysis_result.analysis_data,
            teacher_type
        )
        
        # 선생님 피드백을 AIFeedbackItem으로 저장
        feedback_data = teacher_feedback['feedback']
        teacher_info = teacher_feedback['teacher']
        
        # 기존 선생님 피드백 삭제 (동일 선생님)
        AIFeedbackItem.objects.filter(
            analysis_result=analysis_result,
            category='teacher_feedback',
            metadata__teacher_type=teacher_type
        ).delete()
        
        # 전체 피드백 저장
        overall_item = AIFeedbackItem.objects.create(
            analysis_result=analysis_result,
            category='teacher_feedback',
            severity='info',
            title=f"{teacher_info['name']}의 종합 평가",
            description=feedback_data['overall_feedback'],
            confidence_score=feedback_data.get('score', 75) / 100,
            metadata={
                'teacher_type': teacher_type,
                'teacher_name': teacher_info['name'],
                'emoji': teacher_info['emoji'],
                'score': feedback_data.get('score', 75),
                'emoji_reaction': feedback_data.get('emoji_reaction', '😊')
            }
        )
        
        # 장점 저장
        for strength in feedback_data.get('strengths', []):
            AIFeedbackItem.objects.create(
                analysis_result=analysis_result,
                category='teacher_strength',
                severity='low',
                title='장점',
                description=strength,
                confidence_score=0.9,
                metadata={'teacher_type': teacher_type}
            )
        
        # 개선점 저장
        for improvement in feedback_data.get('improvements', []):
            AIFeedbackItem.objects.create(
                analysis_result=analysis_result,
                category='teacher_improvement',
                severity='medium',
                title='개선점',
                description=improvement,
                confidence_score=0.9,
                metadata={'teacher_type': teacher_type}
            )
        
        # 타임스탬프별 코멘트 저장
        for comment in feedback_data.get('specific_comments', []):
            AIFeedbackItem.objects.create(
                analysis_result=analysis_result,
                category='teacher_comment',
                severity='info',
                title='구체적 코멘트',
                description=comment['comment'],
                timestamp=comment['timestamp'],
                confidence_score=0.85,
                metadata={'teacher_type': teacher_type}
            )
        
        # 마무리 메시지
        AIFeedbackItem.objects.create(
            analysis_result=analysis_result,
            category='teacher_final',
            severity='info',
            title='마무리 메시지',
            description=feedback_data.get('final_message', ''),
            confidence_score=1.0,
            metadata={'teacher_type': teacher_type}
        )
        
        return Response({
            'status': 'success',
            'data': {
                'teacher': teacher_info,
                'feedback': feedback_data,
                'analysis_summary': teacher_feedback.get('analysis_summary', {})
            }
        }, status=status.HTTP_200_OK)
        
    except VideoAnalysisResult.DoesNotExist:
        return Response({
            'status': 'error',
            'message': '분석이 완료되지 않았거나 존재하지 않습니다.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error getting teacher feedback: {str(e)}")
        return Response({
            'status': 'error',
            'message': '선생님 피드백 생성 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_all_teachers(request):
    """
    모든 AI 선생님 정보 조회
    """
    try:
        # AI 선생님 직접 반환 (서비스 초기화 문제 회피)
        teachers = {
            'tiger': {
                'name': '호랑이 선생님',
                'emoji': '🐯',
                'personality': '맹렬하고 직설적인',
                'style': '강렬하고 열정적인 피드백',
                'tone': '단호하고 엄격한',
                'greeting': '어흥! 자, 이제 제대로 된 피드백을 들어볼 시간이야!',
                'color': '#FF6B35',
                'bg_color': '#FFF5F0'
            },
            'owl': {
                'name': '부엉이 선생님',
                'emoji': '🦉',
                'personality': '포근하고 지혜로운',
                'style': '격려와 용기를 주는 피드백',
                'tone': '따뜻하고 부드러운',
                'greeting': '부엉부엉~ 좋은 영상을 만들어주셨네요. 함께 더 나은 작품을 만들어봐요.',
                'color': '#8B4513',
                'bg_color': '#FFF8DC'
            },
            'dolphin': {
                'name': '돌고래 선생님',
                'emoji': '🐬',
                'personality': '유쾌하고 긍정적인',
                'style': '재미있고 활기찬 피드백',
                'tone': '밝고 경쾌한',
                'greeting': '삐삐~ 안녕하세요! 오늘도 신나게 영상을 분석해볼까요?',
                'color': '#4169E1',
                'bg_color': '#F0F8FF'
            },
            'eagle': {
                'name': '독수리 선생님',
                'emoji': '🦅',
                'personality': '날카롭고 분석적인',
                'style': '전문적이고 상세한 피드백',
                'tone': '침착하고 논리적인',
                'greeting': '크아악~ 멀리서도 보이는 문제점들을 하나하나 짚어드리겠습니다.',
                'color': '#8B4513',
                'bg_color': '#FFFAF0'
            }
        }
        
        return Response({
            'status': 'success',
            'data': {
                'teachers': teachers
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting teachers: {str(e)}")
        return Response({
            'status': 'error',
            'message': '선생님 정보를 가져오는 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)