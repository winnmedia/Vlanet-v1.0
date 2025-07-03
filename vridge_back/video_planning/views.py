from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from django.db.models import Q
from .models import VideoPlanning, VideoPlanningImage
from .serializers import VideoPlanningSerializer, VideoPlanningListSerializer
from .gemini_service import GeminiService
import logging

# 이미지 생성 서비스 import
try:
    from .imagen_service import StableDiffusionService
    IMAGE_SERVICE_AVAILABLE = True
except ImportError:
    StableDiffusionService = None
    IMAGE_SERVICE_AVAILABLE = False
import requests
from urllib.parse import urlparse
import os

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_structure(request):
    try:
        planning_input = request.data.get('planning_input', '')
        
        if not planning_input:
            return Response({
                'status': 'error',
                'message': '기획안을 입력해주세요.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        gemini_service = GeminiService()
        structure_data = gemini_service.generate_structure(planning_input)
        
        if 'error' in structure_data:
            logger.error(f"Gemini API error: {structure_data['error']}")
            structure_data = structure_data.get('fallback', {})
        
        return Response({
            'status': 'success',
            'data': structure_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in generate_structure: {str(e)}")
        return Response({
            'status': 'error',
            'message': '구성안 생성 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_story(request):
    try:
        planning_text = request.data.get('planning_text', '')
        
        if not planning_text:
            return Response({
                'status': 'error',
                'message': '기획안 텍스트가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        gemini_service = GeminiService()
        stories_data = gemini_service.generate_stories_from_planning(planning_text)
        
        if 'error' in stories_data:
            logger.error(f"Gemini API error: {stories_data['error']}")
            stories_data = stories_data.get('fallback', {})
        
        return Response({
            'status': 'success',
            'data': stories_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in generate_story: {str(e)}")
        return Response({
            'status': 'error',
            'message': '스토리 생성 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_scenes(request):
    try:
        story_data = request.data.get('story_data', {})
        
        if not story_data:
            return Response({
                'status': 'error',
                'message': '스토리 데이터가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        gemini_service = GeminiService()
        scenes_data = gemini_service.generate_scenes_from_story(story_data)
        
        if 'error' in scenes_data:
            logger.error(f"Gemini API error: {scenes_data['error']}")
            scenes_data = scenes_data.get('fallback', {})
        
        return Response({
            'status': 'success',
            'data': scenes_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in generate_scenes: {str(e)}")
        return Response({
            'status': 'error',
            'message': '씬 생성 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_shots(request):
    try:
        scene_data = request.data.get('scene_data', {})
        
        if not scene_data:
            return Response({
                'status': 'error',
                'message': '씬 데이터가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        gemini_service = GeminiService()
        shots_data = gemini_service.generate_shots_from_scene(scene_data)
        
        if 'error' in shots_data:
            logger.error(f"Gemini API error: {shots_data['error']}")
            shots_data = shots_data.get('fallback', {})
        
        return Response({
            'status': 'success',
            'data': shots_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in generate_shots: {str(e)}")
        return Response({
            'status': 'error',
            'message': '쇼트 생성 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_storyboards(request):
    try:
        shot_data = request.data.get('shot_data', {})
        
        if not shot_data:
            return Response({
                'status': 'error',
                'message': '숏 데이터가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        gemini_service = GeminiService()
        storyboard_data = gemini_service.generate_storyboards_from_shot(shot_data)
        
        if 'error' in storyboard_data:
            logger.error(f"Gemini API error: {storyboard_data['error']}")
            storyboard_data = storyboard_data.get('fallback', {})
        
        return Response({
            'status': 'success',
            'data': storyboard_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in generate_storyboards: {str(e)}")
        return Response({
            'status': 'error',
            'message': '콘티 생성 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def regenerate_storyboard_image(request):
    try:
        frame_data = request.data.get('frame_data', {})
        
        if not frame_data:
            return Response({
                'status': 'error',
                'message': '프레임 데이터가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 이미지 생성 서비스 초기화
        if not IMAGE_SERVICE_AVAILABLE:
            return Response({
                'status': 'error',
                'message': '이미지 생성 서비스가 설치되지 않았습니다.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
        try:
            image_service = StableDiffusionService()
            if not image_service.available:
                return Response({
                    'status': 'error',
                    'message': 'Stable Diffusion 서비스를 사용할 수 없습니다. HUGGINGFACE_API_KEY를 확인해주세요.'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': '이미지 생성 서비스 초기화 실패'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # 이미지 재생성
        image_result = image_service.generate_storyboard_image(frame_data)
        
        if image_result['success']:
            return Response({
                'status': 'success',
                'data': {
                    'image_url': image_result['image_url'],
                    'frame_number': frame_data.get('frame_number', 0)
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'status': 'error',
                'message': image_result.get('error', '이미지 생성에 실패했습니다.')
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        logger.error(f"Error in regenerate_storyboard_image: {str(e)}")
        return Response({
            'status': 'error',
            'message': '이미지 재생성 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def download_storyboard_image(request):
    try:
        image_url = request.data.get('image_url', '')
        frame_title = request.data.get('frame_title', 'storyboard')
        
        if not image_url:
            return Response({
                'status': 'error',
                'message': '이미지 URL이 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 이미지 다운로드
        response = requests.get(image_url)
        
        if response.status_code != 200:
            return Response({
                'status': 'error',
                'message': '이미지를 다운로드할 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 파일 이름 생성
        file_extension = '.png'
        parsed_url = urlparse(image_url)
        if parsed_url.path:
            _, ext = os.path.splitext(parsed_url.path)
            if ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                file_extension = ext
        
        safe_title = "".join(c for c in frame_title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        filename = f"{safe_title}{file_extension}"
        
        # HTTP 응답 생성
        http_response = HttpResponse(
            response.content,
            content_type=f'image/{file_extension[1:]}'
        )
        http_response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return http_response
        
    except Exception as e:
        logger.error(f"Error in download_storyboard_image: {str(e)}")
        return Response({
            'status': 'error',
            'message': '이미지 다운로드 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_planning(request):
    """기획을 저장합니다."""
    try:
        serializer = VideoPlanningSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            planning = serializer.save()
            
            # 스토리보드 이미지 URL이 있으면 별도로 저장
            storyboards = planning.storyboards
            for storyboard in storyboards:
                if 'image_url' in storyboard and storyboard['image_url']:
                    VideoPlanningImage.objects.update_or_create(
                        planning=planning,
                        frame_number=storyboard.get('frame_number', 0),
                        defaults={
                            'image_url': storyboard['image_url'],
                            'prompt_used': storyboard.get('prompt_used', '')
                        }
                    )
            
            return Response({
                'status': 'success',
                'data': VideoPlanningSerializer(planning).data,
                'message': '기획이 저장되었습니다.'
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'status': 'error',
                'message': '유효하지 않은 데이터입니다.',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error in save_planning: {str(e)}")
        return Response({
            'status': 'error',
            'message': '기획 저장 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_planning_list(request):
    """사용자의 기획 목록을 조회합니다. (최대 5개)"""
    try:
        plannings = VideoPlanning.objects.filter(
            user=request.user
        ).order_by('-created_at')[:5]
        
        serializer = VideoPlanningListSerializer(plannings, many=True)
        
        return Response({
            'status': 'success',
            'data': serializer.data,
            'count': len(serializer.data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in get_planning_list: {str(e)}")
        return Response({
            'status': 'error',
            'message': '기획 목록 조회 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_planning_detail(request, planning_id):
    """특정 기획의 상세 정보를 조회합니다."""
    try:
        planning = VideoPlanning.objects.filter(
            id=planning_id,
            user=request.user
        ).first()
        
        if not planning:
            return Response({
                'status': 'error',
                'message': '기획을 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = VideoPlanningSerializer(planning)
        
        return Response({
            'status': 'success',
            'data': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in get_planning_detail: {str(e)}")
        return Response({
            'status': 'error',
            'message': '기획 조회 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_planning(request, planning_id):
    """기획 정보를 업데이트합니다."""
    try:
        planning = VideoPlanning.objects.filter(
            id=planning_id,
            user=request.user
        ).first()
        
        if not planning:
            return Response({
                'status': 'error',
                'message': '기획을 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = VideoPlanningSerializer(
            planning,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            planning = serializer.save()
            
            # 스토리보드 이미지 업데이트
            if 'storyboards' in request.data:
                storyboards = request.data['storyboards']
                for storyboard in storyboards:
                    if 'image_url' in storyboard and storyboard['image_url']:
                        VideoPlanningImage.objects.update_or_create(
                            planning=planning,
                            frame_number=storyboard.get('frame_number', 0),
                            defaults={
                                'image_url': storyboard['image_url'],
                                'prompt_used': storyboard.get('prompt_used', '')
                            }
                        )
            
            return Response({
                'status': 'success',
                'data': VideoPlanningSerializer(planning).data,
                'message': '기획이 업데이트되었습니다.'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'status': 'error',
                'message': '유효하지 않은 데이터입니다.',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error in update_planning: {str(e)}")
        return Response({
            'status': 'error',
            'message': '기획 업데이트 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_planning(request, planning_id):
    """기획을 삭제합니다."""
    try:
        planning = VideoPlanning.objects.filter(
            id=planning_id,
            user=request.user
        ).first()
        
        if not planning:
            return Response({
                'status': 'error',
                'message': '기획을 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        planning.delete()
        
        return Response({
            'status': 'success',
            'message': '기획이 삭제되었습니다.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in delete_planning: {str(e)}")
        return Response({
            'status': 'error',
            'message': '기획 삭제 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)