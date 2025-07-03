import os
import openai
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class DalleService:
    def __init__(self):
        api_key = getattr(settings, 'OPENAI_API_KEY', None) or os.environ.get('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in settings or environment variables")
        
        self.client = openai.OpenAI(api_key=api_key)
    
    def generate_storyboard_image(self, frame_description):
        """
        콘티 프레임 설명을 바탕으로 이미지를 생성합니다.
        """
        try:
            # 프롬프트 최적화 - 스토리보드 스타일로 변환
            prompt = self._create_storyboard_prompt(frame_description)
            
            # DALL-E 3로 이미지 생성
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )
            
            image_url = response.data[0].url
            return {
                "success": True,
                "image_url": image_url,
                "prompt_used": prompt
            }
            
        except openai.AuthenticationError:
            logger.error("OpenAI API 인증 실패")
            return {
                "success": False,
                "error": "API 인증 실패",
                "image_url": None
            }
        except openai.RateLimitError:
            logger.error("OpenAI API 요청 한도 초과")
            return {
                "success": False,
                "error": "API 요청 한도 초과",
                "image_url": None
            }
        except Exception as e:
            logger.error(f"이미지 생성 중 오류: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "image_url": None
            }
    
    def _create_storyboard_prompt(self, frame_data):
        """
        프레임 데이터를 스토리보드 스타일의 프롬프트로 변환합니다.
        """
        visual_desc = frame_data.get('visual_description', '')
        composition = frame_data.get('composition', '')
        camera_info = frame_data.get('camera_info', {})
        lighting = frame_data.get('lighting', '')
        
        # 스토리보드 스타일 프롬프트 생성
        prompt = f"""
        Professional storyboard illustration in pencil sketch style:
        {visual_desc}
        
        Composition: {composition}
        Camera angle: {camera_info.get('angle', 'eye level')}
        Lighting: {lighting}
        
        Style: Clean pencil sketch, professional storyboard art, 
        clear lines, cinematic framing, detailed but not overly complex
        """
        
        return prompt.strip()
    
    def generate_multiple_storyboard_images(self, frames_data):
        """
        여러 프레임에 대한 이미지를 생성합니다.
        """
        results = []
        
        for frame in frames_data:
            result = self.generate_storyboard_image(frame)
            results.append({
                "frame_number": frame.get('frame_number', 0),
                "title": frame.get('title', ''),
                "image_result": result
            })
        
        return results