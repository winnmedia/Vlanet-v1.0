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
                # OpenAI 클라이언트 초기화 - 기본 인자만 사용
                import openai
                # 버전 확인
                openai_version = getattr(openai, '__version__', '0.0.0')
                logger.info(f"OpenAI library version: {openai_version}")
                
                # 간단한 초기화
                self.client = OpenAI(api_key=self.api_key)
                self.available = True
                logger.info("OpenAI client initialized successfully")
            except TypeError as e:
                # Railway 환경에서 proxies 문제 - 환경변수로 우회
                logger.warning(f"TypeError during client init: {e}")
                try:
                    # 환경변수 설정 후 재시도
                    os.environ['OPENAI_API_KEY'] = self.api_key
                    from openai import OpenAI
                    self.client = OpenAI()
                    self.available = True
                    logger.info("OpenAI client initialized via environment variable")
                except Exception as env_e:
                    logger.error(f"Failed to initialize with env var: {env_e}")
                    self.available = False
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
            
            # OpenAI 1.3.7 버전에서는 client를 통해서만 이미지 생성 가능
            if not hasattr(self, 'client') or self.client is None:
                # 클라이언트 재초기화 시도
                try:
                    from openai import OpenAI
                    self.client = OpenAI(api_key=self.api_key)
                except Exception as e:
                    logger.error(f"Failed to reinitialize client: {e}")
                    raise Exception("OpenAI 클라이언트 초기화 실패")
            
            # DALL-E 3 API 호출
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )
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
        
        # DALL-E 3에 최적화된 프롬프트 구성
        prompt_parts = []
        
        # 1. 메인 설명
        if visual_desc:
            prompt_parts.append(visual_desc)
        elif title:
            prompt_parts.append(title)
        
        # 2. 스토리보드 스타일 - 더 구체적으로
        prompt_parts.append("in the style of a professional movie storyboard")
        prompt_parts.append("black and white pencil sketch with clean lines")
        prompt_parts.append("cinematic composition")
        
        # 3. 구도와 카메라 정보
        if composition:
            camera_terms = {
                '와이드샷': 'wide shot showing full environment',
                '미디엄샷': 'medium shot framing subjects from waist up',
                '클로즈업': 'close-up shot focusing on details',
                '오버숄더': 'over-the-shoulder shot',
                '하이앵글': 'high angle shot looking down',
                '로우앵글': 'low angle shot looking up'
            }
            camera_desc = camera_terms.get(composition, f"{composition} shot")
            prompt_parts.append(camera_desc)
        
        # 4. 조명 정보
        if lighting:
            lighting_terms = {
                '자연광': 'natural daylight illumination',
                '부드러운 조명': 'soft diffused lighting',
                '드라마틱한 조명': 'dramatic lighting with strong shadows',
                '역광': 'backlit silhouette lighting',
                '혼합 조명': 'mixed lighting sources'
            }
            lighting_desc = lighting_terms.get(lighting, f"{lighting}")
            prompt_parts.append(lighting_desc)
        
        # 5. 품질 지시어
        prompt_parts.append("professional storyboard artist quality")
        prompt_parts.append("clear visual storytelling")
        
        prompt = ", ".join(prompt_parts)
        logger.info(f"Generated DALL-E prompt: {prompt[:200]}...")
        
        return prompt