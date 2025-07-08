"""
기획안 내보내기 API Views
"""

import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings

from .proposal_export_service import ProposalExportService, ProposalPromptOptimizer
from .serializers_proposal import (
    ProposalExportSerializer,
    ProposalExportResponseSerializer,
    ProposalStructurePreviewSerializer,
    StructuredProposalSerializer
)

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_proposal(request):
    """
    기획안 내보내기 메인 엔드포인트
    
    POST /api/video-planning/proposals/export/
    
    사용자가 입력한 자유 형식의 한글 텍스트를 구조화된 Google Slides로 변환
    """
    try:
        # 입력 데이터 검증
        serializer = ProposalExportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': '입력 데이터가 유효하지 않습니다.',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        planning_text = validated_data['planning_text']
        export_format = validated_data.get('export_format', 'google_slides')
        
        logger.info(f"기획안 내보내기 요청 - 사용자: {request.user.email}, 텍스트 길이: {len(planning_text)}")
        
        # 서비스 초기화
        try:
            export_service = ProposalExportService()
        except ValueError as e:
            return Response({
                'success': False,
                'message': 'API 키 설정 오류',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 내보내기 실행
        if export_format == 'json':
            # JSON 데이터만 반환
            result = export_service.process_proposal_text(planning_text)
        elif export_format == 'google_slides':
            # Google Slides 생성
            result = export_service.export_proposal(planning_text)
        else:  # 'both'
            # 둘 다 생성
            result = export_service.export_proposal(planning_text)
        
        # 응답 준비
        if result.get('success', False):
            response_data = {
                'success': True,
                'message': '기획안이 성공적으로 생성되었습니다.',
                'structured_data': result.get('structured_data'),
                'presentation': result.get('presentation'),
                'export_format': export_format
            }
            
            # 사용자별 사용량 로깅
            logger.info(f"기획안 내보내기 성공 - 사용자: {request.user.email}")
            
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            # 부분 성공 또는 실패
            error_message = result.get('error', '알 수 없는 오류가 발생했습니다.')
            failed_step = result.get('step', 'unknown')
            
            response_data = {
                'success': False,
                'message': f'{failed_step} 단계에서 오류가 발생했습니다.',
                'error': error_message,
                'step': failed_step,
                'details': result.get('details'),
                'structured_data': result.get('structured_data')  # 구조화는 성공한 경우
            }
            
            logger.warning(f"기획안 내보내기 부분 실패 - 사용자: {request.user.email}, 단계: {failed_step}")
            
            return Response(response_data, status=status.HTTP_207_MULTI_STATUS)
    
    except Exception as e:
        logger.error(f"기획안 내보내기 예외 발생 - 사용자: {request.user.email}, 오류: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': '서버 내부 오류가 발생했습니다.',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def preview_structure(request):
    """
    기획안 구조 미리보기 엔드포인트
    
    POST /api/video-planning/proposals/preview/
    
    Google Slides 생성 없이 구조화된 데이터만 반환
    """
    try:
        # 입력 데이터 검증
        serializer = ProposalStructurePreviewSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': '입력 데이터가 유효하지 않습니다.',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        planning_text = validated_data['planning_text']
        
        logger.info(f"기획안 구조 미리보기 요청 - 사용자: {request.user.email}")
        
        # 서비스 초기화
        try:
            export_service = ProposalExportService()
        except ValueError as e:
            return Response({
                'success': False,
                'message': 'API 키 설정 오류',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 텍스트 구조화만 실행
        result = export_service.process_proposal_text(planning_text)
        
        if result.get('success', False):
            return Response({
                'success': True,
                'message': '기획안 구조가 성공적으로 생성되었습니다.',
                'structured_data': result['data'],
                'slide_count': len(result['data'].get('slides', [])),
                'metadata': result['data'].get('metadata', {})
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': '기획안 구조 생성에 실패했습니다.',
                'error': result.get('error', '알 수 없는 오류'),
                'fallback_data': result.get('data')
            }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"기획안 구조 미리보기 예외 발생 - 사용자: {request.user.email}, 오류: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': '서버 내부 오류가 발생했습니다.',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_slides_from_structure(request):
    """
    구조화된 데이터로 Google Slides 생성
    
    POST /api/video-planning/proposals/create-slides/
    
    미리보기에서 받은 구조화된 데이터를 수정 후 Google Slides 생성
    """
    try:
        # 입력 데이터 검증
        serializer = StructuredProposalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': '구조화된 데이터가 유효하지 않습니다.',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        
        logger.info(f"구조화된 데이터로 Google Slides 생성 요청 - 사용자: {request.user.email}")
        
        # 서비스 초기화
        try:
            export_service = ProposalExportService()
        except ValueError as e:
            return Response({
                'success': False,
                'message': 'API 키 설정 오류',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Google Slides 생성
        structure_result = {
            'success': True,
            'data': validated_data
        }
        
        slides_result = export_service.create_google_slides(structure_result)
        
        if slides_result.get('success', False):
            return Response({
                'success': True,
                'message': 'Google Slides가 성공적으로 생성되었습니다.',
                'presentation': {
                    'id': slides_result['presentation_id'],
                    'url': slides_result['url'],
                    'title': slides_result['title'],
                    'slide_count': slides_result['slide_count']
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': 'Google Slides 생성에 실패했습니다.',
                'error': slides_result.get('error', '알 수 없는 오류')
            }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Google Slides 생성 예외 발생 - 사용자: {request.user.email}, 오류: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': '서버 내부 오류가 발생했습니다.',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_available_templates(request):
    """
    사용 가능한 기획안 템플릿 목록 반환
    
    GET /api/video-planning/proposals/templates/
    """
    templates = [
        {
            'id': 'corporate_video',
            'name': '기업 홍보영상',
            'description': '기업 브랜딩 및 제품 소개용 영상 기획서',
            'slide_count': 8,
            'sections': ['개요', '브랜드 스토리', '제품 소개', '타겟 분석', '제작 계획', '예산', '일정', '기대효과']
        },
        {
            'id': 'educational_content',
            'name': '교육 콘텐츠',
            'description': '온라인 강의 및 교육용 영상 기획서',
            'slide_count': 7,
            'sections': ['학습목표', '대상학습자', '커리큘럼', '콘텐츠 구성', '제작방법', '평가방법', '예상효과']
        },
        {
            'id': 'social_media',
            'name': '소셜미디어 콘텐츠',
            'description': 'SNS 마케팅용 숏폼 영상 기획서',
            'slide_count': 6,
            'sections': ['플랫폼 분석', '타겟 오디언스', '콘텐츠 컨셉', '촬영 계획', '편집 스타일', 'KPI 목표']
        },
        {
            'id': 'documentary',
            'name': '다큐멘터리',
            'description': '다큐멘터리 및 기록영상 기획서',
            'slide_count': 9,
            'sections': ['주제 배경', '촬영 대상', '스토리 구성', '촬영 계획', '인터뷰 계획', '후반작업', '배급계획', '예산', '일정']
        }
    ]
    
    return Response({
        'success': True,
        'templates': templates,
        'message': f'{len(templates)}개의 템플릿을 사용할 수 있습니다.'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_service_status(request):
    """
    기획안 내보내기 서비스 상태 확인
    
    GET /api/video-planning/proposals/status/
    """
    try:
        # 서비스 초기화 테스트
        export_service = ProposalExportService()
        
        status_info = {
            'gemini_api': True,
            'google_slides': export_service.slides_available,
            'overall_status': 'healthy' if export_service.slides_available else 'partial',
            'message': 'All services are available' if export_service.slides_available else 'Google Slides service not available'
        }
        
        return Response({
            'success': True,
            'services': status_info,
            'timestamp': request.timestamp if hasattr(request, 'timestamp') else None
        }, status=status.HTTP_200_OK)
    
    except ValueError as e:
        return Response({
            'success': False,
            'services': {
                'gemini_api': False,
                'google_slides': False,
                'overall_status': 'unavailable',
                'message': str(e)
            }
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        logger.error(f"서비스 상태 확인 오류: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)