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
        story_framework = context.get('story_framework', 'classic')
        development_level = context.get('development_level', 'balanced')
        
        # 스토리 프레임워크별 구성
        framework_guides = {
            'classic': "기승전결의 전통적인 4단계 구성",
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
        당신은 전문 영상 스토리 작가입니다. 다음 조건에 맞춰 스토리를 작성해주세요.
        
        [핵심 작성 조건] - 반드시 모든 요소에 다음 조건들을 반영하세요:
        - 타겟 오디언스: {target if target else '일반 시청자'}
        - 장르: {genre if genre else '일반'}
        - 톤앤매너: {tone if tone else '중립적'}
        - 콘셉트: {concept if concept else '기본'}
        - 스토리 프레임워크: {framework_guides.get(story_framework, framework_guides['classic'])}
        - 전개 강도: {development_guides.get(development_level, development_guides['balanced'])}
        
        ⚠️ 매우 중요: 
        - 타겟 오디언스의 연령, 관심사, 라이프스타일을 정확히 반영하세요
        - 장르의 특징적인 요소들(설정, 캐릭터, 사건)을 포함하세요
        - 톤앤매너에 맞는 대사, 분위기, 표현을 사용하세요
        - 콘셉트가 스토리 전체에 일관되게 녹아들도록 하세요
        
        예시:
        - 타겟이 '10대'라면: 학교생활, 친구관계, 성장통, SNS 등을 포함
        - 장르가 '로맨스'라면: 감정선, 만남과 이별, 설렘의 순간 등을 포함
        - 톤이 '유머러스'라면: 재치있는 대사, 코믹한 상황, 밝은 분위기
        - 콘셉트가 '혁신'이라면: 새로운 시도, 변화, 도전정신을 강조
        
        4개 파트 구성:
        1. 기(起) - 설정 [전체의 10-20%]
           - 타겟 오디언스가 공감할 수 있는 주인공 설정
           - 장르에 맞는 배경과 상황 제시
           - 톤앤매너에 맞는 분위기 조성
        
        2. 승(承) - 촉발 사건과 상승 [전체의 20-40%]
           - 장르의 전형적인 갈등 요소 도입
           - 타겟이 흥미를 느낄 만한 사건 전개
           - 콘셉트를 반영한 독특한 전개
        
        3. 전(轉) - 절정과 위기 [전체의 40-30%]
           - 장르의 클라이맥스 요소 활용
           - 타겟의 감정을 자극하는 극적 전환
           - 톤을 유지하면서도 긴장감 조성
        
        4. 결(結) - 해결과 새로운 균형 [전체의 30-10%]
           - 타겟이 만족할 수 있는 결말
           - 장르의 전형적인 마무리 방식 활용
           - 콘셉트와 메시지를 명확히 전달
        
        각 파트는 다음 정보를 포함해야 합니다:
        - 파트 제목 (그 파트의 핵심을 나타내는 제목 - 타겟과 장르 고려)
        - 스토리 단계 (기/승/전/결)
        - 주요 등장인물 (타겟 오디언스가 공감할 수 있는 캐릭터)
        - 핵심 사건/행동 (장르와 콘셉트를 반영한 사건)
        - 감정 톤 (톤앤매너와 일치하는 분위기)
        - 파트 요약 (타겟, 장르, 톤, 콘셉트가 모두 반영된 요약)
        
        주의사항:
        - 설정한 타겟, 장르, 톤앤매너, 콘셉트가 모든 파트에 일관되게 반영되어야 함
        - 타겟 오디언스의 언어와 관심사를 사용하여 공감대 형성
        - 장르의 관습과 기대를 충족시키면서도 신선함 추구
        - 각 파트는 독립적인 이야기가 아닌, 전체 이야기의 일부여야 함
        - 파트 간 인과관계가 명확해야 함
        
        기획안:
        {planning_text}
        
        다음 형식의 JSON으로 응답해주세요:
        {{
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
        }}
        
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
        prompt = f"""
        당신은 전문 영상 씬 구성 작가입니다. 아래 스토리를 정확히 3개의 씬으로 나누어주세요.
        스토리의 흐름에 맞게 시작, 중간, 끝 부분으로 구성하세요.
        
        각 씬은 다음 정보를 포함해야 합니다:
        1. 씬 번호 (1, 2, 3)
        2. 장소
        3. 시간대
        4. 주요 액션
        5. 대사 또는 나레이션
        6. 씬의 목적 (이 씬이 전체 스토리에서 하는 역할)
        
        스토리:
        제목: {story_data.get('title', '')}
        단계: {story_data.get('stage', '')} - {story_data.get('stage_name', '')}
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
            
            return json.loads(response_text)
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
                            "purpose": "인물 소개와 현재 상황 설정"
                        },
                        {
                            "scene_number": 2,
                            "location": "회의실",
                            "time": "오후",
                            "action": "중요한 프로젝트 회의 중 갈등 발생",
                            "dialogue": "이대로는 안 됩니다. 새로운 접근이 필요해요.",
                            "purpose": "갈등 제시와 변화의 필요성 강조"
                        },
                        {
                            "scene_number": 3,
                            "location": "야외 테라스",
                            "time": "저녁",
                            "action": "해결책을 찾고 새로운 비전을 공유하는 팀",
                            "dialogue": "우리가 함께라면 할 수 있습니다.",
                            "purpose": "희망적 메시지와 미래 방향 제시"
                        }
                    ]
                }
            }
    
    def generate_shots_from_scene(self, scene_data):
        """
        씬으로부터 정확히 3개의 샷을 생성합니다.
        """
        prompt = f"""
        당신은 전문 영상 감독입니다. 아래 씬을 정확히 3개의 샷으로 나누어주세요.
        다양한 샷 타입을 사용하여 시각적으로 흥미로운 구성을 만드세요.
        
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
        prompt = f"""
        당신은 전문 스토리보드 아티스트입니다. 아래 숏 정보를 바탕으로 상세한 콘티(스토리보드)를 작성해주세요.

        숏 정보:
        {json.dumps(shot_data, ensure_ascii=False, indent=2)}

        각 프레임은 구도, 동작, 카메라 워크, 조명, 음향 등을 포함해야 합니다.
        
        다음 형식의 JSON으로 응답해주세요:
        {{
            "storyboards": [
                {{
                    "frame_number": 1,
                    "title": "프레임 제목",
                    "visual_description": "시각적 구성 설명",
                    "composition": "구도 (예: 3분할 구도, 중앙 구도 등)",
                    "camera_info": {{
                        "angle": "카메라 앵글",
                        "movement": "카메라 움직임",
                        "lens": "렌즈 타입 (예: 광각, 표준, 망원)"
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
                    image_result = self.image_service.generate_storyboard_image(frame, style=getattr(self, 'style', 'minimal'))
                    if image_result['success']:
                        storyboard_data['storyboards'][i]['image_url'] = image_result['image_url']
                        storyboard_data['storyboards'][i]['prompt_used'] = image_result.get('prompt_used', '')
                        storyboard_data['storyboards'][i]['model_used'] = image_result.get('model_used', 'dall-e')
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