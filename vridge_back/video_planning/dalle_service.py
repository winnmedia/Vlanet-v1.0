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
    
    def generate_storyboard_image(self, frame_data, style='minimal'):
        """
        스토리보드 프레임 설명을 바탕으로 이미지를 생성합니다.
        
        Args:
            frame_data: 프레임 정보
            style: 이미지 스타일 ('minimal', 'realistic', 'sketch', 'cartoon', 'cinematic')
        """
        if not self.available:
            return {
                "success": False,
                "error": "이미지 생성 서비스를 사용할 수 없습니다. OPENAI_API_KEY를 확인해주세요.",
                "image_url": None
            }
        
        try:
            prompt = self._create_storyboard_prompt(frame_data, style)
            
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
            
            # DALL-E 3 API 호출 - HD 품질로 업그레이드
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1792x1024",  # 더 넓은 화면비 (16:9에 가까움)
                quality="hd",      # HD 품질로 변경
                n=1,
                style="natural"    # 더 사실적인 스타일
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
    
    def _filter_forbidden_words(self, text):
        """
        이미지 생성 프롬프트에서 텍스트 중심 결과를 유발하는 금지 단어들을 제거합니다.
        """
        forbidden_words = [
            'storyboard', 'frame', 'scene description',
            'text box', 'textbox', 'caption', 'label',
            'write', 'written', 'explained', 'annotated',
            'comic panel with narration', 'comic panel',
            'diagram', 'layout', 'template',
            'slide', 'presentation', 'whiteboard'
        ]
        
        # 대소문자 구분 없이 필터링
        filtered_text = text
        for word in forbidden_words:
            import re
            # 단어 경계를 포함한 정규표현식으로 정확한 단어만 제거
            pattern = r'\b' + re.escape(word) + r'\b'
            filtered_text = re.sub(pattern, '', filtered_text, flags=re.IGNORECASE)
        
        # 연속된 공백 제거
        filtered_text = ' '.join(filtered_text.split())
        
        return filtered_text
    
    def _create_storyboard_prompt(self, frame_data, style='minimal'):
        """
        프레임 데이터를 바탕으로 DALL-E용 프롬프트를 생성합니다.
        실제 장면이 일러스트로 시각화되도록 구체적인 시각적 요소를 포함합니다.
        
        Args:
            frame_data: 프레임 정보
            style: 이미지 스타일 ('minimal', 'realistic', 'sketch', 'cartoon', 'cinematic')
        """
        visual_desc = frame_data.get('visual_description', '')
        composition = frame_data.get('composition', '')
        lighting = frame_data.get('lighting', '')
        title = frame_data.get('title', '')
        
        # 한국어 키워드를 더 구체적인 영어 시각 표현으로 변환
        scene_translations = {
            # 배경/장소
            '실내': 'interior space with visible walls and ceiling',
            '실외': 'outdoor environment with open sky',
            '사무실': 'modern office interior with desks and computers',
            '거리': 'urban street with buildings on both sides',
            '집': 'cozy home interior with furniture',
            '카페': 'coffee shop interior with tables and warm lighting',
            '공원': 'park with trees and benches',
            '학교': 'school classroom with desks and blackboard',
            '병원': 'hospital corridor with clean white walls',
            '회의실': 'conference room with large table and chairs',
            '방': 'bedroom with bed and window',
            '거실': 'living room with sofa and TV',
            '주방': 'kitchen with cabinets and appliances',
            '도로': 'road with cars and traffic',
            '빌딩': 'tall buildings and urban skyline',
            '숲': 'forest with tall trees and natural lighting',
            '바다': 'ocean view with waves and horizon',
            '산': 'mountain landscape with peaks',
            '하늘': 'sky with clouds',
            '도시': 'cityscape with buildings and streets',
            
            # 인물 묘사
            '남자': 'man in casual clothing',
            '여자': 'woman with medium-length hair',
            '아이': 'young child around 8 years old',
            '노인': 'elderly person with gray hair',
            '청년': 'young adult in their 20s',
            '중년': 'middle-aged person in business attire',
            '소년': 'young boy',
            '소녀': 'young girl with ponytail',
            '사람': 'person in everyday clothes',
            
            # 행동/동작
            '걷다': 'walking with natural stride',
            '앉다': 'sitting on chair with relaxed posture',
            '서다': 'standing upright',
            '뛰다': 'running with dynamic motion',
            '말하다': 'speaking with expressive gestures',
            '듣다': 'listening attentively',
            '보다': 'looking intently at something',
            '웃다': 'smiling with warm expression',
            '울다': 'crying with emotional expression',
            '생각하다': 'deep in thought with hand on chin',
            '쓰다': 'writing at desk',
            '읽다': 'reading book or document',
            '먹다': 'eating at table',
            '마시다': 'drinking from cup',
            '일하다': 'working at desk with focused expression',
            '놀다': 'playing with joyful expression',
            '자다': 'sleeping peacefully',
            '운전하다': 'driving car with hands on wheel'
        }
        
        # 구도/카메라 앵글 매핑
        camera_angles = {
            '와이드샷': 'wide shot showing full environment',
            '미디엄샷': 'medium shot from waist up',
            '클로즈업': 'close-up shot of face showing emotion',
            '오버숄더': 'over-the-shoulder perspective',
            '하이앵글': 'high angle looking down',
            '로우앵글': 'low angle looking up dramatically',
            '익스트림 클로즈업': 'extreme close-up on facial features',
            '풀샷': 'full body shot showing entire figure',
            '투샷': 'two people in frame facing each other'
        }
        
        # 조명 스타일 매핑
        lighting_styles = {
            '자연광': 'natural daylight coming through window',
            '부드러운 조명': 'soft diffused lighting creating gentle shadows',
            '드라마틱한 조명': 'dramatic lighting with strong contrast',
            '역광': 'backlit creating silhouette effect',
            '황금시간대': 'golden hour warm orange lighting',
            '밤': 'nighttime with artificial lights',
            '실내조명': 'indoor warm tungsten lighting'
        }
        
        # 시각적 설명 변환
        translated_desc = visual_desc
        for korean, english in scene_translations.items():
            if korean in visual_desc:
                translated_desc = translated_desc.replace(korean, english)
        
        # 스타일별 프롬프트 설정
        style_prompts = {
            'minimal': {
                'base': "Minimalist illustration",
                'details': [
                    "simple line art",
                    "clean composition",
                    "minimal details",
                    "focus on essential elements"
                ]
            },
            'realistic': {
                'base': "Highly realistic scene illustration",
                'details': [
                    "photorealistic rendering",
                    "detailed textures and materials",
                    "realistic proportions",
                    "natural lighting and shadows"
                ]
            },
            'sketch': {
                'base': "Professional sketch in pencil",
                'details': [
                    "rough pencil sketch style",
                    "dynamic line work",
                    "cross-hatching for shadows",
                    "expressive and loose strokes"
                ]
            },
            'cartoon': {
                'base': "Cartoon-style illustration",
                'details': [
                    "animated cartoon style",
                    "exaggerated expressions",
                    "bold outlines",
                    "simplified but expressive forms"
                ]
            },
            'cinematic': {
                'base': "Cinematic scene in film noir style",
                'details': [
                    "dramatic film noir lighting",
                    "high contrast black and white",
                    "cinematic framing",
                    "professional movie scene quality"
                ]
            },
            'watercolor': {
                'base': "Watercolor painting illustration",
                'details': [
                    "soft watercolor painting",
                    "flowing color blends",
                    "translucent washes",
                    "artistic brush strokes"
                ]
            },
            'digital': {
                'base': "Modern digital art illustration",
                'details': [
                    "digital art style",
                    "vibrant colors",
                    "crisp digital rendering",
                    "contemporary aesthetic"
                ]
            },
            'noir': {
                'base': "Film noir black and white illustration",
                'details': [
                    "stark black and white contrast",
                    "dramatic shadows",
                    "vintage noir atmosphere",
                    "moody lighting"
                ]
            },
            'pastel': {
                'base': "Soft pastel illustration",
                'details': [
                    "soft pastel colors",
                    "gentle color palette",
                    "dreamy atmosphere",
                    "delicate rendering"
                ]
            },
            'comic': {
                'base': "Comic book style illustration",
                'details': [
                    "comic book art style",
                    "dynamic action poses",
                    "speech bubble areas avoided",
                    "bold comic book colors"
                ]
            }
        }
        
        # 선택된 스타일 가져오기 (기본값: sketch)
        selected_style = style_prompts.get(style, style_prompts['sketch'])
        
        # 프롬프트 구성
        prompt_parts = []
        
        # 1. 스타일 기본 설정
        prompt_parts.append(selected_style['base'])
        
        # 2. 구체적인 장면 묘사
        if translated_desc:
            prompt_parts.append(f"Scene: {translated_desc}")
        
        # 3. 카메라 앵글 추가
        if composition in camera_angles:
            prompt_parts.append(camera_angles[composition])
        
        # 4. 조명 효과 추가
        if lighting in lighting_styles:
            prompt_parts.append(lighting_styles[lighting])
        
        # 5. 스타일별 세부사항 추가
        prompt_parts.extend(selected_style['details'])
        
        # 6. 공통 시각적 요소
        prompt_parts.extend([
            "professional illustration quality",
            "clear visual storytelling",
            "expressive character emotions",
            "proper spatial composition"
        ])
        
        # 7. 텍스트 제외 (마지막에 강조)
        prompt_parts.append("NO TEXT OR LETTERS IN THE IMAGE")
        
        # 최종 프롬프트 조합
        prompt = ". ".join(prompt_parts)
        
        # 금지 단어 필터링 적용
        prompt = self._filter_forbidden_words(prompt)
        
        logger.info(f"Generated cinematic DALL-E prompt: {prompt[:200]}...")
        return prompt