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
        
        # Hugging Face Inference API endpoints - v1.5를 기본으로
        self.models = [
            "runwayml/stable-diffusion-v1-5",  # 가장 안정적이고 빠른 모델 (기본)
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
                
                # v1.5에 최적화된 파라미터
                width, height = 512, 512  # v1.5는 512x512가 기본
                steps = 25  # 적절한 품질과 속도의 균형
                
                # Hugging Face API 호출
                response = requests.post(
                    self.api_url,
                    headers=self.headers,
                    json={
                        "inputs": prompt,
                        "parameters": {
                            "negative_prompt": "ugly, blurry, low quality, distorted, disfigured",
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
                    try:
                        error_data = response.json()
                        error_msg = error_data.get('error', '알 수 없는 오류')
                    except:
                        error_msg = f"Status {response.status_code}: {response.text[:200]}"
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
        v1.5 모델에 최적화
        """
        visual_desc = frame_data.get('visual_description', '')
        shot_type = frame_data.get('shot_type', '')
        action = frame_data.get('action', '')
        
        # v1.5에서 잘 작동하는 프롬프트 구조
        prompt_parts = []
        
        # 메인 설명
        if visual_desc:
            # 한국어를 영어로 간단히 설명
            prompt_parts.append(visual_desc)
        
        if action:
            prompt_parts.append(action)
        
        # 스타일 키워드 (v1.5에서 효과적)
        prompt_parts.extend([
            "storyboard",
            "professional",
            "clean lines",
            "sketch style",
            "movie storyboard"
        ])
        
        prompt = ", ".join(filter(None, prompt_parts))
        
        # v1.5는 75 토큰 제한이 있으므로 간결하게
        if len(prompt) > 150:
            prompt = prompt[:150]
            
        logger.debug(f"Generated prompt: {prompt}")
        return prompt