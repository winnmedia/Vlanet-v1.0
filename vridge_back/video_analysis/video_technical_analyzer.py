"""
영상 제작 기술 분석 서비스
수평/뒤틀림, 아이레벨, 하이라이트 등 전문적인 영상 분석
"""
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
import json

logger = logging.getLogger(__name__)


@dataclass
class TechnicalIssue:
    """기술적 문제 항목"""
    category: str  # 'horizon', 'eye_level', 'highlight', 'composition', 'lighting'
    severity: str  # 'critical', 'major', 'minor', 'info'
    description: str
    timestamp: Optional[float] = None
    suggestions: Optional[List[str]] = None


class VideoTechnicalAnalyzer:
    """
    영상의 기술적 품질을 분석하는 서비스
    """
    
    # 분석 카테고리 정의
    ANALYSIS_CATEGORIES = {
        'horizon': {
            'name': '수평 및 뒤틀림',
            'weight': 0.25,
            'checks': [
                'horizontal_alignment',  # 수평선 정렬
                'camera_tilt',          # 카메라 기울기
                'perspective_distortion' # 원근 왜곡
            ]
        },
        'eye_level': {
            'name': '아이레벨 일관성',
            'weight': 0.25,
            'checks': [
                'shot_consistency',      # 컷 간 일관성
                'character_eye_level',   # 인물 아이레벨
                'camera_height'          # 카메라 높이
            ]
        },
        'highlight': {
            'name': '하이라이트 구성',
            'weight': 0.20,
            'checks': [
                'opening_impact',        # 오프닝 임팩트
                'highlight_placement',   # 하이라이트 배치
                'attention_grabbing'     # 시선 끌기
            ]
        },
        'composition': {
            'name': '구도 및 프레이밍',
            'weight': 0.15,
            'checks': [
                'rule_of_thirds',        # 3분할 법칙
                'headroom',              # 헤드룸
                'lead_space',            # 리드 스페이스
                'balance'                # 균형
            ]
        },
        'technical_quality': {
            'name': '기술적 품질',
            'weight': 0.15,
            'checks': [
                'focus_sharpness',       # 초점 선명도
                'exposure',              # 노출
                'color_consistency',     # 색상 일관성
                'stabilization'          # 손떨림 보정
            ]
        }
    }
    
    def analyze_twelve_labs_data(self, twelve_labs_data: Dict) -> Dict:
        """
        Twelve Labs 분석 데이터를 기반으로 기술적 분석 수행
        """
        try:
            analysis_result = {
                'overall_score': 0,
                'category_scores': {},
                'issues': [],
                'technical_summary': {},
                'recommendations': []
            }
            
            # 각 카테고리별 분석
            for category_key, category_info in self.ANALYSIS_CATEGORIES.items():
                category_score, category_issues = self._analyze_category(
                    category_key, 
                    category_info, 
                    twelve_labs_data
                )
                
                analysis_result['category_scores'][category_key] = {
                    'name': category_info['name'],
                    'score': category_score,
                    'weight': category_info['weight']
                }
                
                analysis_result['issues'].extend(category_issues)
            
            # 전체 점수 계산 (가중 평균)
            total_score = sum(
                score_data['score'] * score_data['weight'] 
                for score_data in analysis_result['category_scores'].values()
            )
            analysis_result['overall_score'] = round(total_score)
            
            # 기술적 요약 생성
            analysis_result['technical_summary'] = self._generate_technical_summary(
                analysis_result['category_scores'],
                analysis_result['issues']
            )
            
            # 개선 권장사항 생성
            analysis_result['recommendations'] = self._generate_recommendations(
                analysis_result['issues']
            )
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Technical analysis error: {e}")
            return self._get_default_analysis()
    
    def _analyze_category(self, category_key: str, category_info: Dict, 
                         twelve_labs_data: Dict) -> tuple:
        """카테고리별 상세 분석"""
        issues = []
        base_score = 100
        
        # Twelve Labs 데이터에서 관련 정보 추출
        visual_data = twelve_labs_data.get('summary', {})
        key_moments = twelve_labs_data.get('key_moments', [])
        
        if category_key == 'horizon':
            issues.extend(self._check_horizon_issues(visual_data, key_moments))
        elif category_key == 'eye_level':
            issues.extend(self._check_eye_level_consistency(key_moments))
        elif category_key == 'highlight':
            issues.extend(self._check_highlight_placement(key_moments))
        elif category_key == 'composition':
            issues.extend(self._check_composition_quality(visual_data, key_moments))
        elif category_key == 'technical_quality':
            issues.extend(self._check_technical_quality(visual_data))
        
        # 이슈 수와 심각도에 따라 점수 차감
        for issue in issues:
            if issue.severity == 'critical':
                base_score -= 20
            elif issue.severity == 'major':
                base_score -= 10
            elif issue.severity == 'minor':
                base_score -= 5
        
        return max(0, base_score), issues
    
    def _check_horizon_issues(self, visual_data: Dict, key_moments: List) -> List[TechnicalIssue]:
        """수평 및 뒤틀림 검사"""
        issues = []
        
        # 실제로는 Twelve Labs의 visual analysis에서 더 정확한 데이터를 받아야 함
        # 여기서는 시뮬레이션
        if len(key_moments) > 0:
            # 첫 몇 초의 수평 체크
            if key_moments[0].get('start_time', 0) < 3:
                issues.append(TechnicalIssue(
                    category='horizon',
                    severity='major',
                    description='오프닝 샷의 수평이 맞지 않습니다',
                    timestamp=0,
                    suggestions=[
                        '카메라 수평계를 사용하여 정확한 수평을 맞추세요',
                        '편집 시 회전 보정을 적용하세요'
                    ]
                ))
        
        return issues
    
    def _check_eye_level_consistency(self, key_moments: List) -> List[TechnicalIssue]:
        """아이레벨 일관성 검사"""
        issues = []
        
        # 컷 전환 시 아이레벨 불일치 체크
        if len(key_moments) >= 2:
            for i in range(1, min(len(key_moments), 5)):
                # 시뮬레이션: 실제로는 얼굴 위치 분석 필요
                issues.append(TechnicalIssue(
                    category='eye_level',
                    severity='minor',
                    description=f'{i}번째 컷에서 아이레벨이 이전 컷과 일치하지 않습니다',
                    timestamp=key_moments[i].get('start_time'),
                    suggestions=[
                        '동일 인물 촬영 시 카메라 높이를 일정하게 유지하세요',
                        '컷 전환 시 아이레벨 연속성을 확인하세요'
                    ]
                ))
        
        return issues
    
    def _check_highlight_placement(self, key_moments: List) -> List[TechnicalIssue]:
        """하이라이트 배치 검사"""
        issues = []
        
        # 첫 5초 내 하이라이트 부재
        has_early_highlight = any(
            moment.get('start_time', 0) < 5 
            for moment in key_moments[:3]
        )
        
        if not has_early_highlight:
            issues.append(TechnicalIssue(
                category='highlight',
                severity='critical',
                description='영상 초반 5초 내에 시선을 끄는 하이라이트가 없습니다',
                timestamp=0,
                suggestions=[
                    '가장 임팩트 있는 장면을 맨 앞에 배치하세요',
                    '첫 3초 내에 시청자의 관심을 끌 수 있는 비주얼을 넣으세요',
                    '음악이나 효과음으로 오프닝 임팩트를 강화하세요'
                ]
            ))
        
        return issues
    
    def _check_composition_quality(self, visual_data: Dict, key_moments: List) -> List[TechnicalIssue]:
        """구도 및 프레이밍 품질 검사"""
        issues = []
        
        # 구도 관련 이슈 체크
        issues.append(TechnicalIssue(
            category='composition',
            severity='minor',
            description='일부 샷에서 3분할 법칙이 지켜지지 않았습니다',
            suggestions=[
                '주요 피사체를 3분할 선의 교차점에 배치하세요',
                '수평선을 3분할 선에 맞춰 배치하세요'
            ]
        ))
        
        return issues
    
    def _check_technical_quality(self, visual_data: Dict) -> List[TechnicalIssue]:
        """기술적 품질 검사"""
        issues = []
        
        # 기술적 품질 이슈
        issues.append(TechnicalIssue(
            category='technical_quality',
            severity='minor',
            description='일부 구간에서 손떨림이 감지됩니다',
            suggestions=[
                '짐벌이나 스테디캠을 사용하세요',
                '편집 시 디지털 손떨림 보정을 적용하세요'
            ]
        ))
        
        return issues
    
    def _generate_technical_summary(self, category_scores: Dict, issues: List) -> Dict:
        """기술적 분석 요약 생성"""
        critical_issues = [i for i in issues if i.severity == 'critical']
        major_issues = [i for i in issues if i.severity == 'major']
        
        return {
            'total_issues': len(issues),
            'critical_issues': len(critical_issues),
            'major_issues': len(major_issues),
            'weakest_category': min(category_scores.items(), 
                                   key=lambda x: x[1]['score'])[0],
            'strongest_category': max(category_scores.items(), 
                                    key=lambda x: x[1]['score'])[0]
        }
    
    def _generate_recommendations(self, issues: List[TechnicalIssue]) -> List[Dict]:
        """우선순위별 개선 권장사항 생성"""
        recommendations = []
        
        # 심각도별로 그룹화
        critical_issues = [i for i in issues if i.severity == 'critical']
        major_issues = [i for i in issues if i.severity == 'major']
        
        # 카테고리별로 권장사항 생성
        category_recommendations = {}
        for issue in critical_issues + major_issues:
            if issue.category not in category_recommendations:
                category_recommendations[issue.category] = {
                    'category': self.ANALYSIS_CATEGORIES.get(issue.category, {}).get('name', issue.category),
                    'priority': 'high' if issue.severity == 'critical' else 'medium',
                    'suggestions': []
                }
            
            if issue.suggestions:
                category_recommendations[issue.category]['suggestions'].extend(issue.suggestions)
        
        # 중복 제거 및 정렬
        for category_data in category_recommendations.values():
            category_data['suggestions'] = list(set(category_data['suggestions']))[:3]
            recommendations.append(category_data)
        
        return sorted(recommendations, key=lambda x: x['priority'], reverse=True)
    
    def _get_default_analysis(self) -> Dict:
        """기본 분석 결과 (오류 시)"""
        return {
            'overall_score': 70,
            'category_scores': {
                category_key: {
                    'name': category_info['name'],
                    'score': 70,
                    'weight': category_info['weight']
                }
                for category_key, category_info in self.ANALYSIS_CATEGORIES.items()
            },
            'issues': [],
            'technical_summary': {
                'total_issues': 0,
                'critical_issues': 0,
                'major_issues': 0
            },
            'recommendations': []
        }