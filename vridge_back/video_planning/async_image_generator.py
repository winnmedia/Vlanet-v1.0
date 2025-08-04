"""
비동기 이미지 생성을 위한 백그라운드 태스크 처리
"""
import json
import logging
from django.core.cache import cache
from .dalle_service import DalleService
from .placeholder_image_service import PlaceholderImageService

logger = logging.getLogger(__name__)

class AsyncImageGenerator:
    """비동기 이미지 생성 관리자"""
    
    def __init__(self):
        self.dalle_service = DalleService()
        self.placeholder_service = PlaceholderImageService()
    
    def generate_storyboard_images_async(self, storyboard_data, task_id):
        """
        스토리보드 이미지를 비동기로 생성하고 캐시에 저장
        """
        try:
            # 작업 시작 상태 저장
            cache.set(f"image_gen_status_{task_id}", {
                'status': 'processing',
                'progress': 0,
                'total': len(storyboard_data.get('storyboards', []))
            }, 300)  # 5분 TTL
            
            storyboards = storyboard_data.get('storyboards', [])
            
            for i, frame in enumerate(storyboards):
                try:
                    # DALL-E 시도
                    if self.dalle_service.available:
                        image_result = self.dalle_service.generate_storyboard_image(
                            frame, 
                            draft_mode=True
                        )
                        if image_result['success']:
                            storyboards[i]['image_url'] = image_result['image_url']
                            storyboards[i]['model_used'] = image_result.get('model_used')
                        else:
                            # 플레이스홀더 사용
                            ph_result = self.placeholder_service.generate_storyboard_image(frame)
                            if ph_result['success']:
                                storyboards[i]['image_url'] = ph_result['image_url']
                                storyboards[i]['is_placeholder'] = True
                    else:
                        # 플레이스홀더 사용
                        ph_result = self.placeholder_service.generate_storyboard_image(frame)
                        if ph_result['success']:
                            storyboards[i]['image_url'] = ph_result['image_url']
                            storyboards[i]['is_placeholder'] = True
                    
                    # 진행 상황 업데이트
                    cache.set(f"image_gen_status_{task_id}", {
                        'status': 'processing',
                        'progress': i + 1,
                        'total': len(storyboards)
                    }, 300)
                    
                except Exception as e:
                    logger.error(f"Failed to generate image for frame {i+1}: {e}")
                    storyboards[i]['image_error'] = str(e)
            
            # 완료 상태 저장
            cache.set(f"image_gen_result_{task_id}", storyboard_data, 300)
            cache.set(f"image_gen_status_{task_id}", {
                'status': 'completed',
                'progress': len(storyboards),
                'total': len(storyboards)
            }, 300)
            
            return storyboard_data
            
        except Exception as e:
            logger.error(f"Async image generation failed: {e}")
            cache.set(f"image_gen_status_{task_id}", {
                'status': 'failed',
                'error': str(e)
            }, 300)
            return None
    
    def get_generation_status(self, task_id):
        """생성 작업 상태 조회"""
        return cache.get(f"image_gen_status_{task_id}", {
            'status': 'not_found'
        })
    
    def get_generation_result(self, task_id):
        """생성 결과 조회"""
        return cache.get(f"image_gen_result_{task_id}")