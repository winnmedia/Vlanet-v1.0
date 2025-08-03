"""
데이터 일관성 보장 전략
분산 환경에서도 안정적인 데이터 무결성을 유지하는 종합적인 시스템
"""
import logging
import json
import threading
from typing import Dict, List, Optional, Any, Callable, Union
from dataclasses import dataclass
from enum import Enum
from contextlib import contextmanager
from django.db import transaction, connection
from django.core.cache import cache
from django.utils import timezone
from django.conf import settings
from .error_tracking import error_tracker, ErrorSeverity, ErrorCategory, ErrorContext

logger = logging.getLogger('data_consistency')

class ConsistencyLevel(Enum):
    """일관성 레벨"""
    EVENTUAL = "eventual"    # 최종 일관성
    STRONG = "strong"        # 강한 일관성
    WEAK = "weak"           # 약한 일관성

class OperationType(Enum):
    """작업 타입"""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    BULK_UPDATE = "bulk_update"
    SYNC = "sync"

@dataclass
class ConsistencyRule:
    """일관성 규칙"""
    name: str
    models: List[str]  # 대상 모델들
    level: ConsistencyLevel
    dependencies: List[str]  # 의존성 모델들
    validators: List[Callable]  # 검증 함수들
    auto_repair: bool = True  # 자동 복구 여부
    priority: int = 1  # 우선순위 (1이 가장 높음)

@dataclass
class DataOperation:
    """데이터 작업"""
    operation_id: str
    operation_type: OperationType
    model_name: str
    instance_id: Optional[int]
    data: Dict[str, Any]
    user_id: Optional[int]
    timestamp: str
    dependencies: List[str] = None
    consistency_level: ConsistencyLevel = ConsistencyLevel.STRONG

@dataclass
class ConsistencyViolation:
    """일관성 위반"""
    violation_id: str
    rule_name: str
    model_name: str
    instance_id: Optional[int]
    description: str
    severity: str
    detected_at: str
    resolved: bool = False
    resolution_method: Optional[str] = None

