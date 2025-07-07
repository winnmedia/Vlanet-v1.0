import logging
from typing import Dict, List, Optional
from django.conf import settings
import google.generativeai as genai
import json

logger = logging.getLogger(__name__)


class AITeacherService:
    """
    AI 영상 선생님 서비스
    Twelve Labs 분석 결과를 각 선생님 스타일로 변환
    """
    
    # 선생님 캐릭터 정의
    TEACHERS = {
        'tiger': {
            'name': '호랑이 선생님',
            'emoji': '🐯',
            'personality': '맹렬하고 직설적인',
            'style': '강렬하고 열정적인 피드백',
            'tone': '단호하고 엄격한',
            'greeting': '어흥! 자, 이제 제대로 된 피드백을 들어볼 시간이야!',
            'color': '#FF6B35',
            'bg_color': '#FFF5F0'
        },
        'owl': {
            'name': '부엉이 선생님',
            'emoji': '🦉',
            'personality': '포근하고 지혜로운',
            'style': '격려와 용기를 주는 피드백',
            'tone': '따뜻하고 부드러운',
            'greeting': '부엉부엉~ 좋은 영상을 만들어주셨네요. 함께 더 나은 작품을 만들어봐요.',
            'color': '#8B4513',
            'bg_color': '#FFF8DC'
        },
        'fox': {
            'name': '여우 선생님',
            'emoji': '🦊',
            'personality': '날카롭고 재치있는',
            'style': '약간은 도발적이지만 통찰력 있는 피드백',
            'tone': '재치있고 약간은 까칠한',
            'greeting': '오호라~ 꽤 흥미로운 시도네요? 하지만 아직 갈 길이 멀어 보이는군요.',
            'color': '#FF7F50',
            'bg_color': '#FFEEEE'
        },
        'bear': {
            'name': '곰 선생님',
            'emoji': '🐻',
            'personality': '든든하고 믿음직한',
            'style': '실용적이고 구체적인 피드백',
            'tone': '차분하고 안정적인',
            'greeting': '안녕하세요! 천천히, 그러나 확실하게 개선해나가 봅시다.',
            'color': '#8B4513',
            'bg_color': '#F5E6D3'
        }
    }
    
    def __init__(self):
        api_key = getattr(settings, 'GOOGLE_API_KEY', None)
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            logger.warning("Google API key not found")
            self.model = None
    
    def transform_feedback(self, analysis_data: Dict, teacher_type: str) -> Dict:
        """
        Twelve Labs 분석 결과를 선생님 스타일로 변환
        
        Args:
            analysis_data: Twelve Labs 분석 결과
            teacher_type: 선생님 타입 (tiger, owl, fox, bear)
            
        Returns:
            변환된 피드백
        """
        if teacher_type not in self.TEACHERS:
            teacher_type = 'owl'  # 기본값
        
        teacher = self.TEACHERS[teacher_type]
        
        try:
            # Gemini를 사용하여 피드백 생성
            if self.model:
                feedback = self._generate_teacher_feedback(analysis_data, teacher)
            else:
                # 폴백: 기본 템플릿 사용
                feedback = self._generate_fallback_feedback(analysis_data, teacher)
            
            return {
                'teacher': teacher,
                'feedback': feedback,
                'analysis_summary': self._create_analysis_summary(analysis_data)
            }
            
        except Exception as e:
            logger.error(f"Error transforming feedback: {e}")
            return self._generate_error_feedback(teacher)
    
    def _generate_teacher_feedback(self, analysis_data: Dict, teacher: Dict) -> Dict:
        """Gemini를 사용하여 선생님 스타일의 피드백 생성"""
        
        # 분석 데이터 요약
        summary = analysis_data.get('summary', {}).get('text', '')
        key_moments = analysis_data.get('key_moments', [])
        conversations = analysis_data.get('conversations', [])
        texts_in_video = analysis_data.get('text_in_video', [])
        
        prompt = f"""
        당신은 '{teacher['name']}'입니다.
        성격: {teacher['personality']}
        피드백 스타일: {teacher['style']}
        말투: {teacher['tone']}
        
        다음 영상 분석 결과를 바탕으로 당신의 캐릭터에 맞는 피드백을 작성해주세요:
        
        [영상 요약]
        {summary if summary else '영상 요약 정보가 없습니다.'}
        
        [주요 순간]
        {self._format_key_moments(key_moments)}
        
        [대화 내용]
        {self._format_conversations(conversations)}
        
        [화면 텍스트]
        {self._format_texts(texts_in_video)}
        
        다음 형식으로 JSON 응답해주세요:
        {{
            "overall_feedback": "전체적인 피드백 (2-3문장)",
            "strengths": ["장점1", "장점2", "장점3"],
            "improvements": ["개선점1", "개선점2", "개선점3"],
            "specific_comments": [
                {{"timestamp": 10.5, "comment": "이 부분의 구체적인 코멘트"}},
                {{"timestamp": 25.3, "comment": "다른 부분의 구체적인 코멘트"}}
            ],
            "final_message": "마무리 메시지 (격려 또는 도전적인 메시지)",
            "score": 85,
            "emoji_reaction": "😊"
        }}
        
        중요: 캐릭터의 개성을 확실히 드러내세요!
        - 호랑이 선생님: 직설적이고 강렬하게
        - 부엉이 선생님: 따뜻하고 격려하며
        - 여우 선생님: 재치있고 약간은 까칠하게
        - 곰 선생님: 든든하고 실용적으로
        """
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # JSON 파싱
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            feedback_data = json.loads(response_text)
            return feedback_data
            
        except Exception as e:
            logger.error(f"Gemini generation error: {e}")
            return self._generate_fallback_feedback(analysis_data, teacher)
    
    def _generate_fallback_feedback(self, analysis_data: Dict, teacher: Dict) -> Dict:
        """폴백 피드백 생성"""
        
        # 선생님별 기본 피드백 템플릿
        templates = {
            'tiger': {
                'overall_feedback': '이런! 아직 많이 부족하군! 하지만 열정만큼은 인정하지. 더 노력해서 최고의 영상을 만들어보자!',
                'strengths': [
                    '영상의 기본 구성은 갖춰져 있다',
                    '주제 전달 의도는 명확하다',
                    '최소한의 노력은 보인다'
                ],
                'improvements': [
                    '전체적인 완성도가 떨어진다! 더 신경써라!',
                    '디테일이 부족하다. 프로다운 마무리가 필요해!',
                    '임팩트가 약하다. 더 강렬하게 만들어라!'
                ],
                'final_message': '다음엔 진짜 제대로 된 작품을 보여줘라! 기대하고 있겠다!',
                'emoji_reaction': '😤'
            },
            'owl': {
                'overall_feedback': '참 좋은 시도였어요. 조금만 더 다듬으면 훌륭한 작품이 될 거예요.',
                'strengths': [
                    '창의적인 접근이 돋보여요',
                    '메시지가 잘 전달되고 있어요',
                    '노력한 흔적이 곳곳에 보여요'
                ],
                'improvements': [
                    '조금 더 세심한 편집이 필요해 보여요',
                    '음향 부분을 개선하면 더 좋을 것 같아요',
                    '전체적인 흐름을 다듬어보면 어떨까요?'
                ],
                'final_message': '충분히 잘하고 있어요. 계속 이렇게 발전해나가면 멋진 크리에이터가 될 거예요!',
                'emoji_reaction': '🤗'
            },
            'fox': {
                'overall_feedback': '오호~ 나름 볼만하네? 하지만 아직 나를 감동시키기엔 2% 부족해 보이는군.',
                'strengths': [
                    '기본기는 어느 정도 있는 것 같네',
                    '시도는 신선했어, 인정할게',
                    '노력은 했구나, 그건 알겠어'
                ],
                'improvements': [
                    '좀 더 세련되게 만들 수 없었을까?',
                    '디테일이 아쉽네. 프로와 아마추어의 차이야',
                    '임팩트가 부족해. 좀 더 과감해져봐'
                ],
                'final_message': '다음엔 나를 놀라게 할 작품을 기대할게. 할 수 있겠지?',
                'emoji_reaction': '😏'
            },
            'bear': {
                'overall_feedback': '전체적으로 안정적인 영상이네요. 차근차근 개선해나가면 좋은 결과가 있을 거예요.',
                'strengths': [
                    '기본 구성이 탄탄합니다',
                    '메시지 전달이 명확해요',
                    '안정적인 진행이 좋습니다'
                ],
                'improvements': [
                    '조금 더 역동적인 편집을 시도해보세요',
                    '색감 보정에 신경쓰면 좋겠어요',
                    '음향 밸런스를 조정해보세요'
                ],
                'final_message': '꾸준히 노력하면 반드시 좋은 결과가 있을 거예요. 응원합니다!',
                'emoji_reaction': '😊'
            }
        }
        
        template = templates.get(teacher['name'].split()[0].lower(), templates['owl'])
        
        # 타임스탬프 기반 코멘트 생성
        specific_comments = []
        key_moments = analysis_data.get('key_moments', [])
        for i, moment in enumerate(key_moments[:3]):
            specific_comments.append({
                'timestamp': moment.get('start_time', i * 10),
                'comment': f"이 부분은 {teacher['style']}의 관점에서 주목할 만해요."
            })
        
        return {
            'overall_feedback': template['overall_feedback'],
            'strengths': template['strengths'],
            'improvements': template['improvements'],
            'specific_comments': specific_comments,
            'final_message': template['final_message'],
            'score': 75,
            'emoji_reaction': template['emoji_reaction']
        }
    
    def _generate_error_feedback(self, teacher: Dict) -> Dict:
        """오류 시 기본 피드백"""
        return {
            'teacher': teacher,
            'feedback': {
                'overall_feedback': f"{teacher['emoji']} 분석 중 문제가 발생했어요. 다시 시도해주세요.",
                'strengths': [],
                'improvements': [],
                'specific_comments': [],
                'final_message': '기술적인 문제로 피드백을 생성할 수 없었어요.',
                'score': 0,
                'emoji_reaction': '😅'
            },
            'analysis_summary': {}
        }
    
    def _format_key_moments(self, moments: List[Dict]) -> str:
        """주요 순간 포맷팅"""
        if not moments:
            return "주요 순간 정보 없음"
        
        formatted = []
        for i, moment in enumerate(moments[:5]):
            formatted.append(f"- {moment['start_time']:.1f}초: 중요 장면")
        return '\n'.join(formatted)
    
    def _format_conversations(self, conversations: List[Dict]) -> str:
        """대화 내용 포맷팅"""
        if not conversations:
            return "대화 내용 없음"
        
        formatted = []
        for conv in conversations[:5]:
            formatted.append(f"- [{conv['start_time']:.1f}s] {conv['transcript'][:50]}...")
        return '\n'.join(formatted)
    
    def _format_texts(self, texts: List[Dict]) -> str:
        """화면 텍스트 포맷팅"""
        if not texts:
            return "화면 텍스트 없음"
        
        formatted = []
        for text in texts[:5]:
            formatted.append(f"- [{text['start_time']:.1f}s] {text['text']}")
        return '\n'.join(formatted)
    
    def _create_analysis_summary(self, analysis_data: Dict) -> Dict:
        """분석 데이터 요약"""
        return {
            'total_key_moments': len(analysis_data.get('key_moments', [])),
            'total_conversations': len(analysis_data.get('conversations', [])),
            'total_texts': len(analysis_data.get('text_in_video', [])),
            'has_summary': bool(analysis_data.get('summary', {}).get('text'))
        }
    
    def get_all_teachers(self) -> Dict:
        """모든 선생님 정보 반환"""
        return self.TEACHERS