import os
import logging
import requests
import base64
from io import BytesIO
from PIL import Image
from django.conf import settings

logger = logging.getLogger(__name__)


class StableDiffusionService:
    """
    Hugging Face API를 사용한 Stable Diffusion 이미지 생성 서비스
    """
    
    def __init__(self):
        self.api_key = getattr(settings, 'HUGGINGFACE_API_KEY', None) or os.environ.get('HUGGINGFACE_API_KEY')
        self.available = bool(self.api_key)
        
        if not self.available:
            logger.warning("HUGGINGFACE_API_KEY not found. Image generation will not be available.")
        else:
            logger.info("Stable Diffusion service initialized with API key")
        
        # Hugging Face Inference API endpoint
        self.api_url = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}"
        }
    
    def generate_storyboard_image(self, frame_data):
        """
        스토리보드 프레임 설명을 바탕으로 이미지를 생성합니다.
        """
        if not self.available:
            return {
                "success": False,
                "error": "이미지 생성 서비스를 사용할 수 없습니다. HUGGINGFACE_API_KEY를 확인해주세요.",
                "image_url": None
            }
        
        try:
            prompt = self._create_storyboard_prompt(frame_data)
            
            # Hugging Face API 호출
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json={
                    "inputs": prompt,
                    "parameters": {
                        "negative_prompt": "low quality, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
                        "num_inference_steps": 30,
                        "guidance_scale": 7.5,
                        "width": 1024,
                        "height": 576  # 16:9 비율
                    }
                }
            )
            
            if response.status_code == 200:
                # 이미지 데이터를 base64로 인코딩
                image_bytes = response.content
                image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                image_url = f"data:image/png;base64,{image_base64}"
                
                return {
                    "success": True,
                    "image_url": image_url,
                    "prompt_used": prompt
                }
            else:
                error_msg = response.json().get('error', '알 수 없는 오류')
                logger.error(f"Hugging Face API error: {error_msg}")
                
                # 할당량 초과 또는 모델 로딩 중
                if response.status_code == 503:
                    return {
                        "success": False,
                        "error": "이미지 생성 모델이 로딩 중입니다. 잠시 후 다시 시도해주세요.",
                        "image_url": None
                    }
                elif response.status_code == 429:
                    return {
                        "success": False,
                        "error": "API 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.",
                        "image_url": None
                    }
                else:
                    return {
                        "success": False,
                        "error": f"이미지 생성 실패: {error_msg}",
                        "image_url": None
                    }
                    
        except Exception as e:
            logger.error(f"Error generating image: {str(e)}")
            return {
                "success": False,
                "error": f"이미지 생성 중 오류가 발생했습니다: {str(e)}",
                "image_url": None
            }
    
    def _create_storyboard_prompt(self, frame_data):
        """
        프레임 데이터를 이미지 생성 프롬프트로 변환합니다.
        """
        visual_desc = frame_data.get('visual_description', '')
        shot_type = frame_data.get('shot_type', '')
        action = frame_data.get('action', '')
        
        # 영화 스토리보드 스타일 프롬프트 생성
        prompt_parts = [
            "professional film storyboard",
            "cinematic composition",
            visual_desc
        ]
        
        if shot_type:
            prompt_parts.append(f"{shot_type} shot")
        
        if action:
            prompt_parts.append(action)
        
        prompt_parts.extend([
            "high quality illustration",
            "detailed",
            "16:9 aspect ratio"
        ])
        
        return ", ".join(filter(None, prompt_parts))