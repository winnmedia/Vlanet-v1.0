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
        
        # Hugging Face Inference API endpoints - 여러 모델 시도
        self.models = [
            "runwayml/stable-diffusion-v1-5",  # 가장 안정적이고 빠른 모델
            "CompVis/stable-diffusion-v1-4",   # 클래식 모델
            "prompthero/openjourney",           # 예술적 스타일
            "stabilityai/stable-diffusion-2-1", # SD 2.1
            "stabilityai/stable-diffusion-xl-base-1.0"  # SDXL (무거움)
        ]
        self.current_model_index = 0
        self.api_url = f"https://api-inference.huggingface.co/models/{self.models[self.current_model_index]}"
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
            
            # 여러 모델을 순차적으로 시도
            for attempt in range(len(self.models)):
                current_model = self.models[self.current_model_index]
                self.api_url = f"https://api-inference.huggingface.co/models/{current_model}"
                
                logger.info(f"Trying model: {current_model}")
                
                # 모델에 따라 다른 파라미터 설정
                if "xl" in current_model:
                    width, height = 1024, 576
                    steps = 30
                else:
                    width, height = 768, 432
                    steps = 20
                
                # Hugging Face API 호출
                response = requests.post(
                    self.api_url,
                    headers=self.headers,
                    json={
                        "inputs": prompt,
                        "parameters": {
                            "negative_prompt": "low quality, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
                            "num_inference_steps": steps,
                            "guidance_scale": 7.5,
                            "width": width,
                            "height": height
                        }
                    },
                    timeout=30
                )
            
                if response.status_code == 200:
                    # 이미지 데이터를 base64로 인코딩
                    image_bytes = response.content
                    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                    image_url = f"data:image/png;base64,{image_base64}"
                    
                    logger.info(f"Successfully generated image with model: {current_model}")
                    return {
                        "success": True,
                        "image_url": image_url,
                        "prompt_used": prompt,
                        "model_used": current_model
                    }
                else:
                    error_msg = response.json().get('error', '알 수 없는 오류')
                    logger.warning(f"Model {current_model} failed: {error_msg}")
                    
                    # 다음 모델 시도
                    self.current_model_index = (self.current_model_index + 1) % len(self.models)
                    
                    # 503은 모델 로딩 중이므로 다음 모델 시도
                    if response.status_code == 503:
                        continue
                    # 429는 할당량 초과
                    elif response.status_code == 429:
                        continue
            
            # 모든 모델이 실패한 경우
            return {
                "success": False,
                "error": "모든 이미지 생성 모델이 실패했습니다. 잠시 후 다시 시도해주세요.",
                "image_url": None,
                "models_tried": self.models
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
        
        # 간단하고 명확한 프롬프트 생성
        prompt_parts = []
        
        # 핵심 내용만 포함
        if visual_desc:
            prompt_parts.append(visual_desc)
        
        if action:
            prompt_parts.append(action)
            
        if shot_type:
            prompt_parts.append(f"{shot_type} shot")
        
        # 최소한의 스타일 지시
        prompt_parts.extend([
            "storyboard sketch",
            "simple",
            "clear"
        ])
        
        prompt = ", ".join(filter(None, prompt_parts))
        # 프롬프트 길이 제한
        if len(prompt) > 200:
            prompt = prompt[:200]
            
        return prompt