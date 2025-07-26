import os
import json
import google.generativeai as genai
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# 이미지 생성 서비스 import
try:
    from .dalle_service import DalleService
    IMAGE_SERVICE_AVAILABLE = True
except ImportError:
    logger.warning("DALL-E service not available")
    DalleService = None
    IMAGE_SERVICE_AVAILABLE = False

# 플레이스홀더 이미지 서비스
try:
    from .placeholder_image_service import PlaceholderImageService
    PLACEHOLDER_SERVICE_AVAILABLE = True
except ImportError:
    logger.warning("Placeholder image service not available")
    PlaceholderImageService = None
    PLACEHOLDER_SERVICE_AVAILABLE = False


class GeminiService:
    def __init__(self):
        api_key = getattr(settings, 'GOOGLE_API_KEY', None) or os.environ.get('GOOGLE_API_KEY')
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in settings or environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        
        # 이미지 생성 서비스 초기화 (선택적)
        self.image_service_available = False
        self.image_service = None
        self.placeholder_service = None
        self.style = 'minimal'  # 기본 스타일
        self.draft_mode = True  # 기본적으로 draft 모드 사용
        
        logger.info(f"IMAGE_SERVICE_AVAILABLE: {IMAGE_SERVICE_AVAILABLE}")
        logger.info(f"PLACEHOLDER_SERVICE_AVAILABLE: {PLACEHOLDER_SERVICE_AVAILABLE}")
        
        # 먼저 DALL-E 시도
        if IMAGE_SERVICE_AVAILABLE and DalleService:
            try:
                self.image_service = DalleService()
                self.image_service_available = self.image_service.available
                logger.info(f"Image service available: {self.image_service_available}")
                if self.image_service_available:
                    logger.info("DALL-E service initialized successfully")
                else:
                    logger.warning("DALL-E service initialized but API key not found")
            except Exception as e:
                logger.error(f"Image service initialization failed: {e}", exc_info=True)
                self.image_service_available = False
        
        # 플레이스홀더 서비스 초기화
        if PLACEHOLDER_SERVICE_AVAILABLE and PlaceholderImageService:
            try:
                self.placeholder_service = PlaceholderImageService()
                logger.info("Placeholder image service initialized as fallback")
            except Exception as e:
                logger.error(f"Placeholder service initialization failed: {e}")
                self.placeholder_service = None
    
    def generate_structure(self, planning_input):
        prompt = f"""
        당신은 전문 영상 기획자입니다. 아래 기획안을 바탕으로 체계적인 영상 구성안을 작성해주세요.

        기획안:
        {planning_input}

        다음 형식의 JSON으로 응답해주세요:
        {{
            "title": "영상 제목",
            "sections": [
                {{
                    "title": "섹션 제목",
                    "content": "섹션 내용 설명",
                    "duration": "예상 시간"
                }}
            ],
            "total_duration": "전체 예상 시간",
            "target_audience": "타겟 오디언스",
            "key_message": "핵심 메시지"
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            return json.loads(response_text)
        except Exception as e:
            return {
                "error": str(e),
                "fallback": {
                    "title": "기본 구성안",
                    "sections": [
                        {
                            "title": "도입부",
                            "content": "시청자의 관심을 끄는 오프닝",
                            "duration": "10초"
                        },
                        {
                            "title": "본론",
                            "content": "핵심 메시지 전달",
                            "duration": "1분 30초"
                        },
                        {
                            "title": "결론",
                            "content": "행동 유도 및 마무리",
                            "duration": "20초"
                        }
                    ],
                    "total_duration": "2분",
                    "target_audience": "일반 시청자",
                    "key_message": "기획안에 기반한 메시지"
                }
            }
    
    def _get_framework_structure(self, framework):
        """선택된 프레임워크에 따른 스토리 구조 반환"""
        structures = {
            'classic': """1. 기(起) - 설정 [전체의 10-20%]
           - 주인공과 배경 소개
           - 초기 상황 설정
           - 이야기의 분위기 조성
        
        2. 승(承) - 촉발 사건과 상승 [전체의 20-40%]
           - 갈등이나 문제 상황 도입
           - 사건의 전개와 복잡화
           - 긴장감 상승
        
        3. 전(轉) - 절정과 위기 [전체의 40-30%]
           - 클라이맥스 도달
           - 극적인 전환점
           - 최고조의 긴장감
        
        4. 결(結) - 해결과 새로운 균형 [전체의 30-10%]
           - 갈등의 해결
           - 새로운 상태로의 안착
           - 여운이나 메시지 전달""",
           
            'hook_immersion': """1. 훅(Hook) - 강렬한 도입부 [전체의 5-10%]
           - 시선을 사로잡는 충격적/흥미로운 시작
           - 궁금증 유발하는 질문이나 상황
           - 즉각적인 관심 유도
        
        2. 몰입(Immersion) - 깊이 있는 전개 [전체의 40-50%]
           - 이야기에 빠져들게 하는 디테일
           - 캐릭터와 상황에 대한 공감대 형성
           - 점진적인 긴장감 상승
        
        3. 반전(Twist) - 예상치 못한 전환 [전체의 30-35%]
           - 관객의 예상을 뒤엎는 전개
           - 새로운 관점이나 숨겨진 진실 공개
           - 극적인 감정 변화
        
        4. 떡밥(Cliffhanger) - 여운과 궁금증 [전체의 10-15%]
           - 다음 이야기에 대한 암시
           - 미해결 요소나 새로운 질문
           - 강렬한 여운 남기기""",
           
            'pixar': """1. 옛날에(Once upon a time) - 세계관과 일상 [전체의 15-20%]
           - 주인공이 사는 세계 소개
           - 평범한 일상의 모습
           - 캐릭터의 특징과 욕구
        
        2. 매일(Every day) - 반복되는 패턴 [전체의 20-25%]
           - 주인공의 일상적인 생활
           - 반복되는 행동이나 습관
           - 안정적이지만 불완전한 상태
        
        3. 어느날(Until one day) - 변화의 계기 [전체의 35-40%]
           - 일상을 깨뜨리는 사건 발생
           - 주인공의 선택과 도전
           - 예상치 못한 결과와 갈등
        
        4. 그래서/결국(Because of that/Finally) - 결과와 교훈 [전체의 20-25%]
           - 변화로 인한 연쇄 반응
           - 주인공의 성장과 깨달음
           - 새로운 균형점 도달""",
           
            'save_the_cat': """1. 오프닝 이미지 & 테마 제시 [전체의 10-15%]
           - 시각적으로 강렬한 첫 장면
           - 이야기의 핵심 테마 암시
           - 주인공의 현재 상태 보여주기
        
        2. 촉매제 & 논쟁 [전체의 25-30%]
           - 일상을 깨뜨리는 사건(촉매제)
           - 주인공의 내적 갈등과 고민
           - 변화에 대한 저항과 수용
        
        3. 2막 전환 & Fun and Games [전체의 40-45%]
           - 새로운 세계로의 진입
           - 장르의 재미 요소 집중 배치
           - 주인공의 도전과 성장
        
        4. 클라이맥스 & 최종 이미지 [전체의 15-20%]
           - 모든 갈등의 정점
           - 주인공의 최종 선택
           - 변화된 모습과 새로운 시작""",
           
            'star_moment': """1. 빌드업(Build-up) - 기대감 조성 [전체의 25-30%]
           - 평범한 시작에서 점진적 상승
           - 긴장감과 기대감 축적
           - 결정적 순간을 위한 복선
        
        2. 결정적 순간(Star Moment) - 클라이맥스 [전체의 20-25%]
           - 모든 것이 집중되는 한 순간
           - 극적인 선택이나 행동
           - 감정의 최고조
        
        3. 반전/깨달음(Revelation) - 의미의 전환 [전체의 30-35%]
           - 순간의 진정한 의미 드러남
           - 예상과 다른 결과나 해석
           - 새로운 관점의 제시
        
        4. 새로운 시작(New Beginning) - 변화된 미래 [전체의 15-20%]
           - 결정적 순간이 가져온 변화
           - 주인공의 새로운 모습
           - 미래에 대한 암시"""
        }
        
        return structures.get(framework, structures['classic'])
    
    def generate_insert_shots(self, scene_data, planning_options=None):
        """씬 데이터를 기반으로 인서트 샷을 추천합니다."""
        prompt = f"""
        당신은 전문 영상 촬영 감독입니다. 다음 씬의 내용을 보고, 이 씬에서 확보할 수 있는 인서트 샷 5가지를 추천해주세요.
        
        인서트 샷이란 주요 장면 사이에 삽입되어 이야기의 흐름을 돕고, 감정을 강조하거나 정보를 제공하는 짧은 컷입니다.
        
        씬 정보:
        - 장소: {scene_data.get('location', '')}
        - 시간: {scene_data.get('time', '') or scene_data.get('time_of_day', '')}
        - 설명: {scene_data.get('description', '') or scene_data.get('action', '')}
        - 등장인물: {', '.join(scene_data.get('characters', []))}
        - 분위기: {scene_data.get('mood', '')}
        - 대사: {scene_data.get('dialogue', '')}
        
        인서트 샷 추천 기준:
        1. 감정 강조: 인물의 표정, 손동작, 발걸음 등 디테일
        2. 환경 묘사: 장소의 특징적인 요소, 시간대를 나타내는 요소
        3. 소품/오브젝트: 이야기와 연관된 의미있는 사물
        4. 분위기 조성: 빛, 그림자, 질감 등 시각적 요소
        5. 시간 경과: 시계, 태양, 그림자 변화 등
        
        매우 구체적이고 실제 촬영 가능한 인서트 샷 5개를 추천해주세요.
        추상적인 표현을 피하고, 카메라맨이 바로 이해할 수 있는 구체적인 샷을 설명하세요.
        
        예시:
        - 나쁜 예: "감정 표현"
        - 좋은 예: "주인공이 창문에 비친 자신의 모습을 바라보는 클로즈업"
        
        JSON 형식으로 응답해주세요:
        {{
            "insert_shots": [
                "첫 번째 인서트 샷 설명",
                "두 번째 인서트 샷 설명",
                "세 번째 인서트 샷 설명",
                "네 번째 인서트 샷 설명",
                "다섯 번째 인서트 샷 설명"
            ]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            result = json.loads(response_text)
            return result.get('insert_shots', [])
            
        except Exception as e:
            logger.error(f"Error generating insert shots: {e}")
            # 에러 발생 시 기본 인서트 샷 제공
            location = scene_data.get('location', '장소')
            return [
                f"{location}의 입구나 상징적인 부분을 천천히 패닝하는 와이드 샷",
                "주인공의 손이 무언가를 만지거나 집는 순간의 익스트림 클로즈업",
                f"{location}에서 빛이 들어오는 창문이나 문틈의 클로즈업 샷",
                "주인공의 발걸음이나 그림자가 바닥에 드리워지는 로우앵글 샷",
                "씬의 핵심 소품이나 오브젝트를 포커스 랙으로 강조하는 샷"
            ]
    
    def _get_framework_json_template(self, framework):
        """프레임워크별 JSON 템플릿 반환"""
        templates = {
            'classic': '''{{
            "stories": [
                {{
                    "title": "제목",
                    "stage": "기",
                    "stage_name": "도입부",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "핵심 내용",
                    "summary": "스토리 요약"
                }},
                {{
                    "title": "제목",
                    "stage": "승",
                    "stage_name": "전개부",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "핵심 내용",
                    "summary": "스토리 요약"
                }},
                {{
                    "title": "제목",
                    "stage": "전",
                    "stage_name": "전환부",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "핵심 내용",
                    "summary": "스토리 요약"
                }},
                {{
                    "title": "제목",
                    "stage": "결",
                    "stage_name": "결말부",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "핵심 내용",
                    "summary": "스토리 요약"
                }}
            ]
        }}''',
            
            'hook_immersion': '''{{
            "stories": [
                {{
                    "title": "제목",
                    "stage": "훅",
                    "stage_name": "강렬한 도입부",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "시선을 사로잡는 순간",
                    "summary": "스토리 요약"
                }},
                {{
                    "title": "제목",
                    "stage": "몰입",
                    "stage_name": "깊이 있는 전개",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "몰입감 있는 전개",
                    "summary": "스토리 요약"
                }},
                {{
                    "title": "제목",
                    "stage": "반전",
                    "stage_name": "예상치 못한 전환",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "충격적인 반전",
                    "summary": "스토리 요약"
                }},
                {{
                    "title": "제목",
                    "stage": "떡밥",
                    "stage_name": "여운과 궁금증",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "다음 이야기 암시",
                    "summary": "스토리 요약"
                }}
            ]
        }}''',
            
            'pixar': '''{{
            "stories": [
                {{
                    "title": "제목",
                    "stage": "옛날에",
                    "stage_name": "세계관과 일상",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "평범한 일상",
                    "summary": "스토리 요약"
                }},
                {{
                    "title": "제목",
                    "stage": "매일",
                    "stage_name": "반복되는 패턴",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "일상의 반복",
                    "summary": "스토리 요약"
                }},
                {{
                    "title": "제목",
                    "stage": "어느날",
                    "stage_name": "변화의 계기",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "변화의 시작",
                    "summary": "스토리 요약"
                }},
                {{
                    "title": "제목",
                    "stage": "결국",
                    "stage_name": "결과와 교훈",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "새로운 깨달음",
                    "summary": "스토리 요약"
                }}
            ]
        }}''',
            
            'save_the_cat': '''{{
            "stories": [
                {{
                    "title": "제목",
                    "stage": "오프닝",
                    "stage_name": "오프닝 이미지 & 테마",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "첫 인상과 테마",
                    "summary": "스토리 요약"
                }},
                {{
                    "title": "제목",
                    "stage": "촉매제",
                    "stage_name": "촉매제 & 논쟁",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "변화의 시작점",
                    "summary": "스토리 요약"
                }},
                {{
                    "title": "제목",
                    "stage": "2막전환",
                    "stage_name": "2막 전환 & Fun and Games",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "본격적인 모험",
                    "summary": "스토리 요약"
                }},
                {{
                    "title": "제목",
                    "stage": "클라이맥스",
                    "stage_name": "클라이맥스 & 최종 이미지",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "최종 대결과 변화",
                    "summary": "스토리 요약"
                }}
            ]
        }}''',
            
            'star_moment': '''{{
            "stories": [
                {{
                    "title": "제목",
                    "stage": "빌드업",
                    "stage_name": "기대감 조성",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "긴장감 축적",
                    "summary": "스토리 요약"
                }},
                {{
                    "title": "제목",
                    "stage": "결정적순간",
                    "stage_name": "스타 모멘트",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "클라이맥스 순간",
                    "summary": "스토리 요약"
                }},
                {{
                    "title": "제목",
                    "stage": "반전",
                    "stage_name": "의미의 전환",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "진정한 의미 발견",
                    "summary": "스토리 요약"
                }},
                {{
                    "title": "제목",
                    "stage": "새시작",
                    "stage_name": "변화된 미래",
                    "characters": ["등장인물1", "등장인물2"],
                    "key_content": "새로운 시작",
                    "summary": "스토리 요약"
                }}
            ]
        }}'''
        }
        
        return templates.get(framework, templates['classic'])
    
    def generate_story(self, structure_data):
        prompt = f"""
        당신은 전문 스토리텔러입니다. 아래 구성안을 바탕으로 영상 스토리를 작성해주세요.

        구성안:
        {json.dumps(structure_data, ensure_ascii=False, indent=2)}

        다음 형식의 JSON으로 응답해주세요:
        {{
            "story": "전체 스토리 내용 (내레이션 포함)",
            "genre": "장르",
            "tone": "톤앤매너",
            "key_message": "핵심 메시지",
            "emotional_arc": "감정선 변화"
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            return json.loads(response_text)
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "quota" in error_msg.lower():
                return {
                    "error": "Gemini API 일일 무료 할당량을 초과했습니다. 내일 다시 시도해주세요.",
                    "error_type": "quota_exceeded",
                    "fallback": {
                        "story": "구성안을 바탕으로 한 기본 스토리입니다.",
                        "genre": "정보/교육",
                        "tone": "친근하고 전문적인",
                        "key_message": structure_data.get('key_message', '핵심 메시지'),
                        "emotional_arc": "관심 유발 → 정보 전달 → 감동 → 행동 유도"
                    }
                }
            return {
                "error": error_msg,
                "fallback": {
                    "story": "구성안을 바탕으로 한 기본 스토리입니다.",
                    "genre": "정보/교육",
                    "tone": "친근하고 전문적인",
                    "key_message": structure_data.get('key_message', '핵심 메시지'),
                    "emotional_arc": "관심 유발 → 정보 전달 → 감동 → 행동 유도"
                }
            }
    
    def generate_stories_from_planning(self, planning_text, context=None):
        # 컨텍스트 기본값 설정
        if context is None:
            context = {}
        
        tone = context.get('tone', '')
        genre = context.get('genre', '')
        concept = context.get('concept', '')
        target = context.get('target', '')
        purpose = context.get('purpose', '')
        duration = context.get('duration', '')
        story_framework = context.get('story_framework', 'classic')
        development_level = context.get('development_level', 'balanced')
        character_name = context.get('character_name', '')
        character_description = context.get('character_description', '')
        character_image = context.get('character_image', '')
        
        # 스토리 프레임워크별 구성
        framework_guides = {
            'classic': "기승전결의 전통적인 4단계 구성 - 기(도입), 승(전개), 전(전환), 결(결말)",
            'hook_immersion': "훅-몰입-반전-떡밥 구조 - 인트로 훅으로 시선 사로잡기, 깊은 몰입감 유도, 예상치 못한 반전, 다음 이야기 떡밥",
            'pixar': "픽사 스토리텔링 - 옛날에(설정), 매일(일상), 어느날(변화), 그래서(결과), 결국(교훈)",
            'save_the_cat': "Save the Cat 3막 구조 - 오프닝 이미지, 테마 제시, 촉매제, 논쟁, 2막 전환",
            'star_moment': "스타 모멘트 - 빌드업(긴장감 조성), 결정적 순간(클라이맥스), 반전/깨달음, 새로운 시작",
            'hero': "히어로의 여정 - 평범한 세계, 모험의 소명, 시련, 보상",
            'problem': "문제-해결 구조 - 문제 인식, 원인 분석, 해결책 제시, 결과",
            'emotional': "감정 곡선 - 평온, 긴장, 절정, 해소"
        }
        
        # 디벨롭 레벨별 가이드
        development_guides = {
            'minimal': "간결하고 핵심만 담은 스토리",
            'light': "적당한 디테일의 가벼운 스토리",
            'balanced': "균형잡힌 전개와 적절한 세부사항",
            'detailed': "풍부한 묘사와 상세한 전개"
        }
        
        prompt = f"""
        당신은 전문 영상 스토리 작가입니다. 다음 기획안을 기반으로 스토리를 작성해주세요.
        
        [스토리 작성 지침]
        아래 메타데이터는 스토리의 방향성과 분위기를 가이드하는 참고 정보입니다.
        이 정보들을 스토리에 직접적으로 언급하거나 명시하지 마세요.
        
        작성 참고 정보:
        - 타겟 오디언스: {target if target else '일반 시청자'} (이 관객층이 공감할 수 있는 상황과 정서 활용)
        - 장르: {genre if genre else '일반'} (장르의 관습적 요소를 자연스럽게 활용)
        - 톤앤매너: {tone if tone else '중립적'} (전체적인 분위기와 표현 방식에 반영)
        - 콘셉트: {concept if concept else '기본'} (스토리의 핵심 아이디어로 활용)
        - 영상 목적: {purpose if purpose else '정보 전달'} (최종 목표를 염두에 둔 스토리 구성)
        - 영상 길이: {duration if duration else '3-5분'} (적절한 속도와 밀도로 전개)
        - 스토리 프레임워크: {framework_guides.get(story_framework, framework_guides['classic'])}
        - 전개 강도: {development_guides.get(development_level, development_guides['balanced'])}
        {f'''- 주인공 이름: {character_name}
        - 주인공 설정: {character_description}''' if character_name or character_description else ''}
        
        ⚠️ 중요 원칙:
        - 위 정보들을 스토리 텍스트에 직접 언급하지 마세요 (예: "10대를 위한", "로맨스 장르의" 등)
        - 메타데이터는 암시적으로만 반영하세요
        - 스토리는 자연스럽고 유기적으로 전개되어야 합니다
        - 설정값들은 스토리의 뼈대와 분위기를 형성하는 데만 사용하세요
        {f'- 주인공 "{character_name}"은 자연스럽게 등장시키되, 설정을 설명하지 말고 행동으로 보여주세요' if character_name else ''}
        
        스토리 작성 예시:
        - 잘못된 예: "이것은 10대를 위한 로맨스 이야기입니다"
        - 올바른 예: 자연스럽게 학교를 배경으로 하고, 주인공들이 10대의 정서를 가진 것으로 묘사
        
        - 잘못된 예: "유머러스한 톤으로 진행되는..."
        - 올바른 예: 대사와 상황 자체가 자연스럽게 유머를 담고 있음
        
        4개 파트 구성 (선택된 프레임워크: {story_framework}):
        {self._get_framework_structure(story_framework)}
        
        각 파트는 다음 정보를 포함해야 합니다:
        - 파트 제목 (그 파트의 핵심을 나타내는 제목)
        - 스토리 단계 (프레임워크에 맞는 단계명)
        - 주요 등장인물
        - 핵심 사건/행동
        - 감정적 분위기
        - 파트 요약 (2-3문장)
        
        주의사항:
        - 메타데이터(타겟, 장르, 톤 등)를 텍스트에 직접 언급하지 마세요
        - 스토리는 자연스럽게 흘러가야 합니다
        - 각 파트는 유기적으로 연결되어야 합니다
        - 인물의 행동과 대화로 성격과 상황을 보여주세요
        - 설명보다는 묘사와 행동으로 표현하세요
        
        기획안:
        {planning_text}
        
        다음 형식의 JSON으로 응답해주세요:
        {self._get_framework_json_template(story_framework)}
        
        반드시 정확히 4개의 스토리를 생성하세요.
        """
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            return json.loads(response_text)
        except Exception as e:
            return {
                "error": str(e),
                "fallback": {
                    "stories": [
                        {
                            "title": "새로운 시작",
                            "stage": "기",
                            "stage_name": "도입부",
                            "characters": ["주인공", "조력자"],
                            "key_content": "평범한 일상에서 특별한 기회를 발견하는 순간",
                            "summary": "주인공이 일상적인 삶을 살다가 새로운 가능성을 발견하게 되는 이야기의 시작. 등장인물 소개와 배경 설정.",
                            "message": "변화의 시작점"
                        },
                        {
                            "title": "도전의 길",
                            "stage": "승",
                            "stage_name": "전개부",
                            "characters": ["주인공", "조력자", "경쟁자"],
                            "key_content": "목표를 향해 나아가며 겪는 시행착오와 성장",
                            "summary": "주인공이 목표를 설정하고 본격적으로 도전하는 과정. 다양한 장애물을 만나며 성장하는 모습을 보여줌.",
                            "message": "성장의 과정"
                        },
                        {
                            "title": "위기의 순간",
                            "stage": "전",
                            "stage_name": "전환부",
                            "characters": ["주인공", "조력자", "대립자"],
                            "key_content": "예상치 못한 위기와 갈등이 최고조에 달하는 순간",
                            "summary": "주인공이 가장 큰 위기에 직면하고 포기하고 싶은 순간을 맞이함. 극적인 반전이나 깨달음이 일어남.",
                            "message": "전환의 계기"
                        },
                        {
                            "title": "새로운 미래",
                            "stage": "결",
                            "stage_name": "결말부",
                            "characters": ["주인공", "조력자", "새로운 동료들"],
                            "key_content": "위기를 극복하고 얻은 성장과 새로운 시작",
                            "summary": "주인공이 모든 시련을 극복하고 목표를 달성함. 성장한 모습과 함께 새로운 가능성을 제시하며 희망적으로 마무리.",
                            "message": "희망의 메시지"
                        }
                    ]
                }
            }
    
    def generate_scenes_from_story(self, story_data):
        # planning_options 추출
        planning_options = story_data.get('planning_options', {})
        tone = planning_options.get('tone', '')
        genre = planning_options.get('genre', '')
        concept = planning_options.get('concept', '')
        target = planning_options.get('target', '')
        purpose = planning_options.get('purpose', '')
        duration = planning_options.get('duration', '')
        story_framework = planning_options.get('story_framework', 'classic')
        
        # 스토리의 stage 정보 추출
        stage = story_data.get('stage', '')
        stage_name = story_data.get('stage_name', '')
        
        prompt = f"""
        당신은 전문 영상 씬 구성 작가입니다. 아래 스토리를 정확히 3개의 씬으로 나누어주세요.
        스토리의 흐름에 맞게 시작, 중간, 끝 부분으로 구성하세요.
        
        [작성 조건] - 반드시 다음 조건들을 반영하세요:
        - 타겟 오디언스: {target if target else '일반 시청자'}
        - 장르: {genre if genre else '일반'}
        - 톤앤매너: {tone if tone else '중립적'}
        - 콘셉트: {concept if concept else '기본'}
        - 영상 목적: {purpose if purpose else '정보 전달'}
        - 영상 길이: {duration if duration else '3-5분'}
        - 스토리 프레임워크: {story_framework}
        
        각 씬은 다음 정보를 포함해야 합니다:
        1. 씬 번호 (1, 2, 3)
        2. 장소 (타겟과 장르에 어울리는 공간)
        3. 시간대
        4. 주요 액션 (톤앤매너와 콘셉트를 반영한 동작)
        5. 대사 또는 나레이션 (타겟의 언어로 작성)
        6. 씬의 목적 (이 씬이 전체 스토리에서 하는 역할)
        
        스토리:
        제목: {story_data.get('title', '')}
        단계: {stage} - {stage_name}
        등장인물: {', '.join(story_data.get('characters', []))}
        핵심 내용: {story_data.get('key_content', '')}
        요약: {story_data.get('summary', '')}
        
        다음 형식의 JSON으로 응답해주세요:
        {{
            "scenes": [
                {{
                    "scene_number": 1,
                    "location": "장소",
                    "time": "시간대",
                    "action": "주요 액션",
                    "dialogue": "대사 또는 나레이션",
                    "purpose": "씬의 목적"
                }},
                {{
                    "scene_number": 2,
                    "location": "장소",
                    "time": "시간대",
                    "action": "주요 액션",
                    "dialogue": "대사 또는 나레이션",
                    "purpose": "씬의 목적"
                }},
                {{
                    "scene_number": 3,
                    "location": "장소",
                    "time": "시간대",
                    "action": "주요 액션",
                    "dialogue": "대사 또는 나레이션",
                    "purpose": "씬의 목적"
                }}
            ]
        }}
        
        반드시 정확히 3개의 씬을 생성하세요.
        """
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            result = json.loads(response_text)
            
            # 각 씬에 planning_options와 story 메타데이터 추가
            scenes = result.get('scenes', [])
            for scene in scenes:
                scene['planning_options'] = planning_options
                scene['story_stage'] = stage
                scene['story_stage_name'] = stage_name
                scene['story_framework'] = story_framework
            
            return result
        except Exception as e:
            return {
                "error": str(e),
                "fallback": {
                    "scenes": [
                        {
                            "scene_number": 1,
                            "location": "사무실",
                            "time": "아침",
                            "action": "주인공이 일상적인 업무를 시작하는 모습",
                            "dialogue": "또 하루가 시작되었다. 늘 똑같은 일상이지만...",
                            "purpose": "인물 소개와 현재 상황 설정",
                            "planning_options": planning_options,
                            "story_stage": stage,
                            "story_stage_name": stage_name,
                            "story_framework": story_framework
                        },
                        {
                            "scene_number": 2,
                            "location": "회의실",
                            "time": "오후",
                            "action": "중요한 프로젝트 회의 중 갈등 발생",
                            "dialogue": "이대로는 안 됩니다. 새로운 접근이 필요해요.",
                            "purpose": "갈등 제시와 변화의 필요성 강조",
                            "planning_options": planning_options,
                            "story_stage": stage,
                            "story_stage_name": stage_name,
                            "story_framework": story_framework
                        },
                        {
                            "scene_number": 3,
                            "location": "야외 테라스",
                            "time": "저녁",
                            "action": "해결책을 찾고 새로운 비전을 공유하는 팀",
                            "dialogue": "우리가 함께라면 할 수 있습니다.",
                            "purpose": "희망적 메시지와 미래 방향 제시",
                            "planning_options": planning_options,
                            "story_stage": stage,
                            "story_stage_name": stage_name,
                            "story_framework": story_framework
                        }
                    ]
                }
            }
    
    def generate_shots_from_scene(self, scene_data):
        """
        씬으로부터 정확히 3개의 샷을 생성합니다.
        """
        # planning_options 추출
        planning_options = scene_data.get('planning_options', {})
        tone = planning_options.get('tone', '')
        genre = planning_options.get('genre', '')
        concept = planning_options.get('concept', '')
        
        prompt = f"""
        당신은 전문 영상 감독입니다. 아래 씬을 정확히 3개의 샷으로 나누어주세요.
        다양한 샷 타입을 사용하여 시각적으로 흥미로운 구성을 만드세요.
        
        [연출 가이드라인]:
        - 톤앤매너: {tone if tone else '중립적'}
        - 장르: {genre if genre else '일반'}
        - 콘셉트: {concept if concept else '기본'}
        
        각 샷은 다음 정보를 포함해야 합니다:
        1. 샷 번호 (1, 2, 3)
        2. 샷 타입 (와이드샷, 미디엄샷, 클로즈업, 오버숄더 등)
        3. 카메라 움직임 (고정, 팬, 틸트, 줌, 트래킹 등)
        4. 지속 시간 (2-5초)
        5. 상세 설명
        
        씬 정보:
        씬 번호: {scene_data.get('scene_number', '')}
        장소: {scene_data.get('location', '')}
        시간: {scene_data.get('time', '')}
        액션: {scene_data.get('action', '')}
        대사: {scene_data.get('dialogue', '')}
        목적: {scene_data.get('purpose', '')}
        
        JSON 형식으로 응답해주세요:
        {{
            "shots": [
                {{
                    "shot_number": 1,
                    "shot_type": "샷 타입",
                    "camera_movement": "카메라 움직임",
                    "duration": 3,
                    "description": "샷 설명"
                }},
                {{
                    "shot_number": 2,
                    "shot_type": "샷 타입",
                    "camera_movement": "카메라 움직임",
                    "duration": 3,
                    "description": "샷 설명"
                }},
                {{
                    "shot_number": 3,
                    "shot_type": "샷 타입",
                    "camera_movement": "카메라 움직임",
                    "duration": 3,
                    "description": "샷 설명"
                }}
            ]
        }}
        
        반드시 정확히 3개의 샷을 생성하세요.
        """
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            return json.loads(response_text)
        except Exception as e:
            return {
                "error": str(e),
                "fallback": {
                    "shots": [
                        {
                            "shot_number": 1,
                            "shot_type": "와이드샷",
                            "camera_movement": "고정",
                            "duration": 3,
                            "description": "전체적인 씬의 분위기와 공간을 보여주는 샷"
                        },
                        {
                            "shot_number": 2,
                            "shot_type": "미디엄샷",
                            "camera_movement": "슬로우 팬",
                            "duration": 4,
                            "description": "주요 인물이나 액션에 집중하는 샷"
                        },
                        {
                            "shot_number": 3,
                            "shot_type": "클로즈업",
                            "camera_movement": "고정",
                            "duration": 3,
                            "description": "감정이나 중요한 디테일을 강조하는 샷"
                        }
                    ]
                }
            }
    
    def generate_shots(self, story_data):
        prompt = f"""
        당신은 전문 영상 감독입니다. 아래 스토리를 바탕으로 쇼트 리스트를 작성해주세요.

        스토리:
        {json.dumps(story_data, ensure_ascii=False, indent=2)}

        다음 형식의 JSON으로 응답해주세요:
        {{
            "shots": [
                {{
                    "shot_number": 1,
                    "type": "쇼트 타입 (예: 와이드샷, 클로즈업 등)",
                    "description": "쇼트 내용 설명",
                    "camera_angle": "카메라 앵글",
                    "movement": "카메라 움직임",
                    "duration": "예상 시간",
                    "audio": "오디오/음향 설명"
                }}
            ],
            "total_shots": "전체 쇼트 수",
            "estimated_duration": "예상 전체 시간"
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            return json.loads(response_text)
        except Exception as e:
            return {
                "error": str(e),
                "fallback": {
                    "shots": [
                        {
                            "shot_number": 1,
                            "type": "와이드샷",
                            "description": "전체적인 분위기 설정",
                            "camera_angle": "아이레벨",
                            "movement": "고정",
                            "duration": "5초",
                            "audio": "배경음악 시작"
                        },
                        {
                            "shot_number": 2,
                            "type": "미디엄샷",
                            "description": "주요 내용 전달",
                            "camera_angle": "아이레벨",
                            "movement": "슬로우 줌인",
                            "duration": "10초",
                            "audio": "내레이션"
                        }
                    ],
                    "total_shots": 2,
                    "estimated_duration": "15초"
                }
            }
    
    def generate_storyboards_from_shot(self, shot_data):
        # planning_options 추출 (shot_data나 scene_info에서)
        planning_options = shot_data.get('planning_options', {})
        if not planning_options and 'scene_info' in shot_data:
            planning_options = shot_data['scene_info'].get('planning_options', {})
        
        tone = planning_options.get('tone', '')
        genre = planning_options.get('genre', '')
        concept = planning_options.get('concept', '')
        target = planning_options.get('target', '')
        
        prompt = f"""
        당신은 전문 스토리보드 아티스트입니다. 아래 숏 정보를 바탕으로 DALL-E 3가 생성할 수 있는 상세한 시각적 콘티를 작성해주세요.
        
        [시각적 연출 가이드]:
        - 타겟 오디언스: {target if target else '일반 시청자'}
        - 장르: {genre if genre else '일반'}
        - 톤앤매너: {tone if tone else '중립적'}
        - 콘셉트: {concept if concept else '기본'}

        숏 정보:
        {json.dumps(shot_data, ensure_ascii=False, indent=2)}

        ⚠️ 중요: visual_description은 DALL-E 3가 이미지를 생성할 때 사용됩니다. 다음 가이드라인을 반드시 따라주세요:
        
        ✅ visual_description 작성 규칙:
        1. 시각적 묘사 중심으로 작성 (장면, 인물 외형, 배경, 감정, 행동 등 구체적으로)
        2. 인물 묘사시: 성별, 나이대, 표정, 옷차림, 제스처, 위치 포함
        3. 카메라 뷰 포함: "wide shot", "close-up", "medium shot", "over-the-shoulder" 등
        4. 구체적이고 생생한 영어로 작성
        5. 환경과 분위기를 자세히 묘사
        
        ❌ 절대 사용하지 말아야 할 단어:
        - "Storyboard", "Frame", "Scene", "프레임", "장면", "씬"
        - "Description", "Caption", "Text", "설명"
        - "Panel", "Script", "Title", "Heading"
        - 번호나 라벨 ("Frame 1:", "Scene 1:" 등)
        
        ✅ 좋은 예시들:
        1. "Medium shot of a nervous middle-aged woman in colorful traditional Korean hanbok entering a dimly lit shaman shrine filled with incense smoke, wooden talismans hanging on dark walls, candlelight flickering"
        
        2. "Wide shot of a modern glass-walled office at sunset, young professionals in business casual attire working at computers, city skyline visible through windows, warm golden light streaming in"
        
        3. "Close-up of weathered hands holding prayer beads, soft natural light from side window, blurred traditional Korean interior in background"
        
        4. "Over-the-shoulder shot of a man in his 30s wearing a navy suit looking at laptop screen in busy coffee shop, other customers blurred in background, steam rising from coffee cup"
        
        ❌ 나쁜 예시들:
        - "Frame 1: 주인공이 들어온다"
        - "신당 입구 장면"
        - "Scene showing entrance"
        - "Storyboard panel of cafe"
        
        다음 형식의 JSON으로 응답해주세요:
        {{
            "storyboards": [
                {{
                    "frame_number": 1,
                    "title": "프레임 제목 (한국어 가능)",
                    "visual_description": "DALL-E용 영어 시각적 묘사 (위 가이드라인 준수)",
                    "description_kr": "한국어 한 줄 설명 (50자 이내로 장면의 핵심을 요약)",
                    "composition": "구도 (예: wide shot, close-up, medium shot)",
                    "camera_info": {{
                        "angle": "카메라 앵글",
                        "movement": "카메라 움직임",
                        "lens": "렌즈 타입"
                    }},
                    "lighting": "조명 설정",
                    "audio": {{
                        "dialogue": "대사",
                        "sfx": "효과음",
                        "music": "배경음악"
                    }},
                    "notes": "추가 연출 노트",
                    "duration": "지속 시간"
                }}
            ],
            "total_frames": "전체 프레임 수",
            "technical_requirements": "기술적 요구사항"
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            storyboard_data = json.loads(response_text)
            
            # 이미지 생성 시도
            storyboards = storyboard_data.get('storyboards', [])
            for i, frame in enumerate(storyboards):
                logger.info(f"Generating image for frame {i+1}")
                image_generated = False
                
                # 1. DALL-E 시도
                if self.image_service_available and self.image_service:
                    draft_mode = getattr(self, 'draft_mode', True)
                    image_result = self.image_service.generate_storyboard_image(
                        frame, 
                        style=getattr(self, 'style', 'minimal'),
                        draft_mode=draft_mode
                    )
                    if image_result['success']:
                        storyboard_data['storyboards'][i]['image_url'] = image_result['image_url']
                        storyboard_data['storyboards'][i]['prompt_used'] = image_result.get('prompt_used', '')
                        storyboard_data['storyboards'][i]['model_used'] = image_result.get('model_used', 'dall-e')
                        storyboard_data['storyboards'][i]['draft_mode'] = draft_mode
                        image_generated = True
                    else:
                        logger.warning(f"DALL-E failed for frame {i+1}: {image_result.get('error')}")
                
                # 2. 플레이스홀더 폴백
                if not image_generated and self.placeholder_service:
                    logger.info(f"Using placeholder for frame {i+1}")
                    placeholder_result = self.placeholder_service.generate_storyboard_image(frame)
                    if placeholder_result['success']:
                        storyboard_data['storyboards'][i]['image_url'] = placeholder_result['image_url']
                        storyboard_data['storyboards'][i]['is_placeholder'] = True
                        storyboard_data['storyboards'][i]['image_note'] = "플레이스홀더 이미지 (실제 이미지는 나중에 생성됩니다)"
                    else:
                        storyboard_data['storyboards'][i]['image_url'] = None
                        storyboard_data['storyboards'][i]['image_error'] = "이미지 생성 실패"
            
            return storyboard_data
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "quota" in error_msg.lower():
                logger.warning("Gemini API quota exceeded, using fallback data with images")
            else:
                logger.error(f"Gemini API error: {error_msg}")
            
            return {
                "error": error_msg,
                "fallback": {
                    "storyboards": [
                        {
                            "frame_number": 1,
                            "title": "오프닝 프레임",
                            "visual_description": "넓은 공간에서 제품이 중앙에 위치",
                            "description_kr": "제품의 전체 모습을 보여주는 오프닝 샷",
                            "composition": "중앙 구도",
                            "camera_info": {
                                "angle": "아이레벨",
                                "movement": "슬로우 줌인",
                                "lens": "표준 렌즈"
                            },
                            "lighting": "부드러운 자연광",
                            "audio": {
                                "dialogue": "",
                                "sfx": "앰비언트 사운드",
                                "music": "잔잔한 배경음악 시작"
                            },
                            "notes": "제품의 전체적인 모습을 보여주며 시작",
                            "duration": "3초"
                        },
                        {
                            "frame_number": 2,
                            "title": "디테일 프레임",
                            "visual_description": "제품의 주요 기능 클로즈업",
                            "description_kr": "혁신적인 기능을 클로즈업으로 강조하는 장면",
                            "composition": "3분할 구도",
                            "camera_info": {
                                "angle": "하이앵글",
                                "movement": "고정",
                                "lens": "매크로 렌즈"
                            },
                            "lighting": "키 라이트 강조",
                            "audio": {
                                "dialogue": "혁신적인 기술로...",
                                "sfx": "버튼 클릭음",
                                "music": "배경음악 지속"
                            },
                            "notes": "제품의 혁신적인 기능을 강조",
                            "duration": "5초"
                        }
                    ],
                    "total_frames": 2,
                    "technical_requirements": "4K 해상도, 60fps, 색보정 필요"
                }
            }