class DataConsistencyManager:
    """데이터 일관성 관리자"""
    
    def __init__(self):
        self.consistency_rules: Dict[str, ConsistencyRule] = {}
        self.pending_operations: List[DataOperation] = []
        self.violations: List[ConsistencyViolation] = []
        self.lock = threading.Lock()
        self._initialize_consistency_rules()
    
    def _initialize_consistency_rules(self):
        """기본 일관성 규칙 초기화"""
        
        # 영상 기획 관련 일관성 규칙
        self.add_consistency_rule(ConsistencyRule(
            name="video_planning_integrity",
            models=["VideoPlanning", "VideoPlanningImage", "VideoPlanningAIPrompt"],
            level=ConsistencyLevel.STRONG,
            dependencies=["User"],
            validators=[self._validate_video_planning_integrity],
            auto_repair=True,
            priority=1
        ))
        
        # 프로젝트-피드백 일관성
        self.add_consistency_rule(ConsistencyRule(
            name="project_feedback_consistency",
            models=["Project", "Feedback", "FeedbackComment"],
            level=ConsistencyLevel.STRONG,
            dependencies=["User", "Members"],
            validators=[self._validate_project_feedback_consistency],
            auto_repair=True,
            priority=1
        ))
        
        # 사용자-권한 일관성
        self.add_consistency_rule(ConsistencyRule(
            name="user_permission_consistency",
            models=["User", "Members", "VideoPlanningCollaboration"],
            level=ConsistencyLevel.STRONG,
            dependencies=[],
            validators=[self._validate_user_permission_consistency],
            auto_repair=True,
            priority=2
        ))
        
        # 캐시-DB 일관성
        self.add_consistency_rule(ConsistencyRule(
            name="cache_database_consistency",
            models=["*"],  # 모든 모델
            level=ConsistencyLevel.EVENTUAL,
            dependencies=[],
            validators=[self._validate_cache_database_consistency],
            auto_repair=True,
            priority=3
        ))
    
    def add_consistency_rule(self, rule: ConsistencyRule):
        """일관성 규칙 추가"""
        self.consistency_rules[rule.name] = rule
        logger.info(f"일관성 규칙 추가: {rule.name}")
    
    @contextmanager
    def atomic_operation(self, operation: DataOperation):
        """원자적 작업 컨텍스트"""
        with self.lock:
            self.pending_operations.append(operation)
        
        try:
            with transaction.atomic():
                # 사전 검증
                self._pre_validate_operation(operation)
                
                yield
                
                # 사후 검증
                self._post_validate_operation(operation)
                
                # 관련 캐시 무효화
                self._invalidate_related_cache(operation)
                
                logger.info(f"원자적 작업 완료: {operation.operation_id}")
                
        except Exception as e:
            logger.error(f"원자적 작업 실패: {operation.operation_id} - {str(e)}")
            
            # 오류 추적
            context = ErrorContext(
                user_id=operation.user_id,
                additional_data={
                    'operation_id': operation.operation_id,
                    'operation_type': operation.operation_type.value,
                    'model_name': operation.model_name
                }
            )
            error_tracker.track_error(e, ErrorSeverity.HIGH, ErrorCategory.DATABASE, context)
            
            raise
        finally:
            with self.lock:
                if operation in self.pending_operations:
                    self.pending_operations.remove(operation)
    
    def _pre_validate_operation(self, operation: DataOperation):
        """작업 전 검증"""
        applicable_rules = self._get_applicable_rules(operation.model_name)
        
        for rule in applicable_rules:
            if rule.level == ConsistencyLevel.STRONG:
                for validator in rule.validators:
                    try:
                        validator(operation, pre_validation=True)
                    except Exception as e:
                        logger.error(f"사전 검증 실패 ({rule.name}): {str(e)}")
                        raise
    
    def _post_validate_operation(self, operation: DataOperation):
        """작업 후 검증"""
        applicable_rules = self._get_applicable_rules(operation.model_name)
        
        for rule in applicable_rules:
            for validator in rule.validators:
                try:
                    validator(operation, pre_validation=False)
                except Exception as e:
                    if rule.auto_repair:
                        logger.warning(f"사후 검증 실패, 자동 복구 시도 ({rule.name}): {str(e)}")
                        try:
                            self._attempt_auto_repair(rule, operation, e)
                        except Exception as repair_error:
                            logger.error(f"자동 복구 실패 ({rule.name}): {str(repair_error)}")
                            self._record_violation(rule, operation, str(e))
                            raise
                    else:
                        logger.error(f"사후 검증 실패 ({rule.name}): {str(e)}")
                        self._record_violation(rule, operation, str(e))
                        raise
    
    def _get_applicable_rules(self, model_name: str) -> List[ConsistencyRule]:
        """적용 가능한 규칙 조회"""
        applicable_rules = []
        
        for rule in self.consistency_rules.values():
            if "*" in rule.models or model_name in rule.models:
                applicable_rules.append(rule)
        
        # 우선순위 순 정렬
        applicable_rules.sort(key=lambda r: r.priority)
        return applicable_rules
    
    def _invalidate_related_cache(self, operation: DataOperation):
        """관련 캐시 무효화"""
        try:
            # 모델별 캐시 무효화 패턴
            cache_patterns = [
                f"{operation.model_name.lower()}:*",
                f"user:{operation.user_id}:*" if operation.user_id else None,
                f"{operation.model_name.lower()}:{operation.instance_id}:*" if operation.instance_id else None,
            ]
            
            for pattern in cache_patterns:
                if pattern:
                    self._invalidate_cache_pattern(pattern)
            
        except Exception as e:
            logger.warning(f"캐시 무효화 실패: {str(e)}")
    
    def _invalidate_cache_pattern(self, pattern: str):
        """패턴 기반 캐시 무효화"""
        try:
            # Redis 캐시인 경우
            from django_redis import get_redis_connection
            redis_conn = get_redis_connection("default")
            
            keys = redis_conn.keys(pattern)
            if keys:
                redis_conn.delete(*keys)
                logger.debug(f"캐시 키 {len(keys)}개 무효화: {pattern}")
                
        except ImportError:
            # Redis가 아닌 경우 전체 캐시 클리어
            cache.clear()
            logger.debug("전체 캐시 클리어")
        except Exception as e:
            logger.warning(f"캐시 무효화 오류: {str(e)}")
    
    def _record_violation(self, rule: ConsistencyRule, operation: DataOperation, description: str):
        """일관성 위반 기록"""
        violation = ConsistencyViolation(
            violation_id=f"{rule.name}_{operation.operation_id}_{timezone.now().timestamp()}",
            rule_name=rule.name,
            model_name=operation.model_name,
            instance_id=operation.instance_id,
            description=description,
            severity="high" if rule.level == ConsistencyLevel.STRONG else "medium",
            detected_at=timezone.now().isoformat()
        )
        
        self.violations.append(violation)
        
        # 캐시에도 저장 (24시간)
        cache.set(f"consistency_violation:{violation.violation_id}", violation, 86400)
        
        logger.error(f"일관성 위반 기록: {violation.violation_id}")
    
    def _attempt_auto_repair(self, rule: ConsistencyRule, operation: DataOperation, error: Exception):
        """자동 복구 시도"""
        repair_method = f"_repair_{rule.name}"
        
        if hasattr(self, repair_method):
            repair_function = getattr(self, repair_method)
            repair_function(operation, error)
            logger.info(f"자동 복구 성공: {rule.name}")
        else:
            logger.warning(f"자동 복구 방법 없음: {rule.name}")
            raise error
    
    # 검증 함수들
    def _validate_video_planning_integrity(self, operation: DataOperation, pre_validation: bool = False):
        """영상 기획 무결성 검증"""
        if operation.model_name == "VideoPlanning":
            if not pre_validation:  # 사후 검증
                # 영상 기획이 존재하는지 확인
                from video_planning.models import VideoPlanning
                
                try:
                    planning = VideoPlanning.objects.get(id=operation.instance_id)
                    
                    # 필수 필드 검증
                    if not planning.title or not planning.planning_text:
                        raise ValueError("영상 기획의 필수 필드가 누락되었습니다.")
                    
                    # 사용자 관계 검증
                    if not planning.user:
                        raise ValueError("영상 기획에 사용자가 연결되지 않았습니다.")
                    
                    # JSON 필드 유효성 검증
                    if planning.planning_options and not isinstance(planning.planning_options, dict):
                        raise ValueError("기획 옵션 형식이 올바르지 않습니다.")
                    
                except VideoPlanning.DoesNotExist:
                    if operation.operation_type != OperationType.DELETE:
                        raise ValueError(f"영상 기획 {operation.instance_id}를 찾을 수 없습니다.")
    
    def _validate_project_feedback_consistency(self, operation: DataOperation, pre_validation: bool = False):
        """프로젝트-피드백 일관성 검증"""
        if operation.model_name in ["Project", "Feedback", "FeedbackComment"]:
            if not pre_validation:
                # 프로젝트와 피드백 간의 참조 무결성 확인
                if operation.model_name == "Feedback" and operation.instance_id:
                    from feedbacks.models import Feedback
                    from projects.models import Project
                    
                    try:
                        feedback = Feedback.objects.get(id=operation.instance_id)
                        
                        # 프로젝트 존재 확인 (만약 프로젝트 참조가 있다면)
                        # feedback에 project 필드가 있다고 가정
                        if hasattr(feedback, 'project') and feedback.project:
                            if not Project.objects.filter(id=feedback.project.id).exists():
                                raise ValueError("연결된 프로젝트가 존재하지 않습니다.")
                        
                    except Feedback.DoesNotExist:
                        if operation.operation_type != OperationType.DELETE:
                            raise ValueError(f"피드백 {operation.instance_id}를 찾을 수 없습니다.")
    
    def _validate_user_permission_consistency(self, operation: DataOperation, pre_validation: bool = False):
        """사용자 권한 일관성 검증"""
        if operation.model_name in ["User", "Members", "VideoPlanningCollaboration"]:
            if not pre_validation and operation.user_id:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                
                # 사용자 존재 확인
                if not User.objects.filter(id=operation.user_id).exists():
                    raise ValueError(f"사용자 {operation.user_id}가 존재하지 않습니다.")
                
                # 협업 권한 검증
                if operation.model_name == "VideoPlanningCollaboration":
                    from video_planning.models import VideoPlanningCollaboration, VideoPlanning
                    
                    if operation.instance_id:
                        try:
                            collaboration = VideoPlanningCollaboration.objects.get(id=operation.instance_id)
                            
                            # 기획 존재 확인
                            if not VideoPlanning.objects.filter(id=collaboration.planning.id).exists():
                                raise ValueError("연결된 영상 기획이 존재하지 않습니다.")
                            
                            # 사용자 존재 확인
                            if not User.objects.filter(id=collaboration.user.id).exists():
                                raise ValueError("협업 사용자가 존재하지 않습니다.")
                            
                        except VideoPlanningCollaboration.DoesNotExist:
                            if operation.operation_type != OperationType.DELETE:
                                raise ValueError(f"협업 {operation.instance_id}를 찾을 수 없습니다.")
    
    def _validate_cache_database_consistency(self, operation: DataOperation, pre_validation: bool = False):
        """캐시-데이터베이스 일관성 검증"""
        if not pre_validation:  # 사후 검증에서만
            # 캐시된 데이터와 DB 데이터 비교
            cache_key = f"{operation.model_name.lower()}:{operation.instance_id}"
            cached_data = cache.get(cache_key)
            
            if cached_data and operation.operation_type in [OperationType.UPDATE, OperationType.DELETE]:
                # 캐시 무효화 필요
                logger.debug(f"캐시 일관성 검증: {cache_key} 무효화 필요")
    
    # 자동 복구 함수들
    def _repair_video_planning_integrity(self, operation: DataOperation, error: Exception):
        """영상 기획 무결성 복구"""
        from video_planning.models import VideoPlanning
        
        try:
            planning = VideoPlanning.objects.get(id=operation.instance_id)
            
            # 빈 필드 채우기
            if not planning.title and planning.planning_text:
                planning.title = planning.planning_text[:50] + "..." if len(planning.planning_text) > 50 else planning.planning_text
            
            # 기본값 설정
            if not planning.planning_options:
                planning.planning_options = {}
            
            planning.save()
            logger.info(f"영상 기획 {operation.instance_id} 무결성 복구 완료")
            
        except Exception as e:
            logger.error(f"영상 기획 무결성 복구 실패: {str(e)}")
            raise
    
    def _repair_project_feedback_consistency(self, operation: DataOperation, error: Exception):
        """프로젝트-피드백 일관성 복구"""
        # 고아 피드백 정리, 참조 무결성 복구 등
        logger.info(f"프로젝트-피드백 일관성 복구 시도: {operation.instance_id}")
        # 실제 복구 로직 구현 필요
    
    def _repair_user_permission_consistency(self, operation: DataOperation, error: Exception):
        """사용자 권한 일관성 복구"""
        logger.info(f"사용자 권한 일관성 복구 시도: {operation.instance_id}")
        # 실제 복구 로직 구현 필요
    
    def _repair_cache_database_consistency(self, operation: DataOperation, error: Exception):
        """캐시-데이터베이스 일관성 복구"""        
        # 관련 캐시 무효화
        self._invalidate_related_cache(operation)
        logger.info(f"캐시-데이터베이스 일관성 복구 완료: {operation.model_name}")
    
    def check_global_consistency(self) -> Dict[str, Any]:
        """전역 일관성 검사"""
        consistency_report = {
            'timestamp': timezone.now().isoformat(),
            'rules_checked': len(self.consistency_rules),
            'violations_found': 0,
            'violations_resolved': 0,
            'rules_status': {},
            'recommendations': []
        }
        
        for rule_name, rule in self.consistency_rules.items():
            rule_status = {
                'rule_name': rule_name,
                'level': rule.level.value,
                'models': rule.models,
                'violations': [],
                'status': 'healthy'
            }
            
            try:
                # 각 규칙에 대해 전역 검사 수행
                violations = self._check_rule_globally(rule)
                
                if violations:
                    rule_status['violations'] = violations
                    rule_status['status'] = 'violations_found'
                    consistency_report['violations_found'] += len(violations)
                    
                    # 자동 복구 시도
                    if rule.auto_repair:
                        resolved_count = self._attempt_global_repair(rule, violations)
                        consistency_report['violations_resolved'] += resolved_count
                
            except Exception as e:
                rule_status['status'] = 'check_failed'
                rule_status['error'] = str(e)
                logger.error(f"전역 일관성 검사 실패 ({rule_name}): {str(e)}")
            
            consistency_report['rules_status'][rule_name] = rule_status
        
        # 권장사항 생성
        if consistency_report['violations_found'] > 0:
            consistency_report['recommendations'].append("정기적인 데이터 정리 작업을 실행하세요.")
        
        if consistency_report['violations_found'] > 10:
            consistency_report['recommendations'].append("데이터베이스 무결성 제약조건을 강화하세요.")
        
        return consistency_report
    
    def _check_rule_globally(self, rule: ConsistencyRule) -> List[Dict[str, Any]]:
        """규칙별 전역 검사"""
        violations = []
        
        # 각 규칙에 대한 전역 검사 로직
        if rule.name == "video_planning_integrity":
            violations.extend(self._check_video_planning_integrity_globally())
        elif rule.name == "project_feedback_consistency":
            violations.extend(self._check_project_feedback_consistency_globally())
        elif rule.name == "user_permission_consistency":
            violations.extend(self._check_user_permission_consistency_globally())
        
        return violations
    
    def _check_video_planning_integrity_globally(self) -> List[Dict[str, Any]]:
        """영상 기획 무결성 전역 검사"""
        violations = []
        
        try:
            from video_planning.models import VideoPlanning
            
            # 필수 필드 누락 검사
            plannings_missing_title = VideoPlanning.objects.filter(title__isnull=True).or_(
                VideoPlanning.objects.filter(title__exact='')
            )
            
            for planning in plannings_missing_title:
                violations.append({
                    'type': 'missing_title',
                    'instance_id': planning.id,
                    'description': f'영상 기획 {planning.id}에 제목이 없습니다.',
                    'severity': 'medium'
                })
            
            # 사용자 관계 누락 검사
            plannings_missing_user = VideoPlanning.objects.filter(user__isnull=True)
            
            for planning in plannings_missing_user:
                violations.append({
                    'type': 'missing_user',
                    'instance_id': planning.id,
                    'description': f'영상 기획 {planning.id}에 사용자가 연결되지 않았습니다.',
                    'severity': 'high'
                })
            
        except Exception as e:
            logger.error(f"영상 기획 무결성 전역 검사 실패: {str(e)}")
        
        return violations
    
    def _check_project_feedback_consistency_globally(self) -> List[Dict[str, Any]]:
        """프로젝트-피드백 일관성 전역 검사"""
        violations = []
        
        try:
            # 고아 피드백 검사 등
            # 실제 구현은 모델 구조에 따라 달라짐
            pass
            
        except Exception as e:
            logger.error(f"프로젝트-피드백 일관성 전역 검사 실패: {str(e)}")
        
        return violations
    
    def _check_user_permission_consistency_globally(self) -> List[Dict[str, Any]]:
        """사용자 권한 일관성 전역 검사"""
        violations = []
        
        try:
            from video_planning.models import VideoPlanningCollaboration
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            # 존재하지 않는 사용자 참조 검사
            collaborations = VideoPlanningCollaboration.objects.select_related('user')
            
            for collab in collaborations:
                if not User.objects.filter(id=collab.user.id).exists():
                    violations.append({
                        'type': 'invalid_user_reference',
                        'instance_id': collab.id,
                        'description': f'협업 {collab.id}가 존재하지 않는 사용자를 참조합니다.',
                        'severity': 'high'
                    })
            
        except Exception as e:
            logger.error(f"사용자 권한 일관성 전역 검사 실패: {str(e)}")
        
        return violations
    
    def _attempt_global_repair(self, rule: ConsistencyRule, violations: List[Dict[str, Any]]) -> int:
        """전역 복구 시도"""
        resolved_count = 0
        
        for violation in violations:
            try:
                if self._repair_violation(rule, violation):
                    resolved_count += 1
                    
            except Exception as e:
                logger.error(f"위반 복구 실패 ({violation}): {str(e)}")
        
        return resolved_count
    
    def _repair_violation(self, rule: ConsistencyRule, violation: Dict[str, Any]) -> bool:
        """개별 위반 복구"""
        try:
            if rule.name == "video_planning_integrity":
                return self._repair_video_planning_violation(violation)
            elif rule.name == "project_feedback_consistency":
                return self._repair_project_feedback_violation(violation)
            elif rule.name == "user_permission_consistency":
                return self._repair_user_permission_violation(violation)
            
            return False
            
        except Exception as e:
            logger.error(f"위반 복구 실패: {str(e)}")
            return False
    
    def _repair_video_planning_violation(self, violation: Dict[str, Any]) -> bool:
        """영상 기획 위반 복구"""
        from video_planning.models import VideoPlanning
        
        try:
            planning = VideoPlanning.objects.get(id=violation['instance_id'])
            
            if violation['type'] == 'missing_title':
                if planning.planning_text:
                    planning.title = planning.planning_text[:50] + "..." if len(planning.planning_text) > 50 else planning.planning_text
                else:
                    planning.title = f"영상 기획 {planning.id}"
                
                planning.save()
                return True
            
        except VideoPlanning.DoesNotExist:
            logger.warning(f"복구할 영상 기획을 찾을 수 없음: {violation['instance_id']}")
        
        return False
    
    def _repair_project_feedback_violation(self, violation: Dict[str, Any]) -> bool:
        """프로젝트-피드백 위반 복구"""
        # 실제 복구 로직 구현 필요
        return False
    
    def _repair_user_permission_violation(self, violation: Dict[str, Any]) -> bool:
        """사용자 권한 위반 복구"""
        # 실제 복구 로직 구현 필요
        return False

