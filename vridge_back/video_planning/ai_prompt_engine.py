"""
AI 프롬프트 생성 엔진 - 1000% 효율화를 위한 지능형 프롬프트 시스템
"""
import json
import time
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from django.conf import settings
from django.utils import timezone
from .models import VideoPlanning, VideoPlanningAIPrompt

logger = logging.getLogger(__name__)

@dataclass
class PromptGenerationContext:
    """프롬프트 생성 컨텍스트"""
    planning: VideoPlanning
    prompt_type: str
    user_input: str
    pro_options: Dict[str, Any]
    context_data: Dict[str, Any]
    optimization_level: str = 'high'  # low, medium, high, extreme

@dataclass
class PromptGenerationResult:
    """프롬프트 생성 결과"""
    original_prompt: str
    enhanced_prompt: str
    generation_time: float
    tokens_estimate: int
    cost_estimate: float
    confidence_score: float
    optimization_suggestions: List[str]
    is_successful: bool
    error_message: str = ""

class AIPromptEngine:
    """AI 프롬프트 생성 엔진 - 영상 제작 특화"""
    
    def __init__(self):
        self.prompt_templates = self._load_prompt_templates()
        self.optimization_rules = self._load_optimization_rules()
        self.context_enhancers = self._load_context_enhancers()
        
    def _load_prompt_templates(self) -> Dict[str, Dict]:
        """프롬프트 템플릿 로드"""
        return {
            'story': {
                'base': "영상 스토리를 생성해주세요. 다음 기획안을 바탕으로: {planning_text}",
                'professional': """
                전문적인 영상 스토리를 생성해주세요.
                
                **기획안**: {planning_text}
                **장르**: {genre}
                **톤앤매너**: {tone_manner}
                **타겟 오디언스**: {target_audience}
                **핵심 메시지**: {key_message}
                
                **요구사항**:
                - 명확한 시작, 중간, 끝 구조
                - 감정적 몰입도 높은 스토리라인
                - 실행 가능한 영상 구성
                - 브랜드/제품 자연스러운 통합
                """,
                'creative': """
                창의적이고 혁신적인 영상 스토리를 생성해주세요.
                
                **기획 방향**: {planning_text}
                **창의적 컨셉**: {creative_concept}
                **시각적 스타일**: {visual_style}
                **혁신 요소**: {innovation_elements}
                
                **창의성 기준**:
                - 독창적이고 기억에 남는 스토리
                - 예상치 못한 전개와 반전
                - 감각적이고 예술적인 접근
                - 바이럴 잠재력이 높은 구성
                """
            },
            'scene': {
                'professional': """
                다음 스토리를 바탕으로 전문적인 씬 구성을 생성해주세요:
                
                **선택된 스토리**: {selected_story}
                **카메라 설정**: {camera_settings}
                **조명 설정**: {lighting_setup}
                **위치/배경**: {location_setting}
                
                **씬 구성 요구사항**:
                - 각 씬별 상세 디스크립션
                - 카메라 워크 및 앵글 지정
                - 조명 및 분위기 설정
                - 배우/인물 연출 가이드
                - 예상 촬영 시간 및 비용
                """
            },
            'shot': {
                'professional': """
                선택된 씬을 바탕으로 구체적인 샷 리스트를 생성해주세요:
                
                **씬 정보**: {selected_scene}
                **촬영 사양**: {camera_specs}
                **예산 범위**: {budget_range}
                
                **샷 리스트 요구사항**:
                - 샷 번호 및 구성 순서
                - 구체적인 카메라 설정 (해상도, 프레임레이트, 렌즈)
                - 촬영 각도 및 무브먼트
                - 예상 촬영 시간
                - 후반작업 가이드라인
                """
            },
            'image': {
                'storyboard': """
                스토리보드용 이미지를 생성하기 위한 DALL-E 프롬프트:
                
                **씬 설명**: {scene_description}
                **시각적 스타일**: {visual_style}
                **컬러 팔레트**: {color_palette}
                **분위기**: {mood}
                **카메라 앵글**: {camera_angle}
                
                **이미지 생성 사양**:
                - 16:9 비율의 스토리보드 스타일
                - 전문적이고 명확한 구성
                - 브랜드 컬러 반영
                - 실제 촬영 가능한 구성
                
                프롬프트: "Professional storyboard illustration, {scene_description}, {visual_style} style, {color_palette} color scheme, {mood} atmosphere, {camera_angle} camera angle, 16:9 aspect ratio, clean composition, cinematic lighting"
                """
            }
        }
    
    def _load_optimization_rules(self) -> Dict[str, List]:
        """프롬프트 최적화 규칙"""
        return {
            'clarity_enhancers': [
                '구체적인 수치와 사양 포함',
                '모호한 표현 제거',
                '액션 중심의 동사 사용',
                '전문 용어 정확히 사용'
            ],
            'creativity_boosters': [
                '독창적인 접근 방법 제시',
                '예상치 못한 요소 추가',
                '감정적 몰입 요소 강화',
                '시각적 임팩트 극대화'
            ],
            'efficiency_optimizers': [
                '실행 가능성 우선 고려',
                '비용 효율적인 대안 제시',
                '시간 절약 방법 포함',
                '재사용 가능한 요소 활용'
            ]
        }
    
    def _load_context_enhancers(self) -> Dict[str, callable]:
        """컨텍스트 향상 함수들"""
        return {
            'brand_integration': self._enhance_brand_context,
            'technical_specs': self._enhance_technical_context,
            'creative_direction': self._enhance_creative_context,
            'budget_optimization': self._enhance_budget_context
        }
    
    def generate_enhanced_prompt(self, context: PromptGenerationContext) -> PromptGenerationResult:
        """향상된 프롬프트 생성"""
        start_time = time.time()
        
        try:
            # 1. 기본 프롬프트 선택
            base_prompt = self._select_base_prompt(context)
            
            # 2. 컨텍스트 데이터 추출 및 향상
            enhanced_context = self._enhance_context(context)
            
            # 3. 프롬프트 최적화
            optimized_prompt = self._optimize_prompt(base_prompt, enhanced_context, context.optimization_level)
            
            # 4. 품질 검증
            quality_score = self._validate_prompt_quality(optimized_prompt)
            
            # 5. 성능 메트릭 계산
            generation_time = time.time() - start_time
            tokens_estimate = self._estimate_tokens(optimized_prompt)
            cost_estimate = self._estimate_cost(tokens_estimate)
            
            # 6. 최적화 제안 생성
            suggestions = self._generate_optimization_suggestions(context, optimized_prompt)
            
            # 7. 데이터베이스에 저장
            self._save_prompt_record(context, base_prompt, optimized_prompt, generation_time, tokens_estimate, cost_estimate, True)
            
            return PromptGenerationResult(
                original_prompt=base_prompt,
                enhanced_prompt=optimized_prompt,
                generation_time=generation_time,
                tokens_estimate=tokens_estimate,
                cost_estimate=cost_estimate,
                confidence_score=quality_score,
                optimization_suggestions=suggestions,
                is_successful=True
            )
            
        except Exception as e:
            logger.error(f"프롬프트 생성 실패: {str(e)}")
            generation_time = time.time() - start_time
            
            # 실패 기록 저장
            self._save_prompt_record(context, context.user_input, "", generation_time, 0, 0, False, str(e))
            
            return PromptGenerationResult(
                original_prompt=context.user_input,
                enhanced_prompt="",
                generation_time=generation_time,
                tokens_estimate=0,
                cost_estimate=0,
                confidence_score=0,
                optimization_suggestions=[],
                is_successful=False,
                error_message=str(e)
            )
    
    def _select_base_prompt(self, context: PromptGenerationContext) -> str:
        """기본 프롬프트 선택"""
        prompt_type = context.prompt_type
        optimization_level = context.optimization_level
        
        if prompt_type in self.prompt_templates:
            templates = self.prompt_templates[prompt_type]
            
            if optimization_level in ['high', 'extreme'] and 'professional' in templates:
                return templates['professional']
            elif optimization_level == 'medium' and 'creative' in templates:
                return templates.get('creative', templates.get('professional', templates['base']))
            else:
                return templates.get('base', templates[list(templates.keys())[0]])
        
        # 기본 프롬프트
        return f"{context.user_input}에 대한 {prompt_type} 생성해주세요."
    
    def _enhance_context(self, context: PromptGenerationContext) -> Dict[str, Any]:
        """컨텍스트 데이터 향상"""
        enhanced = context.context_data.copy()
        planning = context.planning
        
        # 기본 정보 추출
        enhanced.update({
            'planning_text': planning.planning_text,
            'title': planning.title,
            'current_step': planning.current_step,
            'planning_options': planning.planning_options,
        })
        
        # 프로 옵션 추가 (color_tone 필드 제거됨)
        # if planning.color_tone:
        #     enhanced['color_palette'] = planning.color_tone
        #     enhanced['primary_color'] = planning.color_tone.get('primary', '#1631F8')
        #     enhanced['mood'] = planning.color_tone.get('mood', 'professional')
        
        # 필드들이 제거됨
        # if planning.camera_settings:
        #     enhanced['camera_settings'] = planning.camera_settings
        #     enhanced['camera_specs'] = planning.get_camera_specs()
        #     enhanced['camera_angle'] = planning.camera_settings.get('shot_type', 'medium')
        
        # if planning.lighting_setup:
        #     enhanced['lighting_setup'] = planning.lighting_setup
        #     enhanced['lighting_mood'] = planning.lighting_setup.get('mood', 'professional')
        
        # if planning.audio_config:
        #     enhanced['audio_config'] = planning.audio_config
        #     enhanced['bgm_style'] = planning.audio_config.get('bgm_style', 'corporate')
        
        # 선택된 콘텐츠 정보
        if planning.selected_story:
            enhanced['selected_story'] = json.dumps(planning.selected_story, ensure_ascii=False)
        
        if planning.selected_scene:
            enhanced['selected_scene'] = json.dumps(planning.selected_scene, ensure_ascii=False)
        
        # 컨텍스트 향상 함수 적용
        for enhancer_name, enhancer_func in self.context_enhancers.items():
            try:
                enhanced = enhancer_func(enhanced, context)
            except Exception as e:
                logger.warning(f"컨텍스트 향상 실패 ({enhancer_name}): {str(e)}")
        
        return enhanced
    
    def _optimize_prompt(self, base_prompt: str, context: Dict[str, Any], optimization_level: str) -> str:
        """프롬프트 최적화"""
        optimized = base_prompt
        
        # 컨텍스트 변수 치환
        try:
            optimized = optimized.format(**context)
        except KeyError as e:
            logger.warning(f"프롬프트 변수 치환 실패: {str(e)}")
            # 누락된 변수를 기본값으로 대체
            for key in e.args:
                context[key] = f"[{key} 정보 없음]"
            optimized = optimized.format(**context)
        
        # 최적화 수준별 규칙 적용
        if optimization_level in ['high', 'extreme']:
            optimized = self._apply_clarity_rules(optimized)
            optimized = self._apply_efficiency_rules(optimized)
        
        if optimization_level == 'extreme':
            optimized = self._apply_creativity_rules(optimized)
            optimized = self._apply_advanced_optimization(optimized)
        
        return optimized
    
    def _apply_clarity_rules(self, prompt: str) -> str:
        """명확성 규칙 적용"""
        # 구체적인 지시사항 추가
        if '생성해주세요' in prompt and '다음 형식으로' not in prompt:
            prompt += "\n\n**출력 형식**: JSON 형태로 구조화된 결과를 제공해주세요."
        
        # 품질 기준 명시
        if '요구사항' in prompt:
            prompt += "\n**품질 기준**: 전문가 수준의 완성도, 실제 제작 가능성, 창의성을 모두 만족해야 합니다."
        
        return prompt
    
    def _apply_efficiency_rules(self, prompt: str) -> str:
        """효율성 규칙 적용"""
        # 시간 절약 지시사항
        if '생성' in prompt:
            prompt += "\n**효율성 고려사항**: 제작 시간과 비용을 최소화하면서도 최대 효과를 낼 수 있는 방안을 포함해주세요."
        
        return prompt
    
    def _apply_creativity_rules(self, prompt: str) -> str:
        """창의성 규칙 적용"""
        # 창의적 요소 강화
        if '스토리' in prompt or '씬' in prompt:
            prompt += "\n**창의성 요구사항**: 예상을 뛰어넘는 독창적인 아이디어와 감정적 몰입도가 높은 요소를 포함해주세요."
        
        return prompt
    
    def _apply_advanced_optimization(self, prompt: str) -> str:
        """고급 최적화 적용"""
        # 컨텍스트 인식 향상
        prompt += f"\n\n**컨텍스트 고려사항**: 현재 시점({timezone.now().strftime('%Y년 %m월')})의 트렌드와 시장 상황을 반영하여 답변해주세요."
        
        # 산업 전문성 강화
        prompt += "\n**전문성 요구사항**: 영상 제작 업계의 최신 기술과 모범 사례를 반영한 전문가 수준의 조언을 포함해주세요."
        
        return prompt
    
    def _enhance_brand_context(self, context: Dict[str, Any], planning_context: PromptGenerationContext) -> Dict[str, Any]:
        """브랜드 컨텍스트 향상"""
        # 브랜드 관련 정보 추출 및 추가
        planning = planning_context.planning
        if hasattr(planning, 'user') and planning.user:
            context['brand_context'] = {
                'user_style': '전문적',
                'brand_values': ['혁신', '품질', '신뢰성'],
                'target_market': '기업 고객'
            }
        return context
    
    def _enhance_technical_context(self, context: Dict[str, Any], planning_context: PromptGenerationContext) -> Dict[str, Any]:
        """기술적 컨텍스트 향상"""
        # 기술 사양 상세화
        if 'camera_settings' in context:
            camera = context['camera_settings']
            context['technical_requirements'] = {
                'video_codec': 'H.264/H.265',
                'audio_codec': 'AAC',
                'bitrate': '고품질 (50-100Mbps)',
                'color_space': 'Rec.709'
            }
        return context
    
    def _enhance_creative_context(self, context: Dict[str, Any], planning_context: PromptGenerationContext) -> Dict[str, Any]:
        """창의적 컨텍스트 향상"""
        # 창의적 방향성 추가
        context['creative_inspiration'] = [
            '최신 영화 촬영 기법',
            '소셜미디어 트렌드',
            '브랜드 스토리텔링',
            '감정적 연결'
        ]
        return context
    
    def _enhance_budget_context(self, context: Dict[str, Any], planning_context: PromptGenerationContext) -> Dict[str, Any]:
        """예산 컨텍스트 향상"""
        # 예산 최적화 가이드
        context['budget_considerations'] = {
            'cost_effective_alternatives': True,
            'resource_optimization': True,
            'scalable_solutions': True
        }
        return context
    
    def _validate_prompt_quality(self, prompt: str) -> float:
        """프롬프트 품질 검증"""
        score = 0.0
        
        # 길이 검증 (적절한 상세도)
        if 100 <= len(prompt) <= 2000:
            score += 20
        
        # 구조화 검증
        if '**' in prompt or '#' in prompt:
            score += 15
        
        # 구체성 검증
        specific_terms = ['구체적', '상세', '전문적', '요구사항', '기준']
        score += sum(10 for term in specific_terms if term in prompt)
        
        # 실행가능성 검증
        action_terms = ['생성', '제작', '구성', '설계', '분석']
        score += sum(5 for term in action_terms if term in prompt)
        
        return min(score, 100.0)
    
    def _estimate_tokens(self, prompt: str) -> int:
        """토큰 수 추정"""
        # 간단한 토큰 추정 (실제로는 tokenizer 사용)
        return len(prompt.split()) * 1.3  # 한국어는 영어보다 토큰이 많음
    
    def _estimate_cost(self, tokens: int) -> float:
        """비용 추정"""
        # GPT-4 기준 대략적인 비용 (실제 API 요금 반영)
        cost_per_1k_tokens = 0.03  # USD
        return (tokens / 1000) * cost_per_1k_tokens
    
    def _generate_optimization_suggestions(self, context: PromptGenerationContext, prompt: str) -> List[str]:
        """최적화 제안 생성"""
        suggestions = []
        
        # 길이 기반 제안
        if len(prompt) < 200:
            suggestions.append("프롬프트에 더 구체적인 요구사항을 추가하면 더 정확한 결과를 얻을 수 있습니다.")
        elif len(prompt) > 1500:
            suggestions.append("프롬프트를 더 간결하게 만들면 AI 처리 속도가 향상됩니다.")
        
        # 컨텍스트 기반 제안
        if context.optimization_level == 'low':
            suggestions.append("최적화 수준을 'high'로 설정하면 더 전문적인 결과를 얻을 수 있습니다.")
        
        # 프로 옵션 활용 제안
        if not context.planning.is_pro_mode_enabled():
            suggestions.append("프로 모드를 활성화하면 고급 카메라 설정과 조명 옵션을 활용할 수 있습니다.")
        
        return suggestions
    
    def _save_prompt_record(self, context: PromptGenerationContext, original: str, enhanced: str, 
                          generation_time: float, tokens: int, cost: float, success: bool, error: str = ""):
        """프롬프트 기록 저장"""
        try:
            VideoPlanningAIPrompt.objects.create(
                planning=context.planning,
                prompt_type=context.prompt_type,
                original_prompt=original,
                enhanced_prompt=enhanced,
                generation_time=generation_time,
                tokens_used=int(tokens),
                cost_estimate=cost,
                is_successful=success,
                error_message=error
            )
        except Exception as e:
            logger.error(f"프롬프트 기록 저장 실패: {str(e)}")

