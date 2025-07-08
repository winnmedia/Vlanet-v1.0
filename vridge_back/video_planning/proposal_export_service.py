"""
AI 기반 기획안 내보내기 서비스
Google Gemini와 Google Slides API를 활용하여 자유 형식의 한글 텍스트를 구조화된 기획안으로 변환
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
import google.generativeai as genai
from django.conf import settings
from .google_slides_service import GoogleSlidesService

logger = logging.getLogger(__name__)


class ProposalExportService:
    """기획안 내보내기 전용 서비스"""
    
    def __init__(self):
        # Gemini API 초기화
        api_key = getattr(settings, 'GOOGLE_API_KEY', None) or os.environ.get('GOOGLE_API_KEY')
        if not api_key:
            raise ValueError("GOOGLE_API_KEY가 설정되지 않았습니다.")
        
        genai.configure(api_key=api_key)
        self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Google Slides 서비스 초기화
        try:
            self.slides_service = GoogleSlidesService()
            self.slides_available = self.slides_service.service is not None
        except Exception as e:
            logger.error(f"Google Slides 서비스 초기화 실패: {e}")
            self.slides_service = None
            self.slides_available = False
    
    def process_proposal_text(self, raw_text: str) -> Dict[str, Any]:
        """
        자유 형식의 한글 텍스트를 구조화된 기획안으로 변환
        
        Args:
            raw_text: 사용자가 입력한 자유 형식의 기획안 텍스트
            
        Returns:
            구조화된 기획안 데이터
        """
        try:
            prompt = self._create_structuring_prompt(raw_text)
            response = self.gemini_model.generate_content(prompt)
            response_text = response.text.strip()
            
            # JSON 파싱 전처리
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            structured_data = json.loads(response_text)
            return {
                'success': True,
                'data': structured_data,
                'original_text': raw_text
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON 파싱 오류: {e}")
            return self._get_fallback_structure(raw_text)
        except Exception as e:
            logger.error(f"텍스트 구조화 실패: {e}")
            return self._get_fallback_structure(raw_text)
    
    def _create_structuring_prompt(self, raw_text: str) -> str:
        """
        Gemini API용 기획안 구조화 프롬프트 생성
        
        A4 가로형 슬라이드에 최적화된 구성으로 프롬프트 설계
        """
        return f"""
당신은 전문 영상 기획자이자 프레젠테이션 전문가입니다. 
사용자가 제공한 자유 형식의 기획안 텍스트를 A4 가로형 Google Slides에 최적화된 구조로 변환해주세요.

** 중요한 설계 원칙 **
1. A4 가로형(16:9) 슬라이드에 적합한 레이아웃
2. 각 슬라이드당 최대 5-7개의 불릿 포인트
3. 제목은 한 줄로 간결하게
4. 본문은 읽기 쉽도록 단락별로 구분
5. 시각적 임팩트를 위한 키워드 강조

** 입력 텍스트 **
{raw_text}

** 출력 형식 **
다음 JSON 구조로 응답해주세요:

{{
    "metadata": {{
        "title": "기획안 제목 (20자 이내)",
        "subtitle": "부제목 (30자 이내)",
        "project_type": "영상 유형 (예: 홍보영상, 교육콘텐츠, 브랜드필름 등)",
        "target_audience": "타겟 오디언스",
        "duration": "예상 러닝타임",
        "budget_range": "예상 예산 범위 (있는 경우)",
        "deadline": "마감일 (있는 경우)"
    }},
    "slides": [
        {{
            "slide_number": 1,
            "layout": "TITLE",
            "title": "슬라이드 제목",
            "content": {{
                "title_text": "메인 제목",
                "subtitle_text": "부제목"
            }}
        }},
        {{
            "slide_number": 2,
            "layout": "TITLE_AND_BODY",
            "title": "프로젝트 개요",
            "content": {{
                "bullet_points": [
                    "• 프로젝트 목적: 명확한 목적 설명",
                    "• 타겟 오디언스: 구체적인 타겟층",
                    "• 기대 효과: 예상되는 결과",
                    "• 차별화 포인트: 경쟁 우위 요소"
                ]
            }}
        }},
        {{
            "slide_number": 3,
            "layout": "TITLE_AND_TWO_COLUMNS",
            "title": "콘텐츠 구성",
            "content": {{
                "left_column": [
                    "• 도입부 (10-15%)",
                    "• 문제 제기 또는 상황 설정",
                    "• 시청자 관심 유발"
                ],
                "right_column": [
                    "• 본론 (70-80%)",
                    "• 핵심 메시지 전달",
                    "• 해결책 또는 가치 제안"
                ]
            }}
        }},
        {{
            "slide_number": 4,
            "layout": "TITLE_AND_BODY",
            "title": "제작 계획",
            "content": {{
                "bullet_points": [
                    "• 촬영 장소: 구체적인 로케이션",
                    "• 촬영 일정: 세부 스케줄",
                    "• 필요 장비: 카메라, 조명, 음향 등",
                    "• 후반 작업: 편집, 색보정, 사운드"
                ]
            }}
        }},
        {{
            "slide_number": 5,
            "layout": "TITLE_AND_BODY",
            "title": "예산 및 일정",
            "content": {{
                "budget_breakdown": [
                    "• 기획/시나리오: 예산 비율",
                    "• 촬영비: 장비 및 인건비",
                    "• 후반작업: 편집 및 CG",
                    "• 기타 비용: 교통비, 식비 등"
                ],
                "timeline": [
                    "• 기획 단계: 기간",
                    "• 촬영 단계: 기간", 
                    "• 후반 작업: 기간",
                    "• 최종 납품: 예정일"
                ]
            }}
        }},
        {{
            "slide_number": 6,
            "layout": "TITLE_AND_BODY",
            "title": "기대 효과 및 성과 지표",
            "content": {{
                "bullet_points": [
                    "• 브랜드 인지도 향상",
                    "• 타겟 오디언스 참여도 증가",
                    "• 구체적인 KPI 목표",
                    "• 측정 방법 및 평가 기준"
                ]
            }}
        }}
    ]
}}

