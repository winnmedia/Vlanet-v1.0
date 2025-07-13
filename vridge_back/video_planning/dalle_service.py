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
        self.client = None
        
        if not self.api_key:
            logger.warning("❌ OPENAI_API_KEY not found. DALL-E image generation will not be available.")
            logger.warning("  - Railway에서 환경변수를 설정했는지 확인하세요")
            logger.warning("  - 설정 후 재배포가 필요합니다")
            self.available = False
        else:
            logger.info(f"✅ API Key found: {self.api_key[:10]}...")
            try:
                # OpenAI 클라이언트 초기화 - 여러 방법 시도
                try:
                    # 방법 1: 직접 API 키 전달
                    self.client = OpenAI(api_key=self.api_key)
                    logger.info("✅ Method 1: OpenAI client initialized with direct API key")
                except Exception as e1:
                    logger.warning(f"❌ Method 1 failed (proxy issue?): {e1}")
                    
                    try:
                        # 방법 2: 환경변수 설정 후 초기화 (프록시 이슈 회피)
                        os.environ['OPENAI_API_KEY'] = self.api_key
                        # 프록시 관련 환경변수 제거
                        for proxy_var in ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']:
                            if proxy_var in os.environ:
                                logger.info(f"Removing proxy env var: {proxy_var}")
                                del os.environ[proxy_var]
                        
                        self.client = OpenAI()
                        logger.info("✅ Method 2: OpenAI client initialized via environment variable")
                    except Exception as e2:
                        logger.error(f"❌ Method 2 failed: {e2}")
                        
                        try:
                            # 방법 3: 최소한의 설정으로 초기화
                            import httpx
                            self.client = OpenAI(
                                api_key=self.api_key,
                                http_client=httpx.Client()
                            )
                            logger.info("✅ Method 3: OpenAI client initialized with custom HTTP client")
                        except Exception as e3:
                            logger.error(f"❌ Method 3 failed: {e3}")
                            raise e3
                
                # 클라이언트가 성공적으로 초기화되면 사용 가능으로 설정
                if self.client:
                    self.available = True
                    logger.info("✅ DALL-E service ready for image generation")
                else:
                    self.available = False
                
            except Exception as e:
                logger.error(f"❌ Failed to initialize OpenAI client: {e}")
                self.available = False
                self.client = None
    
    def generate_storyboard_image(self, frame_data, style='minimal', draft_mode=True):
        """
        스토리보드 프레임 설명을 바탕으로 이미지를 생성합니다.
        
        Args:
            frame_data: 프레임 정보
            style: 이미지 스타일 ('minimal', 'realistic', 'sketch', 'cartoon', 'cinematic')
            draft_mode: True일 경우 저품질 스케치 모드로 생성 (비용 절감)
        """
        # API 키와 클라이언트가 있으면 available 상태와 관계없이 시도
        if not self.api_key:
            return {
                "success": False,
                "error": "OPENAI_API_KEY가 설정되지 않았습니다.",
                "image_url": None
            }
        
        if not self.client:
            # 클라이언트 재초기화 시도
            try:
                logger.info("Attempting to reinitialize OpenAI client...")
                self.client = OpenAI(api_key=self.api_key)
                logger.info("✅ OpenAI client reinitialized successfully")
            except Exception as e:
                logger.error(f"❌ Failed to reinitialize client: {e}")
                return {
                    "success": False,
                    "error": f"OpenAI 클라이언트 초기화 실패: {str(e)}",
                    "image_url": None
                }
        
        try:
            # draft 모드일 경우 스케치 스타일 강제
            if draft_mode:
                style = 'sketch'
            
            prompt = self._create_visual_prompt(frame_data, style, draft_mode=draft_mode)
            
            logger.info(f"Generating image with DALL-E 3 (draft_mode={draft_mode}), prompt: {prompt[:100]}...")
            
            # OpenAI 1.3.7 버전에서는 client를 통해서만 이미지 생성 가능
            if not hasattr(self, 'client') or self.client is None:
                # 클라이언트 재초기화 시도
                try:
                    from openai import OpenAI
                    self.client = OpenAI(api_key=self.api_key)
                except Exception as e:
                    logger.error(f"Failed to reinitialize client: {e}")
                    raise Exception("OpenAI 클라이언트 초기화 실패")
            
            # draft_mode에 따라 설정 변경
            if draft_mode:
                # 비용 절감을 위한 draft 모드 설정
                image_size = "1024x1024"    # 정사각형 (더 작은 크기)
                image_quality = "standard"   # 표준 품질
                image_style = "natural"      # 자연스러운 스타일 (덜 정교함)
            else:
                # 고품질 모드 설정
                image_size = "1792x1024"    # 16:9 화면비
                image_quality = "hd"         # HD 품질
                image_style = "vivid"        # 더 예술적이고 생동감 있는 스타일
            
            # DALL-E 3 API 호출
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size=image_size,
                quality=image_quality,
                n=1,
                style=image_style
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
    
    def _create_visual_prompt(self, frame_data, style='minimal', draft_mode=False):
        """
        프레임 데이터를 바탕으로 DALL-E 3에 최적화된 시각적 프롬프트를 생성합니다.
        
        Args:
            frame_data: 프레임 정보
            style: 이미지 스타일
            draft_mode: True일 경우 스케치 스타일 프롬프트 생성
        """
        visual_desc = frame_data.get('visual_description', '')
        
        # visual_description이 이미 영어로 된 경우 그대로 사용
        if self._is_english(visual_desc):
            # 이미 영어로 잘 작성된 경우
            base_prompt = visual_desc
        else:
            # 한국어인 경우 번역
            base_prompt = self._translate_korean_to_english(visual_desc)
        
        # 구도 정보 추가 (있는 경우)
        composition = frame_data.get('composition', '')
        if composition and not any(term in base_prompt.lower() for term in ['wide shot', 'close-up', 'medium shot']):
            # 한국어 구도를 영어로 변환
            comp_map = {
                '와이드샷': 'wide shot',
                '클로즈업': 'close-up',
                '미디엄샷': 'medium shot',
                '풀샷': 'full shot',
                '오버숄더': 'over-the-shoulder shot'
            }
            for kr, en in comp_map.items():
                if kr in composition:
                    base_prompt = f"{en} of {base_prompt}"
                    break
        
        # 스타일 적용
        if draft_mode:
            # draft 모드에서는 간단한 스케치 스타일
            style_prompts = {
                'sketch': 'simple rough pencil sketch, quick draft drawing',
                'minimal': 'very simple line drawing, minimal details',
                'default': 'rough sketch, draft storyboard'
            }
        else:
            # 일반 모드에서는 정교한 스타일
            style_prompts = {
                'minimal': 'minimalist pencil sketch',
                'sketch': 'detailed pencil sketch',
                'realistic': 'photorealistic',
                'watercolor': 'watercolor painting',
                'cinematic': 'cinematic dramatic lighting',
                'black-and-white': 'black and white photograph',
                'oil-painting': 'oil painting',
                'digital-art': 'digital art illustration'
            }
        
        style_prefix = style_prompts.get(style, style_prompts.get('default', 'cinematic'))
        prompt = f"{style_prefix}, {base_prompt}"
        
        # 추가 디테일 (조명 정보가 있으면 추가)
        lighting = frame_data.get('lighting', '')
        if lighting and '조명' not in prompt:
            lighting_trans = self._translate_lighting(lighting)
            if lighting_trans and lighting_trans != lighting:
                prompt += f", {lighting_trans}"
        
        # 텍스트 방지 강화
        prompt += ", no text, no words, no letters, without any text"
        
        # 금지 단어 최종 제거
        prompt = self._remove_forbidden_words(prompt)
        
        # 프롬프트 정리
        prompt = ' '.join(prompt.split())
        
        logger.info(f"Final DALL-E prompt: {prompt}")
        return prompt
    
    def _is_english(self, text):
        """텍스트가 주로 영어인지 확인"""
        # 알파벳 비율 확인
        if not text:
            return False
        alpha_count = sum(1 for c in text if c.isalpha() and ord(c) < 128)
        total_alpha = sum(1 for c in text if c.isalpha())
        return total_alpha > 0 and alpha_count / total_alpha > 0.8
    
    def _translate_korean_to_english(self, text):
        """
        한국어 텍스트를 영어로 간단히 변환합니다.
        """
        # 먼저 텍스트 트리거 패턴 제거
        text = self._clean_text_triggers(text)
        
        # 문장이 대부분 한국어인 경우 기본 영어 설명으로 대체
        korean_char_count = sum(1 for char in text if '\uac00' <= char <= '\ud7a3')
        total_char_count = len(text.replace(' ', ''))
        
        if total_char_count > 0 and korean_char_count / total_char_count > 0.5:
            # 한국어가 50% 이상인 경우 기본 장면 설명으로 대체
            logger.info(f"Korean text detected ({korean_char_count}/{total_char_count}), using enhanced scene description")
            logger.info(f"Original Korean text: {text}")
            
            # 키워드 기반 풍부한 장면 설명 생성
            result = None
            
            # 신당/무당 관련 장면
            if '신당' in text or '무당' in text or '무속' in text:
                if '손' in text and '잡' in text:
                    result = "elderly female shaman in colorful traditional Korean dress holding hands with worried middle-aged woman client, sitting on floor cushions in dimly lit shrine room filled with hanging paper talismans and burning incense"
                elif '앉' in text:
                    result = "shaman in vibrant hanbok and client sitting face to face on traditional floor cushions in mystical shrine interior, candlelight flickering on walls covered with spiritual paintings and talismans"
                elif '촛불' in text or '향' in text:
                    result = "atmospheric shaman shrine interior with burning incense creating smoke patterns, multiple candles casting warm light on wooden walls decorated with colorful spiritual paintings and paper charms"
                else:
                    result = "traditional Korean shaman shrine interior with elderly female shaman in ceremonial dress, wooden walls covered in talismans, altar with offerings, incense smoke drifting through dim candlelit space"
            
            # 카페 관련 장면
            elif '카페' in text:
                if '들어가' in text or '입구' in text:
                    result = "man in casual business attire pushing glass door to enter modern coffee shop, warm interior lights visible through windows, other customers visible inside"
                elif '앉' in text:
                    result = "people sitting at wooden table in cozy coffee shop, laptops open, coffee cups steaming, large windows showing street view, warm ambient lighting"
                else:
                    result = "bustling modern coffee shop interior with customers at various tables, barista behind counter, exposed brick walls, industrial lighting, plants by windows"
            
            # 회의실 관련 장면
            elif '회의' in text:
                if '프레젠테이션' in text:
                    result = "professional woman in business suit presenting to seated colleagues in modern conference room, projector screen showing charts, city view through floor-to-ceiling windows"
                else:
                    result = "group of business professionals around polished conference table in modern meeting room, laptops open, large monitor on wall, minimalist decor"
            
            # 공원 관련 장면
            elif '공원' in text:
                if '아이' in text or '어린이' in text:
                    result = "children playing on colorful playground equipment in sunny park, parents watching from benches, trees providing shade, blue sky with fluffy clouds"
                else:
                    result = "peaceful urban park with walking paths, green grass, mature trees, people strolling, benches along pathways, city buildings visible in distance"
            
            # 사무실 관련 장면
            elif '사무실' in text:
                result = "modern open office space with rows of desks, computer monitors, employees working, glass partition walls, fluorescent lighting, potted plants"
            
            # 클로즈업 장면
            elif '손' in text and ('잡' in text or '클로즈업' in text):
                result = "extreme close-up of two people's hands clasped together showing emotional connection, soft natural lighting, blurred background"
            elif '얼굴' in text or '표정' in text:
                if '진지' in text:
                    result = "close-up portrait of person with serious thoughtful expression, eyes focused, natural window light on face, shallow depth of field"
                else:
                    result = "close-up of person's face showing genuine emotion, natural lighting, detailed facial features visible, blurred background"
            elif '클로즈업' in text:
                result = "detailed close-up shot showing texture and detail, shallow depth of field, professional lighting"
            elif '와이드' in text:
                result = "expansive wide shot showing full interior space with architectural details, people as small figures in larger environment"
            else:
                # 기본 실내 장면 (더 구체적으로)
                result = "well-lit interior space with people engaged in activity, modern furnishings, natural light from windows, comfortable atmosphere"
            
            logger.info(f"Enhanced Korean to English result: {result}")
            return result
        
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
            ('신당', 'shaman shrine'),
            ('무당집', 'shaman house'),
            ('와드', 'ward'),
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
            ('창', 'window'),
            ('문', 'door'),
            ('벽', 'wall'),
            ('바닥', 'floor'),
            ('천장', 'ceiling'),
            
            # 인물
            ('소영', 'young woman'),
            ('김부자', 'middle aged woman'),
            ('백눈', 'white cat'),
            ('무당', 'shaman'),
            ('아이들', 'children'),
            ('남자', 'man'),
            ('여자', 'woman'),
            ('여성', 'woman'),
            ('남성', 'man'),
            ('아이', 'child'),
            ('사람', 'person'),
            ('사람들', 'people'),
            ('손님', 'client'),
            ('고객', 'customer'),
            
            # 동작
            ('앉아있고', 'sitting'),
            ('앉아있다', 'sitting'),
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
            ('잡고', 'holding'),
            ('잡는', 'holding'),
            ('비추', 'shining'),
            ('걸려있다', 'hanging'),
            ('귀 기울고', 'listening'),
            
            # 기타 표현
            ('내부', 'interior'),
            ('햇살', 'sunlight'),
            ('근처', 'near'),
            ('앞', 'front'),
            ('옆', 'beside'),
            ('조용히', 'quietly'),
            ('정갈하고', 'neat'),
            ('아늑한', 'cozy'),
            ('분위기', 'atmosphere'),
            ('부적', 'talisman'),
            ('그림', 'painting'),
            ('표정', 'expression'),
            ('진지하고', 'serious'),
            ('온화하다', 'gentle'),
            ('클로즈업', 'close up'),
            
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