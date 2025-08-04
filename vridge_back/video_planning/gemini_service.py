import os
import json
import google.generativeai as genai
from django.conf import settings
import logging
from datetime import datetime
import requests

logger = logging.getLogger(__name__)

# 다른 LLM 서비스는 사용하지 않음 - Gemini만 사용

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
        self.pro_model = genai.GenerativeModel('gemini-1.5-pro')  # PDF 요약용 Pro 모델
        
        # 토큰 사용량 추적
        self.token_usage = {
            'total': 0,
            'prompt': 0,
            'response': 0,
            'by_feature': {
                'story': {'prompt': 0, 'response': 0, 'total': 0},
                'scene': {'prompt': 0, 'response': 0, 'total': 0},
                'shot': {'prompt': 0, 'response': 0, 'total': 0},
                'storyboard': {'prompt': 0, 'response': 0, 'total': 0}
            }
        }
        
        # 다른 LLM 서비스 제거 - Gemini만 사용
        self.exaone_service = None
        self.hf_exaone_service = None
        self.friendli_service = None
        logger.info("[GeminiService] Using Gemini for all text generation")
        
        # 이미지 생성 서비스 초기화 (선택적)
        self.image_service_available = False
        self.image_service = None
        self.placeholder_service = None
        self.style = 'minimal'  # 기본 스타일
        self.draft_mode = True  # 기본적으로 draft 모드 사용
        self.no_image = False  # 이미지 생성 스킵 옵션
        
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
        
        logger.info(f"[GeminiService] generate_stories_from_planning 시작")
        logger.info(f"[GeminiService] planning_text 길이: {len(planning_text)}")
        logger.info(f"[GeminiService] context: {context}")
        
        # Gemini 사용
        logger.info("[GeminiService] Using Gemini for text generation")
        
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
        
        logger.info(f"[GeminiService] story_framework: {story_framework}")
        
        # 추가 고급 설정
        aspect_ratio = context.get('aspectRatio', '16:9')
        platform = context.get('platform', '')
        color_tone = context.get('colorTone', '')
        editing_style = context.get('editingStyle', '')
        music_style = context.get('musicStyle', '')
        
        # 스토리 프레임워크별 구성
        framework_guides = {
            'classic': "기승전결의 전통적인 4단계 구성",
            'hero': "히어로의 여정 - 평범한 세계, 모험의 소명, 시련, 보상",
            'problem': "문제-해결 구조 - 문제 인식, 원인 분석, 해결책 제시, 결과",
            'emotional': "감정 곡선 - 평온, 긴장, 절정, 해소",
            'hook_immersion': "훅-몰입-반전-떡밥 구조",
            'pixar': "픽사 스토리텔링 - 옛날에, 매일, 어느날, 그래서, 결국",
            'deductive': "연역식 - 주장/결론, 근거 1, 근거 2, 근거 3, 재확인",
            'inductive': "귀납식 - 사례 1, 사례 2, 사례 3, 패턴 발견, 결론",
            'documentary': "다큐멘터리 - 문제 제기, 탐사/인터뷰, 갈등/대립, 통찰, 메시지"
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
        
        영상 제작 스타일 참고:
        {f'- 플랫폼: {platform} (플랫폼 특성에 맞는 구성과 속도감)' if platform else ''}
        {f'- 화면 비율: {aspect_ratio} (구도와 공간 활용 고려)' if aspect_ratio else ''}
        {f'- 색감/톤: {color_tone} (장면의 분위기와 감정 표현)' if color_tone else ''}
        {f'- 편집 스타일: {editing_style} (장면 전환과 리듬감)' if editing_style else ''}
        {f'- 음악 스타일: {music_style} (감정선과 분위기 조성)' if music_style else ''}
        
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
        
        {self._get_framework_structure(story_framework)}
        
        각 파트는 다음 정보를 포함해야 합니다:
        - 파트 제목 (그 파트의 핵심을 나타내는 제목)
        - 스토리 단계 (기/승/전/결)
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
        
        {self._get_json_response_format(story_framework)}
        
        반드시 정확히 4개의 스토리를 생성하세요.
        응답은 반드시 유효한 JSON 형식이어야 하며, 추가적인 텍스트나 설명 없이 JSON만 반환하세요.
        """
        
        try:
            logger.info(f"[GeminiService] Gemini API 호출 시작")
            
            # 재시도 로직 추가
            max_retries = 3
            retry_count = 0
            last_error = None
            
            while retry_count < max_retries:
                try:
                    response = self.model.generate_content(prompt)
                    response_text = response.text.strip()
                    break  # 성공하면 루프 종료
                except Exception as retry_error:
                    retry_count += 1
                    last_error = retry_error
                    logger.warning(f"[GeminiService] Gemini API 시도 {retry_count}/{max_retries} 실패: {retry_error}")
                    
                    if retry_count < max_retries:
                        import time
                        time.sleep(2)  # 2초 대기 후 재시도
                    else:
                        raise last_error  # 모든 재시도 실패 시 예외 발생
            
            # 토큰 사용량 로깅 및 업데이트
            if hasattr(response, 'usage_metadata'):
                prompt_tokens = response.usage_metadata.prompt_token_count
                response_tokens = response.usage_metadata.candidates_token_count
                total_tokens = response.usage_metadata.total_token_count
                logger.info(f"[GeminiService] 토큰 사용량 - 프롬프트: {prompt_tokens}, 응답: {response_tokens}, 전체: {total_tokens}")
                self._update_token_usage('story', prompt_tokens, response_tokens)
            
            logger.info(f"[GeminiService] Gemini API 응답 길이: {len(response_text)}")
            
            # JSON 코드 블록 제거
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            # 추가적인 정리
            response_text = response_text.strip()
            
            # JSON 파싱 시도
            try:
                result = json.loads(response_text)
                # 결과 검증
                if 'stories' in result and isinstance(result['stories'], list) and len(result['stories']) > 0:
                    logger.info(f"[GeminiService] 스토리 생성 성공: {len(result['stories'])}개")
                    return result
                else:
                    raise ValueError("Invalid story structure")
            except json.JSONDecodeError as json_error:
                # JSON 파싱 실패 시 더 자세한 에러 정보 로깅
                logger.error(f"JSON 파싱 오류 - 프레임워크: {story_framework}, 에러: {str(json_error)}")
                logger.error(f"응답 텍스트 앞 100자: {response_text[:100]}")
                logger.error(f"응답 텍스트 뒤 100자: {response_text[-100:]}")
                
                # 디버그용: 전체 응답을 파일로 저장
                if story_framework == 'inductive':
                    with open(f'/tmp/inductive_response_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt', 'w') as f:
                        f.write(response_text)
                    logger.error(f"전체 응답이 /tmp/inductive_response_*.txt 파일에 저장되었습니다.")
                
                raise json_error
                
        except Exception as e:
            logger.error(f"스토리 생성 오류 - 프레임워크: {story_framework}, 에러: {str(e)}")
            
            # Gemini 실패 시 DALL-E 시도
            if self.image_service_available and self.image_service:
                logger.info("[GeminiService] Gemini 실패, DALL-E로 폴백 시도")
                try:
                    # DALL-E를 통한 텍스트 생성 (이미지 대신)
                    # 하지만 DALL-E는 이미지 생성 서비스이므로, 여기서는 폴백 스토리 제공
                    logger.info("[GeminiService] DALL-E는 이미지 전용, 폴백 스토리 사용")
                except Exception as dalle_error:
                    logger.error(f"DALL-E 폴백도 실패: {dalle_error}")
            
            # 프레임워크별 폴백 스토리 제공
            fallback_stories = self._get_fallback_stories(story_framework)
            
            return {
                "error": str(e),
                "stories": fallback_stories
            }
    
    def generate_scenes_from_story(self, story_data):
        # Gemini 사용
        logger.info("[GeminiService] Using Gemini for scene generation")
        
        # planning_options 추출
        planning_options = story_data.get('planning_options', {})
        tone = planning_options.get('tone', '')
        genre = planning_options.get('genre', '')
        concept = planning_options.get('concept', '')
        target = planning_options.get('target', '')
        purpose = planning_options.get('purpose', '')
        duration = planning_options.get('duration', '')
        
        # 추가 고급 설정
        aspect_ratio = planning_options.get('aspectRatio', '16:9')
        platform = planning_options.get('platform', '')
        color_tone = planning_options.get('colorTone', '')
        editing_style = planning_options.get('editingStyle', '')
        music_style = planning_options.get('musicStyle', '')
        
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
        
        [영상 스타일 지침] - 씬 구성 시 고려사항:
        {f'- 화면 비율 {aspect_ratio}: {"세로 구도 중심, 인물 클로즈업 활용" if aspect_ratio == "9:16" else "가로 구도, 풍경과 공간 활용" if aspect_ratio == "16:9" else "정사각형 구도, 중앙 집중"}' if aspect_ratio else ''}
        {f'- 플랫폼 {platform}: {"짧고 임팩트 있는 전개" if platform in ["youtube_shorts", "tiktok", "instagram_reels"] else "충분한 설명과 전개" if platform in ["youtube", "tv_broadcast"] else "시각적 매력 중시"}' if platform else ''}
        {f'- 색감 {color_tone}: 장면의 분위기와 조명 설정에 반영' if color_tone else ''}
        {f'- 편집 스타일 {editing_style}: 장면 전환의 속도와 리듬 고려' if editing_style else ''}
        {f'- 음악 {music_style}: 대사와 분위기에 맞는 사운드 환경' if music_style else ''}
        
        각 씬은 다음 정보를 포함해야 합니다:
        1. 씬 번호 (1, 2, 3)
        2. 장소 (타겟과 장르에 어울리는 공간)
        3. 시간대
        4. 주요 액션 (톤앤매너와 콘셉트를 반영한 동작)
        5. 대사 또는 나레이션 (타겟의 언어로 작성)
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
            
            # 토큰 사용량 로깅 및 업데이트
            if hasattr(response, 'usage_metadata'):
                prompt_tokens = response.usage_metadata.prompt_token_count
                response_tokens = response.usage_metadata.candidates_token_count
                total_tokens = response.usage_metadata.total_token_count
                logger.info(f"[GeminiService] 씬 생성 토큰 사용량 - 프롬프트: {prompt_tokens}, 응답: {response_tokens}, 전체: {total_tokens}")
                self._update_token_usage('scene', prompt_tokens, response_tokens)
            
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
        # Gemini 사용
        logger.info("[GeminiService] Using Gemini for shot generation")
        
        # planning_options 추출
        planning_options = scene_data.get('planning_options', {})
        tone = planning_options.get('tone', '')
        genre = planning_options.get('genre', '')
        concept = planning_options.get('concept', '')
        
        # 추가 고급 설정
        aspect_ratio = planning_options.get('aspectRatio', '16:9')
        platform = planning_options.get('platform', '')
        color_tone = planning_options.get('colorTone', '')
        editing_style = planning_options.get('editingStyle', '')
        music_style = planning_options.get('musicStyle', '')
        
        prompt = f"""
        당신은 전문 영상 감독입니다. 아래 씬을 정확히 3개의 샷으로 나누어주세요.
        다양한 샷 타입을 사용하여 시각적으로 흥미로운 구성을 만드세요.
        
        [연출 가이드라인]:
        - 톤앤매너: {tone if tone else '중립적'}
        - 장르: {genre if genre else '일반'}
        - 콘셉트: {concept if concept else '기본'}
        
        [촬영 스타일 가이드]:
        {f'- 화면 비율 {aspect_ratio}: {"세로형 프레이밍, 모바일 최적화" if aspect_ratio == "9:16" else "시네마틱 와이드 프레이밍" if aspect_ratio == "21:9" else "표준 가로형 구도"}' if aspect_ratio else ''}
        {f'- 색감 {color_tone}: {"따뜻한 색온도와 부드러운 조명" if color_tone == "warm" else "차가운 색온도와 날카로운 대비" if color_tone == "cool" else "자연스러운 색감"}로 촬영' if color_tone else ''}
        {f'- 편집 스타일 {editing_style}: {"빠른 컷과 다이나믹한 전환" if editing_style == "fast_cuts" else "긴 테이크와 안정적인 구도" if editing_style == "long_takes" else "적절한 리듬"}' if editing_style else ''}
        
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
            
            # 토큰 사용량 로깅 및 업데이트
            if hasattr(response, 'usage_metadata'):
                prompt_tokens = response.usage_metadata.prompt_token_count
                response_tokens = response.usage_metadata.candidates_token_count
                total_tokens = response.usage_metadata.total_token_count
                logger.info(f"[GeminiService] 샷 생성 토큰 사용량 - 프롬프트: {prompt_tokens}, 응답: {response_tokens}, 전체: {total_tokens}")
                self._update_token_usage('shot', prompt_tokens, response_tokens)
            
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
        
        # 추가 고급 설정
        aspect_ratio = planning_options.get('aspectRatio', '16:9')
        platform = planning_options.get('platform', '')
        color_tone = planning_options.get('colorTone', '')
        editing_style = planning_options.get('editingStyle', '')
        music_style = planning_options.get('musicStyle', '')
        
        prompt = f"""
        당신은 전문 스토리보드 아티스트입니다. 아래 숏 정보를 바탕으로 DALL-E 3가 생성할 수 있는 상세한 시각적 콘티를 작성해주세요.
        
        [시각적 연출 가이드]:
        - 타겟 오디언스: {target if target else '일반 시청자'}
        - 장르: {genre if genre else '일반'}
        - 톤앤매너: {tone if tone else '중립적'}
        - 콘셉트: {concept if concept else '기본'}
        
        [영상 스타일 지침]:
        {f'- 화면 비율 {aspect_ratio}: {"세로형 구도로 모바일에 최적화된 프레이밍" if aspect_ratio == "9:16" else "시네마틱 와이드스크린 구도" if aspect_ratio == "21:9" else "표준 가로형 16:9 구도"}' if aspect_ratio else ''}
        {f'- 색감 {color_tone}: {"warm color temperature with soft golden tones" if color_tone == "warm" else "cool color temperature with blue undertones" if color_tone == "cool" else "vibrant saturated colors" if color_tone == "vibrant" else "soft pastel color palette" if color_tone == "pastel" else "natural color grading"}' if color_tone else ''}
        {f'- 플랫폼 {platform}: {"mobile-first vertical composition" if platform in ["tiktok", "instagram_reels", "youtube_shorts"] else "cinema-quality wide composition" if platform in ["cinema", "tv_broadcast"] else "standard web video composition"}' if platform else ''}

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
        
        storyboard_data = None
        gemini_error = None
        
        # Gemini로 스토리보드 텍스트 생성 시도
        try:
            logger.info("[GeminiService] Gemini로 스토리보드 텍스트 생성 시도")
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            storyboard_data = json.loads(response_text)
            logger.info("[GeminiService] Gemini 스토리보드 텍스트 생성 성공")
        except Exception as e:
            gemini_error = str(e)
            logger.error(f"[GeminiService] Gemini 텍스트 생성 실패: {gemini_error}")
            
            # Gemini 실패 시 기본 스토리보드 사용
            logger.info("[GeminiService] 기본 스토리보드 템플릿 사용")
            storyboard_data = {
                "storyboards": [
                    {
                        "frame_number": 1,
                        "title": "오프닝 샷",
                        "visual_description": "Wide establishing shot showing the main character in their environment",
                        "description_kr": "주인공이 있는 환경을 보여주는 와이드 샷",
                        "composition": "wide shot",
                        "camera_info": {
                            "angle": "eye level",
                            "movement": "static",
                            "lens": "standard"
                        },
                        "lighting": "natural lighting",
                        "audio": {
                            "dialogue": "",
                            "sfx": "ambient sound",
                            "music": "background music"
                        },
                        "notes": "전체적인 분위기 설정",
                        "duration": "3초"
                    }
                ],
                "total_frames": 1,
                "technical_requirements": "standard production",
                "gemini_error": gemini_error
            }
        
        if storyboard_data:
            
            # 이미지 생성 시도 - Gemini 실패 시 DALL-E 우선 사용
            storyboards = storyboard_data.get('storyboards', [])
            
            # no_image 옵션이 설정되면 이미지 생성 스킵
            if getattr(self, 'no_image', False):
                logger.info("Skipping image generation (no_image option is set)")
                for i, frame in enumerate(storyboards):
                    storyboard_data['storyboards'][i]['image_url'] = None
                    storyboard_data['storyboards'][i]['image_note'] = "이미지 생성 스킵됨"
                return storyboard_data
            
            for i, frame in enumerate(storyboards):
                logger.info(f"Generating image for frame {i+1}")
                image_generated = False
                
                # Gemini가 실패했다면 DALL-E를 우선 사용
                if gemini_error and self.image_service_available and self.image_service:
                    logger.info(f"[GeminiService] Gemini 실패로 DALL-E 우선 사용")
                
                # 1. DALL-E 시도
                if self.image_service_available and self.image_service:
                    draft_mode = getattr(self, 'draft_mode', True)
                    logger.info(f"[GeminiService] DALL-E로 이미지 생성 시도 (draft_mode={draft_mode})")
                    try:
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
                            logger.info(f"[GeminiService] DALL-E 이미지 생성 성공")
                        else:
                            logger.warning(f"DALL-E failed for frame {i+1}: {image_result.get('error')}")
                    except Exception as dalle_error:
                        logger.error(f"[GeminiService] DALL-E 이미지 생성 예외: {dalle_error}")
                
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
            
            # Gemini 오류가 있었다면 결과에 포함
            if gemini_error:
                storyboard_data['gemini_error'] = gemini_error
                storyboard_data['fallback_used'] = True
            
            return storyboard_data
        
        # storyboard_data가 없는 경우 기본값 반환
        return {
            "error": "Failed to generate storyboard",
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
    
    def _get_framework_structure(self, framework):
        """스토리 프레임워크별 구조 반환"""
        structures = {
            'classic': """4개 파트 구성 (기승전결):
        1. 기(起) - 설정 [전체의 10-20%]
           - 주인공과 배경 소개
           - 초기 상황 설정
           - 이야기의 분위기 조성
        
        2. 승(承) - 전개 [전체의 20-40%]
           - 갈등이나 문제 상황 도입
           - 사건의 전개와 복잡화
           - 긴장감 상승
        
        3. 전(轉) - 절정 [전체의 40-30%]
           - 클라이맥스 도달
           - 극적인 전환점
           - 최고조의 긴장감
        
        4. 결(結) - 해결 [전체의 30-10%]
           - 갈등의 해결
           - 새로운 상태로의 안착
           - 여운이나 메시지 전달""",
           
            'hook_immersion': """4개 파트 구성 (훅-몰입-반전-떡밥):
        1. 훅(Hook) - 강렬한 도입부 [전체의 5-10%]
           - 시청자의 즉각적인 관심 유발
           - 충격적이거나 호기심을 자극하는 장면
           - 핵심 질문이나 미스터리 제시
        
        2. 몰입(Immersion) - 깊이 있는 전개 [전체의 40-50%]
           - 이야기에 빠져들게 하는 상세한 전개
           - 캐릭터와 상황에 대한 깊은 이해
           - 점진적인 긴장감 상승
        
        3. 반전(Twist) - 예상을 뒤엎는 전환 [전체의 30-35%]
           - 기존 이해를 뒤집는 충격적 사실
           - 새로운 관점이나 진실 공개
           - 극적인 방향 전환
        
        4. 떡밥(Cliffhanger) - 여운과 다음 이야기 [전체의 10-15%]
           - 해결되지 않은 미스터리
           - 다음 편에 대한 기대감 조성
           - 열린 결말이나 새로운 질문""",
           
            'pixar': """4개 파트 구성 (픽사 스토리텔링):
        1. 평범한 일상 - "옛날 옛적에..." [전체의 15-20%]
           - 주인공의 일상적인 삶
           - 안정적이지만 뭔가 부족한 상태
           - 변화의 필요성 암시
        
        2. 균열과 도전 - "그런데 어느 날..." [전체의 25-30%]
           - 일상을 깨뜨리는 사건 발생
           - 주인공이 원하지 않는 변화
           - 새로운 세계나 상황에 직면
        
        3. 시련과 성장 - "그래서..." [전체의 35-40%]
           - 연속되는 도전과 실패
           - 주인공의 내적 성장
           - 진정한 문제의 핵심 발견
        
        4. 변화와 깨달음 - "마침내..." [전체의 15-20%]
           - 주인공의 근본적 변화
           - 새로운 관점으로 문제 해결
           - 성장한 모습으로 새로운 일상""",
           
            'deductive': """4개 파트 구성 (연역식 전개):
        1. 핵심 주장/결론 제시 [전체의 15-20%]
           - 영상의 핵심 메시지 명확히 제시
           - 시청자가 앞으로 볼 내용의 방향 제시
           - 강력한 주장이나 가설 설정
        
        2. 첫 번째 근거와 사례 [전체의 25-30%]
           - 주장을 뒷받침하는 가장 강력한 증거
           - 구체적인 데이터나 사례 제시
           - 시각적 증명이나 실험 결과
        
        3. 추가 근거와 심화 [전체의 30-35%]
           - 다양한 각도의 추가 증거
           - 반대 의견에 대한 반박
           - 더 깊은 분석과 해석
        
        4. 종합과 행동 촉구 [전체의 20-25%]
           - 모든 근거를 종합한 강력한 결론
           - 시청자가 취할 수 있는 행동 제시
           - 메시지의 중요성 재강조""",
           
            'inductive': """4개 파트 구성 (귀납식 전개):
        1. 첫 번째 구체적 사례 [전체의 20-25%]
           - 흥미로운 개별 사례나 현상 소개
           - 시청자의 호기심 자극
           - 구체적이고 생생한 묘사
        
        2. 유사한 사례들 축적 [전체의 30-35%]
           - 비슷한 패턴의 다른 사례들
           - 다양한 상황에서의 유사 현상
           - 공통점 암시하기 시작
        
        3. 패턴 발견과 분석 [전체의 25-30%]
           - 사례들 간의 공통 패턴 도출
           - 왜 이런 패턴이 나타나는지 분석
           - 더 큰 그림이 보이기 시작
        
        4. 일반 원리 도출 [전체의 20-25%]
           - 개별 사례에서 보편적 진리로
           - 발견한 원리의 적용 가능성
           - 시청자의 삶과 연결""",
           
            'documentary': """4개 파트 구성 (다큐멘터리 형식):
        1. 문제 제기와 탐사 시작 [전체의 20-25%]
           - 해결해야 할 문제나 미스터리 제시
           - 왜 이것이 중요한지 설명
           - 탐사 여정의 시작
        
        2. 깊이 있는 조사 [전체의 30-35%]
           - 전문가 인터뷰와 증언
           - 현장 취재와 직접 경험
           - 다양한 관점 제시
        
        3. 갈등과 복잡성 [전체의 25-30%]
           - 서로 다른 의견과 입장
           - 예상치 못한 장애물
           - 문제의 복잡한 본질 드러남
        
        4. 통찰과 메시지 [전체의 20-25%]
           - 조사 결과의 종합
           - 새로운 이해와 통찰
           - 사회적 메시지나 행동 촉구"""
        }
        
        return structures.get(framework, structures['classic'])
    
    def _get_json_response_format(self, framework):
        """프레임워크별 JSON 응답 형식"""
        formats = {
            'classic': """다음 형식의 JSON으로 응답해주세요:
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
                    "stage_name": "절정부",
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
        }}""",
            
            'hook_immersion': """다음 형식의 JSON으로 응답해주세요:
        {{
            "stories": [
                {{
                    "title": "강력한 훅 제목",
                    "stage": "훅",
                    "stage_name": "시선 강탈",
                    "characters": ["등장인물"],
                    "key_content": "충격적이거나 호기심을 유발하는 핵심 장면",
                    "summary": "첫 5초 안에 시청자를 사로잡는 강렬한 도입"
                }},
                {{
                    "title": "몰입의 시작",
                    "stage": "몰입",
                    "stage_name": "깊이 있는 전개",
                    "characters": ["주요 인물들"],
                    "key_content": "이야기의 본격적인 전개",
                    "summary": "시청자가 빠져들 수 있는 상세한 스토리 전개"
                }},
                {{
                    "title": "충격적 반전",
                    "stage": "반전",
                    "stage_name": "예상을 뒤엎다",
                    "characters": ["핵심 인물"],
                    "key_content": "모든 것을 뒤집는 진실이나 사실",
                    "summary": "기존 이해를 완전히 바꾸는 반전"
                }},
                {{
                    "title": "다음이 궁금한",
                    "stage": "떡밥",
                    "stage_name": "열린 결말",
                    "characters": ["등장인물"],
                    "key_content": "해결되지 않은 미스터리나 새로운 질문",
                    "summary": "다음 편을 기대하게 만드는 여운"
                }}
            ]
        }}""",
            
            'pixar': """다음 형식의 JSON으로 응답해주세요:
        {{
            "stories": [
                {{
                    "title": "평범한 일상",
                    "stage": "일상",
                    "stage_name": "옛날 옛적에",
                    "characters": ["주인공", "주변인물"],
                    "key_content": "안정적이지만 뭔가 부족한 일상",
                    "summary": "주인공의 평범하지만 불완전한 삶"
                }},
                {{
                    "title": "예상치 못한 사건",
                    "stage": "균열",
                    "stage_name": "그런데 어느 날",
                    "characters": ["주인공", "새로운 인물"],
                    "key_content": "일상을 깨뜨리는 특별한 사건",
                    "summary": "변화의 계기가 되는 사건 발생"
                }},
                {{
                    "title": "성장의 여정",
                    "stage": "시련",
                    "stage_name": "그래서",
                    "characters": ["주인공", "동료들"],
                    "key_content": "연속되는 도전과 실패, 그리고 성장",
                    "summary": "시련을 통한 주인공의 내적 성장"
                }},
                {{
                    "title": "새로운 시작",
                    "stage": "변화",
                    "stage_name": "마침내",
                    "characters": ["성장한 주인공"],
                    "key_content": "근본적으로 변화한 주인공의 모습",
                    "summary": "성장을 통해 얻은 새로운 관점과 삶"
                }}
            ]
        }}""",
            
            'deductive': """다음 형식의 JSON으로 응답해주세요:
        {{
            "stories": [
                {{
                    "title": "핵심 주장",
                    "stage": "주장",
                    "stage_name": "결론 제시",
                    "characters": ["화자/내레이터"],
                    "key_content": "영상의 핵심 메시지와 주장",
                    "summary": "시청자에게 전달할 핵심 결론을 명확히 제시"
                }},
                {{
                    "title": "첫 번째 증거",
                    "stage": "근거1",
                    "stage_name": "핵심 증거",
                    "characters": ["전문가", "사례 주인공"],
                    "key_content": "가장 강력한 증거나 사례",
                    "summary": "주장을 뒷받침하는 구체적인 데이터나 사례"
                }},
                {{
                    "title": "추가 증거들",
                    "stage": "근거2",
                    "stage_name": "심화 분석",
                    "characters": ["다양한 증언자"],
                    "key_content": "다각도의 추가 증거와 반박",
                    "summary": "더 깊은 분석과 다양한 관점의 증거"
                }},
                {{
                    "title": "강력한 마무리",
                    "stage": "종합",
                    "stage_name": "행동 촉구",
                    "characters": ["화자"],
                    "key_content": "모든 증거의 종합과 행동 제안",
                    "summary": "시청자가 취할 수 있는 구체적 행동 제시"
                }}
            ]
        }}""",
            
            'inductive': """다음 형식의 JSON으로 응답해주세요:
        {{
            "stories": [
                {{
                    "title": "흥미로운 사례",
                    "stage": "사례1",
                    "stage_name": "첫 번째 관찰",
                    "characters": ["사례 주인공"],
                    "key_content": "구체적이고 생생한 개별 사례",
                    "summary": "시청자의 호기심을 자극하는 첫 번째 현상"
                }},
                {{
                    "title": "유사한 패턴들",
                    "stage": "사례2",
                    "stage_name": "패턴 축적",
                    "characters": ["다양한 사례들"],
                    "key_content": "비슷한 현상의 반복",
                    "summary": "여러 상황에서 나타나는 유사한 패턴들"
                }},
                {{
                    "title": "패턴의 의미",
                    "stage": "분석",
                    "stage_name": "패턴 발견",
                    "characters": ["분석가/내레이터"],
                    "key_content": "공통 패턴의 발견과 분석",
                    "summary": "왜 이런 패턴이 나타나는지 분석"
                }},
                {{
                    "title": "보편적 원리",
                    "stage": "결론",
                    "stage_name": "원리 도출",
                    "characters": ["화자"],
                    "key_content": "개별에서 보편으로",
                    "summary": "발견한 원리의 보편적 적용 가능성"
                }}
            ]
        }}""",
            
            'documentary': """다음 형식의 JSON으로 응답해주세요:
        {{
            "stories": [
                {{
                    "title": "문제의 발견",
                    "stage": "문제",
                    "stage_name": "탐사 시작",
                    "characters": ["탐사자", "제보자"],
                    "key_content": "해결해야 할 문제나 미스터리",
                    "summary": "왜 이 문제가 중요한지, 탐사의 시작"
                }},
                {{
                    "title": "깊이 있는 취재",
                    "stage": "조사",
                    "stage_name": "현장 탐사",
                    "characters": ["전문가들", "증언자들"],
                    "key_content": "직접 취재와 인터뷰",
                    "summary": "문제의 실체를 파악하기 위한 깊이 있는 조사"
                }},
                {{
                    "title": "복잡한 진실",
                    "stage": "갈등",
                    "stage_name": "대립과 복잡성",
                    "characters": ["대립하는 입장들"],
                    "key_content": "서로 다른 의견과 복잡한 본질",
                    "summary": "단순하지 않은 문제의 복잡한 실체"
                }},
                {{
                    "title": "새로운 이해",
                    "stage": "통찰",
                    "stage_name": "메시지",
                    "characters": ["내레이터"],
                    "key_content": "종합된 이해와 통찰",
                    "summary": "조사를 통해 얻은 새로운 이해와 메시지"
                }}
            ]
        }}"""
        }
        
        return formats.get(framework, formats['classic'])
    
    def summarize_for_pdf(self, planning_data):
        """PDF 내보내기를 위한 기획안 요약 및 정리"""
        try:
            # 사용자 설정값 추출
            user_settings = {
                'tone': planning_data.get('tone', ''),
                'genre': planning_data.get('genre', ''),
                'concept': planning_data.get('concept', ''),
                'target': planning_data.get('target', ''),
                'purpose': planning_data.get('purpose', ''),
                'duration': planning_data.get('duration', ''),
                'aspectRatio': planning_data.get('planning_options', {}).get('aspectRatio', '16:9'),
                'platform': planning_data.get('planning_options', {}).get('platform', ''),
                'colorTone': planning_data.get('planning_options', {}).get('colorTone', ''),
                'editingStyle': planning_data.get('planning_options', {}).get('editingStyle', ''),
                'musicStyle': planning_data.get('planning_options', {}).get('musicStyle', ''),
                'storyFramework': planning_data.get('planning_options', {}).get('storyFramework', ''),
                'characterName': planning_data.get('planning_options', {}).get('characterName', ''),
                'characterDescription': planning_data.get('planning_options', {}).get('characterDescription', '')
            }
            
            prompt = f"""
