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
        # 디버깅을 위한 상세 로그
        settings_key = getattr(settings, 'OPENAI_API_KEY', None)
        env_key = os.environ.get('OPENAI_API_KEY')
        
        logger.info(f"🔍 OPENAI_API_KEY 체크:")
        logger.info(f"  - settings.OPENAI_API_KEY: {settings_key[:10] + '...' if settings_key else 'None'}")
        logger.info(f"  - os.environ.get('OPENAI_API_KEY'): {env_key[:10] + '...' if env_key else 'None'}")
        
        self.api_key = settings_key or env_key
        self.available = bool(self.api_key)
        
        if not self.available:
            logger.warning("❌ OPENAI_API_KEY not found. DALL-E image generation will not be available.")
            logger.warning("  - Railway에서 환경변수를 설정했는지 확인하세요")
            logger.warning("  - 설정 후 재배포가 필요합니다")
        else:
            logger.info(f"✅ DALL-E service initialized with API key: {self.api_key[:10]}...")
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
            'storyboard', 'frame', 'scene description', 'scene',
            'text box', 'textbox', 'caption', 'label',
            'write', 'written', 'explained', 'annotated',
            'comic panel with narration', 'comic panel',
            'diagram', 'layout', 'template',
            'slide', 'presentation', 'whiteboard',
            'panel', 'box', 'description', 'narration',
            'subtitle', 'title card', 'text overlay',
            'document', 'paper', 'poster', 'sign'
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
        설명문이 아닌 순수한 그림 묘사로 변환합니다.
        
        Args:
            frame_data: 프레임 정보
            style: 이미지 스타일 ('minimal', 'realistic', 'sketch', 'cartoon', 'cinematic')
        """
        visual_desc = frame_data.get('visual_description', '')
        composition = frame_data.get('composition', '')
        lighting = frame_data.get('lighting', '')
        # title과 frame_number는 프롬프트에서 완전히 제외
        
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
            
            # 인물 묘사 - 더 자연스럽고 시각적으로
            '남자': 'man',
            '여자': 'woman',
            '아이': 'child',
            '노인': 'elderly person',
            '청년': 'young person',
            '중년': 'middle-aged person',
            '소년': 'boy',
            '소녀': 'girl',
            '사람': 'person',
            '여성': 'woman',
            '남성': 'man',
            '아버지': 'father figure',
            '어머니': 'mother figure',
            '학생': 'student',
            '선생님': 'teacher',
            '의사': 'doctor in white coat',
            '간호사': 'nurse',
            '회사원': 'office worker',
            '20대': 'young adult',
            '30대': 'person in thirties',
            '40대': 'middle-aged person',
            '50대': 'mature person',
            
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
        
        # 구도/카메라 앵글 매핑 - 더 시각적이고 구체적으로
        camera_angles = {
            '와이드샷': 'extremely wide landscape view',
            '미디엄샷': 'person framed from waist up',
            '클로즈업': 'tight shot on face filling frame',
            '오버숄더': 'view over someone shoulder',
            '하이앵글': 'camera high above looking down',
            '로우앵글': 'camera near ground looking up',
            '익스트림 클로즈업': 'macro shot of eyes only',
            '풀샷': 'full figure head to toe',
            '투샷': 'two people together in frame'
        }
        
        # 조명 스타일 매핑 - 더 시각적이고 구체적으로
        lighting_styles = {
            '자연광': 'bright sunny daylight',
            '부드러운 조명': 'soft even lighting no shadows',
            '드라마틱한 조명': 'stark light and shadow contrast',
            '역광': 'strong backlight silhouette',
            '황금시간대': 'warm orange sunset glow',
            '밤': 'dark night blue hour lighting',
            '실내조명': 'cozy warm indoor lamps'
        }
        
        # 시각적 설명 변환
        translated_desc = visual_desc
        for korean, english in scene_translations.items():
            if korean in visual_desc:
                translated_desc = translated_desc.replace(korean, english)
        
        # 스타일별 프롬프트 설정 - 더 시각적이고 구체적으로
        style_prompts = {
            'minimal': {
                'base': "Minimalist line drawing",
                'details': [
                    "simple clean lines",
                    "empty negative space",
                    "essential shapes only",
                    "monochromatic"
                ]
            },
            'realistic': {
                'base': "Photorealistic cinematic shot",
                'details': [
                    "hyperrealistic details",
                    "natural textures",
                    "volumetric lighting",
                    "depth of field"
                ]
            },
            'sketch': {
                'base': "Rough pencil sketch artwork",
                'details': [
                    "hand-drawn pencil strokes",
                    "sketchy lines",
                    "shading with crosshatching",
                    "artistic pencil drawing"
                ]
            },
            'cartoon': {
                'base': "Vibrant cartoon artwork",
                'details': [
                    "bright cartoon colors",
                    "thick black outlines",
                    "cel-shaded style",
                    "animated character design"
                ]
            },
            'cinematic': {
                'base': "Dramatic cinematic shot",
                'details': [
                    "film noir atmosphere",
                    "chiaroscuro lighting",
                    "wide aspect ratio",
                    "movie still quality"
                ]
            },
            'watercolor': {
                'base': "Soft watercolor painting",
                'details': [
                    "watercolor paint on paper",
                    "wet-on-wet technique",
                    "flowing paint bleeds",
                    "transparent color layers"
                ]
            },
            'digital': {
                'base': "Digital artwork rendering",
                'details': [
                    "glossy digital painting",
                    "vibrant neon colors",
                    "smooth gradients",
                    "futuristic aesthetic"
                ]
            },
            'noir': {
                'base': "Black and white film noir",
                'details': [
                    "high contrast monochrome",
                    "deep shadows",
                    "1940s noir style",
                    "venetian blind shadows"
                ]
            },
            'pastel': {
                'base': "Soft pastel artwork",
                'details': [
                    "chalk pastel on paper",
                    "muted pastel tones",
                    "soft edges",
                    "dreamy soft focus"
                ]
            },
            'comic': {
                'base': "Comic book artwork",
                'details': [
                    "comic book art",
                    "dynamic action shot",
                    "ben day dots",
                    "vibrant pop art colors"
                ]
            }
        }
        
        # 선택된 스타일 가져오기 (기본값: sketch)
        selected_style = style_prompts.get(style, style_prompts['sketch'])
        
        # 프롬프트 구성 - 완전한 그림 묘사로
        prompt_parts = []
        
        # 1. 메인 스타일을 시작으로
        prompt_parts.append(selected_style['base'])
        
        # 2. 장면의 시각적 요소를 자연스럽게 묘사
        if translated_desc:
            # 숫자나 설명문 형식 제거
            clean_desc = translated_desc
            # "40대 여성" → "middle-aged woman"으로 이미 변환되었지만, 더 자연스럽게
            clean_desc = clean_desc.replace('around ', '')
            clean_desc = clean_desc.replace(' years old', '')
            prompt_parts.append(clean_desc)
        
        # 3. 카메라 구도를 자연스럽게 통합
        if composition in camera_angles:
            # "shot" 같은 기술적 용어 최소화
            angle_desc = camera_angles[composition].replace(' shot', '').replace('camera ', '')
            prompt_parts.append(angle_desc)
        
        # 4. 조명을 분위기로 표현
        if lighting in lighting_styles:
            prompt_parts.append(lighting_styles[lighting])
        
        # 5. 스타일 세부사항 추가
        prompt_parts.extend(selected_style['details'])
        
        # 6. 텍스트 완전 배제 강조
        prompt_parts.extend([
            "artwork without any text",
            "no words or letters visible",
            "pure visual illustration"
        ])
        
        # 최종 프롬프트를 자연스러운 문장으로 조합
        # 마침표 대신 쉼표로 연결하여 하나의 통합된 묘사로
        prompt = ", ".join(prompt_parts)
        
        # 금지 단어 필터링 적용
        prompt = self._filter_forbidden_words(prompt)
        
        logger.info(f"Generated cinematic DALL-E prompt: {prompt[:200]}...")
        return prompt