import logging
from typing import Dict, List, Optional
from django.conf import settings
import google.generativeai as genai
import json
from .video_technical_analyzer import VideoTechnicalAnalyzer, TechnicalIssue

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
        
        # 기술적 분석기 초기화
        self.technical_analyzer = VideoTechnicalAnalyzer()
    
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
            # 먼저 기술적 분석 수행
            technical_analysis = self.technical_analyzer.analyze_twelve_labs_data(analysis_data)
            
            # Gemini를 사용하여 피드백 생성
            if self.model:
                feedback = self._generate_teacher_feedback(analysis_data, teacher, technical_analysis)
            else:
                # 폴백: 기본 템플릿 사용
                feedback = self._generate_fallback_feedback(analysis_data, teacher, technical_analysis)
            
            return {
                'teacher': teacher,
                'feedback': feedback,
                'analysis_summary': self._create_analysis_summary(analysis_data),
                'technical_analysis': technical_analysis
            }
            
        except Exception as e:
            logger.error(f"Error transforming feedback: {e}")
            return self._generate_error_feedback(teacher)
    
    def _generate_teacher_feedback(self, analysis_data: Dict, teacher: Dict, technical_analysis: Dict) -> Dict:
        """Gemini를 사용하여 선생님 스타일의 피드백 생성"""
        
        # 분석 데이터 요약
        summary = analysis_data.get('summary', {}).get('text', '')
        key_moments = analysis_data.get('key_moments', [])
        conversations = analysis_data.get('conversations', [])
        texts_in_video = analysis_data.get('text_in_video', [])
        
        # 기술적 분석 결과
        tech_score = technical_analysis.get('overall_score', 70)
        tech_issues = technical_analysis.get('issues', [])
        tech_recommendations = technical_analysis.get('recommendations', [])
        
        prompt = f"""
        당신은 '{teacher['name']}'입니다.
        성격: {teacher['personality']}
        피드백 스타일: {teacher['style']}
        말투: {teacher['tone']}
        
        다음은 전문적인 영상 제작 관점에서 분석한 결과입니다:
        
        [기술적 점수]
        전체 점수: {tech_score}/100점
        
        [발견된 기술적 문제들]
        {self._format_technical_issues(tech_issues)}
        
        [카테고리별 점수]
        {self._format_category_scores(technical_analysis.get('category_scores', {}))}
        
        [영상 내용 요약]
        {summary if summary else '영상 요약 정보가 없습니다.'}
        
        [주요 순간]
        {self._format_key_moments(key_moments)}
        
        당신은 영상 제작 전문가로서 다음 기술적 요소들을 중심으로 피드백해야 합니다:
        1. 수평 및 뒤틀림 (카메라 기울기, 수평선 정렬)
        2. 아이레벨 일관성 (컷 간 인물 시선 높이 일치)
        3. 하이라이트 배치 (첫 5초 내 임팩트)
        4. 구도 및 프레이밍 (3분할 법칙, 헤드룸)
        5. 기술적 품질 (초점, 노출, 손떨림)
        
        다음 형식으로 JSON 응답해주세요:
        {{
            "overall_feedback": "기술적 관점에서의 전체 평가 (2-3문장)",
            "strengths": ["기술적으로 잘된 점1", "잘된 점2", "잘된 점3"],
            "improvements": ["기술적 개선점1", "개선점2", "개선점3"],
            "specific_comments": [
                {{"timestamp": 10.5, "comment": "수평/아이레벨/구도 관련 구체적 코멘트"}},
                {{"timestamp": 25.3, "comment": "기술적 문제에 대한 구체적 코멘트"}}
            ],
            "final_message": "영상 제작 기술 향상을 위한 마무리 메시지",
            "score": {tech_score},
            "emoji_reaction": "😊"
        }}
        
        중요: 
        1. 반드시 영상 제작의 기술적 측면(수평, 아이레벨, 하이라이트, 구도 등)을 중심으로 피드백하세요
        2. 전문 용어를 사용하되, 이해하기 쉽게 설명하세요
        3. 캐릭터의 개성을 유지하면서도 전문성을 보여주세요:
        - 호랑이 선생님: "수평이 2도 틀어졌다! 이런 기본도 못 지키면 어떻게 프로가 되겠나!"
        - 부엉이 선생님: "아이레벨이 조금 어긋났지만, 연습하면 충분히 개선할 수 있어요"
        - 여우 선생님: "오호~ 3분할 법칙은 들어본 적이 없나보네? 구도가 아마추어티가 나는군"
        - 곰 선생님: "수평계를 사용하면 이런 문제를 쉽게 해결할 수 있습니다"
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
            return self._generate_fallback_feedback(analysis_data, teacher, technical_analysis)
    
    def _generate_fallback_feedback(self, analysis_data: Dict, teacher: Dict, technical_analysis: Dict) -> Dict:
        """폴백 피드백 생성"""
        
        tech_score = technical_analysis.get('overall_score', 70)
        tech_issues = technical_analysis.get('issues', [])
        
        # 선생님별 기술적 피드백 템플릿
        templates = {
            'tiger': {
                'overall_feedback': f'기술 점수 {tech_score}점? 이런 기초적인 실수들을 하다니! 수평도 못 맞추고, 아이레벨도 엉망이군!',
                'strengths': [
                    '최소한 카메라는 켰군',
                    '영상이 재생은 된다',
                    '시도는 했다는 점은 인정하지'
                ],
                'improvements': [
                    '수평계 좀 사용해라! 기울어진 화면 보기 힘들다!',
                    '아이레벨이 컷마다 다르다! 일관성을 지켜라!',
                    '첫 5초가 지루하다! 하이라이트를 앞에 배치해라!'
                ],
                'final_message': '기본기부터 다시 연습해서 돌아와라! 프로가 되려면 멀었다!',
                'emoji_reaction': '😤'
            },
            'owl': {
                'overall_feedback': f'기술 점수 {tech_score}점이네요. 몇 가지 기술적인 부분만 개선하면 훨씬 좋아질 거예요.',
                'strengths': [
                    '영상 제작에 대한 열정이 느껴져요',
                    '기본적인 편집은 잘 되어있어요',
                    '메시지 전달력이 있어요'
                ],
                'improvements': [
                    '수평을 맞추는 연습을 해보세요. 수평계 앱을 활용하면 도움이 될 거예요',
                    '인물을 찍을 때는 아이레벨을 일정하게 유지해보세요',
                    '첫 장면에 더 임팩트 있는 컷을 넣어보면 어떨까요?'
                ],
                'final_message': '기술적인 부분은 연습으로 충분히 극복할 수 있어요. 포기하지 마세요!',
                'emoji_reaction': '🤗'
            },
            'fox': {
                'overall_feedback': f'오호~ {tech_score}점? 기술적으로 구멍이 숭숭 뚫려있네? 특히 수평이랑 아이레벨은 영상 제작의 기본 중의 기본인데?',
                'strengths': [
                    '용기는 가상하네, 이런 상태로 업로드하다니',
                    '최소한 렌즈캡은 벗겼구나',
                    '편집 프로그램은 켤 줄 아는군'
                ],
                'improvements': [
                    '3분할 법칙이라고 들어봤나? 구도가 너무 평범해',
                    '아이레벨이 들쭉날쭉한데, 삼각대라는 걸 써봤어?',
                    '첫 5초에 졸려서 나갔다가 다시 들어왔어'
                ],
                'final_message': '프로 흉내는 내지 말고, 기본기부터 제대로 익혀서 와. 기대할게~',
                'emoji_reaction': '😏'
            },
            'bear': {
                'overall_feedback': f'기술 점수 {tech_score}점으로 개선할 부분이 있네요. 하나씩 차근차근 해결해봅시다.',
                'strengths': [
                    '영상의 기본 구조는 갖춰져 있습니다',
                    '스토리 전달은 잘 되고 있어요',
                    '편집의 기초는 이해하고 있는 것 같습니다'
                ],
                'improvements': [
                    '수평계를 사용해서 카메라 수평을 맞춰보세요. 작은 도구가 큰 차이를 만듭니다',
                    '컷 전환 시 인물의 아이레벨을 일정하게 유지하는 연습을 해보세요',
                    '오프닝 5초에 가장 인상적인 장면을 배치해서 시청자를 사로잡아보세요'
                ],
                'final_message': '기술적인 부분들은 연습과 경험으로 개선됩니다. 꾸준히 노력하세요!',
                'emoji_reaction': '😊'
            }
        }
        
        template = templates.get(teacher['name'].split()[0].lower(), templates['owl'])
        
        # 기술적 이슈 기반 타임스탬프 코멘트 생성
        specific_comments = []
        
        # 기술적 이슈에서 타임스탬프가 있는 것들 추출
        for issue in tech_issues[:3]:
            if issue.timestamp is not None:
                comment_templates = {
                    'tiger': f"여기! {issue.timestamp:.1f}초 부분 {issue.description} 이런 실수는 용납 못한다!",
                    'owl': f"{issue.timestamp:.1f}초 부분을 보면 {issue.description} 개선하면 더 좋을 거예요.",
                    'fox': f"오호, {issue.timestamp:.1f}초에 {issue.description} 아마추어티가 확 드러나는군.",
                    'bear': f"{issue.timestamp:.1f}초 지점에서 {issue.description} 이 부분을 수정해보세요."
                }
                
                teacher_key = teacher['name'].split()[0].lower()
                specific_comments.append({
                    'timestamp': issue.timestamp,
                    'comment': comment_templates.get(teacher_key, comment_templates['owl'])
                })
        
        # 타임스탬프가 없으면 key_moments 활용
        if not specific_comments and analysis_data.get('key_moments'):
            for i, moment in enumerate(analysis_data['key_moments'][:2]):
                specific_comments.append({
                    'timestamp': moment.get('start_time', i * 10),
                    'comment': f"이 부분의 구도와 수평을 다시 확인해보세요."
                })
        
        return {
            'overall_feedback': template['overall_feedback'],
            'strengths': template['strengths'],
            'improvements': template['improvements'],
            'specific_comments': specific_comments,
            'final_message': template['final_message'],
            'score': tech_score,
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
    
    def _format_technical_issues(self, issues: List) -> str:
        """기술적 문제 포맷팅"""
        if not issues:
            return "발견된 주요 기술적 문제가 없습니다."
        
        formatted = []
        for issue in issues[:5]:  # 상위 5개만
            severity_emoji = {
                'critical': '🚨',
                'major': '⚠️',
                'minor': 'ℹ️',
                'info': '💡'
            }.get(issue.severity, '•')
            
            formatted.append(f"{severity_emoji} [{issue.category}] {issue.description}")
        
        return '\n'.join(formatted)
    
    def _format_category_scores(self, category_scores: Dict) -> str:
        """카테고리별 점수 포맷팅"""
        if not category_scores:
            return "카테고리별 점수 정보 없음"
        
        formatted = []
        for cat_key, cat_data in category_scores.items():
            score = cat_data.get('score', 0)
            name = cat_data.get('name', cat_key)
            emoji = '✅' if score >= 80 else '⚠️' if score >= 60 else '❌'
            formatted.append(f"{emoji} {name}: {score}/100점")
        
        return '\n'.join(formatted)