# 전역 데이터 일관성 관리자 인스턴스
data_consistency_manager = DataConsistencyManager()

# 데코레이터
def ensure_data_consistency(model_name: str, 
                          operation_type: OperationType,
                          consistency_level: ConsistencyLevel = ConsistencyLevel.STRONG):
    """데이터 일관성 보장 데코레이터"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # 요청 컨텍스트에서 사용자 정보 추출
            request = None
            for arg in args:
                if hasattr(arg, 'user'):
                    request = arg
                    break
            
            user_id = request.user.id if request and hasattr(request, 'user') and request.user.is_authenticated else None
            
            # 작업 객체 생성
            operation = DataOperation(
                operation_id=f"{func.__name__}_{timezone.now().timestamp()}",
                operation_type=operation_type,
                model_name=model_name,
                instance_id=None,  # 함수 실행 후 추출
                data={},
                user_id=user_id,
                timestamp=timezone.now().isoformat(),
                consistency_level=consistency_level
            )
            
            # 일관성 보장 컨텍스트에서 실행
            with data_consistency_manager.atomic_operation(operation):
                result = func(*args, **kwargs)
                
                # 결과에서 인스턴스 ID 추출 (가능한 경우)
                if hasattr(result, 'id'):
                    operation.instance_id = result.id
                elif hasattr(result, 'data') and isinstance(result.data, dict) and 'id' in result.data:
                    operation.instance_id = result.data['id']
                
                return result
        
        return wrapper
    return decorator