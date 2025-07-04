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
    
    def _create_storyboard_prompt(self, frame_data):
        """
        프레임 데이터를 바탕으로 DALL-E용 프롬프트를 생성합니다.
        배경, 인물(묘사), 인물(행동) 세 가지만 사용하여 미니멀하게 구성합니다.
        """
        visual_desc = frame_data.get('visual_description', '')
        
        # visual_description에서 배경, 인물 묘사, 인물 행동 추출
        background = ""
        character_desc = ""
        character_action = ""
        
        # 간단한 패턴 매칭으로 요소 추출
        if visual_desc:
            # 배경 키워드
            background_keywords = ['실내', '실외', '사무실', '거리', '집', '카페', '공원', '학교', '병원', '회의실', '방', '거실', '주방', '도로', '빌딩', '숲', '바다', '산', '하늘', '도시']
            # 인물 묘사 키워드
            character_keywords = ['남자', '여자', '아이', '노인', '청년', '중년', '소년', '소녀', '사람', '주인공', '인물']
            # 행동 키워드
            action_keywords = ['걷다', '앉다', '서다', '뛰다', '말하다', '듣다', '보다', '웃다', '울다', '생각하다', '쓰다', '읽다', '먹다', '마시다', '일하다', '놀다', '자다', '운전하다']
            
            # 각 요소 찾기
            for keyword in background_keywords:
                if keyword in visual_desc:
                    background = keyword
                    break
            
            for keyword in character_keywords:
                if keyword in visual_desc:
                    character_desc = keyword
                    break
                    
            for keyword in action_keywords:
                if keyword in visual_desc:
                    character_action = keyword
                    break
        
        # 한국어를 영어로 변환하는 매핑
        korean_to_english = {
            # 배경
            '실내': 'indoor',
            '실외': 'outdoor',
            '사무실': 'office',
            '거리': 'street',
            '집': 'house',
            '카페': 'cafe',
            '공원': 'park',
            '학교': 'school',
            '병원': 'hospital',
            '회의실': 'meeting room',
            '방': 'room',
            '거실': 'living room',
            '주방': 'kitchen',
            '도로': 'road',
            '빌딩': 'building',
            '숲': 'forest',
            '바다': 'ocean',
            '산': 'mountain',
            '하늘': 'sky',
            '도시': 'city',
            # 인물
            '남자': 'man',
            '여자': 'woman',
            '아이': 'child',
            '노인': 'elderly person',
            '청년': 'young adult',
            '중년': 'middle-aged person',
            '소년': 'boy',
            '소녀': 'girl',
            '사람': 'person',
            '주인공': 'main character',
            '인물': 'character',
            # 행동
            '걷다': 'walking',
            '앉다': 'sitting',
            '서다': 'standing',
            '뛰다': 'running',
            '말하다': 'talking',
            '듣다': 'listening',
            '보다': 'looking',
            '웃다': 'smiling',
            '울다': 'crying',
            '생각하다': 'thinking',
            '쓰다': 'writing',
            '읽다': 'reading',
            '먹다': 'eating',
            '마시다': 'drinking',
            '일하다': 'working',
            '놀다': 'playing',
            '자다': 'sleeping',
            '운전하다': 'driving'
        }
        
        # 영어로 변환
        background_en = korean_to_english.get(background, background) if background else ""
        character_en = korean_to_english.get(character_desc, character_desc) if character_desc else ""
        action_en = korean_to_english.get(character_action, character_action) if character_action else ""
        
        # 미니멀한 프롬프트 구성
        prompt_parts = []
        
        # 0. 텍스트 제외 명시
        prompt_parts.append("NO TEXT, NO LETTERS, NO WRITING")
        
        # 1. 핵심 요소만 포함 (배경, 인물, 행동)
        if background_en:
            prompt_parts.append(f"{background_en} setting")
        if character_en and action_en:
            prompt_parts.append(f"{character_en} {action_en}")
        elif character_en:
            prompt_parts.append(f"{character_en} present")
        elif action_en:
            prompt_parts.append(f"person {action_en}")
            
        # 2. 미니멀한 스타일 지정
        prompt_parts.append("minimalist illustration")
        prompt_parts.append("simple clean lines")
        prompt_parts.append("basic shapes")
        prompt_parts.append("monochrome sketch")
        prompt_parts.append("minimal details")
        
        # 최종 프롬프트 조합
        prompt = ", ".join(prompt_parts)
        
        logger.info(f"Generated minimal DALL-E prompt: {prompt}")
        return prompt