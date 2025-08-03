"""
AI 기반 영상 기획 프롬프트 생성 모듈
"""
import json
from typing import Dict, List, Optional
import openai
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class VideoPlanningPromptGenerator:
    """영상 기획을 위한 AI 프롬프트 생성기"""
    
    def __init__(self):
        self.api_key = getattr(settings, 'OPENAI_API_KEY', None)
        if self.api_key:
            openai.api_key = self.api_key
    
    def generate_quick_suggestions(self, project_data: Dict) -> Dict:
        """프로젝트 기본 정보로부터 빠른 제안 생성"""
        try:
            prompt = self._build_suggestion_prompt(project_data)
            
            # 실제 OpenAI API 호출 (API 키가 없으면 더미 데이터 반환)
            if not self.api_key:
                return self._get_dummy_suggestions(project_data)
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "당신은 전문 영상 기획자입니다. 간결하고 실용적인 조언을 제공하세요."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            return self._parse_suggestion_response(response.choices[0].message.content)
            
        except Exception as e:
            logger.error(f"AI 제안 생성 오류: {str(e)}")
            return self._get_dummy_suggestions(project_data)
    
    def generate_full_planning(self, planning_data: Dict) -> Dict:
        """완전한 영상 기획안 생성"""
        try:
            # 프로젝트 타입별 템플릿 선택
            template = self._get_planning_template(planning_data['projectType'])
            
            # AI 프롬프트 구성
            prompt = self._build_full_planning_prompt(planning_data, template)
            
            # 실제 API 호출 또는 더미 데이터
            if not self.api_key:
                return self._get_dummy_full_planning(planning_data)
            
            response = openai.ChatCompletion.create(
                model="gpt-4" if planning_data.get('enableProOptions') else "gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "당신은 전문 영상 기획자입니다. 구조화된 영상 기획안을 작성하세요."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=2000
            )
            
            return self._parse_planning_response(response.choices[0].message.content, planning_data)
            
        except Exception as e:
            logger.error(f"전체 기획 생성 오류: {str(e)}")
            return self._get_dummy_full_planning(planning_data)
    
    def _build_suggestion_prompt(self, data: Dict) -> str:
        """제안 생성을 위한 프롬프트 구성"""
        return f"""
        다음 영상 프로젝트에 대한 간단한 제안을 해주세요:
        - 프로젝트 유형: {data.get('project_type')}
        - 주제: {data.get('main_topic')}
        - 타겟 시청자: {data.get('target_audience')}
        - 영상 길이: {data.get('duration')}
        
        다음 형식으로 답변해주세요:
        1. 추천 구성 (기승전결)
        2. 핵심 키워드 3-5개
        3. 제작 팁 1-2개
        """
    
    def _build_full_planning_prompt(self, data: Dict, template: Dict) -> str:
        """전체 기획 생성을 위한 프롬프트 구성"""
        pro_options = ""
        if data.get('enableProOptions'):
            pro_options = f"""
            프로 옵션 설정:
            - 컬러톤: {data.get('colorTone')}
            - 화면 비율: {data.get('aspectRatio')}
            - 카메라 종류: {data.get('cameraType')}
            - 렌즈: {data.get('lensType')}
            - 카메라 워킹: {data.get('cameraMovement')}
            """
        
        return f"""
        다음 정보를 바탕으로 완전한 영상 기획안을 작성해주세요:
        
        기본 정보:
        - 프로젝트 유형: {data.get('projectType')}
        - 영상 길이: {data.get('duration')}
        - 타겟 시청자: {data.get('targetAudience')}
        - 주제: {data.get('mainTopic')}
        - 핵심 메시지: {data.get('keyMessage')}
        - 원하는 분위기: {data.get('desiredMood')}
        
        {pro_options}
        
        다음 구조로 작성해주세요:
        1. 전체 기획 개요 (200자)
        2. 기승전결 4개 스토리 (각 100자)
        3. 각 스토리별 3개 씬 (총 12개, 각 50자)
        4. 주요 촬영 포인트
        5. 예상되는 어려움과 해결방안
        """
    
    def _get_planning_template(self, project_type: str) -> Dict:
        """프로젝트 타입별 기획 템플릿"""
        templates = {
            'youtube': {
                'structure': '인트로(10%) - 본론(70%) - 아웃트로(20%)',
                'key_elements': ['후킹', '정보전달', 'CTA'],
                'tips': '첫 15초가 중요합니다'
            },
            'corporate': {
                'structure': '문제제기 - 솔루션 - 성과 - 비전',
                'key_elements': ['신뢰성', '전문성', '비전'],
                'tips': '구체적인 수치와 사례를 활용하세요'
            },
            'advertisement': {
                'structure': '어텐션 - 관심 - 욕구 - 행동',
                'key_elements': ['임팩트', '감성', 'CTA'],
                'tips': '단순하고 명확한 메시지가 중요합니다'
            },
            'documentary': {
                'structure': '도입 - 전개 - 위기 - 해결',
                'key_elements': ['진정성', '깊이', '공감'],
                'tips': '스토리텔링과 팩트의 균형을 맞추세요'
            }
        }
        return templates.get(project_type, templates['youtube'])
    
    def _parse_suggestion_response(self, response: str) -> Dict:
        """AI 응답을 구조화된 제안으로 파싱"""
        # 실제 구현에서는 더 정교한 파싱 로직 필요
        lines = response.strip().split('\n')
        return {
            'structure': lines[0] if len(lines) > 0 else '',
            'keywords': lines[1].split(',') if len(lines) > 1 else [],
            'tips': lines[2] if len(lines) > 2 else ''
        }
    
    def _parse_planning_response(self, response: str, original_data: Dict) -> Dict:
        """AI 응답을 완전한 기획안으로 파싱"""
        # 실제 구현에서는 더 정교한 파싱 로직 필요
        return {
            'title': original_data.get('mainTopic', '제목 없음'),
            'planning': response[:500],  # 전체 개요
            'stories': self._generate_stories_from_response(response),
            'scenes': self._generate_scenes_from_response(response),
            'id': None  # 저장 후 ID 할당
        }
    
    def _generate_stories_from_response(self, response: str) -> List[Dict]:
        """응답에서 스토리 추출"""
        # 더미 구현
        stages = ['기', '승', '전', '결']
        stories = []
        for i, stage in enumerate(stages):
            stories.append({
                'stage': stage,
                'stage_name': f"{stage} - 파트 {i+1}",
                'content': f"AI가 생성한 {stage} 부분 스토리입니다.",
                'order': i
            })
        return stories
    
    def _generate_scenes_from_response(self, response: str) -> List[Dict]:
        """응답에서 씬 추출"""
        # 더미 구현
        scenes = []
        for story_idx in range(4):
            for scene_idx in range(3):
                scenes.append({
                    'story_index': story_idx,
                    'scene_number': scene_idx + 1,
                    'title': f"씬 {story_idx * 3 + scene_idx + 1}",
                    'description': f"AI가 생성한 씬 설명입니다.",
                    'duration': '30초'
                })
        return scenes
    
    def _get_dummy_suggestions(self, data: Dict) -> Dict:
        """더미 제안 데이터"""
        project_type = data.get('project_type', 'youtube')
        
        suggestions = {
            'youtube': {
                'structure': '후킹(15초) → 문제 제기(30초) → 해결책 제시(2분) → 실제 적용(3분) → 마무리(30초)',
                'keywords': ['실용적', '따라하기 쉬운', '일상 활용', '꿀팁', '효과적인'],
                'tips': '시청자가 바로 따라할 수 있는 단계별 가이드를 제공하고, 실패 사례도 함께 보여주면 신뢰감을 높일 수 있습니다.'
            },
            'corporate': {
                'structure': '기업 비전(30초) → 핵심 가치(1분) → 성공 사례(1분) → 미래 전망(30초)',
                'keywords': ['혁신', '신뢰', '전문성', '파트너십', '성장'],
                'tips': '구체적인 숫자와 실제 고객 사례를 활용하여 신뢰성을 높이세요.'
            },
            'advertisement': {
                'structure': '문제 상황(5초) → 제품 등장(10초) → 사용 후 변화(10초) → 행동 유도(5초)',
                'keywords': ['변화', '즉각적', '편리함', '만족', '특별함'],
                'tips': '첫 3초 안에 시청자의 관심을 끌 수 있는 강력한 비주얼이나 질문을 사용하세요.'
            },
            'documentary': {
                'structure': '주제 소개(1분) → 현황 분석(3분) → 심층 탐구(4분) → 시사점(2분)',
                'keywords': ['진실', '발견', '탐구', '인사이트', '변화'],
                'tips': '객관적인 데이터와 감성적인 스토리의 균형을 맞추어 시청자의 공감을 이끌어내세요.'
            }
        }
        
        return suggestions.get(project_type, suggestions['youtube'])
    
    def _get_dummy_full_planning(self, data: Dict) -> Dict:
        """더미 전체 기획 데이터"""
        project_type = data.get('projectType', 'youtube')
        main_topic = data.get('mainTopic', '주제')
        
        # 기본 기획안
        planning_text = f"""
        [{main_topic}] 영상 기획안
        
        타겟: {data.get('targetAudience', '일반')}
        길이: {data.get('duration', '5분')}
        분위기: {data.get('desiredMood', '친근한')}
        
        핵심 메시지: {data.get('keyMessage', '시청자에게 가치를 전달합니다')}
        
        이 영상은 {main_topic}에 대해 {data.get('targetAudience', '시청자')}가 
        쉽게 이해하고 공감할 수 있도록 구성됩니다.
        """
        
        # 기승전결 스토리
        stories = [
            {
                'stage': '기',
                'stage_name': '도입부',
                'content': f"{main_topic}의 중요성을 시청자가 공감할 수 있는 일상적인 상황으로 시작합니다. 호기심을 자극하는 질문이나 놀라운 사실을 제시합니다.",
                'order': 0
            },
            {
                'stage': '승',
                'stage_name': '전개부',
                'content': f"{main_topic}에 대한 구체적인 정보와 사례를 제시합니다. 시청자가 이해하기 쉽도록 단계별로 설명하며 시각적 자료를 활용합니다.",
                'order': 1
            },
            {
                'stage': '전',
                'stage_name': '절정부',
                'content': f"{main_topic}의 핵심 포인트를 집중적으로 다룹니다. 가장 중요한 메시지를 전달하고 실제 적용 방법을 보여줍니다.",
                'order': 2
            },
            {
                'stage': '결',
                'stage_name': '마무리',
                'content': f"전체 내용을 요약하고 {main_topic}의 가치를 재확인합니다. 시청자가 행동할 수 있는 구체적인 방법을 제시하며 마무리합니다.",
                'order': 3
            }
        ]
        
        # 각 스토리별 3개씩 씬 생성
        scenes = []
        for story_idx, story in enumerate(stories):
            for scene_idx in range(3):
                scene_num = story_idx * 3 + scene_idx + 1
                scenes.append({
                    'story_index': story_idx,
                    'scene_number': scene_idx + 1,
                    'title': f"{story['stage']} - 씬 {scene_idx + 1}",
                    'description': f"{story['stage']} 파트의 {scene_idx + 1}번째 장면입니다. {story['content'][:50]}...",
                    'duration': '20-30초',
                    'camera_notes': data.get('cameraMovement', 'static') if data.get('enableProOptions') else None,
                    'color_tone': data.get('colorTone', 'natural') if data.get('enableProOptions') else None
                })
        
        return {
            'id': None,
            'title': f"[AI 생성] {main_topic} - {project_type} 영상 기획",
            'planning': planning_text,
            'stories': stories,
            'scenes': scenes,
            'shots': [],  # 샷은 나중에 추가
            'storyboards': [],  # 스토리보드는 나중에 생성
            'pro_options': {
                'colorTone': data.get('colorTone'),
                'aspectRatio': data.get('aspectRatio'),
                'cameraType': data.get('cameraType'),
                'lensType': data.get('lensType'),
                'cameraMovement': data.get('cameraMovement')
            } if data.get('enableProOptions') else None
        }