** 주의사항 **
1. 입력 텍스트에서 명시적으로 언급되지 않은 내용은 "입력 텍스트 기반으로 작성 필요"로 표기
2. 불릿 포인트는 각각 15-25자 내외로 간결하게
3. 전문적이고 설득력 있는 표현 사용
4. 슬라이드 간 논리적 연결성 유지
5. A4 가로형 레이아웃에 최적화된 텍스트 양 조절

반드시 유효한 JSON 형식으로만 응답해주세요.
"""
    
    def _get_fallback_structure(self, raw_text: str) -> Dict[str, Any]:
        """Gemini API 실패 시 사용할 기본 구조"""
        return {
            'success': False,
            'error': 'AI 구조화 실패',
            'data': {
                'metadata': {
                    'title': '영상 기획안',
                    'subtitle': '구조화 프로세싱 중...',
                    'project_type': '일반',
                    'target_audience': '입력 텍스트 분석 필요',
                    'duration': '분석 필요',
                    'budget_range': '입력 텍스트 기반으로 작성 필요',
                    'deadline': '입력 텍스트 기반으로 작성 필요'
                },
                'slides': [
                    {
                        'slide_number': 1,
                        'layout': 'TITLE',
                        'title': '영상 기획안',
                        'content': {
                            'title_text': '영상 기획안',
                            'subtitle_text': '사용자 입력 기반 기획서'
                        }
                    },
                    {
                        'slide_number': 2,
                        'layout': 'TITLE_AND_BODY',
                        'title': '원본 기획 내용',
                        'content': {
                            'bullet_points': [
                                f'• 사용자 입력: {raw_text[:100]}...',
                                '• AI 구조화 재시도 필요',
                                '• 수동 편집 권장'
                            ]
                        }
                    }
                ]
            },
            'original_text': raw_text
        }
    
    def create_google_slides(self, structured_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        구조화된 데이터로 Google Slides 프레젠테이션 생성
        
        Args:
            structured_data: process_proposal_text()에서 반환된 구조화된 데이터
            
        Returns:
            생성된 Google Slides 정보 (URL 포함)
        """
        if not self.slides_available:
            return {
                'success': False,
                'error': 'Google Slides 서비스를 사용할 수 없습니다. GOOGLE_APPLICATION_CREDENTIALS를 확인해주세요.'
            }
        
        try:
            data = structured_data['data']
            metadata = data['metadata']
            title = metadata['title']
            
            # Google Slides 생성
            result = self.slides_service.create_structured_presentation(title, data)
            
            if 'error' in result:
                return {
                    'success': False,
                    'error': result['error']
                }
            
            return {
                'success': True,
                'presentation_id': result['presentation_id'],
                'url': result['url'],
                'title': title,
                'slide_count': len(data['slides'])
            }
            
        except Exception as e:
            logger.error(f"Google Slides 생성 실패: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def export_proposal(self, raw_text: str) -> Dict[str, Any]:
        """
        전체 기획안 내보내기 프로세스 실행
        
        Args:
            raw_text: 사용자 입력 텍스트
            
        Returns:
            최종 결과 (Google Slides URL 포함)
        """
        logger.info(f"기획안 내보내기 시작 - 텍스트 길이: {len(raw_text)}")
        
        # 1단계: 텍스트 구조화
        structure_result = self.process_proposal_text(raw_text)
        
        if not structure_result['success']:
            return {
                'success': False,
                'step': 'structuring',
                'error': '텍스트 구조화 실패',
                'details': structure_result
            }
        
        # 2단계: Google Slides 생성
        slides_result = self.create_google_slides(structure_result)
        
        if not slides_result['success']:
            return {
                'success': False,
                'step': 'slides_creation',
                'error': 'Google Slides 생성 실패',
                'structured_data': structure_result['data'],  # 구조화된 데이터는 제공
                'details': slides_result
            }
        
        # 성공
        return {
            'success': True,
            'structured_data': structure_result['data'],
            'presentation': {
                'id': slides_result['presentation_id'],
                'url': slides_result['url'],
                'title': slides_result['title'],
                'slide_count': slides_result['slide_count']
            },
            'original_text': raw_text
        }


class ProposalPromptOptimizer:
    """기획안 프롬프트 최적화 전용 클래스"""
    
    @staticmethod
    def create_executive_summary_prompt(text: str) -> str:
        """경영진용 요약 프롬프트"""
        return f"""
다음 기획안을 경영진 보고용으로 요약해주세요:
- 핵심 메시지 3개
- 예상 ROI
- 주요 리스크 및 대응방안
- 의사결정 포인트

텍스트: {text}
"""
    
    @staticmethod
    def create_technical_spec_prompt(text: str) -> str:
        """기술 사양서 프롬프트"""
        return f"""
다음 기획안의 기술적 요구사항을 정리해주세요:
- 촬영 장비 사양
- 편집 소프트웨어 요구사항
- 파일 포맷 및 해상도
- 납품 형태

텍스트: {text}
"""
    
    @staticmethod
    def create_budget_breakdown_prompt(text: str) -> str:
        """예산 세부 내역 프롬프트"""
        return f"""
다음 기획안의 예산을 세부 항목별로 분석해주세요:
- 인건비 (기획, 촬영, 편집)
- 장비비 (촬영 장비, 조명, 음향)
- 재료비 (소품, 의상, 메이크업)
- 기타비 (교통비, 숙박비, 식비)

텍스트: {text}
"""