다음 영상 기획안을 압축된 형태로 정리해주세요. 
PDF로 내보낼 때 장수를 최소화하면서도 핵심 정보를 모두 담아야 합니다.

[사용자 설정 정보]
- 톤앤매너: {user_settings['tone']}
- 장르: {user_settings['genre']} 
- 컨셉: {user_settings['concept']}
- 타겟: {user_settings['target']}
- 목적: {user_settings['purpose']}
- 러닝타임: {user_settings['duration']}
- 화면비율: {user_settings['aspectRatio']}
- 플랫폼: {user_settings['platform']}
- 색감: {user_settings['colorTone']}
- 편집스타일: {user_settings['editingStyle']}
- 음악스타일: {user_settings['musicStyle']}
- 스토리전개: {user_settings['storyFramework']}
- 주인공: {user_settings['characterName']} - {user_settings['characterDescription']}

[기획 내용]
{planning_data.get('planning_text', '')}

[스토리 구성]
{json.dumps(planning_data.get('stories', []), ensure_ascii=False)}

[씬 정보]
{json.dumps(planning_data.get('scenes', []), ensure_ascii=False)}

다음 형식으로 압축 정리해주세요:

1. **핵심 콘셉트** (한 문장으로)
2. **프로젝트 스펙** (표 형태로 정리)
   - 기본 정보 (장르, 타겟, 러닝타임 등)
   - 기술 사양 (화면비율, 플랫폼, 색감 등)
   - 스토리 설정 (주인공, 스토리전개 방식 등)
