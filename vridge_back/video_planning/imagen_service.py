import os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class ImagenService:
    """
    Google Imagen 서비스 (현재는 placeholder)
    
    주의: Google Imagen API는 현재 Vertex AI를 통해서만 사용 가능하며,
    일반 google-generativeai 패키지로는 직접 접근할 수 없습니다.
    
    이 클래스는 향후 Imagen API가 일반 공개될 때를 대비한 구조입니다.
    """
    
    def __init__(self):
        self.api_key = getattr(settings, 'GOOGLE_API_KEY', None) or os.environ.get('GOOGLE_API_KEY')
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not found in settings or environment variables")
        
        # 현재는 Imagen API를 직접 사용할 수 없으므로 placeholder
        self.available = False
        logger.info("Imagen service initialized (placeholder mode)")
    
    def generate_storyboard_image(self, frame_description):
        """
        콘티 프레임 설명을 바탕으로 이미지를 생성합니다.
        현재는 placeholder 응답을 반환합니다.
        """
        
        # 향후 Imagen API가 사용 가능해지면 여기에 구현
        # 현재는 텍스트 설명만 반환
        
        prompt = self._create_storyboard_prompt(frame_description)
        
        return {
            "success": False,
            "error": "Imagen API는 현재 Vertex AI를 통해서만 사용 가능합니다",
            "image_url": None,
            "prompt_used": prompt,
            "alternative": "텍스트 기반 콘티를 사용하거나 다른 이미지 생성 서비스를 이용해주세요"
        }
    
    def _create_storyboard_prompt(self, frame_data):
        """
        프레임 데이터를 이미지 생성 프롬프트로 변환합니다.
        """
        visual_desc = frame_data.get('visual_description', '')
        composition = frame_data.get('composition', '')
        camera_info = frame_data.get('camera_info', {})
        lighting = frame_data.get('lighting', '')
        
        prompt = f"""
        Professional storyboard illustration:
        {visual_desc}
        
        Composition: {composition}
        Camera angle: {camera_info.get('angle', 'eye level')}
        Lighting: {lighting}
        
        Style: Clean pencil sketch, professional storyboard art
        """
        
        return prompt.strip()


class StableDiffusionService:
    """
    Stable Diffusion을 사용한 이미지 생성 서비스 (Hugging Face API)
    무료 티어로 사용 가능
    """
    
    def __init__(self):
        self.api_key = getattr(settings, 'HUGGINGFACE_API_KEY', None) or os.environ.get('HUGGINGFACE_API_KEY')
        # 다른 Stable Diffusion 모델들 (선택 가능)
        # self.api_url = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1"
        # self.api_url = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5"
        self.api_url = "https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4"
        self.available = bool(self.api_key)
        
        if not self.available:
            logger.warning("Hugging Face API key not found - Stable Diffusion service unavailable")
    
    def generate_storyboard_image(self, frame_description, retry_count=0):
        """
        Stable Diffusion을 사용하여 스토리보드 이미지를 생성합니다.
        503 에러 시 재시도 로직 포함
        """
        if not self.available:
            return {
                "success": False,
                "error": "Hugging Face API 키가 설정되지 않았습니다",
                "image_url": None
            }
        
        try:
            import requests
            import time
            import base64
            from django.core.files.base import ContentFile
            from django.core.files.storage import default_storage
            import uuid
            
            prompt = self._create_storyboard_prompt(frame_description)
            
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            # 첫 시도는 더 긴 타임아웃으로
            timeout = 120 if retry_count == 0 else 60
            
            response = requests.post(
                self.api_url,
                headers=headers,
                json={"inputs": prompt},
                timeout=timeout
            )
            
            if response.status_code == 200:
                # 이미지 바이너리를 파일로 저장
                image_data = response.content
                file_name = f"storyboard_{uuid.uuid4().hex[:8]}.png"
                file_path = f"storyboards/{file_name}"
                
                # Django 스토리지에 저장
                saved_path = default_storage.save(file_path, ContentFile(image_data))
                image_url = default_storage.url(saved_path)
                
                return {
                    "success": True,
                    "image_url": image_url,
                    "prompt_used": prompt
                }
            elif response.status_code == 503 and retry_count < 3:
                # 모델 로딩 중 - 재시도
                wait_time = 30 * (retry_count + 1)  # 30초, 60초, 90초
                logger.info(f"모델 로딩 중... {wait_time}초 후 재시도 (시도 {retry_count + 1}/3)")
                time.sleep(wait_time)
                return self.generate_storyboard_image(frame_description, retry_count + 1)
            else:
                error_msg = response.text[:200] if response.text else f"상태 코드: {response.status_code}"
                return {
                    "success": False,
                    "error": f"API 오류: {error_msg}",
                    "image_url": None
                }
                
        except requests.exceptions.Timeout:
            if retry_count < 2:
                logger.info(f"타임아웃 발생. 재시도 중... (시도 {retry_count + 1}/2)")
                time.sleep(10)
                return self.generate_storyboard_image(frame_description, retry_count + 1)
            else:
                return {
                    "success": False,
                    "error": "요청 시간 초과. 잠시 후 다시 시도해주세요.",
                    "image_url": None
                }
        except Exception as e:
            logger.error(f"Stable Diffusion 이미지 생성 오류: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "image_url": None
            }
    
    def _create_storyboard_prompt(self, frame_data):
        """
        프레임 데이터를 Stable Diffusion 프롬프트로 변환합니다.
        """
        visual_desc = frame_data.get('visual_description', '')
        composition = frame_data.get('composition', '')
        camera_info = frame_data.get('camera_info', {})
        lighting = frame_data.get('lighting', '')
        
        # Stable Diffusion에 최적화된 프롬프트
        prompt = f"""
        storyboard sketch, pencil drawing, professional storyboard art,
        {visual_desc},
        {composition} composition,
        {camera_info.get('angle', 'eye level')} angle,
        {lighting} lighting,
        black and white sketch, clean lines
        """
        
        return prompt.strip()