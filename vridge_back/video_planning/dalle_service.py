import os
import logging
import requests
import base64
from django.conf import settings
from openai import OpenAI

logger = logging.getLogger(__name__)


class DalleService:
    """
    OpenAI DALL-E 3를 사용한 이미지 생성 서비스
    """
    
    def __init__(self):
        self.api_key = getattr(settings, 'OPENAI_API_KEY', None) or os.environ.get('OPENAI_API_KEY')
        self.available = bool(self.api_key)
        
        if not self.available:
            logger.warning("OPENAI_API_KEY not found. DALL-E image generation will not be available.")
        else:
            logger.info("DALL-E service initialized with API key")
            try:
                # 새 버전 API 방식
                self.client = OpenAI(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
                self.available = False
    
    def generate_storyboard_image(self, frame_data):
        """
        스토리보드 프레임 설명을 바탕으로 이미지를 생성합니다.
        """
        if not self.available:
            return {
                "success": False,
                "error": "이미지 생성 서비스를 사용할 수 없습니다. OPENAI_API_KEY를 확인해주세요.",
                "image_url": None
            }
        
        try:
            prompt = self._create_storyboard_prompt(frame_data)
            
            logger.info(f"Generating image with DALL-E 3, prompt: {prompt[:100]}...")
            
            # DALL-E 3 API 호출 (새 버전 방식)
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",  # DALL-E 3는 1024x1024, 1024x1792, 1792x1024 지원
                quality="standard",  # "standard" 또는 "hd"
                n=1,
            )
            
            # 이미지 URL 가져오기
            image_url = response.data[0].url
            
            # URL에서 이미지 다운로드하여 base64로 변환
            image_response = requests.get(image_url, timeout=30)
            if image_response.status_code == 200:
                image_base64 = base64.b64encode(image_response.content).decode('utf-8')
                final_image_url = f"data:image/png;base64,{image_base64}"
                
                logger.info("Successfully generated image with DALL-E 3")
                return {
                    "success": True,
                    "image_url": final_image_url,
                    "prompt_used": prompt,
                    "model_used": "dall-e-3",
                    "original_url": image_url  # 원본 URL도 저장
                }
            else:
                raise Exception(f"Failed to download image from {image_url}")
                
        except Exception as e:
            error_msg = str(e)
            logger.error(f"DALL-E image generation failed: {error_msg}")
            
            # API 키 관련 오류 체크
            if "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
                error_msg = "OpenAI API 키가 유효하지 않습니다."
            elif "quota" in error_msg.lower() or "limit" in error_msg.lower():
                error_msg = "OpenAI API 사용 한도를 초과했습니다."
            
            return {
                "success": False,
                "error": error_msg,
                "image_url": None
            }
    
    def _create_storyboard_prompt(self, frame_data):
        """
        프레임 데이터를 바탕으로 DALL-E용 프롬프트를 생성합니다.
        """
        visual_desc = frame_data.get('visual_description', '')
        title = frame_data.get('title', '')
        composition = frame_data.get('composition', '')
        lighting = frame_data.get('lighting', '')
        
        # DALL-E 3는 더 자세한 프롬프트를 잘 이해함
        prompt_parts = []
        
        if visual_desc:
            prompt_parts.append(visual_desc)
        elif title:
            prompt_parts.append(title)
        
        # 스토리보드 스타일 추가
        prompt_parts.append("storyboard illustration style")
        prompt_parts.append("professional movie storyboard")
        prompt_parts.append("clean sketch")
        
        if composition:
            prompt_parts.append(f"composition: {composition}")
        
        if lighting:
            prompt_parts.append(f"lighting: {lighting}")
        
        # DALL-E 3는 부정적 프롬프트를 직접 지원하지 않으므로 긍정적으로 표현
        prompt_parts.append("high quality")
        prompt_parts.append("professional artwork")
        prompt_parts.append("clear and detailed")
        
        prompt = ", ".join(prompt_parts)
        logger.debug(f"Generated prompt: {prompt}")
        
        return prompt