# VEO3 비디오 생성 프롬프트 생성기
class VEO3PromptGenerator:
    """VEO3 비디오 생성을 위한 프롬프트 생성기"""
    
    def generate_video_prompt(self, scene_data: Dict, pro_options: Dict = None) -> str:
        """씬 데이터로부터 VEO3용 비디오 생성 프롬프트 생성"""
        
        base_prompt = f"{scene_data.get('description', '')}"
        
        if pro_options:
            # 프로 옵션이 있으면 기술적 세부사항 추가
            technical_details = []
            
            if pro_options.get('colorTone'):
                color_mapping = {
                    'natural': 'natural lighting',
                    'warm': 'warm color grading',
                    'cool': 'cool blue tones',
                    'cinematic': 'cinematic color grading',
                    'vibrant': 'vibrant saturated colors'
                }
                technical_details.append(color_mapping.get(pro_options['colorTone'], ''))
            
            if pro_options.get('cameraType'):
                camera_mapping = {
                    'dslr': 'shot with DSLR camera',
                    'cinema': 'shot with cinema camera, shallow depth of field',
                    'smartphone': 'shot with smartphone',
                    'drone': 'aerial drone footage'
                }
                technical_details.append(camera_mapping.get(pro_options['cameraType'], ''))
            
            if pro_options.get('lensType'):
                lens_mapping = {
                    '24mm': '24mm wide angle lens',
                    '35mm': '35mm lens',
                    '50mm': '50mm standard lens',
                    '85mm': '85mm portrait lens, bokeh',
                    'zoom': 'zoom lens'
                }
                technical_details.append(lens_mapping.get(pro_options['lensType'], ''))
            
            if pro_options.get('cameraMovement'):
                movement_mapping = {
                    'static': 'static shot',
                    'pan': 'smooth panning movement',
                    'tilt': 'tilting camera movement',
                    'dolly': 'dolly camera movement',
                    'handheld': 'handheld camera movement'
                }
                technical_details.append(movement_mapping.get(pro_options['cameraMovement'], ''))
            
            if technical_details:
                base_prompt += f", {', '.join(filter(None, technical_details))}"
        
        return base_prompt
    
    def generate_image_prompt(self, scene_data: Dict, pro_options: Dict = None) -> str:
        """씬 데이터로부터 고품질 이미지 생성 프롬프트 생성"""
        
        base_prompt = f"cinematic still frame, {scene_data.get('description', '')}"
        
        if pro_options:
            # 이미지용 프로 옵션 적용
            if pro_options.get('aspectRatio'):
                base_prompt += f", aspect ratio {pro_options['aspectRatio']}"
            
            if pro_options.get('colorTone'):
                base_prompt += f", {pro_options['colorTone']} color grading"
        
        # 고품질 키워드 추가
        base_prompt += ", highly detailed, professional photography, 8k resolution"
        
        return base_prompt