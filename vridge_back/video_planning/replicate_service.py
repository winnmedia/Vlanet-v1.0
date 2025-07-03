import os
import logging
import requests
from django.conf import settings
import base64

logger = logging.getLogger(__name__)


class ReplicateService:
    """
    Replicate API를 사용한 이미지 생성 서비스
    더 안정적이고 다양한 모델 지원
    """
    
    def __init__(self):
        self.api_key = getattr(settings, 'REPLICATE_API_TOKEN', None) or os.environ.get('REPLICATE_API_TOKEN')
        self.api_url = "https://api.replicate.com/v1/predictions"
        self.available = bool(self.api_key)
        
        if not self.available:
            logger.warning("Replicate API token not found - Image generation service unavailable")
    
    def generate_storyboard_image(self, frame_description):
        """
        Replicate를 사용하여 스토리보드 이미지를 생성합니다.
        """
        if not self.available:
            return {
                "success": False,
                "error": "Replicate API 토큰이 설정되지 않았습니다",
                "image_url": None
            }
        
        try:
            prompt = self._create_storyboard_prompt(frame_description)
            
            # Stable Diffusion XL 모델 사용
            headers = {
                "Authorization": f"Token {self.api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "version": "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",  # SDXL version
                "input": {
                    "prompt": prompt,
                    "negative_prompt": "blurry, bad quality, watermark, text",
                    "width": 1024,
                    "height": 768,
                    "num_outputs": 1,
                    "scheduler": "K_EULER",
                    "num_inference_steps": 25,
                    "guidance_scale": 7.5
                }
            }
            
            # 예측 생성
            response = requests.post(self.api_url, headers=headers, json=data)
            
            if response.status_code == 201:
                prediction = response.json()
                prediction_id = prediction['id']
                
                # 결과 폴링
                result_url = f"{self.api_url}/{prediction_id}"
                max_attempts = 30
                
                for _ in range(max_attempts):
                    import time
                    time.sleep(2)
                    
                    result_response = requests.get(result_url, headers=headers)
                    result = result_response.json()
                    
                    if result['status'] == 'succeeded':
                        image_url = result['output'][0] if result.get('output') else None
                        return {
                            "success": True,
                            "image_url": image_url,
                            "prompt_used": prompt
                        }
                    elif result['status'] == 'failed':
                        return {
                            "success": False,
                            "error": "이미지 생성 실패",
                            "image_url": None
                        }
                
                return {
                    "success": False,
                    "error": "시간 초과",
                    "image_url": None
                }
            else:
                return {
                    "success": False,
                    "error": f"API 오류: {response.status_code}",
                    "image_url": None
                }
                
        except Exception as e:
            logger.error(f"Replicate 이미지 생성 오류: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "image_url": None
            }
    
    def _create_storyboard_prompt(self, frame_data):
        """
        프레임 데이터를 스토리보드 프롬프트로 변환합니다.
        """
        visual_desc = frame_data.get('visual_description', '')
        composition = frame_data.get('composition', '')
        camera_info = frame_data.get('camera_info', {})
        lighting = frame_data.get('lighting', '')
        
        # SDXL에 최적화된 프롬프트
        prompt = f"""
        professional storyboard illustration, pencil sketch style,
        {visual_desc},
        {composition} composition,
        {camera_info.get('angle', 'eye level')} camera angle,
        {lighting} lighting,
        clean lines, detailed sketch, monochrome drawing
        """
        
        return prompt.strip()