3. **스토리 요약** (3-4문장으로 전체 스토리 압축)
4. **씬별 핵심 포인트** (각 씬당 1-2줄로 압축)
5. **제작 노트** (특별히 주의할 사항이나 핵심 메시지)

각 섹션은 최대한 간결하게 작성하되, 실제 제작에 필요한 정보는 빠짐없이 포함해주세요.
"""
            
            response = self.pro_model.generate_content(prompt)
            summary = response.text
            
            # JSON 형태로 파싱하여 반환
            return {
                'success': True,
                'summary': summary,
                'original_settings': user_settings
            }
            
        except Exception as e:
            logger.error(f"PDF 요약 생성 오류: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'summary': None
            }
    
    def _get_fallback_stories(self, framework):
        """프레임워크별 폴백 스토리 반환"""
        fallback_stories = {
            'classic': [
                {
                    "title": "새로운 시작",
                    "stage": "기",
                    "stage_name": "도입부",
                    "characters": ["주인공", "조력자"],
                    "key_content": "평범한 일상에서 특별한 기회를 발견하는 순간",
                    "summary": "주인공이 일상적인 삶을 살다가 새로운 가능성을 발견하게 되는 이야기의 시작."
                },
                {
                    "title": "도전의 길",
                    "stage": "승",
                    "stage_name": "전개부",
                    "characters": ["주인공", "조력자", "경쟁자"],
                    "key_content": "목표를 향해 나아가며 겪는 시행착오와 성장",
                    "summary": "주인공이 목표를 설정하고 본격적으로 도전하는 과정."
                },
                {
                    "title": "위기의 순간",
                    "stage": "전",
                    "stage_name": "전환부",
                    "characters": ["주인공", "조력자", "대립자"],
                    "key_content": "예상치 못한 위기와 갈등이 최고조에 달하는 순간",
                    "summary": "주인공이 가장 큰 위기에 직면하고 극적인 반전이 일어남."
                },
                {
                    "title": "새로운 미래",
                    "stage": "결",
                    "stage_name": "결말부",
                    "characters": ["주인공", "조력자", "새로운 동료들"],
                    "key_content": "위기를 극복하고 얻은 성장과 새로운 시작",
                    "summary": "주인공이 모든 시련을 극복하고 목표를 달성함."
                }
            ],
            'hook_immersion': [
                {
                    "title": "강렬한 시작",
                    "stage": "훅",
                    "stage_name": "시선 강탈",
                    "characters": ["주인공"],
                    "key_content": "시청자의 시선을 사로잡는 충격적인 장면",
                    "summary": "평범한 일상이 한순간에 뒤집히는 충격적인 사건으로 시작."
                },
                {
                    "title": "깊이 있는 전개",
                    "stage": "몰입",
                    "stage_name": "깊이 있는 전개",
                    "characters": ["주인공", "핵심 인물들"],
                    "key_content": "이야기의 본격적인 전개와 캐릭터 탐구",
                    "summary": "시청자를 이야기 속으로 끌어들이는 매력적인 전개."
                },
                {
                    "title": "예상을 뒤엎다",
                    "stage": "반전",
                    "stage_name": "예상을 뒤엎다",
                    "characters": ["주인공", "숨겨진 인물"],
                    "key_content": "모든 것을 뒤바꾸는 충격적인 진실",
                    "summary": "기존의 이해를 완전히 뒤집는 놀라운 반전."
                },
                {
                    "title": "다음이 궁금한",
                    "stage": "떡밥",
                    "stage_name": "열린 결말",
                    "characters": ["주인공"],
                    "key_content": "풀리지 않은 미스터리와 새로운 시작",
                    "summary": "다음 이야기가 궁금하게 만드는 여운 있는 마무리."
                }
            ],
            'pixar': [
                {
                    "title": "평범한 일상",
                    "stage": "일상",
                    "stage_name": "옛날 옛적에",
                    "characters": ["주인공", "주변 인물"],
                    "key_content": "안정적이지만 뭔가 부족한 일상",
                    "summary": "주인공의 평범하지만 불완전한 삶의 모습."
                },
                {
                    "title": "예상치 못한 변화",
                    "stage": "균열",
                    "stage_name": "그런데 어느 날",
                    "characters": ["주인공", "새로운 인물"],
                    "key_content": "일상을 깨뜨리는 특별한 사건",
                    "summary": "평온한 일상에 찾아온 예상치 못한 변화."
                },
                {
                    "title": "성장의 여정",
                    "stage": "시련",
                    "stage_name": "그래서",
                    "characters": ["주인공", "동료들"],
                    "key_content": "연속되는 도전과 실패, 그리고 성장",
                    "summary": "시련을 통해 성장하는 주인공의 여정."
                },
                {
                    "title": "새로운 자신",
                    "stage": "변화",
                    "stage_name": "마침내",
                    "characters": ["성장한 주인공"],
                    "key_content": "근본적으로 변화한 주인공의 모습",
                    "summary": "성장을 통해 새로운 관점을 얻은 주인공."
                }
            ],
            'deductive': [
                {
                    "title": "핵심 메시지",
                    "stage": "주장",
                    "stage_name": "결론 제시",
                    "characters": ["화자/내레이터"],
                    "key_content": "영상의 핵심 메시지와 주장",
                    "summary": "시청자에게 전달할 핵심 결론을 명확히 제시."
                },
                {
                    "title": "강력한 증거",
                    "stage": "근거1",
                    "stage_name": "핵심 증거",
                    "characters": ["전문가", "사례 주인공"],
                    "key_content": "가장 강력한 증거나 사례",
                    "summary": "주장을 뒷받침하는 구체적인 데이터나 사례."
                },
                {
                    "title": "추가적인 근거",
                    "stage": "근거2",
                    "stage_name": "심화 분석",
                    "characters": ["다양한 증언자"],
                    "key_content": "다각도의 추가 증거와 분석",
                    "summary": "더 깊은 분석과 다양한 관점의 증거."
                },
                {
                    "title": "행동 촉구",
                    "stage": "종합",
                    "stage_name": "행동 촉구",
                    "characters": ["화자"],
                    "key_content": "모든 증거의 종합과 행동 제안",
                    "summary": "시청자가 취할 수 있는 구체적 행동 제시."
                }
            ],
            'inductive': [
                {
                    "title": "첫 번째 관찰",
                    "stage": "사례1",
                    "stage_name": "첫 번째 관찰",
                    "characters": ["관찰자", "사례 주인공"],
                    "key_content": "흥미로운 개별 현상의 발견",
                    "summary": "특정 상황에서 발견한 흥미로운 첫 번째 사례"
                },
                {
                    "title": "패턴의 반복",
                    "stage": "사례2",
                    "stage_name": "패턴 축적",
                    "characters": ["다양한 사례 주인공들"],
                    "key_content": "유사한 현상들의 반복적 관찰",
                    "summary": "여러 상황에서 비슷한 패턴이 반복되는 것을 발견"
                },
                {
                    "title": "공통점 발견",
                    "stage": "분석",
                    "stage_name": "패턴 발견",
                    "characters": ["분석가", "내레이터"],
                    "key_content": "사례들 간의 공통 패턴 도출",
                    "summary": "개별 사례들에서 공통적인 패턴과 원인을 분석"
                },
                {
                    "title": "보편적 원리",
                    "stage": "결론",
                    "stage_name": "원리 도출",
                    "characters": ["화자"],
                    "key_content": "개별 사례에서 보편적 진리로",
                    "summary": "발견한 패턴을 통해 보편적으로 적용 가능한 원리 도출"
                }
            ],
            'documentary': [
                {
                    "title": "문제의 발견",
                    "stage": "문제",
                    "stage_name": "탐사 시작",
                    "characters": ["탐사자", "제보자"],
                    "key_content": "해결해야 할 문제나 미스터리",
                    "summary": "탐사가 필요한 중요한 문제의 발견."
                },
                {
                    "title": "깊이 있는 조사",
                    "stage": "탐사",
                    "stage_name": "현장 탐사",
                    "characters": ["전문가", "당사자"],
                    "key_content": "현장 취재와 전문가 인터뷰",
                    "summary": "문제를 깊이 있게 조사하고 분석."
                },
                {
                    "title": "복잡한 진실",
                    "stage": "갈등",
                    "stage_name": "대립과 복잡성",
                    "characters": ["대립하는 입장들"],
                    "key_content": "서로 다른 의견과 복잡한 현실",
                    "summary": "문제의 복잡성과 다양한 관점 제시."
                },
                {
                    "title": "새로운 이해",
                    "stage": "통찰",
                    "stage_name": "메시지",
                    "characters": ["화자"],
                    "key_content": "조사 결과와 새로운 통찰",
                    "summary": "탐사를 통해 얻은 새로운 이해와 메시지."
                }
            ]
        }
        
        # 요청된 프레임워크의 폴백 스토리가 있으면 반환, 없으면 classic 반환
        return fallback_stories.get(framework, fallback_stories['classic'])
    
    def _update_token_usage(self, feature, prompt_tokens, response_tokens):
        """토큰 사용량 업데이트"""
        total_tokens = prompt_tokens + response_tokens
        
        # 전체 사용량 업데이트
        self.token_usage['total'] += total_tokens
        self.token_usage['prompt'] += prompt_tokens
        self.token_usage['response'] += response_tokens
        
        # 기능별 사용량 업데이트
        if feature in self.token_usage['by_feature']:
            self.token_usage['by_feature'][feature]['prompt'] += prompt_tokens
            self.token_usage['by_feature'][feature]['response'] += response_tokens
            self.token_usage['by_feature'][feature]['total'] += total_tokens
    
    def get_token_usage(self):
        """토큰 사용량 조회"""
        return self.token_usage
    
    def reset_token_usage(self):
        """토큰 사용량 초기화"""
        self.token_usage = {
            'total': 0,
            'prompt': 0,
            'response': 0,
            'by_feature': {
                'story': {'prompt': 0, 'response': 0, 'total': 0},
                'scene': {'prompt': 0, 'response': 0, 'total': 0},
                'shot': {'prompt': 0, 'response': 0, 'total': 0},
                'storyboard': {'prompt': 0, 'response': 0, 'total': 0}
            }
        }