from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import AllowAnyTemporary
# from .debug_permissions import DebugAllowAny  # 삭제된 파일
from rest_framework.response import Response
from django.http import HttpResponse
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from .models import VideoPlanning, VideoPlanningImage, VideoPlanningAIPrompt
from .serializers import VideoPlanningSerializer, VideoPlanningListSerializer
from .gemini_service import GeminiService
from .ai_prompt_engine import PromptOptimizationService, PromptGenerationContext, PromptGenerationResult
from .ai_prompt_generator import VideoPlanningPromptGenerator, VEO3PromptGenerator
import logging

# 이미지 생성 서비스 import
try:
    from .dalle_service import DalleService
    IMAGE_SERVICE_AVAILABLE = True
except ImportError:
    DalleService = None
    IMAGE_SERVICE_AVAILABLE = False
import requests
from urllib.parse import urlparse
import os
import json
from django.http import FileResponse, HttpResponse
from .pdf_export_service import PDFExportService
from .compressed_pdf_export_service import CompressedPDFExportService
from .pdf_export_service_enhanced import EnhancedPDFExportService
from .google_slides_service import GoogleSlidesService
from .services.advanced_pdf_export_service import AdvancedPDFExportService
from .async_image_generator import AsyncImageGenerator
import uuid
from django.core.cache import cache
import threading
from datetime import datetime

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recent_plannings(request):
    """
    사용자의 최근 비디오 기획 로그를 가져옵니다.
    """
    # 디버깅 로그 추가
    logger.info(f"[get_recent_plannings] User: {request.user}, Authenticated: {request.user.is_authenticated}")
    logger.info(f"[get_recent_plannings] Auth Header: {request.META.get('HTTP_AUTHORIZATION', 'No auth header')}")
    
    try:
        # 인증된 사용자의 최근 5개 기획 로그 가져오기
        # 명시적으로 필드를 선택하여 존재하지 않는 필드 오류 방지
        recent_plannings = VideoPlanning.objects.filter(
            user=request.user
        ).values(
            'id', 'title', 'planning_text', 'stories', 'selected_story',
            'scenes', 'selected_scene', 'shots', 'selected_shot',
            'storyboards', 'planning_options', 'is_completed', 
            'current_step', 'created_at', 'updated_at'
        ).order_by('-created_at')[:5]
        
        # 응답 데이터 구성
        planning_logs = []
        for planning in recent_plannings:
            try:
                # planning_options 가져오기 (이제 planning은 딕셔너리)
                planning_options = {}
                if planning.get('selected_story') and isinstance(planning['selected_story'], dict):
                    planning_options = planning['selected_story'].get('planning_options', {})
                
                planning_logs.append({
                    'id': planning['id'],
                    'title': planning.get('title') or '제목 없음',
                    'created_at': planning['created_at'].strftime('%Y-%m-%d %H:%M') if planning.get('created_at') else '',
                    'planning_options': planning.get('planning_options') or planning_options,
                    'current_step': planning.get('current_step') or 1,
                    'is_completed': planning.get('is_completed') or False,
                    'planning_data': {
                        'planning': planning.get('planning_text', ''),
                        'stories': planning.get('stories', []),
                        'scenes': planning.get('scenes', []),
                        'shots': planning.get('shots', []),
                        'storyboards': planning.get('storyboards', [])
                    }
                })
            except Exception as item_error:
                logger.warning(f"Error processing planning item {planning.get('id', 'unknown')}: {str(item_error)}")
                continue
        
        return Response({
            'status': 'success',
            'data': {
                'planning_logs': planning_logs,
                'total_count': VideoPlanning.objects.filter(user=request.user).count()
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in get_recent_plannings: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'최근 기획 로그를 가져오는 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_structure(request):
    try:
        # planning_text 또는 planning_input 둘 다 받을 수 있도록 수정
        planning_input = request.data.get('planning_text', '') or request.data.get('planning_input', '')
        
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
    # 디버깅 로그 추가
    logger.info(f"[generate_story] User: {request.user}, Authenticated: {request.user.is_authenticated}")
    logger.info(f"[generate_story] Auth Header: {request.META.get('HTTP_AUTHORIZATION', 'No auth header')}")
    
    try:
        planning_text = request.data.get('planning_text', '')
        tone = request.data.get('tone', '')
        genre = request.data.get('genre', '')
        concept = request.data.get('concept', '')
        target = request.data.get('target', '')
        purpose = request.data.get('purpose', '')
        duration = request.data.get('duration', '')
        story_framework = request.data.get('story_framework', 'classic')
        development_level = request.data.get('development_level', 'balanced')
        character_name = request.data.get('character_name', '')
        character_description = request.data.get('character_description', '')
        character_image = request.data.get('character_image', '')
        
        if not planning_text:
            return Response({
                'status': 'error',
                'message': '기획안 텍스트가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 모든 옵션을 포함한 컨텍스트 생성
        context = {
            'tone': tone,
            'genre': genre,
            'concept': concept,
            'target': target,
            'purpose': purpose,
            'duration': duration,
            'story_framework': story_framework,
            'development_level': development_level,
            'character_name': character_name,
            'character_description': character_description,
            'character_image': character_image
        }
        
        gemini_service = GeminiService()
        stories_data = gemini_service.generate_stories_from_planning(planning_text, context)
        
        logger.info(f"[generate_story] Stories data response: {stories_data}")
        
        if 'error' in stories_data:
            logger.error(f"Gemini API error: {stories_data['error']}")
            # fallback이 있으면 사용, 없으면 stories 배열을 사용
            if 'stories' in stories_data:
                # 에러가 있어도 stories가 있으면 사용 (fallback stories)
                stories_data = {'stories': stories_data['stories']}
            else:
                stories_data = stories_data.get('fallback', {'stories': []})
        
        # 로그인한 사용자인 경우 VideoPanning 로그 저장
        if request.user.is_authenticated:
            try:
                # 제목 생성 (스토리 제목 또는 기획안의 첫 부분)
                title = stories_data.get('stories', [{}])[0].get('title', '')
                if not title:
                    title = planning_text[:50] + "..." if len(planning_text) > 50 else planning_text[:50]
                
                # VideoPanning 생성
                video_planning = VideoPlanning.objects.create(
                    user=request.user,
                    title=title,
                    planning_text=planning_text,
                    stories=stories_data.get('stories', []),
                    current_step=1
                )
                
                # planning_data에 옵션 정보 저장
                planning_data = {
                    'tone': tone,
                    'genre': genre,
                    'concept': concept,
                    'target': target,
                    'purpose': purpose,
                    'duration': duration,
                    'story_framework': story_framework,
                    'development_level': development_level,
                    'character_name': character_name,
                    'character_description': character_description,
                    'character_image': character_image
                }
                # JSON 필드에 추가 데이터 저장 (모델 확장 없이)
                video_planning.selected_story = {'planning_options': planning_data}
                video_planning.save()
                
                logger.info(f"VideoPanning log created for user {request.user.email}")
            except Exception as e:
                logger.error(f"Failed to create VideoPanning log: {e}")
        
        # stories가 실제로 있는지 확인
        if not stories_data.get('stories'):
            logger.warning("No stories in response, returning empty array")
            stories_data = {'stories': []}
        
        logger.info(f"[generate_story] Final response stories count: {len(stories_data.get('stories', []))}")
        
        # 토큰 사용량 정보 추가
        token_usage = gemini_service.get_token_usage()
        
        return Response({
            'status': 'success',
            'data': stories_data,
            'token_usage': token_usage
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
        planning_options = request.data.get('planning_options', {})
        
        if not story_data:
            return Response({
                'status': 'error',
                'message': '스토리 데이터가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        gemini_service = GeminiService()
        # 스토리 데이터에 planning_options 추가
        if planning_options:
            story_data['planning_options'] = planning_options
        scenes_data = gemini_service.generate_scenes_from_story(story_data)
        
        if 'error' in scenes_data:
            logger.error(f"Gemini API error: {scenes_data['error']}")
            scenes_data = scenes_data.get('fallback', {})
        
        # 토큰 사용량 정보 추가
        token_usage = gemini_service.get_token_usage()
        
        return Response({
            'status': 'success',
            'data': scenes_data,
            'token_usage': token_usage
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
        
        # 토큰 사용량 정보 추가
        token_usage = gemini_service.get_token_usage()
        
        return Response({
            'status': 'success',
            'data': shots_data,
            'token_usage': token_usage
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
        # shot_data 또는 scene 데이터 처리
        shot_data = request.data.get('shot_data', {})
        scene_data = request.data.get('scene', {})
        
        # scene 데이터가 있으면 shot_data로 변환
        if not shot_data and scene_data:
            shot_data = {
                'shot_number': 1,
                'shot_type': "와이드샷",
                'description': scene_data.get('action') or scene_data.get('description', ''),
                'camera_angle': "아이레벨",
                'camera_movement': "고정",
                'duration': "5초",
                'scene_info': scene_data,
                'planning_options': scene_data.get('planning_options', {})
            }
        
        style = request.data.get('style', 'minimal')
        draft_mode = request.data.get('draft_mode', True)  # 기본값을 True로 설정하여 비용 절감
        speed_optimized = request.data.get('speed_optimized', False)
        no_image = request.data.get('no_image', False)  # 이미지 생성 스킵 옵션
        
        # 빠른 드래프트 모드 처리
        if speed_optimized or style == 'quick_draft':
            draft_mode = True
            style = 'minimal'  # 빠른 드래프트는 minimal 스타일 사용
        
        if not shot_data:
            return Response({
                'status': 'error',
                'message': '숏 데이터가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # API 키 상태 확인 로그
        logger.info("=" * 50)
        logger.info("🎨 스토리보드 생성 시작")
        logger.info(f"  - 스타일: {style}")
        logger.info(f"  - 숏 데이터: {shot_data}")
        logger.info(f"  - IMAGE_SERVICE_AVAILABLE: {IMAGE_SERVICE_AVAILABLE}")
        logger.info(f"  - DalleService 모듈: {'있음' if DalleService else '없음'}")
        
        # 각 요청마다 새로운 GeminiService 인스턴스 생성
        gemini_service = GeminiService()
        gemini_service.style = style  # 스타일 설정
        gemini_service.draft_mode = draft_mode  # draft 모드 설정
        gemini_service.no_image = no_image  # 이미지 생성 스킵 옵션
        storyboard_data = gemini_service.generate_storyboards_from_shot(shot_data)
        
        if 'error' in storyboard_data:
            logger.error(f"Gemini API error: {storyboard_data['error']}")
            storyboard_data = storyboard_data.get('fallback', {})
            
            # 폴백 데이터에도 이미지 생성 시도
            if IMAGE_SERVICE_AVAILABLE and DalleService:
                try:
                    dalle_service = DalleService()
                    if dalle_service.available:
                        storyboards = storyboard_data.get('storyboards', [])
                        for i, frame in enumerate(storyboards):
                            logger.info(f"Generating image for fallback frame {i+1} (draft_mode={draft_mode})")
                            image_result = dalle_service.generate_storyboard_image(frame, draft_mode=draft_mode)
                            if image_result['success']:
                                storyboard_data['storyboards'][i]['image_url'] = image_result['image_url']
                                storyboard_data['storyboards'][i]['model_used'] = image_result.get('model_used')
                                storyboard_data['storyboards'][i]['draft_mode'] = draft_mode
                            else:
                                # 플레이스홀더 시도
                                try:
                                    from .placeholder_image_service import PlaceholderImageService
                                    ph_service = PlaceholderImageService()
                                    ph_result = ph_service.generate_storyboard_image(frame)
                                    if ph_result['success']:
                                        storyboard_data['storyboards'][i]['image_url'] = ph_result['image_url']
                                        storyboard_data['storyboards'][i]['is_placeholder'] = True
                                except Exception as e:
                                    logger.error(f"Placeholder generation failed: {e}")
                except Exception as e:
                    logger.error(f"Image generation for fallback failed: {e}")
        
        # 토큰 사용량 정보 추가
        token_usage = gemini_service.get_token_usage()
        
        return Response({
            'status': 'success',
            'data': storyboard_data,
            'token_usage': token_usage
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in generate_storyboards: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'콘티 생성 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_all_storyboards(request):
    """
    모든 씬에 대해 스토리보드를 한번에 생성합니다.
    """
    try:
        scenes = request.data.get('scenes', [])
        style = request.data.get('style', 'minimal')
        
        if not scenes:
            return Response({
                'status': 'error',
                'message': '씬 데이터가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info("=" * 50)
        logger.info(f"🎨 모든 스토리보드 생성 시작 ({len(scenes)}개 씬)")
        logger.info(f"  - 스타일: {style}")
        
        # 이미지 생성 서비스 초기화
        if not IMAGE_SERVICE_AVAILABLE:
            return Response({
                'status': 'error',
                'message': '이미지 생성 서비스가 설치되지 않았습니다.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        try:
            dalle_service = DalleService()
            if not dalle_service.available:
                return Response({
                    'status': 'error',
                    'message': 'DALL-E 서비스를 사용할 수 없습니다. OPENAI_API_KEY를 확인해주세요.'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': '이미지 생성 서비스 초기화 실패'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # 결과를 저장할 리스트
        storyboards = []
        success_count = 0
        error_count = 0
        
        # 각 씬에 대해 스토리보드 생성
        for i, scene in enumerate(scenes):
            try:
                # 씬에서 가상의 샷 데이터 생성 (씬 정보 기반)
                shot_data = {
                    'shot_number': 1,
                    'shot_type': "와이드샷",
                    'description': scene.get('action') or scene.get('description', ''),
                    'camera_angle': "아이레벨",
                    'camera_movement': "고정",
                    'duration': "5초",
                    'scene_info': scene
                }
                
                # 각 요청마다 새로운 GeminiService 인스턴스 생성
                gemini_service = GeminiService()
                gemini_service.style = style  # 스타일 설정
                storyboard_data = gemini_service.generate_storyboards_from_shot(shot_data)
                
                if 'error' in storyboard_data:
                    logger.error(f"씬 {i+1} 스토리보드 생성 실패: {storyboard_data['error']}")
                    storyboards.append({
                        'scene_index': i,
                        'error': storyboard_data['error'],
                        'storyboard': None
                    })
                    error_count += 1
                else:
                    # 생성된 스토리보드를 리스트에 추가
                    storyboard_result = storyboard_data.get('storyboards', [{}])[0] if storyboard_data.get('storyboards') else {}
                    storyboards.append({
                        'scene_index': i,
                        'error': None,
                        'storyboard': storyboard_result
                    })
                    success_count += 1
                    logger.info(f"씬 {i+1} 스토리보드 생성 성공")
                
            except Exception as e:
                logger.error(f"씬 {i+1} 처리 중 오류: {str(e)}")
                storyboards.append({
                    'scene_index': i,
                    'error': str(e),
                    'storyboard': None
                })
                error_count += 1
        
        return Response({
            'status': 'success',
            'data': {
                'storyboards': storyboards,
                'total': len(scenes),
                'success_count': success_count,
                'error_count': error_count
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in generate_all_storyboards: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'모든 콘티 생성 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def regenerate_storyboard_image(request):
    """
    스토리보드 이미지를 재생성합니다.
    """
    try:
        frame_data = request.data.get('frame_data', {})
        style = request.data.get('style', 'minimal')
        draft_mode = request.data.get('draft_mode', True)  # 기본값을 True로 설정하여 비용 절감
        
        logger.info("=" * 50)
        logger.info("🎨 스토리보드 이미지 재생성 요청")
        logger.info(f"  - 스타일: {style}")
        logger.info(f"  - 프레임 데이터: {frame_data}")
        
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
            image_service = DalleService()
            if not image_service.available:
                return Response({
                    'status': 'error',
                    'message': 'DALL-E 서비스를 사용할 수 없습니다. OPENAI_API_KEY를 확인해주세요.'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': '이미지 생성 서비스 초기화 실패'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # 이미지 재생성
        image_result = image_service.generate_storyboard_image(frame_data, style=style, draft_mode=draft_mode)
        
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
        logger.error(f"Error in regenerate_storyboard_image: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'이미지 생성 중 오류가 발생했습니다: {str(e)}'
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
        # DRF Request 타입을 처리하기 위해 이미 api_view 데코레이터가 적용되어 있음
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
                'data': {
                    'planning_id': planning.id,
                    'planning': VideoPlanningSerializer(planning).data
                },
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
        # 인증된 사용자인 경우에만 필터링
        if request.user.is_authenticated:
            plannings = VideoPlanning.objects.filter(
                user=request.user
            ).order_by('-created_at')[:5]
        else:
            # 인증되지 않은 경우 빈 목록 반환
            plannings = []
        
        serializer = VideoPlanningListSerializer(plannings, many=True)
        
        return Response({
            'status': 'success',
            'data': {
                'plannings': serializer.data
            },
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
            'data': {
                'planning': serializer.data
            }
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


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def planning_library_view(request):
    """라이브러리 뷰 - GET과 POST 모두 처리"""
    if request.method == 'GET':
        # 사용자의 저장된 기획안 목록 반환
        try:
            plannings = VideoPlanning.objects.filter(
                user=request.user
            ).order_by('-created_at')
            
            planning_list = []
            for planning in plannings:
                planning_list.append({
                    'id': planning.id,
                    'title': planning.title or '제목 없음',
                    'created_at': planning.created_at.strftime('%Y-%m-%d %H:%M') if planning.created_at else '',
                    'updated_at': planning.updated_at.strftime('%Y-%m-%d %H:%M') if planning.updated_at else '',
                    'is_completed': planning.is_completed,
                    'current_step': planning.current_step,
                    'thumbnail': planning.thumbnail_url if hasattr(planning, 'thumbnail_url') else None,
                    'planning_options': planning.planning_options if hasattr(planning, 'planning_options') else {},
                    'scene_count': len(planning.scenes) if planning.scenes else 0,
                    'has_storyboards': bool(planning.storyboards) if planning.storyboards else False
                })
            
            return Response({
                'status': 'success',
                'data': {
                    'plannings': planning_list,
                    'total_count': len(planning_list)
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error in planning_library_view GET: {str(e)}", exc_info=True)
            return Response({
                'status': 'error',
                'message': f'기획 목록을 가져오는 중 오류가 발생했습니다: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    elif request.method == 'POST':
        return save_planning(request)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_to_pdf(request):
    """비디오 기획안을 PDF로 내보내기"""
    try:
        planning_data = request.data.get('planning_data', {})
        export_type = request.data.get('export_type', 'full')  # 'full' or 'storyboard_only'
        use_enhanced_layout = request.data.get('use_enhanced_layout', True)  # 가로형 레이아웃 사용 여부
        
        if not planning_data:
            return Response({
                'status': 'error',
                'message': '기획 데이터가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 사용자가 입력한 모든 데이터를 JSON 형태로 로깅
        logger.info("PDF 내보내기 요청 데이터 (JSON):")
        logger.info(json.dumps(planning_data, ensure_ascii=False, indent=2))
        
        # planning_options가 없으면 빈 딕셔너리로 설정
        if 'planning_options' not in planning_data:
            planning_data['planning_options'] = {}
        
        # PDF 생성 서비스 선택
        use_compressed = request.data.get('use_compressed', True)  # 기본값을 압축 버전으로
        
        if use_compressed:
            # 압축된 레이아웃 사용 (LLM 요약 포함)
            pdf_service = CompressedPDFExportService()
            pdf_buffer = pdf_service.generate_pdf(planning_data)
        elif use_enhanced_layout:
            # 가로형 보고서 레이아웃 사용
            pdf_service = EnhancedPDFExportService()
            pdf_buffer = pdf_service.generate_pdf(planning_data)
        else:
            # 기존 세로형 레이아웃 사용
            pdf_service = PDFExportService()
            if export_type == 'storyboard_only':
                pdf_buffer = pdf_service.generate_storyboard_only_pdf(planning_data)
            else:
                pdf_buffer = pdf_service.generate_pdf(planning_data)
        
        # 파일명 생성
        title = planning_data.get('title', '영상기획안')
        safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        
        # 레이아웃 접미사 설정
        if use_compressed:
            layout_suffix = '_압축판'
        elif use_enhanced_layout:
            layout_suffix = '_가로형'
        else:
            layout_suffix = ''
        
        filename = f"{safe_title}_{'스토리보드' if export_type == 'storyboard_only' else '기획안'}{layout_suffix}.pdf"
        
        # 파일 응답 반환
        response = FileResponse(
            pdf_buffer,
            content_type='application/pdf',
            as_attachment=True,
            filename=filename
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error in export_to_pdf: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'PDF 내보내기 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_to_google_slides(request):
    """비디오 기획안을 Google Slides로 내보내기"""
    try:
        planning_data = request.data.get('planning_data', {})
        
        if not planning_data:
            return Response({
                'status': 'error',
                'message': '기획 데이터가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Google Slides 서비스
        slides_service = GoogleSlidesService()
        
        # 프레젠테이션 생성
        title = planning_data.get('title', '영상 기획안')
        result = slides_service.create_presentation(title, planning_data)
        
        if 'error' in result:
            logger.error(f"Google Slides 생성 실패: {result['error']}")
            return Response({
                'status': 'error',
                'message': result['error']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'status': 'success',
            'data': {
                'presentation_id': result['presentation_id'],
                'url': result['url']
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in export_to_google_slides: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'Google Slides 내보내기 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_to_advanced_pdf(request):
    """AI 기반 고급 디자인 PDF로 내보내기"""
    try:
        planning_data = request.data.get('planning_data', {})
        
        if not planning_data:
            return Response({
                'status': 'error',
                'message': '기획 데이터가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 고급 PDF 서비스
        advanced_pdf_service = AdvancedPDFExportService()
        
        # PDF 생성
        pdf_bytes = advanced_pdf_service.export_to_pdf(planning_data)
        
        if not pdf_bytes:
            return Response({
                'status': 'error',
                'message': 'PDF 생성에 실패했습니다.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 파일명 생성
        title = planning_data.get('title', '영상기획안')
        safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        filename = f"{safe_title}_AI디자인_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        # PDF 반환
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        logger.error(f"Error in export_to_advanced_pdf: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'고급 PDF 내보내기 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_to_enhanced_pdf(request):
    """향상된 테이블 구조 PDF로 내보내기 (가로 A4)"""
    try:
        planning_data = request.data.get('planning_data', {})
        
        if not planning_data:
            return Response({
                'status': 'error',
                'message': '기획 데이터가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 향상된 PDF 서비스
        enhanced_pdf_service = EnhancedPDFExportService()
        
        # PDF 생성
        pdf_buffer = enhanced_pdf_service.generate_pdf(planning_data)
        
        if not pdf_buffer:
            return Response({
                'status': 'error',
                'message': 'PDF 생성에 실패했습니다.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # 파일명 생성
        title = planning_data.get('title', '영상기획안')
        safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        filename = f"{safe_title}_테이블구조_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        # PDF 반환
        response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        logger.error(f"Error in export_to_enhanced_pdf: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'향상된 PDF 내보내기 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_export_formats(request):
    """사용 가능한 내보내기 형식 조회"""
    try:
        formats = [
            {
                'id': 'pdf_full',
                'name': 'PDF - 전체 기획안',
                'description': '모든 내용이 포함된 상세 기획안',
                'icon': 'file-pdf',
                'available': True
            },
            {
                'id': 'pdf_storyboard',
                'name': 'PDF - 스토리보드',
                'description': '스토리보드 이미지 중심의 간략한 문서',
                'icon': 'file-image',
                'available': True
            },
            {
                'id': 'google_slides',
                'name': 'Google Slides',
                'description': '프레젠테이션 형식으로 공유 가능',
                'icon': 'file-presentation',
                'available': bool(os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'))
            },
            {
                'id': 'pdf_advanced',
                'name': 'PDF - AI 디자인',
                'description': 'Gemini AI로 구조화된 전문 디자인 문서',
                'icon': 'file-pdf-box',
                'available': bool(os.environ.get('GOOGLE_API_KEY'))
            },
            {
                'id': 'ai_proposal',
                'name': 'AI 기획서 (Google Slides)',
                'description': 'AI가 자동으로 구조화하여 슬라이드로 생성',
                'icon': 'robot',
                'available': bool(os.environ.get('GOOGLE_API_KEY') and os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'))
            },
            {
                'id': 'pdf_enhanced',
                'name': 'PDF - 테이블 구조 (가로형)',
                'description': '표 형식으로 정리된 가로 A4 전문 문서',
                'icon': 'file-table',
                'available': True
            }
        ]
        
        return Response({
            'status': 'success',
            'data': {
                'formats': formats
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in get_export_formats: {str(e)}")
        return Response({
            'status': 'error',
            'message': '내보내기 형식 조회 중 오류가 발생했습니다.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ================================
# AI 프롬프트 생성 API 엔드포인트들
# ================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_ai_prompt(request):
    """
    AI 프롬프트 생성 - 1000% 효율화를 위한 지능형 프롬프트 시스템
    """
    try:
        data = request.data
        planning_id = data.get('planning_id')
        prompt_type = data.get('prompt_type')  # story, scene, shot, image
        user_input = data.get('user_input', '')
        optimization_level = data.get('optimization_level', 'high')  # low, medium, high, extreme
        
        # 입력값 검증
        if not planning_id:
            return Response({
                'status': 'error',
                'message': '기획 ID가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not prompt_type:
            return Response({
                'status': 'error',
                'message': '프롬프트 타입이 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if prompt_type not in ['story', 'scene', 'shot', 'image', 'storyboard']:
            return Response({
                'status': 'error',
                'message': '지원하지 않는 프롬프트 타입입니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 기획 조회 및 권한 확인
        try:
            planning = VideoPlanning.objects.get(id=planning_id, user=request.user)
        except VideoPlanning.DoesNotExist:
            return Response({
                'status': 'error',
                'message': '기획을 찾을 수 없거나 접근 권한이 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # AI 프롬프트 생성 서비스 호출
        prompt_service = PromptOptimizationService()
        
        if prompt_type == 'story':
            result = prompt_service.generate_story_prompt(planning, user_input, optimization_level)
        elif prompt_type == 'scene':
            result = prompt_service.generate_scene_prompt(planning, user_input, optimization_level)
        elif prompt_type == 'shot':
            result = prompt_service.generate_shot_prompt(planning, user_input, optimization_level)
        elif prompt_type in ['image', 'storyboard']:
            result = prompt_service.generate_image_prompt(planning, user_input, optimization_level)
        
        if result.is_successful:
            response_data = {
                'status': 'success',
                'data': {
                    'original_prompt': result.original_prompt,
                    'enhanced_prompt': result.enhanced_prompt,
                    'generation_time': result.generation_time,
                    'tokens_estimate': result.tokens_estimate,
                    'cost_estimate': result.cost_estimate,
                    'confidence_score': result.confidence_score,
                    'optimization_suggestions': result.optimization_suggestions
                },
                'message': 'AI 프롬프트가 성공적으로 생성되었습니다.'
            }
            
            # 분석 데이터 업데이트
            try:
                analytics, created = planning.analytics.get_or_create(planning=planning)
                analytics.update_metrics()
            except Exception as e:
                logger.warning(f"분석 데이터 업데이트 실패: {str(e)}")
            
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            return Response({
                'status': 'error',
                'message': f'프롬프트 생성 실패: {result.error_message}',
                'data': {
                    'generation_time': result.generation_time
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        logger.error(f"AI 프롬프트 생성 오류: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'프롬프트 생성 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_prompt_analytics(request, planning_id):
    """
    AI 프롬프트 분석 데이터 조회
    """
    try:
        # 기획 조회 및 권한 확인
        try:
            planning = VideoPlanning.objects.get(id=planning_id, user=request.user)
        except VideoPlanning.DoesNotExist:
            return Response({
                'status': 'error',
                'message': '기획을 찾을 수 없거나 접근 권한이 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 분석 데이터 생성
        prompt_service = PromptOptimizationService()
        analytics_data = prompt_service.get_optimization_analytics(planning)
        
        return Response({
            'status': 'success',
            'data': analytics_data,
            'message': '분석 데이터를 성공적으로 조회했습니다.'
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"프롬프트 분석 조회 오류: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'분석 데이터 조회 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_prompt_history(request, planning_id):
    """
    AI 프롬프트 생성 히스토리 조회
    """
    try:
        # 기획 조회 및 권한 확인
        try:
            planning = VideoPlanning.objects.get(id=planning_id, user=request.user)
        except VideoPlanning.DoesNotExist:
            return Response({
                'status': 'error',
                'message': '기획을 찾을 수 없거나 접근 권한이 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 프롬프트 히스토리 조회
        prompts = VideoPlanningAIPrompt.objects.filter(planning=planning).order_by('-created_at')
        
        # 페이지네이션
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        total_count = prompts.count()
        prompts_page = prompts[start_idx:end_idx]
        
        # 데이터 직렬화
        prompt_data = []
        for prompt in prompts_page:
            prompt_data.append({
                'id': prompt.id,
                'prompt_type': prompt.prompt_type,
                'prompt_type_display': prompt.get_prompt_type_display(),
                'original_prompt': prompt.original_prompt[:200] + "..." if len(prompt.original_prompt) > 200 else prompt.original_prompt,
                'enhanced_prompt': prompt.enhanced_prompt[:200] + "..." if len(prompt.enhanced_prompt) > 200 else prompt.enhanced_prompt,
                'is_successful': prompt.is_successful,
                'generation_time': prompt.generation_time,
                'tokens_used': prompt.tokens_used,
                'cost_estimate': float(prompt.cost_estimate) if prompt.cost_estimate else 0,
                'created_at': prompt.created_at.isoformat(),
                'error_message': prompt.error_message
            })
        
        return Response({
            'status': 'success',
            'data': {
                'prompts': prompt_data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_count': total_count,
                    'total_pages': (total_count + page_size - 1) // page_size,
                    'has_next': end_idx < total_count,
                    'has_prev': page > 1
                }
            },
            'message': '프롬프트 히스토리를 성공적으로 조회했습니다.'
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"프롬프트 히스토리 조회 오류: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'히스토리 조회 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_pro_settings(request, planning_id):
    """
    영상 기획 프로 설정 업데이트
    """
    try:
        # 기획 조회 및 권한 확인
        try:
            planning = VideoPlanning.objects.get(id=planning_id, user=request.user)
        except VideoPlanning.DoesNotExist:
            return Response({
                'status': 'error',
                'message': '기획을 찾을 수 없거나 접근 권한이 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        data = request.data
        updated_fields = []
        
        # 컬러톤 설정 업데이트 (color_tone 필드 제거됨)
        # if 'color_tone' in data:
        #     planning.color_tone = data['color_tone']
        #     updated_fields.append('color_tone')
        
        # 카메라 설정 업데이트 (필드 제거됨)
        # if 'camera_settings' in data:
        #     planning.camera_settings = data['camera_settings']
        #     updated_fields.append('camera_settings')
        
        # 조명 설정 업데이트 (필드 제거됨)
        # if 'lighting_setup' in data:
        #     planning.lighting_setup = data['lighting_setup']
        #     updated_fields.append('lighting_setup')
        
        # 오디오 설정 업데이트 (필드 제거됨)
        # if 'audio_config' in data:
        #     planning.audio_config = data['audio_config']
        #     updated_fields.append('audio_config')
        
        # AI 생성 설정 업데이트 (필드 제거됨)
        # if 'ai_generation_config' in data:
        #     planning.ai_generation_config = data['ai_generation_config']
        #     updated_fields.append('ai_generation_config')
        
        # 협업 설정 업데이트 (필드 제거됨)
        # if 'collaboration_settings' in data:
        #     planning.collaboration_settings = data['collaboration_settings']
        #     updated_fields.append('collaboration_settings')
        
        # 워크플로우 설정 업데이트 (필드 제거됨)
        # if 'workflow_config' in data:
        #     planning.workflow_config = data['workflow_config']
        #     updated_fields.append('workflow_config')
        
        if updated_fields:
            planning.save(update_fields=updated_fields + ['updated_at'])
            
            return Response({
                'status': 'success',
                'data': {
                    'updated_fields': updated_fields,
                    'pro_mode_enabled': planning.is_pro_mode_enabled()
                },
                'message': '프로 설정이 성공적으로 업데이트되었습니다.'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'status': 'error',
                'message': '업데이트할 설정이 없습니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"프로 설정 업데이트 오류: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'설정 업데이트 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pro_templates(request):
    """
    영상 기획 프로 템플릿 목록 조회
    """
    try:
        from .models import VideoPlanningProTemplate
        
        # 활성화된 템플릿만 조회
        templates = VideoPlanningProTemplate.objects.filter(is_active=True).order_by('-usage_count', 'name')
        
        # 카테고리 필터링
        category = request.GET.get('category')
        if category:
            templates = templates.filter(category=category)
        
        template_data = []
        for template in templates:
            template_data.append({
                'id': template.id,
                'name': template.name,
                'category': template.category,
                'description': template.description,
                'default_color_tone': template.default_color_tone,
                'default_camera_settings': template.default_camera_settings,
                'default_lighting_setup': template.default_lighting_setup,
                'default_audio_config': template.default_audio_config,
                'usage_count': template.usage_count,
                'created_at': template.created_at.isoformat()
            })
        
        # 사용 가능한 카테고리 목록
        categories = VideoPlanningProTemplate.objects.filter(is_active=True).values_list('category', flat=True).distinct()
        
        return Response({
            'status': 'success',
            'data': {
                'templates': template_data,
                'categories': list(categories)
            },
            'message': '프로 템플릿을 성공적으로 조회했습니다.'
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"프로 템플릿 조회 오류: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'템플릿 조회 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_pro_template(request, planning_id, template_id):
    """
    프로 템플릿을 기획에 적용
    """
    try:
        from .models import VideoPlanningProTemplate
        
        # 기획 조회 및 권한 확인
        try:
            planning = VideoPlanning.objects.get(id=planning_id, user=request.user)
        except VideoPlanning.DoesNotExist:
            return Response({
                'status': 'error',
                'message': '기획을 찾을 수 없거나 접근 권한이 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 템플릿 조회
        try:
            template = VideoPlanningProTemplate.objects.get(id=template_id, is_active=True)
        except VideoPlanningProTemplate.DoesNotExist:
            return Response({
                'status': 'error',
                'message': '템플릿을 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 템플릿 적용 (필드들이 제거됨)
        # planning.color_tone = template.default_color_tone
        # planning.camera_settings = template.default_camera_settings
        # planning.lighting_setup = template.default_lighting_setup
        # planning.audio_config = template.default_audio_config
        
        planning.save(update_fields=['updated_at'])
        
        # 템플릿 사용 횟수 증가
        template.increment_usage()
        
        return Response({
            'status': 'success',
            'data': {
                'template_name': template.name,
                'applied_settings': {
                    # 필드들이 제거됨
                    # 'color_tone': planning.color_tone,
                    # 'camera_settings': planning.camera_settings,
                    # 'lighting_setup': planning.lighting_setup,
                    # 'audio_config': planning.audio_config
                }
            },
            'message': f'"{template.name}" 템플릿이 성공적으로 적용되었습니다.'
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"프로 템플릿 적용 오류: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'템플릿 적용 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ================================
# AI 기반 기획 생성 엔드포인트 (30초 기획)
# ================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_quick_suggestions(request):
    """AI 빠른 제안 생성 - 프로젝트 타입별 즉시 가이드"""
    try:
        from .ai_prompt_generator import VideoPlanningPromptGenerator
        
        generator = VideoPlanningPromptGenerator()
        suggestions = generator.generate_quick_suggestions(request.data)
        
        return Response({
            'status': 'success',
            'suggestions': suggestions,
            'message': 'AI 제안이 생성되었습니다.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"AI 제안 생성 오류: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'AI 제안 생성 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_generate_full_planning(request):
    """완전한 AI 기획안 생성 - 30초만에 전체 기획"""
    try:
        from .ai_prompt_generator import VideoPlanningPromptGenerator
        
        generator = VideoPlanningPromptGenerator()
        planning = generator.generate_full_planning(request.data)
        
        # 사용자의 기획으로 저장 옵션
        if request.data.get('save_to_library', False):
            video_planning = VideoPlanning.objects.create(
                user=request.user,
                title=planning['title'],
                planning=planning['planning'],
                # color_tone=planning.get('pro_options', {}).get('colorTone'),  # 필드 제거됨
                camera_settings={
                    'type': planning.get('pro_options', {}).get('cameraType'),
                    'lens': planning.get('pro_options', {}).get('lensType'),
                    'movement': planning.get('pro_options', {}).get('cameraMovement')
                } if planning.get('pro_options') else None
            )
            
            # 스토리 저장
            for story_data in planning.get('stories', []):
                VideoPlanningStory.objects.create(
                    planning=video_planning,
                    stage=story_data['stage'],
                    stage_name=story_data['stage_name'],
                    content=story_data['content'],
                    order=story_data['order']
                )
            
            # 씬 저장
            for scene_data in planning.get('scenes', []):
                VideoPlanningScene.objects.create(
                    planning=video_planning,
                    story_index=scene_data['story_index'],
                    scene_number=scene_data['scene_number'],
                    title=scene_data['title'],
                    description=scene_data['description'],
                    duration=scene_data['duration']
                )
            
            planning['id'] = video_planning.id
        
        return Response({
            'status': 'success',
            'planning': planning,
            'message': 'AI 기획안이 성공적으로 생성되었습니다!'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"AI 기획 생성 오류: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'AI 기획 생성 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_veo3_prompt(request):
    """VEO3 비디오 생성 프롬프트 생성"""
    try:
        from .ai_prompt_generator import VEO3PromptGenerator
        
        generator = VEO3PromptGenerator()
        scene_data = request.data.get('scene_data', {})
        pro_options = request.data.get('pro_options', {})
        
        video_prompt = generator.generate_video_prompt(scene_data, pro_options)
        image_prompt = generator.generate_image_prompt(scene_data, pro_options)
        
        return Response({
            'status': 'success',
            'data': {
                'video_prompt': video_prompt,
                'image_prompt': image_prompt,
                'scene_title': scene_data.get('title', ''),
                'technical_specs': pro_options
            },
            'message': 'VEO3 프롬프트가 생성되었습니다.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"VEO3 프롬프트 생성 오류: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'VEO3 프롬프트 생성 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_project(request):
    """프로젝트 완성 처리 - 최종 영상 업로드 및 상태 업데이트"""
    try:
        planning_id = request.data.get('planning_id')
        final_video_url = request.data.get('final_video_url')
        completion_notes = request.data.get('completion_notes', '')
        
        # 파일 업로드 처리
        video_file = request.FILES.get('video_file')
        
        if not planning_id:
            return Response({
                'status': 'error',
                'message': '기획 ID가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 기획 조회
        planning = VideoPlanning.objects.filter(
            id=planning_id,
            user=request.user
        ).first()
        
        if not planning:
            return Response({
                'status': 'error',
                'message': '기획을 찾을 수 없습니다.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 비디오 파일이 업로드된 경우 처리
        if video_file:
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile
            import os
            
            # 파일 저장
            file_name = f"completed_videos/{planning_id}_{video_file.name}"
            path = default_storage.save(file_name, ContentFile(video_file.read()))
            final_video_url = request.build_absolute_uri(default_storage.url(path))
        
        # 기획 상태 업데이트
        planning_data = planning.planning_data or {}
        planning_data['completed'] = True
        planning_data['completed_at'] = timezone.now().isoformat()
        planning_data['final_video_url'] = final_video_url
        planning_data['completion_notes'] = completion_notes
        
        planning.planning_data = planning_data
        planning.save()
        
        return Response({
            'status': 'success',
            'message': '프로젝트가 성공적으로 완성되었습니다!',
            'data': {
                'planning_id': planning.id,
                'completed_at': planning_data['completed_at'],
                'final_video_url': final_video_url
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"프로젝트 완성 처리 오류: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'프로젝트 완성 처리 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_storyboard_images_async(request):
    """
    스토리보드 이미지를 비동기로 생성합니다.
    즉시 태스크 ID를 반환하고, 백그라운드에서 이미지를 생성합니다.
    """
    try:
        storyboard_data = request.data.get('storyboard_data', {})
        
        if not storyboard_data or not storyboard_data.get('storyboards'):
            return Response({
                'status': 'error',
                'message': '스토리보드 데이터가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 태스크 ID 생성
        task_id = str(uuid.uuid4())
        
        # 비동기 이미지 생성기 초기화
        async_generator = AsyncImageGenerator()
        
        # 백그라운드 스레드에서 이미지 생성 시작
        def generate_images():
            async_generator.generate_storyboard_images_async(storyboard_data, task_id)
        
        thread = threading.Thread(target=generate_images)
        thread.daemon = True
        thread.start()
        
        return Response({
            'status': 'success',
            'task_id': task_id,
            'message': '이미지 생성이 시작되었습니다. task_id로 진행 상황을 확인하세요.'
        }, status=status.HTTP_202_ACCEPTED)
        
    except Exception as e:
        logger.error(f"Error in generate_storyboard_images_async: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'비동기 이미지 생성 시작 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_image_generation_status(request, task_id):
    """
    비동기 이미지 생성 작업의 상태를 확인합니다.
    """
    try:
        async_generator = AsyncImageGenerator()
        status_data = async_generator.get_generation_status(task_id)
        
        if status_data.get('status') == 'completed':
            # 완료된 경우 결과도 함께 반환
            result = async_generator.get_generation_result(task_id)
            return Response({
                'status': 'success',
                'task_status': status_data,
                'result': result
            }, status=status.HTTP_200_OK)
        else:
            # 진행 중이거나 실패한 경우 상태만 반환
            return Response({
                'status': 'success',
                'task_status': status_data
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        logger.error(f"Error in check_image_generation_status: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'message': f'상태 확인 중 오류가 발생했습니다: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)