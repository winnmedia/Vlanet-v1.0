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
    OpenAI DALL-E 3를 사용한 이미지 생성 서비스 - 개선된 버전
    """
    
    def __init__(self):
        # API 키 설정
        settings_key = getattr(settings, 'OPENAI_API_KEY', None)
        env_key = os.environ.get('OPENAI_API_KEY')
        
        self.api_key = settings_key or env_key
        self.available = bool(self.api_key)
        
        if not self.available:
            logger.warning("❌ OPENAI_API_KEY not found.")
        else:
            logger.info(f"✅ DALL-E service initialized")
            try:
                self.client = OpenAI(api_key=self.api_key)
                self.available = True
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
                self.available = False
    
    def generate_storyboard_image(self, frame_data, style='minimal'):
        """
        스토리보드 이미지를 생성합니다.
        """
        if not self.available:
            return {
                "success": False,
                "error": "OPENAI_API_KEY not configured",
                "image_url": None
            }
        
        try:
            # 3가지 다른 접근법으로 프롬프트 생성
            prompts = self._create_multiple_prompts(frame_data, style)
            
            # 첫 번째 프롬프트로 시도
            for i, prompt in enumerate(prompts):
                logger.info(f"Attempt {i+1} with prompt: {prompt}")
                
                try:
                    response = self.client.images.generate(
                        model="dall-e-3",
                        prompt=prompt,
                        size="1792x1024",
                        quality="standard",
                        n=1,
                        style="vivid"
                    )
                    
                    image_url = response.data[0].url
                    
                    # 이미지 다운로드 및 base64 변환
                    image_response = requests.get(image_url, timeout=30)
                    if image_response.status_code == 200:
                        image_base64 = base64.b64encode(image_response.content).decode('utf-8')
                        return {
                            "success": True,
                            "image_url": f"data:image/png;base64,{image_base64}",
                            "prompt_used": prompt,
                            "model_used": "dall-e-3",
                            "attempt": i+1
                        }
                except Exception as e:
                    logger.warning(f"Attempt {i+1} failed: {e}")
                    continue
            
            raise Exception("All prompt attempts failed")
                
        except Exception as e:
            logger.error(f"DALL-E generation failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "image_url": None
            }
    
    def _create_multiple_prompts(self, frame_data, style='minimal'):
        """
        여러 스타일의 프롬프트를 생성합니다.
        """
        visual_desc = frame_data.get('visual_description', '')
        
        # 한국어를 영어로 변환
        eng_desc = self._translate_korean(visual_desc)
        
        # 3가지 다른 스타일의 프롬프트
        prompts = []
        
        # 1. 극도로 단순한 버전
        if style == 'minimal':
            prompts.append(f"minimalist pencil sketch: {eng_desc}")
        elif style == 'sketch':
            prompts.append(f"pencil drawing: {eng_desc}")
        elif style == 'realistic':
            prompts.append(f"photorealistic: {eng_desc}")
        else:
            prompts.append(f"{style}: {eng_desc}")
        
        # 2. 중간 디테일 버전
        composition = frame_data.get('composition', '')
        if composition:
            comp_eng = self._get_composition(composition)
            prompts.append(f"{prompts[0]}, {comp_eng}")
        
        # 3. 예술적 버전 (텍스트 언급 없이)
        artistic_prompt = self._create_artistic_prompt(eng_desc, style)
        prompts.append(artistic_prompt)
        
        return prompts
    
    def _translate_korean(self, text):
        """
        한국어를 자연스러운 영어로 변환
        """
        # 전체 구문 번역
        full_translations = {
            '카페에 들어가는 남자': 'man walking through café entrance',
            '회의실에서 프레젠테이션하는 여성': 'businesswoman giving presentation in meeting room',
            '공원에서 뛰어노는 아이들': 'children running and playing in sunny park',
            '사무실에서 일하는 사람들': 'people working at office desks',
            '거리를 걷는 사람': 'person walking down city street'
        }
        
        # 전체 매칭 먼저 시도
        if text in full_translations:
            return full_translations[text]
        
        # 부분 번역
        result = text
        translations = {
            '카페': 'café',
            '회의실': 'meeting room',
            '공원': 'park',
            '사무실': 'office',
            '거리': 'street',
            '남자': 'man',
            '여자': 'woman',
            '여성': 'woman',
            '아이들': 'children',
            '사람': 'person',
            '들어가는': 'entering',
            '프레젠테이션하는': 'presenting',
            '뛰어노는': 'playing',
            '걷는': 'walking',
            '일하는': 'working',
            '에서': ' in ',
            '에': ' at ',
            '을': '',
            '를': '',
            '는': '',
            '이': '',
            '가': ''
        }
        
        for kor, eng in translations.items():
            result = result.replace(kor, eng)
        
        return ' '.join(result.split())
    
    def _get_composition(self, korean_comp):
        """
        한국어 구도를 영어로 변환
        """
        compositions = {
            '와이드샷': 'wide shot',
            '미디엄샷': 'medium shot',
            '클로즈업': 'close up',
            '풀샷': 'full shot'
        }
        return compositions.get(korean_comp, '')
    
    def _create_artistic_prompt(self, description, style):
        """
        예술적인 프롬프트 생성 (텍스트 언급 완전 배제)
        """
        style_templates = {
            'minimal': f"simple line art showing {description}",
            'sketch': f"artistic pencil sketch of {description}",
            'realistic': f"photographic image of {description}",
            'watercolor': f"watercolor painting depicting {description}",
            'cinematic': f"movie still showing {description}"
        }
        
        return style_templates.get(style, f"illustration of {description}")
    
    def _remove_forbidden_words(self, prompt):
        """
        금지 단어 제거
        """
        # 금지 패턴들
        forbidden = [
            r'\bframe\b', r'\bscene\b', r'\bstoryboard\b',
            r'\btext\b', r'\bcaption\b', r'\blabel\b',
            r'\bpanel\b', r'\bdescription\b', r'#\d+'
        ]
        
        result = prompt
        for pattern in forbidden:
            result = re.sub(pattern, '', result, flags=re.IGNORECASE)
        
        # 정리
        result = ' '.join(result.split())
        return result