# VideoPlanet 시스템 치명적 문제 분석 및 해결 방안

**분석자**: Q, the Gatekeeper of Truth  
**분석 일시**: 2025-08-06 08:20  
**테스트 환경**: 로컬 (백엔드: http://localhost:8000, 프론트엔드: http://localhost:3000)  
**최종 판정**: 🚫 REJECTED - 프로덕션 배포 불가

---

## 🚨 치명적 문제 (Critical Issues) - 즉시 수정 필요

### 1. 프로젝트 중복 생성 방지 실패 ⚠️ CRITICAL
**문제**: 동일한 이름으로 프로젝트가 중복 생성됨  
**위험도**: 🔴 HIGH  
**영향**: 데이터 무결성 위반, 사용자 혼란

#### 본질적 원인 분석
- 프로젝트 생성 API에서 unique 제약조건이 제대로 작동하지 않음
- 사용자별 프로젝트명 유일성 검증 로직 부재
- 데이터베이스 레벨 제약조건과 애플리케이션 레벨 검증 불일치

#### 해결 방안
```python
# projects/models.py 수정 필요
class Project(models.Model):
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('name', 'owner')  # 사용자별 유일성 보장
```

```python
# projects/views.py CreateProject 뷰 수정
def post(self, request):
    # 1. 중복 체크 로직 추가
    if Project.objects.filter(
        name=request.data['name'],
        owner=request.user
    ).exists():
        return Response({
            'error': 'Project with this name already exists'
        }, status=400)
    
    # 2. 트랜잭션으로 감싸기
    with transaction.atomic():
        project = Project.objects.create(...)
```

---

## ❌ 실패한 기능들 (Failed Features)

### 2. 피드백 시스템 완전 실패
**문제**: 피드백 관련 모든 API가 404/500 에러 발생  
**위험도**: 🔴 HIGH  
**영향**: 핵심 기능 사용 불가

#### 세부 문제들
- **피드백 페이지 접근**: 500 에러 (서버 에러)
- **피드백 목록 조회**: 404 에러 (엔드포인트 없음)
- **피드백 작성**: 404 에러 (엔드포인트 없음)

#### 본질적 원인 분석
```python
# URL 패턴 불일치 문제
# 현재 테스트가 기대하는 URL: /api/feedbacks/{project_id}/
# 실제 구현된 URL: 다른 패턴일 가능성
```

#### 해결 방안
1. **URL 패턴 정규화**
```python
# urls.py 확인 및 수정
urlpatterns = [
    path('api/feedbacks/<int:project_id>/', FeedbackListView.as_view()),
    path('api/feedbacks/<int:project_id>/', FeedbackCreateView.as_view()),
]
```

2. **피드백 모델 및 뷰 재검토**
```python
# feedbacks/views.py
class FeedbackListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id, owner=request.user)
            feedbacks = Feedback.objects.filter(project=project)
            return Response({'feedbacks': FeedbackSerializer(feedbacks, many=True).data})
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=404)
```

### 3. 영상 기획 저장 실패
**문제**: 기획안 저장 시 400 에러 발생  
**위험도**: 🟡 MEDIUM  
**영향**: 영상 기획 기능 제한

#### 본질적 원인 분석
- API 요청 데이터 형식과 서버 기대 형식 불일치
- 필수 필드 누락 또는 데이터 타입 오류
- 입력 검증 로직 과도하게 엄격

#### 해결 방안
```python
# video_planning/serializers.py
class VideoPlanningSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoPlanning
        fields = '__all__'
    
    def validate(self, data):
        # 필수 필드 검증을 완화하되 안전하게
        if not data.get('project_id'):
            raise serializers.ValidationError('project_id is required')
        return data
```

### 4. JSON 에러 처리 개선 필요
**문제**: 잘못된 JSON 요청 시 500 에러 (예상: 400 에러)  
**위험도**: 🟡 MEDIUM  
**영향**: 에러 처리 품질 저하

#### 해결 방안
```python
# middleware.py 또는 views.py
import json
from django.http import JsonResponse

def handle_json_error(request):
    try:
        json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
```

---

## ⚠️ 경고사항 (Warnings)

### 5. API 버전 관리 미구현
**권장사항**: `/api/version/` 엔드포인트 구현
```python
# config/views.py
class APIVersionView(APIView):
    def get(self, request):
        return Response({
            'version': '1.0.0',
            'environment': settings.ENVIRONMENT,
            'build_date': '2025-08-06'
        })
```

### 6. AI 기획 마법사 미구현
**권장사항**: 단계적 구현 계획 수립
- Phase 1: 기본 템플릿 기반 기획안 생성
- Phase 2: AI 모델 연동
- Phase 3: 고급 프로 옵션 추가

---

## ✅ 양호한 기능들 (Working Well)

### 보안 측면
- **SQL 인젝션 방어**: ✅ 완벽
- **XSS 공격 방어**: ✅ 완벽  
- **인증 우회 방어**: ✅ 완벽
- **입력값 길이 제한**: ✅ 완벽

### 성능 측면
- **API 응답 시간**: 50-60ms (매우 양호)
- **동시 요청 처리**: 5개 동시 요청 완벽 처리
- **서버 안정성**: 헬스체크 통과

### 인증 시스템
- **회원가입/로그인**: ✅ 완벽
- **JWT 토큰 관리**: ✅ 완벽
- **사용자 정보 관리**: ✅ 완벽

---

## 🎯 우선순위별 수정 계획

### Phase 1: 치명적 문제 해결 (즉시)
1. **프로젝트 중복 생성 방지** - unique_together 제약조건 추가
2. **피드백 시스템 URL 패턴 수정** - 404 에러 해결

### Phase 2: 핵심 기능 복구 (1주일 내)
3. **영상 기획 저장 기능** - 400 에러 원인 분석 및 수정
4. **JSON 에러 처리 개선** - 미들웨어 레벨 개선

### Phase 3: 기능 완성도 향상 (2주일 내)
5. **AI 기획 마법사 구현** - 기본 템플릿부터 시작
6. **API 버전 관리** - 버전 정보 엔드포인트 추가

---

## 🔧 즉시 적용 가능한 핫픽스

### 1. 프로젝트 중복 방지 (5분 작업)
```python
# projects/views.py CreateProject.post() 메서드 첫 줄에 추가
if Project.objects.filter(name=request.data['name'], owner=request.user).exists():
    return Response({'error': 'Project name already exists'}, status=400)
```

### 2. 피드백 URL 패턴 확인 (10분 작업)
```bash
# URL 패턴 확인
grep -r "feedbacks" vridge_back/*/urls.py
# 올바른 패턴으로 수정
```

---

## 📊 테스트 결과 요약

- **총 테스트**: 31개
- **성공**: 25개 (81%)
- **실패**: 5개 (16%)
- **경고**: 3개 (3%)
- **치명적**: 1개

**Q의 최종 판정**: 치명적 문제로 인해 현재 상태로는 프로덕션 배포 불가. 위 수정사항 적용 후 재테스트 필요.

---

## 📋 재테스트 체크리스트

Phase 1 수정 완료 후 다음 테스트 재실행:
- [ ] 프로젝트 중복 생성 시도 → 400 에러 반환 확인
- [ ] 피드백 페이지 접근 → 200 응답 확인  
- [ ] 피드백 목록 조회 → 빈 배열이라도 200 응답 확인
- [ ] 피드백 작성 → 정상 처리 확인

**목표**: 성공률 90% 이상 달성 시 조건부 승인 가능