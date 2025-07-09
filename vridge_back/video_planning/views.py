from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import AllowAnyTemporary
from .debug_permissions import DebugAllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from .models import VideoPlanning, VideoPlanningImage
from .serializers import VideoPlanningSerializer, VideoPlanningListSerializer
from .gemini_service import GeminiService
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
from django.http import FileResponse
from .pdf_export_service import PDFExportService
from .google_slides_service import GoogleSlidesService

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
        recent_plannings = VideoPlanning.objects.filter(
            user=request.user
        ).order_by('-created_at')[:5]
        
        # 응답 데이터 구성
        planning_logs = []
        for planning in recent_plannings:
            try:
                # planning_options 가져오기
                planning_options = {}
                if planning.selected_story and isinstance(planning.selected_story, dict):
                    planning_options = planning.selected_story.get('planning_options', {})
                
                planning_logs.append({
                    'id': planning.id,
                    'title': planning.title or '제목 없음',
                    'created_at': planning.created_at.strftime('%Y-%m-%d %H:%M') if planning.created_at else '',
                    'planning_options': {
                        'tone': planning_options.get('tone', ''),
                        'genre': planning_options.get('genre', ''),
                        'concept': planning_options.get('concept', ''),
                        'target': planning_options.get('target', ''),
                        'purpose': planning_options.get('purpose', ''),
                        'duration': planning_options.get('duration', '')
                    },
                    'current_step': planning.current_step or 1,
                    'is_completed': planning.is_completed or False
                })
            except Exception as item_error:
                logger.warning(f"Error processing planning item {planning.id}: {str(item_error)}")
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
        
        if 'error' in stories_data:
            logger.error(f"Gemini API error: {stories_data['error']}")
            stories_data = stories_data.get('fallback', {})
        
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
        style = request.data.get('style', 'minimal')
        
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
                            logger.info(f"Generating image for fallback frame {i+1}")
                            image_result = dalle_service.generate_storyboard_image(frame)
                            if image_result['success']:
                                storyboard_data['storyboards'][i]['image_url'] = image_result['image_url']
                                storyboard_data['storyboards'][i]['model_used'] = image_result.get('model_used')
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
        
        return Response({
            'status': 'success',
            'data': storyboard_data
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
        image_result = image_service.generate_storyboard_image(frame_data, style=style)
        
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
        # 임시 응답 - 빈 목록 반환
        return Response({
            'status': 'success',
            'data': {
                'plannings': []
            }
        }, status=status.HTTP_200_OK)
    elif request.method == 'POST':
        return save_planning(request)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_to_pdf(request):
    """비디오 기획안을 PDF로 내보내기"""
    try:
        planning_data = request.data.get('planning_data', {})
        export_type = request.data.get('export_type', 'full')  # 'full' or 'storyboard_only'
        
        if not planning_data:
            return Response({
                'status': 'error',
                'message': '기획 데이터가 필요합니다.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # PDF 생성 서비스
        pdf_service = PDFExportService()
        
        # PDF 생성
        if export_type == 'storyboard_only':
            pdf_buffer = pdf_service.generate_storyboard_only_pdf(planning_data)
        else:
            pdf_buffer = pdf_service.generate_pdf(planning_data)
        
        # 파일명 생성
        title = planning_data.get('title', '영상기획안')
        safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        filename = f"{safe_title}_{'스토리보드' if export_type == 'storyboard_only' else '기획안'}.pdf"
        
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