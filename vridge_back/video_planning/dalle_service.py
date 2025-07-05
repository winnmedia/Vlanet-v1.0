import os
import logging
import requests
import base64
from django.conf import settings
from openai import OpenAI
import re

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
            prompt = self._create_visual_prompt(frame_data, style)
            
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
            
            # DALL-E 3 API 호출 - 일러스트레이션에 최적화
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1792x1024",  # 16:9 화면비
                quality="standard", # 표준 품질 (더 빠른 생성)
                n=1,
                style="vivid"      # 더 예술적이고 생동감 있는 스타일
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
    
    def _create_visual_prompt(self, frame_data, style='minimal'):
        """
        프레임 데이터를 바탕으로 순수한 시각적 프롬프트를 생성합니다.
        DALL-E가 텍스트 박스를 그리지 않도록 영화의 한 장면처럼 묘사합니다.
        
        Args:
            frame_data: 프레임 정보
            style: 이미지 스타일
        """
        visual_desc = frame_data.get('visual_description', '')
        
        # 한국어를 영어로 변환
        translated_desc = self._translate_korean_to_english(visual_desc)
        
        # 극도로 단순한 프롬프트 - DALL-E가 절대 텍스트를 그리지 못하도록
        # 스타일에 관계없이 모두 단순하게
        prompt = f"{translated_desc}"
        
        # 스타일 키워드만 추가 (아주 짧게)
        if style == 'minimal' or style == 'sketch':
            prompt = f"pencil sketch {prompt}"
        elif style == 'realistic':
            prompt = f"photo {prompt}"
        elif style == 'watercolor':
            prompt = f"watercolor {prompt}"
        elif style == 'cinematic':
            prompt = f"cinematic {prompt}"
        
        # 마지막에 반드시 추가
        prompt = f"{prompt}, no text"
        
        # 프롬프트 최종 정리
        prompt = ' '.join(prompt.split())
        
        logger.info(f"Final DALL-E prompt (극도로 단순화): {prompt}")
        return prompt
    
    def _translate_korean_to_english(self, text):
        """
        한국어 텍스트를 영어로 간단히 변환합니다.
        """
        # 먼저 텍스트 트리거 패턴 제거
        text = self._clean_text_triggers(text)
        
        # 복합 표현 먼저 처리 (순서 중요!)
        translations = [
            # 복합 동작 (가장 긴 패턴부터)
            ('사무실에서 일하는 사람들', 'people working in office'),
            ('카페에 들어가는 남자', 'man walks into cafe'),
            ('회의실에서 프레젠테이션하는 여성', 'woman giving presentation in meeting room'),
            ('공원에서 뛰어노는 아이들', 'children running in park playground'),
            ('남자가 걸어가는 모습', 'man walking'),
            ('회의실에서 프레젠테이션', 'presentation in meeting room'),
            ('공원에서 뛰는 아이들', 'children running in park'),
            ('카페 입구 장면', 'cafe entrance'),
            ('카페 입구', 'cafe entrance'),
            ('사무실에서 일하는', 'working in office'),
            ('카페에 들어가는', 'entering cafe'),
            ('회의실에서 프레젠테이션하는', 'presenting in meeting room'),
            ('공원에서 뛰어노는', 'playing in park'),
            
            # 장소
            ('카페', 'cafe'),
            ('커피숍', 'coffee shop'),
            ('회의실', 'meeting room'),
            ('공원', 'park'),
            ('사무실', 'office'),
            ('거리', 'street'),
            ('도로', 'road'),
            ('집', 'home'),
            ('학교', 'school'),
            ('병원', 'hospital'),
            ('상점', 'shop'),
            ('레스토랑', 'restaurant'),
            
            # 인물
            ('아이들', 'children'),
            ('남자', 'man'),
            ('여자', 'woman'),
            ('여성', 'woman'),
            ('남성', 'man'),
            ('아이', 'child'),
            ('사람', 'person'),
            ('사람들', 'people'),
            
            # 동작
            ('들어가는', 'entering'),
            ('나오는', 'exiting'),
            ('걷는', 'walking'),
            ('뛰는', 'running'),
            ('앉아있는', 'sitting'),
            ('서있는', 'standing'),
            ('말하는', 'speaking'),
            ('듣는', 'listening'),
            ('웃는', 'smiling'),
            ('일하는', 'working'),
            ('놀고있는', 'playing'),
            ('뛰어노는', 'playing'),
            ('걸어가는', 'walking'),
            ('프레젠테이션', 'presentation'),
            
            # 조사 (마지막에 처리)
            ('에서', ' in '),
            ('에', ' at '),
            ('을', ''),
            ('를', ''),
            ('이', ''),
            ('가', ''),
            ('는', ''),
            ('은', ''),
            ('들', '')
        ]
        
        result = text
        # 순서대로 치환 (긴 패턴이 먼저 처리되도록 정렬됨)
        for korean, english in translations:
            result = result.replace(korean, english)
        
        # 연속된 공백 정리
        result = ' '.join(result.split())
        
        return result
    
    def _clean_text_triggers(self, text):
        """
        텍스트에서 스토리보드/프레임 관련 트리거 단어를 제거합니다.
        """
        import re
        
        # 먼저 콜론(:) 앞의 모든 레이블 제거
        if ':' in text:
            # 콜론 이후의 내용만 가져오기
            parts = text.split(':', 1)
            if len(parts) > 1:
                text = parts[1].strip()
        
        # 제거할 패턴들
        patterns_to_remove = [
            r'프레임\s*#?\s*\d*',
            r'Frame\s*#?\s*\d*',
            r'장면\s*\d*',
            r'Scene\s*\d*',
            r'장면\s*설명',
            r'Scene\s*description',
            r'씬\s*\d*',
            r'컷\s*\d*',
            r'Cut\s*\d*',
            r'샷\s*\d*',
            r'Shot\s*\d*',
            r'설명\s*:',
            r'description\s*:',
            r'^\d+\.\s*',  # 숫자로 시작하는 리스트
            r'^\-\s*',     # 대시로 시작하는 리스트
            r'^\*\s*',     # 별표로 시작하는 리스트
            r'#\d+',       # #1, #2 등
        ]
        
        cleaned_text = text
        for pattern in patterns_to_remove:
            cleaned_text = re.sub(pattern, '', cleaned_text, flags=re.IGNORECASE)
        
        # 여러 공백을 하나로
        cleaned_text = ' '.join(cleaned_text.split())
        
        return cleaned_text.strip()
    
    def _translate_composition(self, composition):
        """
        구성 용어를 영어로 변환
        """
        comp_dict = {
            '클로즈업': 'closeup',
            '미디엄샷': 'medium',
            '와이드샷': 'wide',
            '풀샷': 'full',
            '롱샷': 'long',
            '버드아이뷰': 'aerial',
            '로우앵글': 'low angle',
            '하이앵글': 'high angle'
        }
        return comp_dict.get(composition, composition)
    
    def _translate_lighting(self, lighting):
        """
        조명 용어를 영어로 변환
        """
        light_dict = {
            '자연광': 'natural light',
            '실내조명': 'indoor lighting',
            '황금시간대': 'golden hour',
            '역광': 'backlight',
            '부드러운조명': 'soft light',
            '강한조명': 'harsh light',
            '어두운': 'dark',
            '밝은': 'bright'
        }
        return light_dict.get(lighting, lighting)
    
    def _remove_forbidden_words(self, prompt):
        """
        텍스트 생성을 유발하는 금지 단어들을 제거합니다.
        """
        forbidden_patterns = [
            r'frame\s*#?\s*\d*',
            r'scene\s*:?\s*\d*',
            r'shot\s*#?\s*\d*',
            r'storyboard',
            r'description',
            r'text\s*box',
            r'caption',
            r'label',
            r'written',
            r'explained',
            r'annotated',
            r'panel',
            r'slide',
            r'script',
            r'title',
            r'heading',
            r'프레임',
            r'장면',
            r'설명',
            r'콘티',
            r'스토리보드'
        ]
        
        result = prompt
        for pattern in forbidden_patterns:
            result = re.sub(pattern, '', result, flags=re.IGNORECASE)
        
        # 연속된 공백과 쉼표 정리
        result = re.sub(r'\s+', ' ', result)
        result = re.sub(r',\s*,', ',', result)
        result = result.strip(' ,')
        
        return result