class PromptOptimizationService:
    """프롬프트 최적화 서비스"""
    
    def __init__(self):
        self.engine = AIPromptEngine()
    
    def generate_story_prompt(self, planning: VideoPlanning, user_input: str, optimization_level: str = 'high') -> PromptGenerationResult:
        """스토리 프롬프트 생성"""
        context = PromptGenerationContext(
            planning=planning,
            prompt_type='story',
            user_input=user_input,
            pro_options=self._extract_pro_options(planning),
            context_data={},
            optimization_level=optimization_level
        )
        return self.engine.generate_enhanced_prompt(context)
    
    def generate_scene_prompt(self, planning: VideoPlanning, user_input: str, optimization_level: str = 'high') -> PromptGenerationResult:
        """씬 프롬프트 생성"""
        context = PromptGenerationContext(
            planning=planning,
            prompt_type='scene',
            user_input=user_input,
            pro_options=self._extract_pro_options(planning),
            context_data={},
            optimization_level=optimization_level
        )
        return self.engine.generate_enhanced_prompt(context)
    
    def generate_shot_prompt(self, planning: VideoPlanning, user_input: str, optimization_level: str = 'high') -> PromptGenerationResult:
        """샷 프롬프트 생성"""
        context = PromptGenerationContext(
            planning=planning,
            prompt_type='shot',
            user_input=user_input,
            pro_options=self._extract_pro_options(planning),
            context_data={},
            optimization_level=optimization_level
        )
        return self.engine.generate_enhanced_prompt(context)
    
    def generate_image_prompt(self, planning: VideoPlanning, scene_description: str, optimization_level: str = 'high') -> PromptGenerationResult:
        """이미지 생성 프롬프트 생성"""
        context = PromptGenerationContext(
            planning=planning,
            prompt_type='image',
            user_input=scene_description,
            pro_options=self._extract_pro_options(planning),
            context_data={'scene_description': scene_description},
            optimization_level=optimization_level
        )
        return self.engine.generate_enhanced_prompt(context)
    
    def _extract_pro_options(self, planning: VideoPlanning) -> Dict[str, Any]:
        """프로 옵션 추출"""
        return {
            # 필드들이 제거됨
            # 'color_tone': planning.color_tone,
            # 'camera_settings': planning.camera_settings,
            # 'lighting_setup': planning.lighting_setup,
            # 'audio_config': planning.audio_config,
            # 'ai_generation_config': planning.ai_generation_config
        }
    
    def get_optimization_analytics(self, planning: VideoPlanning) -> Dict[str, Any]:
        """최적화 분석 데이터 반환"""
        prompts = VideoPlanningAIPrompt.objects.filter(planning=planning)
        
        if not prompts.exists():
            return {'message': '생성된 프롬프트가 없습니다.'}
        
        total_prompts = prompts.count()
        successful_prompts = prompts.filter(is_successful=True).count()
        avg_generation_time = prompts.aggregate(avg_time=models.Avg('generation_time'))['avg_time'] or 0
        total_cost = prompts.aggregate(total=models.Sum('cost_estimate'))['total'] or 0
        
        return {
            'total_prompts': total_prompts,
            'success_rate': (successful_prompts / total_prompts) * 100,
            'avg_generation_time': round(avg_generation_time, 2),
            'total_cost': float(total_cost),
            'efficiency_rating': self._calculate_efficiency_rating(successful_prompts, total_prompts, avg_generation_time),
            'recommendations': self._generate_recommendations(planning, prompts)
        }
    
    def _calculate_efficiency_rating(self, successful: int, total: int, avg_time: float) -> str:
        """효율성 등급 계산"""
        success_rate = (successful / total) * 100 if total > 0 else 0
        
        if success_rate >= 95 and avg_time <= 2:
            return 'excellent'
        elif success_rate >= 85 and avg_time <= 5:
            return 'good'
        elif success_rate >= 70:
            return 'average'
        else:
            return 'needs_improvement'
    
    def _generate_recommendations(self, planning: VideoPlanning, prompts) -> List[str]:
        """개선 권장사항 생성"""
        recommendations = []
        
        # 성공률 기반 권장사항
        success_rate = prompts.filter(is_successful=True).count() / prompts.count() * 100
        if success_rate < 80:
            recommendations.append("프롬프트 최적화 수준을 'extreme'으로 높여보세요.")
        
        # 비용 최적화 권장사항
        avg_cost = prompts.aggregate(avg=models.Avg('cost_estimate'))['avg'] or 0
        if avg_cost > 0.1:
            recommendations.append("더 간결한 프롬프트로 비용을 절약할 수 있습니다.")
        
        # 프로 모드 권장사항
        if not planning.is_pro_mode_enabled():
            recommendations.append("프로 모드를 활성화하면 더 정확한 결과를 얻을 수 있습니다.")
        
        return recommendations